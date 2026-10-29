import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { Terrain } from '../terrain';
import { save, PX_PER_M } from '../state';
import { truckKey, hatKey } from '../cosmeticos';

// La librería Matter.js que trae Phaser (sus tipos no la exponen).
const M: any = (Phaser.Physics.Matter as any).Matter;
const STEP_MS = 1000 / 60;

/** Ajustes de manejo (los que se tocan para equilibrar el juego). */
const T = {
  wheelR: 24,
  maxSpin: 0.42,        // velocidad angular máxima de las ruedas (rad por paso)
  spinUp: 0.035,
  brake: 0.86,          // al soltar, las ruedas frenan
  airLeanBack: 0.0032,  // en el aire, mantener inclina hacia atrás
  airLeanFwd: 0.0024,   // y soltar, hacia delante
  crackSpeed: 6.2,      // golpe del huevo contra la caja que lo agrieta
  flipSeconds: 1.4,
};

type Truck = {
  chassis: MatterJS.BodyType; wheels: MatterJS.BodyType[]; d: { x: number; y: number };
  sprite: Phaser.GameObjects.Image; wheelSprites: Phaser.GameObjects.Image[];
};

/**
 * La partida. Una sola mecánica: mantener pulsado = acelerar (e inclinar atrás en el aire);
 * soltar = frenar (e inclinar adelante). Llevar el huevo lo más lejos posible sin romperlo.
 */
export class Play extends Phaser.Scene {
  private terrain!: Terrain;
  private truck!: Truck;
  private egg!: MatterJS.BodyType;
  private eggSprite!: Phaser.GameObjects.Image;
  private hat: Phaser.GameObjects.Image | null = null; // gorro de la tienda (sigue al huevo)
  /** Estrellas de la partida ya dobladas con el anuncio ×2 (una vez por partida). */
  doubled = false;
  private crack = 0;
  private startX = 0;
  private dist = 0;
  private starsRun = 0;
  private starsSaved = 0;   // estrellas de esta partida ya sumadas al total (por si revive)
  private alive = true;
  private revived = false;
  private grounded = 0;
  private flipT = 0;
  private hold = false;
  private starObjs: Phaser.GameObjects.Image[] = [];
  private flags: Phaser.GameObjects.Image[] = [];
  private nextFlagM = 100;
  private engine: ReturnType<typeof audio.engine> = null;
  private lastCrackAt = 0;
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private clouds: Phaser.GameObjects.Image[] = [];
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private static firstRun = true;
  private acc = 0;          // acumulador de tiempo para la física a paso fijo
  private paused = false;   // física detenida (anuncio en curso)
  private groundedNow = 0;  // ruedas tocando suelo en el último paso
  private groundY = 0;      // altura media del suelo en pantalla (para las colinas del fondo)

  constructor() { super('Play'); }

  async create() {
    this.alive = true; this.revived = false; this.doubled = false; this.hat = null; this.crack = 0; this.dist = 0; this.starsRun = 0; this.starsSaved = 0; this.flipT = 0;
    this.groundY = 0; this.nextFlagM = 100; this.starObjs = []; this.flags = []; this.clouds = []; this.hold = false;
    this.registry.set('hold', false);
    // la instancia de la escena se reutiliza al reiniciar: nada de la partida anterior puede sobrevivir
    this.egg = undefined as unknown as MatterJS.BodyType;
    this.eggSprite = undefined as unknown as Phaser.GameObjects.Image;
    this.truck = undefined as unknown as Truck;
    this.paused = false;

    this.cameras.main.setBackgroundColor('#6cc8ff');
    this.makeBackground();
    this.startX = 400;
    this.terrain = new Terrain(this, this.startX, new Phaser.Math.RandomDataGenerator([`${Date.now()}`]));
    this.terrain.ensure(this.startX + 2400);
    this.spawnTruck(this.startX, this.terrain.heightAt(this.startX) - 70);
    this.spawnEgg();

    const cam = this.cameras.main;
    cam.startFollow(this.truck.sprite, true, 0.09, 0.09);
    this.layout();
    this.scale.on('resize', this.layout, this);

    this.matter.world.on('collisionstart', this.onCollide, this);
    this.matter.world.on('collisionactive', this.onContact, this);
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
      M.Bodies.rectangle(x, y, 160, 26, opts),               // chasis
      M.Bodies.rectangle(x + 44, y - 30, 52, 40, opts),      // cabina
      M.Bodies.rectangle(x - 71, y - 26, 14, 36, opts),      // pared trasera de la caja
    ];
    const chassis = M.Body.create({ parts, collisionFilter: filter, friction: 0.4, label: 'truck', frictionAir: 0.005 });
    M.Body.setDensity(chassis, 0.0016);
    this.matter.world.add(chassis);
    const d = { x: x - chassis.position.x, y: y - chassis.position.y };

