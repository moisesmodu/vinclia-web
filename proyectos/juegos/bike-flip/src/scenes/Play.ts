import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { Terrain, START_X } from '../terrain';
import { LEVELS } from '../levels';
import { save, PX_PER_M, starsFor, saveResult, levelTime } from '../state';

// La librería Matter.js que trae Phaser (sus tipos no la exponen).
const M: any = (Phaser.Physics.Matter as any).Matter;
const STEP_MS = 1000 / 60;
const TAU = Math.PI * 2;

/** Ajustes de manejo (los que se tocan para equilibrar el juego). */
export const T = {
  wheelR: 21,
  maxSpin: 0.5,         // velocidad angular máxima de las ruedas (rad por paso)
  spinUp: 0.04,
  brake: 0.9,           // al soltar, las ruedas frenan
  airLeanBack: 0.011,  // en el aire, mantener inclina hacia atrás (rad/paso²)
  airLeanFwd: 0.008,    // y soltar, hacia delante
  airSpinMax: 0.14,     // giro máximo en el aire (rad por paso ≈ 8,4 rad/s)
  flipSlack: 0.6,       // una voltereta cuenta si el giro acumulado llega a 2π − 0,6 rad (aterrizar algo inclinado vale)
  turboMs: 2600,        // turbo por voltereta (se suma, máximo 3 volteretas)
  turboSpin: 0.74,
  drive: 0.3,           // empuje del motor con alguna rueda en el suelo (px/paso²): sube cuestas sin patinar
  vMax: 9.6,            // velocidad máxima con el motor (px/paso ≈ 580 px/s)
  turboDrive: 0.34,
  turboVMax: 14.5,
};

export type Bike = {
  chassis: MatterJS.BodyType; wheels: MatterJS.BodyType[]; d: { x: number; y: number };
  sprite: Phaser.GameObjects.Image; wheelSprites: Phaser.GameObjects.Image[];
};

