import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { Terrain, type DepotSpot } from '../terrain';
import { TRUCK_TEX, TRAILER_TEX } from '../cosmeticos';
import { save, PX_PER_M, DEPOT_EVERY_M } from '../state';

// La librería Matter.js que trae Phaser (sus tipos no la exponen).
const M: any = (Phaser.Physics.Matter as any).Matter;
const STEP_MS = 1000 / 60;

/** Ajustes de manejo y de la carga (los que se tocan para equilibrar el juego). */
const T = {
  wheelR: 24,
  trailerWheelR: 20,
  maxSpin: 0.38,         // velocidad angular máxima de las ruedas (rad por paso)
  spinUp: 0.032,
  brake: 0.84,          // al soltar, las ruedas frenan
  airLeanBack: 0.003,   // en el aire, mantener inclina hacia atrás
  airLeanFwd: 0.0024,   // y soltar, hacia delante
  flipSeconds: 1.4,
  offSeconds: 0.45,     // una carga fuera del remolque tanto tiempo = perdida
  load: 6,              // carga en cada depósito (y al empezar)
  reviveLoad: 3,        // carga al revivir
  hitchTruck: { x: -92, y: 6 },    // enganche en la grúa (coordenadas del diseño)
  hitchTrailer: { x: 142, y: 6 },  // anilla de la lanza del remolque
};
/** Distancia entre el origen de la grúa y el del remolque cuando están en línea. */
const RIG = T.hitchTrailer.x - T.hitchTruck.x;

type Kind = 'crate' | 'barrel' | 'sheep';
const SIZE: Record<Kind, { w: number; h: number }> = { crate: { w: 34, h: 34 }, barrel: { w: 30, h: 36 }, sheep: { w: 44, h: 32 } };

type Rig = {
  chassis: MatterJS.BodyType; wheels: MatterJS.BodyType[]; d: { x: number; y: number };
  trailer: MatterJS.BodyType; tWheel: MatterJS.BodyType; dt: { x: number; y: number };
  sprite: Phaser.GameObjects.Image; wheelSprites: Phaser.GameObjects.Image[];
  tSprite: Phaser.GameObjects.Image; tWheelSprite: Phaser.GameObjects.Image; beacon: Phaser.GameObjects.Image;
};
type Cargo = { kind: Kind; body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; offT: number; state: 'on' | 'done' | 'lost'; bumpAt: number };
type Depot = DepotSpot & { m: number; objs: Phaser.GameObjects.GameObject[]; done: boolean; got: number };
type Runner = { s: Phaser.GameObjects.Image; t: number };

/**
 * La partida. Una sola mecánica: mantener pulsado = acelerar (e inclinar atrás en el aire);
 * soltar = frenar (e inclinar adelante). La grúa arrastra un remolque enganchado con una bisagra; en el remolque
 * va la carga suelta (cajas, barriles y ovejas). En cada granero (cada 200 m) se entrega lo que quede encima:
 * puntos = cargas × metros del granero, monedas = cargas. Allí se carga otra vez. Remolque vacío o grúa volcada = fin.
 */
export class Play extends Phaser.Scene {
  private terrain!: Terrain;
  /** La grúa con su remolque (las pruebas automáticas leen truck.chassis). */
  truck!: Rig;
  private cargo: Cargo[] = [];
  private depots: Depot[] = [];
  private runners: Runner[] = [];
  private startX = 0;
  dist = 0;
  private points = 0;
  private coinsRun = 0;
  private coinsSaved = 0;   // monedas de esta partida ya sumadas al total (por si revive)
  private deliveredRun = 0;
  alive = true;
  private revived = false;
  /** Monedas de la partida ya dobladas con el anuncio ×2 (una vez por partida). */
  doubled = false;
  private grounded = 0;
  private flipT = 0;
  private hold = false;
  private refillPending = 0;
  private rng = new Phaser.Math.RandomDataGenerator(['load']);
  private engine: ReturnType<typeof audio.engine> = null;
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private static firstRun = true;
  private acc = 0;          // acumulador de tiempo para la física a paso fijo
  paused = false;           // física detenida (anuncio en curso)
  groundedNow = 0;          // ruedas de la grúa tocando suelo en el último paso
  private groundY = 0;      // altura media del suelo en pantalla (para las colinas del fondo)
  private lastLoad = -1;
  private rattleAt = 0;
  private runId = 0;        // partida en curso (los setTimeout de una partida anterior no hacen nada)
  private stuckT = 0;       // mantiene pulsado y no avanza: ayuda de cabrestante
  private idleT = 0;        // segundos sin ganar distancia
  private lastDist = 0;