    const wheelPos = [{ x: -52, y: 26 }, { x: 52, y: 26 }];
    const wheels = wheelPos.map((p) => {
      const w = M.Bodies.circle(x + p.x, y + p.y, T.wheelR, {
        collisionFilter: filter, friction: 1, frictionStatic: 10, restitution: 0, label: 'wheel', density: 0.0022,
      });
      this.matter.world.add(w);
      this.matter.world.add(M.Constraint.create({
        bodyA: chassis, pointA: { x: p.x + d.x, y: p.y + d.y }, bodyB: w, length: 0, stiffness: 0.28, damping: 0.12,
      }));
      return w;
    });
    const sprite = this.add.image(x, y, truckKey()).setOrigin(0.5, 70 / 110).setDepth(2);
    const wheelSprites = wheels.map((w) => this.add.image(w.position.x, w.position.y, 'wheel').setDepth(3));
    this.truck = { chassis, wheels, d, sprite, wheelSprites };
  }

  /** Coloca el huevo en la caja (también al revivir). */
  private spawnEgg() {
    const p = this.bedPoint();
    if (this.egg) this.matter.world.remove(this.egg);
    this.egg = M.Bodies.circle(p.x, p.y, 19, {
      label: 'egg', restitution: 0.35, friction: 0.6, frictionAir: 0.004, density: 0.0006,
    });
    this.matter.world.add(this.egg);
    if (!this.eggSprite) this.eggSprite = this.add.image(p.x, p.y, 'egg0').setDepth(1);
    this.eggSprite.setTexture('egg0').setVisible(true);
    const hk = hatKey();
    if (hk && !this.hat) this.hat = this.add.image(p.x, p.y, hk).setOrigin(0.5, 0.85).setDepth(1.1);
    if (this.hat) { this.tweens.killTweensOf(this.hat); this.hat.setVisible(true).setAlpha(1); }
  }

  /** Punto del mundo en el centro de la caja de carga, sobre el chasis. */
  private bedPoint() {
    const c = this.truck.chassis, a = c.angle;
    const lx = this.truck.d.x - 30, ly = this.truck.d.y - 36;
    return { x: c.position.x + lx * Math.cos(a) - ly * Math.sin(a), y: c.position.y + lx * Math.sin(a) + ly * Math.cos(a) };
  }

  private makeBackground() {
    const cam = this.cameras.main;
    for (let i = 0; i < 5; i++) {
      this.clouds.push(this.add.image(i * 420, 80 + (i % 3) * 70, 'cloud').setScrollFactor(0.15, 0.05).setDepth(-5).setAlpha(0.95));
    }
    this.bgFar = this.add.tileSprite(0, 0, cam.width, 400, 'hills-far').setScrollFactor(0).setOrigin(0.5, 1).setDepth(-4);
    this.bgNear = this.add.tileSprite(0, 0, cam.width, 400, 'hills-near').setScrollFactor(0).setOrigin(0.5, 1).setDepth(-3);
  }

  /** Zoom según la pantalla: siempre se ve lo mismo del mundo en vertical, también en móvil. */
  private layout() {
    const w = this.scale.width, h = this.scale.height;
    const cam = this.cameras.main;
    cam.setSize(w, h);
    // apaisado: se ve siempre la misma altura de mundo; vertical: se prioriza el ancho para no ver el camión diminuto
    const z = h > w ? Phaser.Math.Clamp(w / 560, 0.45, 1.6) : Phaser.Math.Clamp(Math.min(h / 760, w / 900), 0.38, 1.6);
    cam.setZoom(z);
    cam.setFollowOffset(-w / z * 0.16, 60);
    const vw = w / z, vh = h / z;
    this.bgFar.setSize(vw, 400).setX(w / 2);
    this.bgNear.setSize(vw, 400).setX(w / 2);
  }

  /* ---------------------------------------------------------------- colisiones */

  private isPart(b: MatterJS.BodyType, label: string) { return b.label === label || b.parent?.label === label; }

  private onContact(ev: { pairs: Phaser.Types.Physics.Matter.MatterCollisionPair[] }) {
    for (const p of ev.pairs) {
      const a = p.bodyA as MatterJS.BodyType, b = p.bodyB as MatterJS.BodyType;
      if ((a.label === 'wheel' && b.label === 'ground') || (b.label === 'wheel' && a.label === 'ground')) this.grounded++;
    }
  }

  private onCollide(ev: { pairs: Phaser.Types.Physics.Matter.MatterCollisionPair[] }) {
    if (!this.alive) return;
    for (const p of ev.pairs) {
      const a = p.bodyA as MatterJS.BodyType, b = p.bodyB as MatterJS.BodyType;
      const egg = a.label === 'egg' ? a : b.label === 'egg' ? b : null;
      if (!egg) continue;
      const other = egg === a ? b : a;
      if (other.label === 'ground') return this.breakEgg();
      if (this.isPart(other, 'truck')) {
        const c = this.truck.chassis;
        const rel = Math.hypot(egg.velocity.x - c.velocity.x, egg.velocity.y - c.velocity.y);
        if (rel > T.crackSpeed && this.time.now - this.lastCrackAt > 250) {
          this.lastCrackAt = this.time.now;
          this.crack++;
          if (this.crack >= 3) return this.breakEgg();
          this.eggSprite.setTexture(`egg${this.crack}`);
          audio.noise(0.12, 0.35, 2400);
          audio.tone(320, 0.12, 'triangle', 0.15, 180);
          this.cameras.main.shake(120, 0.004);
          this.events.emit('crack', this.crack);
        } else if (rel > 2.5) {
          audio.tone(220, 0.06, 'sine', 0.08, 160);
        }
      }
    }
  }

  /* ---------------------------------------------------------------- bucle */

  update(_t: number, dtMs: number) {
    const { chassis, wheels, sprite, wheelSprites, d } = this.truck;
    this.hold = this.alive && (this.registry.get('hold') || this.keys.some((k) => k.isDown));
    // Física a 60 Hz fijos con acumulador (máximo 4 pasos por fotograma para no espiralizar).
    if (!this.paused) {
      // rawDelta: tiempo real (el delta de Phaser viene suavizado y topado a 16,7 ms)
      this.acc += Math.min(this.game.loop.rawDelta || dtMs, 100) * this.time.timeScale;
      let n = 0;
      while (this.acc >= STEP_MS && n < 4) { this.matter.world.step(STEP_MS); this.acc -= STEP_MS; n++; }
      if (n === 4) this.acc = 0;
    }

    // sprites siguen a la física
    const a = chassis.angle;
    sprite.setPosition(chassis.position.x + d.x * Math.cos(a) - d.y * Math.sin(a), chassis.position.y + d.x * Math.sin(a) + d.y * Math.cos(a));
    sprite.setRotation(a);
    wheels.forEach((w, i) => wheelSprites[i].setPosition(w.position.x, w.position.y).setRotation(w.angle));
    if (this.alive) {
      const e = this.egg.position, ea = this.egg.angle;
      this.eggSprite.setPosition(e.x, e.y).setRotation(ea);
      // gorro sobre la punta del huevo (el huevo mide 50 de alto: punta a -24 del centro)
      this.hat?.setPosition(e.x + 21 * Math.sin(ea), e.y - 21 * Math.cos(ea)).setRotation(ea);
    }

    if (this.alive) {
      const speed = Math.hypot(chassis.velocity.x, chassis.velocity.y);
      this.engine?.set(Math.min(1, Math.abs(wheels[0].angularVelocity) / T.maxSpin), this.hold ? 1 : 0.45);

      // distancia y banderines
      this.dist = Math.max(this.dist, Math.floor((chassis.position.x - this.startX) / PX_PER_M));
      this.events.emit('dist', this.dist);
      if (this.dist >= this.nextFlagM - 8 && !this.flags.some((f) => f.getData('m') === this.nextFlagM)) {
        const fx = this.startX + this.nextFlagM * PX_PER_M;
        this.flags.push(this.add.image(fx, this.terrain.heightAt(fx) - 40, 'flag').setData('m', this.nextFlagM).setDepth(0));
      }
      if (this.dist >= this.nextFlagM) {
        this.events.emit('milestone', this.nextFlagM);
        audio.tone(660, 0.12, 'square', 0.1); this.time.delayedCall(110, () => audio.tone(990, 0.2, 'square', 0.1));
        this.nextFlagM += 100;
      }

      // huevo perdido (fuera de la caja y lejos) o camión volcado
      const eggDist = Phaser.Math.Distance.Between(this.egg.position.x, this.egg.position.y, chassis.position.x, chassis.position.y);
      if (eggDist > 260) this.breakEgg();
      const up = Math.cos(a);
      this.flipT = up < -0.2 && speed < 4 ? this.flipT + dtMs / 1000 : 0;
      if (this.flipT > T.flipSeconds) this.breakEgg();
    } else {
      this.engine?.set(0, 0);
    }

    // estrellas
    this.placeStars();
    for (const s of this.starObjs) {
      if (!s.active) continue;
      s.setScale(0.36 + Math.sin(this.time.now / 180 + s.x) * 0.03);
      if (this.alive && (Phaser.Math.Distance.Between(s.x, s.y, sprite.x, sprite.y - 20) < 70 ||
          Phaser.Math.Distance.Between(s.x, s.y, this.egg.position.x, this.egg.position.y) < 45)) this.collect(s);
    }

    // mundo infinito
    this.terrain.ensure(chassis.position.x + 2600);
    this.terrain.cull(chassis.position.x - 1600);
    this.starObjs = this.starObjs.filter((s) => { if (s.x < chassis.position.x - 1600) { s.destroy(); return false; } return s.active; });

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
    for (const c of this.clouds) {
      const sx = c.x - cam.scrollX * 0.15;
      if (sx < -300) c.x += 2100;
    }
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

  private placeStars() {
    const list = this.terrain.stars;
    while (list.length && !Number.isNaN(list[0].y)) {
      const s = list.shift()!;
      this.starObjs.push(this.add.image(s.x, s.y, 'ic-star').setScale(0.36).setDepth(1));
    }
  }

  private collect(s: Phaser.GameObjects.Image) {
    s.setActive(false);
    this.starsRun++;
    this.events.emit('stars', this.starsRun);
    audio.tone(880 + (this.starsRun % 5) * 110, 0.12, 'triangle', 0.14, 1600);
    this.tweens.add({ targets: s, y: s.y - 60, alpha: 0, scale: 0.6, duration: 260, onComplete: () => s.destroy() });
  }

  /* ---------------------------------------------------------------- final y revivir */

  private breakEgg() {
    if (!this.alive) return;
    this.alive = false;
    portal.gameplayStop();
    const p = { x: this.egg.position.x, y: this.egg.position.y };
    this.eggSprite.setVisible(false);
    this.matter.world.remove(this.egg);
    if (this.hat) {
      // el gorro sale volando
      const hat = this.hat;
      this.tweens.add({ targets: hat, y: hat.y - 90, angle: hat.angle + 200, alpha: 0, duration: 650, ease: 'Quad.out', onComplete: () => hat.setVisible(false) });
    }
    audio.noise(0.35, 0.5, 1500);
    audio.tone(300, 0.4, 'sawtooth', 0.12, 80);
    this.cameras.main.shake(220, 0.01);
    const shells = this.add.particles(p.x, p.y, 'shell', {
      speed: { min: 120, max: 380 }, angle: { min: 200, max: 340 }, gravityY: 900, lifespan: 1100,
      rotate: { min: 0, max: 360 }, scale: { start: 1.3, end: 0.8 }, emitting: false,
    }).setDepth(5);
    shells.explode(14);
    const yolk = this.add.image(p.x, p.y, 'yolk').setDepth(5).setScale(0.4);
    this.tweens.add({ targets: yolk, scale: 2.2, y: p.y + 8, duration: 260, ease: 'Back.out' });
    this.time.timeScale = 0.6;
    this.time.delayedCall(700, () => {
      this.time.timeScale = 1;
      const best = save.get('best');
      const newBest = this.dist > best;
      if (newBest) { save.set('best', this.dist); portal.happyTime(); }
      save.set('stars', save.get('stars') + this.starsRun - this.starsSaved);
      this.starsSaved = this.starsRun;
      this.events.emit('over', { dist: this.dist, best: Math.max(best, this.dist), newBest, stars: this.starsRun, canRevive: portal.hasRewarded && !this.revived, canDouble: !this.doubled });
      yolk.destroy();
    });
  }

  /** ×2 con anuncio con recompensa: suma otra vez las estrellas de la partida (una vez por partida). */
  doubleStars() {
    if (this.doubled) return 0;
    this.doubled = true;
    save.set('stars', save.get('stars') + this.starsRun);
    return this.starsRun;
  }

  /** Revivir tras anuncio con recompensa: camión recolocado y huevo nuevo (una vez por partida). */
  revive() {
    this.revived = true;
    const c = this.truck.chassis;
    const x = c.position.x + 60, y = this.terrain.heightAt(x) - 90;
    const dx = x - c.position.x, dy = y - c.position.y;
    M.Body.setAngle(c, 0);
    M.Body.translate(c, { x: dx, y: dy });
    M.Body.setVelocity(c, { x: 0, y: 0 });
    M.Body.setAngularVelocity(c, 0);
    this.truck.wheels.forEach((w, i) => {
      M.Body.setPosition(w, { x: x + this.truck.d.x + (i ? 52 : -52), y: y + this.truck.d.y + 26 });
      M.Body.setVelocity(w, { x: 0, y: 0 });
      M.Body.setAngularVelocity(w, 0);
    });
    this.crack = 0;
    this.flipT = 0;
    this.spawnEgg();
    this.alive = true;
    portal.gameplayStart();
  }
}
