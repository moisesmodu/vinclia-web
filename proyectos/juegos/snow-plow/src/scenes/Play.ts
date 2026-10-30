import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { Terrain, type SleighSpot } from '../terrain';
import { hasLights } from '../cosmeticos';
import { save, PX_PER_M, SLEIGH_EVERY_M } from '../state';

// La librería Matter.js que trae Phaser (sus tipos no la exponen).
const M: any = (Phaser.Physics.Matter as any).Matter;
const STEP_MS = 1000 / 60;

/** Ajustes de manejo y de la carga (los que se tocan para equilibrar el juego). */
const T = {
  wheelR: 24,
  maxSpin: 0.36,        // velocidad angular máxima de las ruedas (rad por paso)
  spinUp: 0.03,
  brake: 0.84,          // al soltar, las ruedas frenan
  airLeanBack: 0.003,   // en el aire, mantener inclina hacia atrás
  airLeanFwd: 0.0024,   // y soltar, hacia delante
  flipSeconds: 1.4,
  bladeX: 94,           // borde delantero de la pala (coordenadas locales del diseño)
  behindSeconds: 0.6,   // un regalo detrás de la pala tanto tiempo = perdido
  refill: 5,            // regalos nuevos en cada trineo
};

type Truck = {
  chassis: MatterJS.BodyType; wheels: MatterJS.BodyType[]; d: { x: number; y: number };
  sprite: Phaser.GameObjects.Image; wheelSprites: Phaser.GameObjects.Image[]; beacon: Phaser.GameObjects.Image;
};
type Gift = { body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; behindT: number; state: 'push' | 'done' | 'lost' };
type Sleigh = SleighSpot & { objs: Phaser.GameObjects.GameObject[]; got: number; refilled: boolean; passed: boolean };

/**
 * La partida. Una sola mecánica: mantener pulsado = acelerar (e inclinar atrás en el aire);
 * soltar = frenar (e inclinar adelante). La pala del quitanieves empuja un montón de regalos hasta el trineo
 * de Papá Noel (cada 150 m). Regalo que llega = un punto; regalo que se queda atrás = perdido.
 * Sin regalos delante de la pala (o con el camión volcado) se acaba la partida.
 */
export class Play extends Phaser.Scene {
  private terrain!: Terrain;
  private truck!: Truck;
  private gifts: Gift[] = [];
  private sleighs: Sleigh[] = [];
  private startX = 0;
  private dist = 0;
  private delivered = 0;
  private deliveredSaved = 0; // regalos de esta partida ya sumados al total (por si revive)
  private alive = true;
  private revived = false;
  private xmasLights = false;
  /** Regalos de la partida ya doblados con el anuncio ×2 (una vez por partida). */
  doubled = false;
  private grounded = 0;
  private flipT = 0;
  private hold = false;
  private refillPending = 0;
  private giftN = 0;        // para alternar colores
  private engine: ReturnType<typeof audio.engine> = null;
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private static firstRun = true;
  private acc = 0;          // acumulador de tiempo para la física a paso fijo
  private paused = false;   // física detenida (anuncio en curso)
  private groundedNow = 0;  // ruedas tocando suelo en el último paso
  private groundY = 0;      // altura media del suelo en pantalla (para las colinas del fondo)
  private blinkAt = 0;
  private lastLoad = -1;

  constructor() { super('Play'); }