  constructor() { super('Play'); }

  async create() {
    // la instancia de la escena se reutiliza al reiniciar: nada de la partida anterior puede sobrevivir
    this.alive = true; this.revived = false; this.doubled = false; this.dist = 0; this.points = 0; this.coinsRun = 0; this.coinsSaved = 0;
    this.deliveredRun = 0; this.flipT = 0; this.groundY = 0; this.cargo = []; this.depots = []; this.runners = []; this.hold = false;
    this.refillPending = 0; this.lastLoad = -1; this.grounded = 0; this.groundedNow = 0; this.rattleAt = 0; this.stuckT = 0; this.idleT = 0; this.lastDist = 0;
    this.truck = undefined as unknown as Rig;
    this.runId++;
    this.paused = false;
    this.registry.set('hold', false);

    this.scene.launch('Sky');
    this.makeBackground();
    this.startX = 400;
    this.rng = new Phaser.Math.RandomDataGenerator([`${Date.now()}`]);
    this.terrain = new Terrain(this, this.startX, new Phaser.Math.RandomDataGenerator([`${Date.now()}`]));
    this.terrain.ensure(this.startX + 2400);
    this.spawnRig(this.startX, this.terrain.heightAt(this.startX) - 52);
    this.loadCargo(T.load);

    const cam = this.cameras.main;
    cam.startFollow(this.truck.sprite, true, 0.09, 0.09);
    this.layout();
    this.scale.on('resize', this.layout, this);

    this.matter.world.on('collisionactive', this.onContact, this);
    this.matter.world.on('collisionstart', this.onContact, this);
    this.matter.world.on('collisionstart', this.onBump, this);
    // El motor se aplica en cada paso de física (no en cada fotograma): igual a 30 que a 120 FPS.
    this.matter.world.on('beforeupdate', () => { this.groundedNow = this.grounded; this.grounded = 0; this.drive(); });
    this.acc = 0;

    this.keys = ['SPACE', 'UP', 'RIGHT', 'W', 'D'].map((k) => this.input.keyboard!.addKey(k));
    this.engine = audio.engine();

    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      this.runId++;
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

  /** Grúa (origen de diseño en x, y) y remolque detrás, unidos por una bisagra en el enganche. */
  private spawnRig(x: number, y: number) {
    const group = M.Body.nextGroup(true);
    const filter = { group, category: 1, mask: 0xffffffff };
    const opts = { collisionFilter: filter };
    const chassis = M.Body.create({
      parts: [
        M.Bodies.rectangle(x, y, 160, 24, opts),           // chasis
        M.Bodies.rectangle(x + 38, y - 34, 56, 48, opts),  // cabina
        M.Bodies.rectangle(x + 75, y - 20, 26, 20, opts),  // capó
        M.Bodies.rectangle(x - 27, y - 20, 30, 20, opts),  // base de la pluma
      ],
      collisionFilter: filter, friction: 0.4, label: 'truck', frictionAir: 0.005,
    });
    M.Body.setDensity(chassis, 0.0018);
    // más inercia: el tirón del remolque no levanta el morro (en el aire se inclina con setAngularVelocity)
    M.Body.setInertia(chassis, chassis.inertia * 4);
    this.matter.world.add(chassis);
    const d = { x: x - chassis.position.x, y: y - chassis.position.y };
    const wheels = [{ x: -50, y: 26 }, { x: 50, y: 26 }].map((p) => this.addWheel(chassis, d, p, T.wheelR, filter, 'wheel', 0.0024));

    const tx = x - RIG;
    const trailer = M.Body.create({
      parts: [
        M.Bodies.rectangle(tx, y, 208, 14, { ...opts, chamfer: { radius: 6 } }), // plataforma
        M.Bodies.rectangle(tx - 95, y - 14, 12, 16, opts),   // compuerta trasera, muy baja: en las cuestas la carga resbala hacia atrás
        M.Bodies.rectangle(tx + 95, y - 17, 12, 22, opts),   // borde delantero
      ],
      collisionFilter: filter, friction: 0.6, frictionStatic: 0.8, label: 'trailer', frictionAir: 0.004,
    });
    M.Body.setDensity(trailer, 0.0012);
    this.matter.world.add(trailer);
    const dt = { x: tx - trailer.position.x, y: y - trailer.position.y };
    const tWheel = this.addWheel(trailer, dt, { x: -6, y: 30 }, T.trailerWheelR, filter, 'twheel', 0.0016);
    // bisagra: los dos enganches en el mismo punto (el remolque gira libre y tira de la grúa al frenar)
    this.matter.world.add(M.Constraint.create({
      bodyA: chassis, pointA: { x: T.hitchTruck.x + d.x, y: T.hitchTruck.y + d.y },
      bodyB: trailer, pointB: { x: T.hitchTrailer.x + dt.x, y: T.hitchTrailer.y + dt.y },
      length: 0, stiffness: 0.8, damping: 0.1, label: 'hitch',
    }));

    const tSprite = this.add.image(tx, y, 'trailer').setOrigin(TRAILER_TEX.ox / TRAILER_TEX.w, TRAILER_TEX.oy / TRAILER_TEX.h).setDepth(1.2);
    const tWheelSprite = this.add.image(tWheel.position.x, tWheel.position.y, 'wheel-s').setDepth(1.3);
    const sprite = this.add.image(x, y, 'truck').setOrigin(TRUCK_TEX.ox / TRUCK_TEX.w, TRUCK_TEX.oy / TRUCK_TEX.h).setDepth(2);
    const wheelSprites = wheels.map((w) => this.add.image(w.position.x, w.position.y, 'wheel').setDepth(3));
    const beacon = this.add.image(x, y, 'dot').setDepth(2.5).setTint(0xffa040).setBlendMode(Phaser.BlendModes.ADD);
    this.truck = { chassis, wheels, d, trailer, tWheel, dt, sprite, wheelSprites, tSprite, tWheelSprite, beacon };
  }

  private addWheel(body: MatterJS.BodyType, d: { x: number; y: number }, p: { x: number; y: number }, r: number, filter: object, label: string, density: number) {
    const ox = body.position.x + d.x, oy = body.position.y + d.y;
    const w = M.Bodies.circle(ox + p.x, oy + p.y, r, { collisionFilter: filter, friction: 1, frictionStatic: 10, restitution: 0, label, density });
    this.matter.world.add(w);
    this.matter.world.add(M.Constraint.create({ bodyA: body, pointA: { x: p.x + d.x, y: p.y + d.y }, bodyB: w, length: 0, stiffness: 0.28, damping: 0.12 }));
    return w;
  }

  /** Punto del mundo para unas coordenadas locales del diseño de un cuerpo (grúa o remolque). */
  private world(body: MatterJS.BodyType, d: { x: number; y: number }, lx: number, ly: number) {
    const a = body.angle, x = d.x + lx, y = d.y + ly;
    return { x: body.position.x + x * Math.cos(a) - y * Math.sin(a), y: body.position.y + x * Math.sin(a) + y * Math.cos(a) };
  }

  /** Coordenadas locales del remolque (x a lo largo de la plataforma, y hacia abajo; 0,0 = centro de la plataforma). */
  private trailerLocal(px: number, py: number) {
    const t = this.truck.trailer, a = t.angle, o = this.world(t, this.truck.dt, 0, 0);
    const dx = px - o.x, dy = py - o.y;
    return { x: dx * Math.cos(a) + dy * Math.sin(a), y: -dx * Math.sin(a) + dy * Math.cos(a) };
  }

  private spawnCargo(kind: Kind, lx: number, up: number) {
    const sz = SIZE[kind], t = this.truck.trailer;
    const p = this.world(t, this.truck.dt, lx, -7 - sz.h / 2 - 1 - up);
    const body = M.Bodies.rectangle(p.x, p.y, sz.w, sz.h, {
      label: kind, density: kind === 'sheep' ? 0.0005 : 0.0006, friction: 0.32, frictionStatic: 0.45, frictionAir: 0.01,
      restitution: kind === 'sheep' ? 0.25 : kind === 'barrel' ? 0.15 : 0.06, chamfer: { radius: kind === 'crate' ? 3 : kind === 'barrel' ? 7 : 11 },
    });
    M.Body.setAngle(body, t.angle);
    M.Body.setVelocity(body, { x: t.velocity.x, y: t.velocity.y });
    this.matter.world.add(body);
    const sprite = this.add.image(p.x, p.y, kind).setDepth(1.1);
    if (kind === 'sheep') sprite.setScale(0.8).setOrigin(0.5, 0.56);
    else sprite.setDisplaySize(sz.w + 2, sz.h + 2);
    this.cargo.push({ kind, body, sprite, offT: 0, state: 'on', bumpAt: 0 });
  }

  /** Carga del remolque: hasta 4 abajo (siempre alguna oveja) y 2 cajas o barriles encima (al empezar, en cada granero y al revivir). */
  private loadCargo(n: number) {
    const slots: [number, number][] = [[-64, 0], [-24, 0], [16, 0], [56, 0], [-44, 37], [36, 37]];
    const r = this.rng;
    // como mucho 2 ovejas por carga, siempre en la fila de abajo (encima solo cajas y barriles)
    const sheepAt = r.between(0, 3), sheep2 = r.frac() < 0.4 ? (sheepAt + 2) % 4 : -1;
    for (let i = 0; i < n; i++) {
      const [lx, up] = slots[i % slots.length];
      const kind: Kind = i === sheepAt || i === sheep2 ? 'sheep' : r.frac() < 0.5 ? 'crate' : 'barrel';
      this.spawnCargo(kind, lx, up);
    }
    this.lastLoad = -1;
  }

  private makeBackground() {
    const cam = this.cameras.main;
    this.bgFar = this.add.tileSprite(0, 0, cam.width, 400, 'hills-far').setScrollFactor(0).setOrigin(0.5, 1).setDepth(-4);
    this.bgNear = this.add.tileSprite(0, 0, cam.width, 400, 'hills-near').setScrollFactor(0).setOrigin(0.5, 1).setDepth(-3);
  }

  /** Zoom según la pantalla: siempre se ve la grúa entera con su remolque, también en móvil vertical. */
  private layout() {
    const w = this.scale.width, h = this.scale.height;
    const cam = this.cameras.main;
    cam.setSize(w, h);
    const portrait = h > w;
    const z = portrait ? Phaser.Math.Clamp(w / 800, 0.4, 1.6) : Phaser.Math.Clamp(Math.min(h / 660, w / 1000), 0.36, 1.8);
    cam.setZoom(z);
    const vw = w / z;
    // centro de la cámara respecto a la grúa: algo de camino por delante y el remolque entero detrás
    const ahead = portrait ? -60 : Math.min(vw * 0.12, vw / 2 - RIG - 140) - 40;
    cam.setFollowOffset(-ahead, 60);
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

  /** Golpes de la carga: las ovejas dan un saltito y balan; cajas y barriles suenan a madera. */
  private onBump(ev: { pairs: Phaser.Types.Physics.Matter.MatterCollisionPair[] }) {
    if (!this.alive) return;
    for (const p of ev.pairs) {
      for (const [me, other] of [[p.bodyA, p.bodyB], [p.bodyB, p.bodyA]] as MatterJS.BodyType[][]) {
        if (me.label !== 'sheep' && me.label !== 'crate' && me.label !== 'barrel') continue;
        const rel = Math.hypot(me.velocity.x - other.velocity.x, me.velocity.y - other.velocity.y);
        if (rel < 2.2) continue;
        const c = this.cargo.find((k) => k.body === me);
        if (!c || c.state !== 'on' || this.time.now - c.bumpAt < 280) continue;
        c.bumpAt = this.time.now;
        if (c.kind === 'sheep') {
          M.Body.setVelocity(me, { x: me.velocity.x, y: me.velocity.y - Math.min(2.2, rel * 0.3) });
          const base = 0.8;
          this.tweens.killTweensOf(c.sprite);
          c.sprite.setScale(base);
          this.tweens.add({ targets: c.sprite, scaleY: base * 1.18, scaleX: base * 0.9, duration: 90, yoyo: true });
          this.baa();
        } else {
          audio.tone(c.kind === 'barrel' ? 150 : 200, 0.07, 'triangle', Math.min(0.12, 0.03 + rel * 0.012), 90);
        }
      }
    }
  }

  private baa() {
    const f = 520 + Math.random() * 120;
    audio.tone(f, 0.09, 'sawtooth', 0.05, f * 0.94);
    this.time.delayedCall(80, () => audio.tone(f * 0.96, 0.22, 'sawtooth', 0.05, f * 0.82));
  }

  /* ---------------------------------------------------------------- bucle */

  update(_t: number, dtMs: number) {
    if (!this.truck) return;
    const { chassis, wheels, sprite, wheelSprites, trailer, tWheel, tSprite, tWheelSprite, beacon } = this.truck;
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
    const a = chassis.angle, o = this.world(chassis, this.truck.d, 0, 0);
    sprite.setPosition(o.x, o.y).setRotation(a);
    wheels.forEach((w, i) => wheelSprites[i].setPosition(w.position.x, w.position.y).setRotation(w.angle));
    const to = this.world(trailer, this.truck.dt, 0, 0);
    tSprite.setPosition(to.x, to.y).setRotation(trailer.angle);
    tWheelSprite.setPosition(tWheel.position.x, tWheel.position.y).setRotation(tWheel.angle);
    const bp = this.world(chassis, this.truck.d, 36, -66);
    beacon.setPosition(bp.x, bp.y).setScale(2.2).setAlpha(this.alive ? 0.35 + 0.55 * Math.abs(Math.sin(this.time.now / 170)) : 0);
    for (const c of this.cargo) if (c.state === 'on') c.sprite.setPosition(c.body.position.x, c.body.position.y).setRotation(c.body.angle);
    this.updateRunners(dt);

    this.placeDepots();
    if (this.alive) {
      const speed = Math.hypot(chassis.velocity.x, chassis.velocity.y);
      this.engine?.set(Math.min(1, Math.abs(wheels[0].angularVelocity) / T.maxSpin), this.hold ? 1 : 0.45);
      this.dist = Math.max(this.dist, Math.floor((o.x - this.startX) / PX_PER_M));
      this.events.emit('dist', this.dist);
      // barra hasta el próximo granero (están cada 200 m exactos desde la salida, contados desde el remolque)
      const leg = DEPOT_EVERY_M * PX_PER_M, k = Math.floor((to.x - this.startX) / leg) + 1;
      this.events.emit('progress', Phaser.Math.Clamp(1 - (this.startX + k * leg - to.x) / leg, 0, 1));
      this.checkCargo(dt);
      this.checkDepots(to.x);
      // traqueteo en el puente
      if (this.terrain.bridgeAt(o.x) && speed > 2 && this.time.now > this.rattleAt) {
        this.rattleAt = this.time.now + 110;
        audio.tone(120 + Math.random() * 40, 0.04, 'square', 0.04);
      }
      // atascado: si se mantiene pulsado y no avanza, una ayuda suave empuja (drive); sin avanzar 15 s = fin
      if (speed >= 0.7) this.stuckT = 0; else if (this.hold) this.stuckT += dt;
      if (this.dist > this.lastDist) { this.lastDist = this.dist; this.idleT = 0; } else this.idleT += dt;
      if (this.idleT > 15) this.endRun('stuck');
      // grúa volcada
      const up = Math.cos(a);
      this.flipT = up < -0.2 && speed < 4 ? this.flipT + dt : 0;
      if (this.flipT > T.flipSeconds) this.endRun('flip');
    } else {
      this.engine?.set(0, 0);
    }

    if (this.cargo.length > 30) this.cargo = this.cargo.filter((c) => c.state === 'on');

    // mundo infinito
    this.terrain.ensure(chassis.position.x + 2600);
    this.terrain.cull(chassis.position.x - 1800);
    this.terrain.spin(dtMs);
    this.depots = this.depots.filter((s) => {
      if (s.x > chassis.position.x - 2000) return true;
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
    if ((this.stuckT > 1.2 || (this.hold && this.idleT > 2.5)) && this.groundedNow > 0) {
      for (const b of [chassis, this.truck.trailer]) M.Body.setVelocity(b, { x: b.velocity.x + 0.12, y: b.velocity.y - 0.05 });
    }
    if (this.groundedNow === 0) {
      const lean = this.hold ? -T.airLeanBack : T.airLeanFwd;
      M.Body.setAngularVelocity(chassis, Phaser.Math.Clamp(chassis.angularVelocity + lean, -0.09, 0.09));
    }
  }

  /** Carga que se sale del remolque (por los lados o por debajo de la plataforma) un rato: perdida. */
  private checkCargo(dt: number) {
    let load = 0;
    for (const c of this.cargo) {
      if (c.state !== 'on') continue;
      const p = c.body.position;
      const l = this.trailerLocal(p.x, p.y);
      const onBed = Math.abs(l.x) < 108 && l.y < 4 && l.y > -300;
      c.offT = onBed ? 0 : c.offT + dt;
      if (c.offT > T.offSeconds || p.y > this.terrain.heightAt(p.x) + 60) { this.loseCargo(c); continue; }
      load++;
    }
    if (load !== this.lastLoad) { this.lastLoad = load; this.events.emit('load', load); }
    if (load === 0 && this.refillPending === 0) this.endRun('empty');
  }

  private loseCargo(c: Cargo) {
    c.state = 'lost';
    this.matter.world.remove(c.body);
    this.events.emit('lost', c.kind);
    const x = c.sprite.x, y = c.sprite.y;
    if (c.kind === 'sheep') {
      // la oveja no se hace daño: aterriza de pie y vuelve corriendo a casa
      this.baa();
      c.sprite.setRotation(0).setFlipX(true);
      this.runners.push({ s: c.sprite, t: 0 });
    } else {
      audio.tone(300, 0.2, 'triangle', 0.12, 140);
      this.tweens.add({ targets: c.sprite, alpha: 0, y: y + 30, angle: c.sprite.angle - 120, duration: 520, onComplete: () => c.sprite.destroy() });
    }
    const poof = this.add.particles(x, y, 'dust', {
      speed: { min: 40, max: 140 }, lifespan: 420, scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 }, emitting: false,
    }).setDepth(4);
    poof.explode(6);
    this.time.delayedCall(500, () => poof.destroy());
  }

  /** Ovejas que se cayeron: trotan dando saltitos hacia atrás (a la granja) y desaparecen. */
  private updateRunners(dt: number) {
    for (const r of this.runners) {
      r.t += dt;
      const x = r.s.x - 260 * dt;
      r.s.setPosition(x, this.terrain.heightAt(x) - 22 - Math.abs(Math.sin(r.t * 11)) * 14);
      r.s.setRotation(Math.sin(r.t * 11) * 0.12);
      if (r.t > 1.4) r.s.setAlpha(Math.max(0, 1 - (r.t - 1.4) / 0.8));
      if (r.t > 2.2) r.s.destroy();
    }
    if (this.runners.length) this.runners = this.runners.filter((r) => r.s.active);
  }

  /** Graneros: se colocan cuando su suelo existe. */
  private placeDepots() {
    const list = this.terrain.depots;
    while (list.length) {
      const s = list.shift()!;
      const m = Math.round((s.x - this.startX) / PX_PER_M);
      const objs: Phaser.GameObjects.GameObject[] = [
        this.add.image(s.x + 150, s.y + 14, 'barn').setOrigin(0.5, 1).setDepth(-0.5),
        this.add.image(s.x, s.y + 6, 'gate').setOrigin(0.5, 1).setDepth(0.4),
      ];
      this.depots.push({ ...s, m, objs, done: false, got: 0 });
    }
  }

  /** El remolque cruza el poste del granero: entrega todo lo que lleva encima y se carga de nuevo. */
  private checkDepots(trailerX: number) {
    for (const s of this.depots) {
      if (s.done || trailerX < s.x + 10) continue;
      s.done = true;
      const on = this.cargo.filter((c) => c.state === 'on');
      if (!on.length) continue;
      const barn = s.objs[0] as Phaser.GameObjects.Image;
      on.forEach((c, i) => {
        c.state = 'done';
        this.matter.world.remove(c.body);
        // la carga salta al granero, una detrás de otra
        this.tweens.add({
          targets: c.sprite, x: barn.x - 50 + (i % 3) * 18, y: barn.y - 70, angle: 0, delay: i * 70, duration: 420, ease: 'Quad.out',
          onStart: () => { const f = 660 * Math.pow(2, Math.min(i, 7) / 12); audio.tone(f, 0.14, 'triangle', 0.12); },
          onComplete: () => this.tweens.add({ targets: c.sprite, alpha: 0, scale: 0.2, duration: 160, onComplete: () => c.sprite.destroy() }),
        });
      });
      const n = on.length, pts = n * s.m;
      s.got = n;
      this.points += pts;
      this.coinsRun += n;
      this.deliveredRun += n;
      this.events.emit('score', this.points);
      this.events.emit('coins', this.coinsRun);
      this.events.emit('depot', { n, m: s.m, points: pts });
      this.tweens.add({ targets: barn, scaleY: 1.08, duration: 110, yoyo: true, repeat: 1 });
      this.refillPending++;
      // tiempo real: con pocos FPS el reloj de la escena va lento y la recarga tardaba varios segundos
      const run = this.runId;
      setTimeout(() => { if (run === this.runId) this.refill(s); }, 650 + n * 70);
    }
  }

  /** Nueva carga cae en el remolque, con estrellitas. */
  private refill(s: Depot) {
    this.refillPending--;
    if (!this.scene.isActive() || !this.truck || !this.alive) return;
    // el granjero cambia lo entregado por carga nueva (lo perdido no vuelve) y regala una más si llegaron 3 o más
    const n = Phaser.Math.Clamp(s.got + (s.got >= 3 ? 1 : 0), 1, T.load);
    this.loadCargo(n);
    const p = this.world(this.truck.trailer, this.truck.dt, 0, -40);
    const sp = this.add.particles(p.x, p.y, 'ic-star', {
      speed: { min: 80, max: 260 }, lifespan: 700, scale: { start: 0.2, end: 0 }, gravityY: 300, emitting: false,
    }).setDepth(4);
    sp.explode(14);
    this.time.delayedCall(800, () => sp.destroy());
    [1046, 1318, 1568, 2093].forEach((f, i) => this.time.delayedCall(i * 80, () => audio.tone(f, 0.2, 'sine', 0.1)));
    this.events.emit('refill', { n, m: s.m });
  }

  /* ---------------------------------------------------------------- final y revivir */

  /** Por qué acabó la última partida (telemetría de las pruebas automáticas). */
  endReason = '';

  private endRun(reason = 'test') {
    if (!this.alive) return;
    this.alive = false;
    this.endReason = reason;
    portal.gameplayStop();
    audio.tone(392, 0.2, 'triangle', 0.14); this.time.delayedCall(180, () => audio.tone(294, 0.35, 'triangle', 0.14, 220));
    this.cameras.main.shake(180, 0.006);
    const run = this.runId;
    setTimeout(() => {
      if (run !== this.runId) return;
      const best = save.get('best');
      const newBest = this.points > best;
      if (newBest) { save.set('best', this.points); portal.happyTime(); }
      if (this.dist > save.get('bestDist')) save.set('bestDist', this.dist);
      save.set('coins', save.get('coins') + this.coinsRun - this.coinsSaved);
      save.set('delivered', save.get('delivered') + this.coinsRun - this.coinsSaved);
      this.coinsSaved = this.coinsRun;
      this.events.emit('over', {
        points: this.points, best: Math.max(best, this.points), newBest, dist: this.dist, coins: this.coinsRun,
        canRevive: portal.hasRewarded && !this.revived, canDouble: !this.doubled,
      });
    }, 700);
  }

  /** Nombre que usan las pruebas automáticas (scripts/sdk-test*.mjs, heredado de Egg Truck): termina la partida. */
  breakEgg() { this.endRun(); }

  /** ×2 con anuncio con recompensa: suma otra vez las monedas ganadas en la partida (una vez por partida). */
  doubleCoins() {
    if (this.doubled) return 0;
    this.doubled = true;
    save.set('coins', save.get('coins') + this.coinsRun);
    return this.coinsRun;
  }

  /** Revivir tras anuncio con recompensa: grúa y remolque recolocados y 3 cargas nuevas (una vez por partida). */
  revive() {
    this.revived = true;
    const r = this.truck;
    const x = r.chassis.position.x + r.d.x + 40;
    const y = Math.min(this.terrain.heightAt(x), this.terrain.heightAt(x - RIG), this.terrain.heightAt(x - RIG - 100)) - 70;
    const place = (body: MatterJS.BodyType, d: { x: number; y: number }, ox: number, wheelsAt: [MatterJS.BodyType, number, number][]) => {
      M.Body.setAngle(body, 0);
      M.Body.setPosition(body, { x: ox - d.x, y: y - d.y });
      M.Body.setVelocity(body, { x: 0, y: 0 });
      M.Body.setAngularVelocity(body, 0);
      for (const [w, lx, ly] of wheelsAt) {
        M.Body.setPosition(w, { x: ox + lx, y: y + ly });
        M.Body.setVelocity(w, { x: 0, y: 0 });
        M.Body.setAngularVelocity(w, 0);
      }
    };
    place(r.chassis, r.d, x, [[r.wheels[0], -50, 26], [r.wheels[1], 50, 26]]);
    place(r.trailer, r.dt, x - RIG, [[r.tWheel, -6, 30]]);
    for (const c of this.cargo) if (c.state === 'on') { c.state = 'lost'; this.matter.world.remove(c.body); c.sprite.destroy(); }
    this.cargo = this.cargo.filter((c) => c.state === 'done' && c.sprite.active);
    this.flipT = 0;
    this.loadCargo(T.reviveLoad);
    this.alive = true;
    portal.gameplayStart();
  }
}