/**
 * La partida (un nivel). Una sola mecánica: mantener = acelerar (e inclinar atrás en el aire);
 * soltar = frenar (e inclinar adelante). Llegar a la meta sin dar con el casco en el suelo.
 * Una voltereta completa en el aire = turbo al aterrizar.
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  level = 1;
  terrain!: Terrain;
  /** Se llama "truck" por compatibilidad con scripts/perf.mjs (lee truck.chassis). */
  truck!: Bike;
  alive = false;
  finished = false;
  started = false;
  dist = 0;
  groundedNow = 0;
  elapsed = 0;
  revived = false;
  private grounded = 0;
  private hold = false;
  private acc = 0;
  private paused = false;
  private airSteps = 0;
  private airRot = 0;
  private airFlips = 0;
  private lastAngle = 0;
  private turbo = 0;
  private flipsRun = 0;
  private safe: number[] = [];
  private engine: ReturnType<typeof audio.engine> = null;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private flame!: Phaser.GameObjects.Image;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sun!: Phaser.GameObjects.Image;
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private bgFill!: Phaser.GameObjects.Rectangle;
  private clouds: Phaser.GameObjects.Image[] = [];
  private groundY = 0;
  private lastProgress = -1;
  private runId = 0;
  private slow = 1;          // cámara lenta tras el choque (solo la física)

  constructor() { super('Play'); }

  async create(data?: { level?: number }) {
    // la instancia de la escena se reutiliza al reiniciar: nada de la partida anterior puede sobrevivir
    this.level = Phaser.Math.Clamp(data?.level ?? this.registry.get('level') ?? 1, 1, LEVELS.length);
    this.registry.set('level', this.level);
    this.registry.set('hold', false);
    this.alive = false; this.finished = false; this.started = false; this.revived = false;
    this.dist = 0; this.elapsed = 0; this.grounded = 0; this.groundedNow = 0; this.hold = false; this.acc = 0; this.paused = false;
    this.airSteps = 0; this.airRot = 0; this.airFlips = 0; this.lastAngle = 0; this.turbo = 0; this.flipsRun = 0;
    this.safe = []; this.clouds = []; this.groundY = 0; this.lastProgress = -1; this.slow = 1;
    this.truck = undefined as unknown as Bike;

    this.makeBackground();
    this.terrain = new Terrain(this, LEVELS[this.level - 1]);
    this.terrain.ensure(START_X + 2600);
    const fx = this.terrain.finishX;
    this.add.image(fx, this.terrain.heightAt(fx) + 4, 'finish').setOrigin(0.5, 1).setDepth(-0.5);
    this.add.tileSprite(fx, this.terrain.heightAt(fx) - 2, 24, 30, 'checker').setOrigin(0.5, 0).setDepth(-0.4);
    this.spawnBike(START_X, this.terrain.heightAt(START_X) - 46);

    this.flame = this.add.image(0, 0, 'flame').setOrigin(0.92, 0.5).setDepth(1.5).setVisible(false);
    this.sparks = this.add.particles(0, 0, 'dot', {
      speed: { min: 40, max: 140 }, lifespan: 380, scale: { start: 0.9, end: 0 }, tint: [0xffd23f, 0xff7a3d, 0xfff4b8],
      frequency: 22, emitting: false,
    }).setDepth(1.4);
    this.dust = this.add.particles(0, 0, 'dust', {
      speed: { min: 60, max: 220 }, angle: { min: 190, max: 350 }, lifespan: 520, scale: { start: 0.9, end: 0.2 }, alpha: { start: 0.9, end: 0 },
      gravityY: 300, emitting: false,
    }).setDepth(1.6);

    const cam = this.cameras.main;
    cam.setBackgroundColor('#ffc996'); // cielo liso: un quad a pantalla completa menos por fotograma
    cam.startFollow(this.truck.sprite, true, 0.1, 0.1);
    this.layout();
    this.scale.on('resize', this.layout, this);

    this.matter.world.on('collisionstart', this.onCollide, this);
    this.matter.world.on('collisionactive', this.onContact, this);
    // Motor, volteretas y cronómetro en cada paso de física (no en cada fotograma): igual a 30 que a 120 FPS.
    this.matter.world.on('beforeupdate', this.beforeStep, this);

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
    });

    save.set('runs', save.get('runs') + 1);
    this.alive = true;
    const run = ++this.runId;
    // Anuncio intersticial en pausa natural: antes de cada partida salvo la primera de la sesión.
    if (!Play.firstRun) {
      this.paused = true;
      await portal.commercialBreak();
      this.paused = false;
    }
    Play.firstRun = false;
    if (run !== this.runId || !this.truck) return; // salió de la escena durante el anuncio
    this.started = true;
    portal.gameplayStart();
  }

  /* ---------------------------------------------------------------- montaje */

  private spawnBike(x: number, y: number) {
    const group = M.Body.nextGroup(true);
    const filter = { group, category: 1, mask: 0xffffffff };
    const parts = [
      M.Bodies.rectangle(x, y, 96, 16, { collisionFilter: filter, label: 'bike', density: 0.0022 }),        // cuadro
      M.Bodies.rectangle(x - 6, y - 14, 50, 14, { collisionFilter: filter, label: 'bike', density: 0.0012 }), // depósito y sillín
      M.Bodies.rectangle(x - 8, y - 38, 18, 34, { collisionFilter: filter, label: 'rider', density: 0.0007 }), // piloto
      M.Bodies.circle(x - 2, y - 66, 14, { collisionFilter: filter, label: 'head', density: 0.0005 }),        // casco
    ];
    const chassis = M.Body.create({ parts, collisionFilter: filter, friction: 0.5, label: 'bikebody', frictionAir: 0.0015 });
    this.matter.world.add(chassis);
    const d = { x: x - chassis.position.x, y: y - chassis.position.y };
    const wheelPos = [{ x: -44, y: 22 }, { x: 44, y: 22 }];
    const wheels = wheelPos.map((p) => {
      const w = M.Bodies.circle(x + p.x, y + p.y, T.wheelR, {
        collisionFilter: filter, friction: 1, frictionStatic: 10, restitution: 0, label: 'wheel', density: 0.002, frictionAir: 0.001,
      });
      this.matter.world.add(w);
      this.matter.world.add(M.Constraint.create({
        bodyA: chassis, pointA: { x: p.x + d.x, y: p.y + d.y }, bodyB: w, length: 0, stiffness: 0.3, damping: 0.08,
      }));
      return w;
    });
    const sprite = this.add.image(x, y, 'bike').setOrigin(0.5, 100 / 150).setDepth(2);
    const wheelSprites = wheels.map((w) => this.add.image(w.position.x, w.position.y, 'wheel').setDepth(3).setDisplaySize(T.wheelR * 2 + 4, T.wheelR * 2 + 4));
    this.truck = { chassis, wheels, d, sprite, wheelSprites };
    this.lastAngle = chassis.angle;
  }

  private makeBackground() {
    this.sun = this.add.image(0, 0, 'sun').setScrollFactor(0).setDepth(-9);
    for (let i = 0; i < 6; i++) {
      this.clouds.push(this.add.image(i * 380, 60 + (i % 3) * 70, 'cloud').setScrollFactor(0.12, 0.04).setDepth(-8).setAlpha(0.9).setScale(0.7 + (i % 2) * 0.3));
    }
    const cam = this.cameras.main;
    this.bgFar = this.add.tileSprite(0, 0, cam.width, 420, 'mesas-far').setScrollFactor(0).setOrigin(0.5, 1).setDepth(-7);
    this.bgNear = this.add.tileSprite(0, 0, cam.width, 420, 'mesas-near').setScrollFactor(0).setOrigin(0.5, 1).setDepth(-6);
    // bajo las mesetas cercanas, su mismo color hasta abajo: en los huecos se ve el fondo del cañón, no el cielo
    this.bgFill = this.add.rectangle(0, 0, cam.width, 10, 0xe9825f).setScrollFactor(0).setOrigin(0.5, 0).setDepth(-6);
  }

  /** Zoom según la pantalla: siempre se ve lo mismo del mundo, también en móvil vertical. */
  private layout() {
    const w = this.scale.width, h = this.scale.height;
    const cam = this.cameras.main;
    cam.setSize(w, h);
    const z = h > w ? Phaser.Math.Clamp(w / 600, 0.45, 1.6) : Phaser.Math.Clamp(Math.min(h / 720, w / 1000), 0.38, 1.6);
    cam.setZoom(z);
    cam.setFollowOffset(-(w / z) * 0.17, 40);
    const vw = w / z, vh = h / z;
    this.sun.setPosition(w / 2 + vw * 0.22, h / 2 - vh * 0.22);
    this.bgFar.setSize(vw + 40, 420).setX(w / 2);
    this.bgNear.setSize(vw + 40, 420).setX(w / 2);
    this.bgFill.setSize(vw + 40, vh * 2 + 2000).setX(w / 2);
  }

  /* ---------------------------------------------------------------- colisiones */

  private onContact(ev: { pairs: Phaser.Types.Physics.Matter.MatterCollisionPair[] }) {
    for (const p of ev.pairs) {
      const a = p.bodyA as MatterJS.BodyType, b = p.bodyB as MatterJS.BodyType;
      if ((a.label === 'wheel' && b.label === 'ground') || (b.label === 'wheel' && a.label === 'ground')) this.grounded++;
      else if ((a.label === 'head' && b.label === 'ground') || (b.label === 'head' && a.label === 'ground')) this.crash();
    }
  }

  private onCollide(ev: { pairs: Phaser.Types.Physics.Matter.MatterCollisionPair[] }) {
    this.onContact(ev);
  }

  /* ---------------------------------------------------------------- bucle */

  /** Un paso de física (60 Hz fijos): motor, inclinación, volteretas, turbo y cronómetro. */
  private beforeStep() {
    this.groundedNow = this.grounded;
    this.grounded = 0;
    if (!this.truck) return;
    const { chassis, wheels } = this.truck;
    const a = chassis.angle;
    if (this.finished) {
      for (const w of wheels) M.Body.setAngularVelocity(w, w.angularVelocity * 0.85);
      return;
    }
    if (!this.alive || !this.started) { this.lastAngle = a; return; }
    this.elapsed += STEP_MS;

    // volteretas: giro acumulado del chasis mientras ninguna rueda toca el suelo
    if (this.groundedNow === 0) {
      this.airSteps++;
      this.airRot += a - this.lastAngle;
      const n = Math.floor((Math.abs(this.airRot) + T.flipSlack) / TAU);
      if (n > this.airFlips && this.airSteps > 8) {
        this.airFlips = n;
        this.events.emit('flip', n);
        audio.tone(700 + n * 200, 0.14, 'triangle', 0.14, 1400 + n * 200);
      }
    } else {
      if (this.airSteps > 10) this.land();
      this.airSteps = 0; this.airRot = 0; this.airFlips = 0;
      // punto seguro para revivir: dos ruedas en el suelo, recto
      const up = Math.cos(a);
      if (this.groundedNow >= 2 && up > 0.8) {
        const x = chassis.position.x;
        if (!this.safe.length || x - this.safe[this.safe.length - 1] > PX_PER_M) this.safe.push(x);
      }
    }
    this.lastAngle = a;

    // motor
    const turbo = this.turbo > 0;
    if (turbo) this.turbo -= STEP_MS;
    const maxSpin = turbo ? T.turboSpin : T.maxSpin;
    for (const w of wheels) {
      const av = w.angularVelocity;
      M.Body.setAngularVelocity(w, this.hold ? Math.min(av + T.spinUp * (turbo ? 1.6 : 1), maxSpin) : av * T.brake);
    }
    if (this.groundedNow === 0 && this.airSteps > 4) {
      // en el aire se gira la moto entera (chasis y ruedas) alrededor de su centro de masas común:
      // si solo se girase el chasis, las ruedas colgadas de los muelles frenarían el giro
      const lean = this.hold ? -T.airLeanBack : T.airLeanFwd;
      const dw = Phaser.Math.Clamp(chassis.angularVelocity + lean, -T.airSpinMax, T.airSpinMax) - chassis.angularVelocity;
      if (dw !== 0) {
        const bodies = [chassis, ...wheels];
        let mx = 0, my = 0, m = 0;
        for (const b of bodies) { mx += b.position.x * b.mass; my += b.position.y * b.mass; m += b.mass; }
        mx /= m; my /= m;
        for (const b of bodies) {
          M.Body.setVelocity(b, { x: b.velocity.x - dw * (b.position.y - my), y: b.velocity.y + dw * (b.position.x - mx) });
        }
        M.Body.setAngularVelocity(chassis, chassis.angularVelocity + dw);
      }
    } else if (this.hold) {
      // empuje arcade a lo largo de la moto hasta la velocidad máxima (las ruedas solas patinan en Matter)
      const ca = Math.cos(a), sa = Math.sin(a);
      const v = chassis.velocity.x * ca + chassis.velocity.y * sa;
      const vMax = turbo ? T.turboVMax : T.vMax;
      if (v < vMax) {
        const acc = Math.min(turbo ? T.turboDrive : T.drive, vMax - v);
        const f = (chassis.mass * acc) / (STEP_MS * STEP_MS);
        M.Body.applyForce(chassis, chassis.position, { x: ca * f, y: sa * f });
      }
    }
  }

  /** Aterrizaje tras un vuelo: polvo y, si hubo voltereta completa, turbo. */
  private land() {
    const { chassis } = this.truck;
    this.dust.explode(6, chassis.position.x, chassis.position.y + 40);
    const n = Math.min(3, Math.floor((Math.abs(this.airRot) + T.flipSlack) / TAU));
    if (n <= 0 || !this.alive) { audio.noise(0.08, 0.15, 500); return; }
    this.flipsRun += n;
    save.set('flips', save.get('flips') + n);
    this.turbo = Math.max(this.turbo, 0) + T.turboMs * n;
    const a = chassis.angle;
    M.Body.setVelocity(chassis, { x: chassis.velocity.x + Math.cos(a) * 3, y: chassis.velocity.y + Math.sin(a) * 3 });
    this.events.emit('turbo', n, this.turbo);
    this.cameras.main.flash(160, 255, 200, 90, false);
    this.cameras.main.shake(160, 0.004);
    audio.noise(0.4, 0.3, 1800);
    audio.tone(220, 0.5, 'sawtooth', 0.12, 880);
    this.time.delayedCall(120, () => audio.tone(660, 0.25, 'square', 0.08, 1320));
  }

  update(_t: number, dtMs: number) {
    if (!this.truck) return;
    const { chassis, wheels, sprite, wheelSprites, d } = this.truck;
    this.hold = this.alive && this.started && (this.registry.get('hold') || this.keys.some((k) => k.isDown));
    // Física a 60 Hz fijos con acumulador (máximo 4 pasos por fotograma para no espiralizar).
    if (!this.paused) {
      // rawDelta: tiempo real (el delta de Phaser viene suavizado y topado a 16,7 ms)
      this.acc += Math.min(this.game.loop.rawDelta || dtMs, 100) * this.slow;
      let n = 0;
      while (this.acc >= STEP_MS && n < 4) { this.matter.world.step(STEP_MS); this.acc -= STEP_MS; n++; }
      if (n === 4) this.acc = 0;
    }
    if (!this.truck) return; // la escena pudo terminar dentro de un paso (choque → nada, pero por si acaso)

    // sprites siguen a la física
    const a = chassis.angle, ca = Math.cos(a), sa = Math.sin(a);
    sprite.setPosition(chassis.position.x + d.x * ca - d.y * sa, chassis.position.y + d.x * sa + d.y * ca).setRotation(a);
    wheels.forEach((w, i) => wheelSprites[i].setPosition(w.position.x, w.position.y).setRotation(w.angle));

    // turbo: llama en el escape y chispas
    const turbo = this.turbo > 0 && this.alive;
    this.flame.setVisible(turbo);
    this.sparks.emitting = turbo;
    if (turbo) {
      const ex = sprite.x + -40 * ca - -2 * sa, ey = sprite.y + -40 * sa + -2 * ca;
      this.flame.setPosition(ex, ey).setRotation(a).setScale(0.9 + Math.random() * 0.35 * (this.hold ? 1.4 : 0.6), 0.9 + Math.random() * 0.2);
      this.sparks.setPosition(ex - 30 * ca, ey - 30 * sa);
    }

    if (this.alive && this.started) {
      this.engine?.set(turbo ? 1 : Math.min(1, Math.abs(wheels[0].angularVelocity) / T.maxSpin), this.hold ? 1 : 0.45);
      const x = chassis.position.x;
      this.dist = Math.max(this.dist, Math.floor((x - START_X) / PX_PER_M));
      const prog = Phaser.Math.Clamp((x - START_X) / (this.terrain.finishX - START_X), 0, 1);
      if (Math.abs(prog - this.lastProgress) > 0.002) { this.lastProgress = prog; this.events.emit('progress', prog); }
      this.events.emit('time', this.elapsed);
      if (x >= this.terrain.finishX) this.complete();
      else if (chassis.position.y > this.terrain.heightAt(x) + 280 || chassis.position.y > this.terrain.maxY + 500) this.crash();
    } else {
      this.engine?.set(0, 0);
    }

    // construir por delante, destruir por detrás
    this.terrain.ensure(chassis.position.x + 3200, 1);
    this.terrain.cull(chassis.position.x - 2200);

    // fondo con paralaje
    const cam = this.cameras.main;
    this.bgFar.tilePositionX = cam.scrollX * 0.12;
    this.bgNear.tilePositionX = cam.scrollX * 0.3;
    const gy = this.terrain.heightAt(cam.midPoint.x);
    this.groundY = this.groundY ? this.groundY + (gy - this.groundY) * 0.04 : gy;
    const cy = this.scale.height / 2 - cam.midPoint.y;
    this.bgFar.y = cy + this.groundY + 90;
    this.bgNear.y = cy + this.groundY + 210;
    this.bgFill.y = this.bgNear.y - 4;
    for (const c of this.clouds) if (c.x - cam.scrollX * 0.12 < -300) c.x += 2280;
  }

  /* ---------------------------------------------------------------- final, revivir y saltar nivel */

  /** Choque: el casco tocó el suelo (o caída a un hueco). */
  crash() {
    if (!this.alive || this.finished) return;
    this.alive = false;
    this.turbo = 0;
    portal.gameplayStop();
    const { chassis } = this.truck;
    audio.noise(0.35, 0.5, 900);
    audio.tone(260, 0.4, 'sawtooth', 0.12, 70);
    this.cameras.main.shake(240, 0.012);
    this.dust.explode(14, chassis.position.x, chassis.position.y - 20);
    this.slow = 0.5;
    this.later(600, () => {
      this.slow = 1;
      this.events.emit('over', { level: this.level, canRevive: portal.hasRewarded && !this.revived, canSkip: portal.hasRewarded && this.level < LEVELS.length });
    });
  }

  /** Espera en tiempo real (no en fotogramas): la pantalla final sale a su hora aunque el móvil vaya lento. */
  private later(ms: number, fn: () => void) {
    const run = this.runId;
    window.setTimeout(() => { if (run === this.runId && this.truck) fn(); }, ms);
  }

  /** Alias para scripts/sdk-test.mjs (nombre de Egg Truck): termina la partida con un choque. */
  breakEgg() { this.crash(); }

  private complete() {
    if (this.finished || !this.alive) return;
    this.finished = true;
    this.alive = false;
    this.turbo = 0;
    portal.gameplayStop();
    const ms = Math.round(this.elapsed);
    const prevBest = levelTime(this.level);
    const stars = starsFor(this.level, ms);
    const newBest = saveResult(this.level, ms, stars);
    if (newBest && prevBest) portal.happyTime();
    if (stars === 3) portal.happyTime();
    audio.tone(523, 0.12, 'square', 0.1);
    this.time.delayedCall(120, () => audio.tone(659, 0.12, 'square', 0.1));
    this.time.delayedCall(240, () => audio.tone(784, 0.3, 'square', 0.1));
    const fx = this.terrain.finishX, fy = this.terrain.heightAt(fx) - 220;
    this.add.particles(fx, fy, 'dot', {
      speed: { min: 200, max: 600 }, lifespan: 1400, gravityY: 700, scale: { start: 1.2, end: 0.4 },
      tint: [0xffd23f, 0x19c9b4, 0x8a5cf6, 0xff5d5d, 0xffffff], emitting: false,
    }).setDepth(5).explode(60);
    this.later(700, () => this.events.emit('complete', {
      level: this.level, ms, best: levelTime(this.level), newBest, stars, flips: this.flipsRun, last: this.level >= LEVELS.length,
    }));
  }

  /** Revivir tras anuncio con recompensa (una vez por partida): moto recolocada en el último punto seguro, lanzada. */
  revive() {
    if (this.alive || this.finished) return;
    this.revived = true;
    const { chassis, wheels, d } = this.truck;
    const minX = this.terrain.culledUntil + 200;
    const last = this.safe.length ? this.safe[this.safe.length - 1] : START_X;
    // unos metros por detrás del último punto seguro, para coger carrerilla antes de un salto
    let x = Math.max(START_X, minX, last - 6 * PX_PER_M);
    while (this.terrain.isGap(x) && x > START_X) x -= PX_PER_M;
    const y = this.terrain.heightAt(x) - 60;
    const dx = x - chassis.position.x, dy = y - chassis.position.y;
    M.Body.setAngle(chassis, 0);
    M.Body.translate(chassis, { x: dx, y: dy });
    M.Body.setVelocity(chassis, { x: 0, y: 0 });
    M.Body.setAngularVelocity(chassis, 0);
    wheels.forEach((w, i) => {
      M.Body.setPosition(w, { x: x + d.x + (i ? 44 : -44), y: y + d.y + 22 });
      M.Body.setVelocity(w, { x: 0, y: 0 });
      M.Body.setAngularVelocity(w, 0);
    });
    this.lastAngle = 0; this.airRot = 0; this.airSteps = 0; this.airFlips = 0; this.slow = 1;
    this.safe = this.safe.filter((s) => s <= x);
    this.alive = true;
    portal.gameplayStart();
  }

  /** Saltar nivel tras anuncio con recompensa: desbloquea el siguiente (sin estrellas) y lo empieza. */
  skip() {
    const next = Math.min(LEVELS.length, this.level + 1);
    if (next > save.get('unlocked')) save.set('unlocked', next);
    this.registry.set('level', next);
    this.scene.restart({ level: next });
  }

  /** Siguiente nivel o el mismo otra vez (el anuncio intersticial se pide al empezar la partida). */
  startLevel(level: number) {
    this.registry.set('level', level);
    this.scene.restart({ level });
  }
}