  async create() {
    // la instancia de la escena se reutiliza al reiniciar: nada de la partida anterior puede sobrevivir
    this.alive = true; this.revived = false; this.doubled = false; this.xmasLights = hasLights(); this.dist = 0; this.delivered = 0; this.deliveredSaved = 0; this.flipT = 0; this.groundY = 0;
    this.gifts = []; this.sleighs = []; this.hold = false; this.refillPending = 0; this.giftN = 0; this.blinkAt = 0;
    this.lastLoad = -1; this.grounded = 0; this.groundedNow = 0;
    this.truck = undefined as unknown as Truck;
    this.paused = false;
    this.registry.set('hold', false);

    this.scene.launch('Sky');
    this.makeBackground();
    this.startX = 400;
    this.terrain = new Terrain(this, this.startX, new Phaser.Math.RandomDataGenerator([`${Date.now()}`]));
    this.terrain.ensure(this.startX + 2400);
    this.spawnTruck(this.startX, this.terrain.heightAt(this.startX) - 50);
    this.loadPile(6);

    const cam = this.cameras.main;
    cam.startFollow(this.truck.sprite, true, 0.09, 0.09);
    this.layout();
    this.scale.on('resize', this.layout, this);

    this.matter.world.on('collisionactive', this.onContact, this);
    this.matter.world.on('collisionstart', this.onContact, this);
    // El motor se aplica en cada paso de física (no en cada fotograma): igual a 30 que a 120 FPS.
    this.matter.world.on('beforeupdate', () => { this.groundedNow = this.grounded; this.grounded = 0; this.drive(); });
    this.acc = 0;

    this.keys = ['SPACE', 'UP', 'RIGHT', 'W', 'D'].map((k) => this.input.keyboard!.addKey(k));
    this.engine = audio.engine();

    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      this.engine?.stop();
      this.terrain.destroy();
      this.scene.stop('Hud');
      this.scene.stop('Sky');
    });

    save.set('runs', save.get('runs') + 1);
    // Anuncio intersticial en pausa natural: antes de cada partida salvo la primera de la sesión.
    if (!Play.firstRun) {
      this.paused = true;
      await portal.commercialBreak();
      this.paused = false;
    }
    Play.firstRun = false;
    portal.gameplayStart();
  }

  /* ---------------------------------------------------------------- montaje */

  private spawnTruck(x: number, y: number) {
    const group = M.Body.nextGroup(true);
    const filter = { group, category: 1, mask: 0xffffffff };
    const opts = { collisionFilter: filter };
    const parts = [
      M.Bodies.rectangle(x, y, 156, 24, opts),                // chasis
      M.Bodies.rectangle(x - 4, y - 34, 60, 46, opts),        // cabina
      M.Bodies.rectangle(x + 47, y - 19, 50, 22, opts),       // capó
      M.Bodies.rectangle(x + 88, y - 5, 12, 98, { ...opts, chamfer: { radius: [2, 2, 6, 6] } }), // pala
    ];
    const chassis = M.Body.create({ parts, collisionFilter: filter, friction: 0.12, label: 'truck', frictionAir: 0.005 });
    M.Body.setDensity(chassis, 0.0018);
    // más inercia: el empuje de la carga contra la pala no levanta el morro (en el aire se inclina con setAngularVelocity)
    M.Body.setInertia(chassis, chassis.inertia * 2.5);
    this.matter.world.add(chassis);
    const d = { x: x - chassis.position.x, y: y - chassis.position.y };

    const wheelPos = [{ x: -50, y: 26 }, { x: 48, y: 26 }];
    const wheels = wheelPos.map((p) => {
      const w = M.Bodies.circle(x + p.x, y + p.y, T.wheelR, {
        collisionFilter: filter, friction: 1, frictionStatic: 10, restitution: 0, label: 'wheel', density: 0.0024,
      });
      this.matter.world.add(w);
      this.matter.world.add(M.Constraint.create({
        bodyA: chassis, pointA: { x: p.x + d.x, y: p.y + d.y }, bodyB: w, length: 0, stiffness: 0.28, damping: 0.12,
      }));
      return w;
    });
    const sprite = this.add.image(x, y, 'plow').setOrigin(110 / 240, 84 / 140).setDepth(2);
    const wheelSprites = wheels.map((w) => this.add.image(w.position.x, w.position.y, 'wheel').setDepth(3));
    const beacon = this.add.image(x, y, 'beacon').setDepth(2.5).setBlendMode(Phaser.BlendModes.ADD);
    this.truck = { chassis, wheels, d, sprite, wheelSprites, beacon };
  }

  /** Punto del mundo para unas coordenadas locales del diseño del camión. */
  private toWorld(lx: number, ly: number) {
    const c = this.truck.chassis, a = c.angle, x = this.truck.d.x + lx, y = this.truck.d.y + ly;
    return { x: c.position.x + x * Math.cos(a) - y * Math.sin(a), y: c.position.y + x * Math.sin(a) + y * Math.cos(a) };
  }

  /** Coordenada x local (a lo largo del chasis) de un punto del mundo. */
  private localX(px: number, py: number) {
    const c = this.truck.chassis, a = c.angle;
    const o = this.toWorld(0, 0);
    return (px - o.x) * Math.cos(a) + (py - o.y) * Math.sin(a);
  }

  private spawnGift(x: number, y: number, size: number) {
    const body = M.Bodies.rectangle(x, y, size, size, {
      label: 'gift', density: 0.0005, friction: 0.35, frictionStatic: 0.5, restitution: 0.04, frictionAir: 0.008,
      chamfer: { radius: 3 },
    });
    M.Body.setAngle(body, 0);
    this.matter.world.add(body);
    const sprite = this.add.image(x, y, `gift${this.giftN++ % 4}`).setDisplaySize(size + 2, size + 2).setDepth(1.5);
    this.gifts.push({ body, sprite, behindT: 0, state: 'push' });
  }

  /** Montón de regalos delante de la pala: 3 abajo, 2 en medio y 1 arriba (al empezar y al revivir). */
  private loadPile(n: number) {
    // [x local, altura de la fila sobre el suelo, lado]
    const rows: [number, number, number][] = [[116, 0, 40], [158, 0, 40], [200, 0, 40], [137, 41, 34], [179, 41, 34], [158, 76, 28]];
    for (const [lx, up, s] of rows.slice(0, n)) {
      const x = this.toWorld(lx, 0).x;
      this.spawnGift(x, this.terrain.heightAt(x) - s / 2 - 3 - up, s);
    }
  }

  private makeBackground() {
    const cam = this.cameras.main;
    this.bgFar = this.add.tileSprite(0, 0, cam.width, 400, 'hills-far').setScrollFactor(0).setOrigin(0.5, 1).setDepth(-4);
    this.bgNear = this.add.tileSprite(0, 0, cam.width, 400, 'hills-near').setScrollFactor(0).setOrigin(0.5, 1).setDepth(-3);
  }

  /** Zoom según la pantalla: siempre se ve lo mismo del mundo en vertical, también en móvil. */
  private layout() {
    const w = this.scale.width, h = this.scale.height;
    const cam = this.cameras.main;
    cam.setSize(w, h);
    // apaisado: misma altura de mundo; vertical: se prioriza el ancho para ver la pala y los regalos
    const z = h > w ? Phaser.Math.Clamp(w / 640, 0.45, 1.6) : Phaser.Math.Clamp(Math.min(h / 760, w / 980), 0.38, 1.6);
    cam.setZoom(z);
    cam.setFollowOffset(-w / z * (h > w ? 0.12 : 0.2), 60);
    const vw = w / z;
    this.bgFar.setSize(vw, 400).setX(w / 2);
    this.bgNear.setSize(vw, 400).setX(w / 2);
  }

  /* ---------------------------------------------------------------- colisiones */

  private onContact(ev: { pairs: Phaser.Types.Physics.Matter.MatterCollisionPair[] }) {
    for (const p of ev.pairs) {
      const a = p.bodyA as MatterJS.BodyType, b = p.bodyB as MatterJS.BodyType;
      if ((a.label === 'wheel' && b.label === 'ground') || (b.label === 'wheel' && a.label === 'ground')) this.grounded++;
    }
  }

  /* ---------------------------------------------------------------- bucle */

  update(_t: number, dtMs: number) {
    if (!this.truck) return;
    const { chassis, wheels, sprite, wheelSprites, beacon } = this.truck;
    this.hold = this.alive && (this.registry.get('hold') || this.keys.some((k) => k.isDown));
    // Física a 60 Hz fijos con acumulador (máximo 4 pasos por fotograma para no espiralizar).
    if (!this.paused) {
      // rawDelta: tiempo real (el delta de Phaser viene suavizado y topado a 16,7 ms)
      this.acc += Math.min(this.game.loop.rawDelta || dtMs, 100) * this.time.timeScale;
      let n = 0;
      while (this.acc >= STEP_MS && n < 4) { this.matter.world.step(STEP_MS); this.acc -= STEP_MS; n++; }
      if (n === 4) this.acc = 0;
    }
    const dt = this.paused ? 0 : Math.min(dtMs, 100) / 1000;

    // sprites siguen a la física
    const a = chassis.angle, o = this.toWorld(0, 0);
    sprite.setPosition(o.x, o.y).setRotation(a);
    wheels.forEach((w, i) => wheelSprites[i].setPosition(w.position.x, w.position.y).setRotation(w.angle));
    // luces de Navidad de la tienda: parpadean alternando dos texturas
    if (this.xmasLights) {
      const k = Math.floor(this.time.now / 380) % 2 ? 'plow-b' : 'plow';
      if (sprite.texture.key !== k) sprite.setTexture(k);
    }
    const bp = this.toWorld(-3, -70);
    beacon.setPosition(bp.x, bp.y).setAlpha(0.45 + 0.55 * Math.abs(Math.sin(this.time.now / 160)));
    for (const g of this.gifts) if (g.state === 'push') g.sprite.setPosition(g.body.position.x, g.body.position.y).setRotation(g.body.angle);

    this.placeSleighs();
    if (this.alive) {
      const speed = Math.hypot(chassis.velocity.x, chassis.velocity.y);
      this.engine?.set(Math.min(1, Math.abs(wheels[0].angularVelocity) / T.maxSpin), this.hold ? 1 : 0.45);
      this.dist = Math.max(this.dist, Math.floor((chassis.position.x - this.startX) / PX_PER_M));
      this.events.emit('dist', this.dist);
      // barra hasta el próximo trineo (están cada 150 m exactos desde la salida)
      const leg = SLEIGH_EVERY_M * PX_PER_M, k = Math.floor((o.x + 180 - this.startX) / leg) + 1;
      this.events.emit('progress', Phaser.Math.Clamp(1 - (this.startX + k * leg - o.x) / leg, 0, 1));
      this.checkGifts(dt);
      this.checkSleighs(o.x);

      // camión volcado
      const up = Math.cos(a);
      this.flipT = up < -0.2 && speed < 4 ? this.flipT + dt : 0;
      if (this.flipT > T.flipSeconds) this.endRun();
    } else {
      this.engine?.set(0, 0);
    }

    if (this.gifts.length > 24) this.gifts = this.gifts.filter((g) => g.state === 'push');

    // mundo infinito
    this.terrain.ensure(chassis.position.x + 2600);
    this.terrain.cull(chassis.position.x - 1600);
    if (this.time.now > this.blinkAt) { this.blinkAt = this.time.now + 450; this.terrain.blink(Math.floor(this.time.now / 450)); }
    this.sleighs = this.sleighs.filter((s) => {
      if (s.x > chassis.position.x - 1800) return true;
      for (const ob of s.objs) ob.destroy();
      return false;
    });

    // fondo con paralaje
    const cam = this.cameras.main;
    this.bgFar.tilePositionX = cam.scrollX * 0.15;
    this.bgNear.tilePositionX = cam.scrollX * 0.35;
    // colinas lejanas apoyadas en la línea del suelo (objeto fijo a pantalla: y = h/2 + (yMundo - centroCámara))
    const gy = this.terrain.heightAt(cam.midPoint.x);
    this.groundY = this.groundY ? this.groundY + (gy - this.groundY) * 0.05 : gy;
    const cy = this.scale.height / 2 - cam.midPoint.y;
    this.bgFar.y = cy + this.groundY + 60;
    this.bgNear.y = cy + this.groundY + 150;
  }

  /** Motor y control en el aire, una vez por paso de física. */
  private drive() {
    if (!this.alive || !this.truck) return;
    const { chassis, wheels } = this.truck;
    for (const w of wheels) {
      const av = w.angularVelocity;
      M.Body.setAngularVelocity(w, this.hold ? Math.min(av + T.spinUp, T.maxSpin) : av * T.brake);
    }
    if (this.groundedNow === 0) {
      const lean = this.hold ? -T.airLeanBack : T.airLeanFwd;
      M.Body.setAngularVelocity(chassis, Phaser.Math.Clamp(chassis.angularVelocity + lean, -0.09, 0.09));
    }
  }

  /** Regalos que se quedan atrás de la pala, se van muy lejos o se hunden: perdidos. */
  private checkGifts(dt: number) {
    let load = 0;
    for (const g of this.gifts) {
      if (g.state !== 'push') continue;
      const p = g.body.position;
      const lx = this.localX(p.x, p.y);
      g.behindT = lx < T.bladeX - 12 ? g.behindT + dt : 0;
      if (g.behindT > T.behindSeconds || lx > 1600 || p.y > this.terrain.heightAt(p.x) + 90) { this.loseGift(g); continue; }
      load++;
    }
    if (load !== this.lastLoad) { this.lastLoad = load; this.events.emit('load', load); }
    if (load === 0 && this.refillPending === 0) this.endRun();
  }

  private loseGift(g: Gift) {
    g.state = 'lost';
    this.matter.world.remove(g.body);
    audio.tone(330, 0.25, 'triangle', 0.14, 140);
    this.events.emit('lost');
    this.tweens.add({ targets: g.sprite, alpha: 0, y: g.sprite.y + 40, angle: g.sprite.angle + 90, duration: 500, onComplete: () => g.sprite.destroy() });
    const poof = this.add.particles(g.sprite.x, g.sprite.y, 'poof', {
      speed: { min: 40, max: 140 }, lifespan: 420, scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 }, emitting: false,
    }).setDepth(4);
    poof.explode(6);
    this.time.delayedCall(500, () => poof.destroy());
  }

  /** Trineos: se colocan cuando su suelo existe; cada regalo que cruza su línea es una entrega. */
  private placeSleighs() {
    const list = this.terrain.sleighs;
    while (list.length) {
      const s = list.shift()!;
      const objs: Phaser.GameObjects.GameObject[] = [
        this.add.image(s.x + 30, s.y + 8, 'sleigh').setOrigin(90 / 200, 1).setScale(1.35).setDepth(0.5),
        this.add.image(s.x - 70, s.y + 4, 'pole').setOrigin(0.5, 1).setDepth(0.4),
        this.add.image(s.x - 70, s.y - 192, 'ic-star').setScale(0.42).setDepth(0.6),
      ];
      this.tweens.add({ targets: objs[2], angle: 360, duration: 4000, repeat: -1 });
      this.sleighs.push({ ...s, objs, got: 0, refilled: false, passed: false });
    }
  }

  private checkSleighs(truckX: number) {
    for (const s of this.sleighs) {
      if (s.passed) continue;
      for (const g of this.gifts) {
        if (g.state === 'push' && g.body.position.x > s.x - 10 && g.body.position.x < s.x + 150) this.deliver(g, s);
      }
      if (s.got > 0 && !s.refilled) {
        s.refilled = true;
        this.refillPending++;
        this.time.delayedCall(450, () => this.refill(s));
      }
      if (truckX > s.x + 180) s.passed = true;
    }
  }

  private deliver(g: Gift, s: Sleigh) {
    g.state = 'done';
    this.matter.world.remove(g.body);
    s.got++;
    this.delivered++;
    this.events.emit('gifts', this.delivered);
    // campanillas que suben de tono con cada regalo del mismo trineo
    const base = 880 * Math.pow(2, Math.min(s.got - 1, 7) / 12);
    audio.tone(base, 0.18, 'triangle', 0.14); this.time.delayedCall(70, () => audio.tone(base * 1.5, 0.22, 'triangle', 0.1));
    this.tweens.add({
      targets: g.sprite, x: s.x + 6, y: s.y - 112, angle: 0, scale: g.sprite.scale * 0.6, duration: 380, ease: 'Quad.out',
      onComplete: () => this.tweens.add({ targets: g.sprite, alpha: 0, y: s.y - 92, duration: 160, onComplete: () => g.sprite.destroy() }),
    });
    const sl = s.objs[0] as Phaser.GameObjects.Image;
    this.tweens.killTweensOf(sl);
    sl.setScale(1.35);
    this.tweens.add({ targets: sl, scaleY: 1.45, duration: 90, yoyo: true });
  }

  /** Recarga en el trineo: los duendes dejan regalos nuevos en la carretera, justo después. */
  private refill(s: Sleigh) {
    if (!this.scene.isActive() || !this.truck) return;
    // siempre por delante de la pala, aunque el camión ya haya pasado el trineo (móviles lentos)
    const base = Math.max(s.x + 250, this.toWorld(T.bladeX, 0).x + 60);
    const spots: [number, number, number][] = [[0, 0, 40], [42, 0, 40], [84, 0, 40], [21, -41, 34], [63, -41, 34]];
    for (const [dx, dy, size] of spots.slice(0, T.refill)) {
      const x = base + dx, y = this.terrain.heightAt(x) - size / 2 - 40 + dy;
      this.spawnGift(x, y, size);
    }
    const sp = this.add.particles(base + 42, this.terrain.heightAt(base + 42) - 60, 'ic-star', {
      speed: { min: 80, max: 260 }, lifespan: 700, scale: { start: 0.2, end: 0 }, gravityY: 300, emitting: false,
    }).setDepth(4);
    sp.explode(14);
    this.time.delayedCall(800, () => sp.destroy());
    [1046, 1318, 1568, 2093].forEach((f, i) => this.time.delayedCall(i * 80, () => audio.tone(f, 0.2, 'sine', 0.1)));
    this.refillPending--;
    this.events.emit('sleigh', { got: s.got, refill: T.refill });
  }

  /* ---------------------------------------------------------------- final y revivir */

  private endRun() {
    if (!this.alive) return;
    this.alive = false;
    portal.gameplayStop();
    audio.tone(392, 0.2, 'triangle', 0.14); this.time.delayedCall(180, () => audio.tone(294, 0.35, 'triangle', 0.14, 220));
    this.cameras.main.shake(180, 0.006);
    this.time.delayedCall(700, () => {
      const best = save.get('best');
      const newBest = this.delivered > best;
      if (newBest) { save.set('best', this.delivered); portal.happyTime(); }
      if (this.dist > save.get('bestDist')) save.set('bestDist', this.dist);
      save.set('gifts', save.get('gifts') + this.delivered - this.deliveredSaved);
      this.deliveredSaved = this.delivered;
      this.events.emit('over', {
        gifts: this.delivered, best: Math.max(best, this.delivered), newBest, dist: this.dist, canRevive: portal.hasRewarded && !this.revived, canDouble: !this.doubled,
      });
    });
  }

  /** Nombre que usan las pruebas automáticas (scripts/sdk-test.mjs, heredado de Egg Truck): termina la partida. */
  breakEgg() { this.endRun(); }

  /** ×2 con anuncio con recompensa: suma otra vez los regalos entregados en la partida (una vez por partida). */
  doubleGifts() {
    if (this.doubled) return 0;
    this.doubled = true;
    save.set('gifts', save.get('gifts') + this.delivered);
    return this.delivered;
  }

  /** Revivir tras anuncio con recompensa: camión recolocado y montón nuevo de regalos (una vez por partida). */
  revive() {
    this.revived = true;
    const c = this.truck.chassis;
    const x = c.position.x + 60, y = this.terrain.heightAt(x) - 70;
    const dx = x - c.position.x, dy = y - c.position.y;
    M.Body.setAngle(c, 0);
    M.Body.translate(c, { x: dx, y: dy });
    M.Body.setVelocity(c, { x: 0, y: 0 });
    M.Body.setAngularVelocity(c, 0);
    this.truck.wheels.forEach((w, i) => {
      M.Body.setPosition(w, { x: x + this.truck.d.x + (i ? 48 : -50), y: y + this.truck.d.y + 26 });
      M.Body.setVelocity(w, { x: 0, y: 0 });
      M.Body.setAngularVelocity(w, 0);
    });
    for (const g of this.gifts) if (g.state === 'push') { g.state = 'lost'; this.matter.world.remove(g.body); g.sprite.destroy(); }
    this.gifts = this.gifts.filter((g) => g.state === 'done' && g.sprite.active);
    this.flipT = 0;
    this.loadPile(5);
    this.lastLoad = -1;
    this.alive = true;
    portal.gameplayStart();
  }
}
