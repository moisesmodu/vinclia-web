import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { bigNumber } from '@comun/ui';
import { save } from '../state';
import { K } from './Boot';

// La librería Matter.js que trae Phaser (sus tipos no la exponen).
const M: any = (Phaser.Physics.Matter as any).Matter;
const STEP_MS = 1000 / 60;

/** Ajustes de vuelo (los que se tocan para equilibrar el juego). Velocidades en px por paso de 1/60 s. */
const T = {
  thrust: 2.1,          // empuje a lo largo del eje, en gravedades (la gravedad es 0,278 px/paso²)
  maxLean: 0.55,        // inclinación máxima al propulsar (rad)
  aimGain: 0.0021,      // la inclinación apunta a la plataforma siguiente...
  aimDamp: 0.075,       // ...y frena la velocidad horizontal (corrección suave)
  spring: 0.007,        // muelle angular hacia el ángulo objetivo
  springDamp: 0.14,
  burn: 13,             // combustible por segundo de propulsor (de 100)
  refuel: 10,           // al aterrizar en una plataforma nueva
  refuelPerfect: 32,    // al aterrizar perfecto
  hardSpeed: 8.4,       // golpe que revienta el cohete
  hardAngle: 0.7,
  perfectSpeed: 3.4,
  perfectAngle: 0.16,
};

type Plat = {
  i: number; body: MatterJS.BodyType; view: Phaser.GameObjects.Container; target: Phaser.GameObjects.Rectangle;
  beacon: Phaser.GameObjects.Image; jets: Phaser.GameObjects.Image[];
  w: number; bx: number; by: number; ax: number; ay: number; freq: number; phase: number; zone: number;
  vx: number; vy: number; impact?: { speed: number; angle: number; off: number };
};

/**
 * La partida. Una sola mecánica: mantener = propulsor (empuje por el eje del cohete, que se inclina solo hacia la
 * plataforma siguiente y se endereza al soltar); soltar = caer. Aterriza suave en plataformas que se mueven.
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  rocket!: MatterJS.BodyType;
  private d = { x: 0, y: 0 };
  private sprite!: Phaser.GameObjects.Image;
  private flame!: Phaser.GameObjects.Image;
  private exhaust!: Phaser.GameObjects.Particles.ParticleEmitter;
  plats: Plat[] = [];
  private nextIndex = 0;
  cur = 0;                  // índice de la última plataforma alcanzada
  score = 0;
  fuel = 100;
  alive = false;            // true desde create (la escena aún no creada no puede estrellarse)
  revived = false;
  hold = false;
  private paused = false;
  private acc = 0;
  private stepN = 0;
  private contact: Plat | null = null;   // plataforma que toca el cohete en este paso
  private contactNow: Plat | null = null;
  private settle = 0;
  private emptyT = 0;
  private combo = 0;
  private faceT = 0;
  private wind = 0;
  private windT = 0;
  private nextGust = 0;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private engine: ReturnType<typeof audio.engine> = null;
  private skyFar!: Phaser.GameObjects.TileSprite;
  private skyNear!: Phaser.GameObjects.TileSprite;
  private planets: Phaser.GameObjects.Image[] = [];
  private rnd!: Phaser.Math.RandomDataGenerator;
  private camX = 0;
  private camY = 0;
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private pop!: Phaser.GameObjects.Text;

  constructor() { super('Play'); }

  async create() {
    // la instancia se reutiliza al reiniciar: nada de la partida anterior puede sobrevivir
    this.plats = []; this.planets = []; this.nextIndex = 0; this.cur = 0; this.score = 0; this.fuel = 100;
    this.alive = true; this.revived = false; this.hold = false; this.paused = false; this.acc = 0; this.stepN = 0;
    this.contact = null; this.contactNow = null; this.settle = 0; this.emptyT = 0; this.combo = 0; this.faceT = 0;
    this.wind = 0; this.windT = 0; this.nextGust = 0;
    this.registry.set('hold', false);
    this.rnd = new Phaser.Math.RandomDataGenerator([`${Date.now()}`]);

    this.cameras.main.setBackgroundColor('#211a78');
    this.makeSky();
    while (this.plats.length < 6) this.addPlatform();
    const p0 = this.plats[0];
    this.spawnRocket(p0.bx, p0.by - 13 - 42 - 1);
    this.camX = p0.bx + 120; this.camY = p0.by - 140;

    // objetos reutilizados en cada aterrizaje (sin crear ni destruir durante la partida)
    this.burst = this.add.particles(0, 0, 'ic-star', {
      speed: { min: 220, max: 420 }, angle: { min: 190, max: 350 }, lifespan: 700, scale: { start: 0.24, end: 0 }, gravityY: 600, emitting: false,
    }).setDepth(3.5);
    this.pop = bigNumber(this, 0, 0, 54, '').setDepth(7).setVisible(false);

    this.layout();
    this.scale.on('resize', this.layout, this);

    this.matter.world.on('collisionstart', this.onCollide, this);
    this.matter.world.on('collisionactive', this.onContact, this);
    // Control y plataformas una vez por paso de física: igual a 30 que a 120 FPS.
    this.matter.world.on('beforeupdate', this.beforeStep, this);
    this.matter.world.on('afterupdate', this.afterStep, this);

    this.keys = ['SPACE', 'UP', 'W'].map((k) => this.input.keyboard!.addKey(k));
    this.engine = audio.engine();

    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      this.engine?.stop();
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

  private spawnRocket(x: number, y: number) {
    // Cuerpo compuesto: fuselaje + barra de patas (ancha, para que el aterrizaje sea estable si es recto).
    const parts = [
      M.Bodies.rectangle(x, y - 8, 34, 68, { chamfer: { radius: [14, 14, 3, 3] } }),
      M.Bodies.rectangle(x, y + 37, 58, 10, { chamfer: { radius: 4 } }),
    ];
    const body = M.Body.create({ parts, label: 'rocket', friction: 0.9, frictionStatic: 2, frictionAir: 0.012, restitution: 0.05 });
    M.Body.setDensity(body, 0.0012);
    this.matter.world.add(body);
    this.rocket = body;
    this.d = { x: x - body.position.x, y: y - body.position.y };
    this.flame = this.add.image(x, y + 34, 'flame').setOrigin(0.5, 0.08).setScale(0.5 / K).setDepth(3).setVisible(false);
    this.sprite = this.add.image(x, y, 'rocket0').setOrigin(0.5, 0.5).setScale(1 / K).setDepth(4);
    this.exhaust = this.add.particles(0, 0, 'puff', {
      lifespan: 520, speed: { min: 10, max: 50 }, scale: { start: 0.55, end: 0.05 }, alpha: { start: 0.85, end: 0 },
      tint: [0xffd23f, 0xff9f43, 0xcfd3e6], frequency: 28, emitting: false,
    }).setDepth(2);
  }

  /** Dificultad: plataformas más estrechas, más lejos y más rápidas; viento desde la 12. */
  private addPlatform() {
    const i = this.nextIndex++;
    const prev = this.plats[this.plats.length - 1];
    const n = i;
    let w = i === 0 ? 280 : Phaser.Math.Clamp(230 - n * 3.6, 96, 230) + this.rnd.between(-12, 12);
    let ax = 0, ay = 0, freq = 0;
    if (i >= 2) {
      const moving = this.rnd.frac() < Math.min(0.9, 0.35 + n * 0.03);
      if (moving) {
        const amp = Math.min(150, 40 + n * 3.2) * this.rnd.realInRange(0.7, 1);
        if (n >= 6 && this.rnd.frac() < 0.4) ay = amp * 0.7; else ax = amp;
        freq = Math.min(0.036, 0.012 + n * 0.0006) * this.rnd.realInRange(0.8, 1.1);
      }
    }
    let bx = 0, by = 0;
    if (prev) {
      const gap = Math.min(440, 220 + n * 5.5) + this.rnd.between(-30, 40);
      const minGap = prev.w / 2 + w / 2 + prev.ax + ax + 70;
      bx = prev.bx + Math.max(gap, minGap);
      by = prev.by + this.rnd.between(-Math.min(210, 130 + n * 2.5), 50);
    }
    w = Math.round(w);
    const body = M.Bodies.rectangle(bx, by, w, 26, { isStatic: true, label: 'plat', friction: 1, frictionStatic: 4, restitution: 0 });
    this.matter.world.add(body);
    const ns = this.add.nineslice(0, 0, 'plat', undefined, (w + 4) * K, 30 * K, 14 * K, 14 * K, 12 * K, 12 * K).setScale(1 / K);
    const zone = Math.max(30, w * 0.26);
    const target = this.add.rectangle(0, -9, zone, 5, 0xffd23f).setStrokeStyle(2, 0x2b2340);
    const jets: Phaser.GameObjects.Image[] = [];
    const pods: Phaser.GameObjects.Image[] = [];
    for (const px of w > 150 ? [-w * 0.3, w * 0.3] : [0]) {
      jets.push(this.add.image(px, 20, 'jet').setOrigin(0.5, 0).setScale(1 / K));
      pods.push(this.add.image(px, 16, 'pod').setScale(1 / K));
    }
    const beacon = this.add.image(w / 2 - 12, -20, 'beacon').setScale(1 / K).setVisible(false);
    const view = this.add.container(bx, by, [...jets, ...pods, ns, target, beacon]).setDepth(1);
    this.plats.push({ i, body, view, target, beacon, jets, w, bx, by, ax, ay, freq, phase: this.rnd.realInRange(0, Math.PI * 2), zone, vx: 0, vy: 0 });
  }

  private makeSky() {
    const cam = this.cameras.main;
    this.skyFar = this.add.tileSprite(0, 0, cam.width, cam.height, 'stars-far').setScrollFactor(0).setDepth(-10);
    this.skyNear = this.add.tileSprite(0, 0, cam.width, cam.height, 'stars-near').setScrollFactor(0).setDepth(-9);
    const defs: [string, number, number, number][] = [['planet-a', 0.05, 700, -300], ['planet-b', 0.09, 200, 120], ['planet-c', 0.12, 1100, -60]];
    for (const [key, f, x, y] of defs) this.planets.push(this.add.image(x, y, key).setScrollFactor(f).setDepth(-8).setData('f', f));
  }

  /** Zoom según la pantalla: en apaisado se ve siempre la misma altura de mundo; en vertical, la misma anchura. */
  private layout() {
    const w = this.scale.width, h = this.scale.height;
    const cam = this.cameras.main;
    cam.setSize(w, h);
    const z = h > w ? Phaser.Math.Clamp(Math.min(w / 520, h / 820), 0.4, 1.6) : Phaser.Math.Clamp(Math.min(h / 660, w / 1100), 0.36, 1.6);
    cam.setZoom(z);
    const vw = w / z, vh = h / z;
    for (const t of [this.skyFar, this.skyNear]) t.setSize(vw, vh).setPosition(w / 2, h / 2);
  }

  /* ---------------------------------------------------------------- física */

  private isRocket(b: MatterJS.BodyType) { return b.label === 'rocket' || b.parent?.label === 'rocket'; }
  private platOf(b: MatterJS.BodyType) { return b.label === 'plat' ? this.plats.find((p) => p.body === b) ?? null : null; }

  private pairPlat(p: Phaser.Types.Physics.Matter.MatterCollisionPair) {
    const a = p.bodyA as MatterJS.BodyType, b = p.bodyB as MatterJS.BodyType;
    if (this.isRocket(a)) return this.platOf(b);
    if (this.isRocket(b)) return this.platOf(a);
    return null;
  }

  private onContact(ev: { pairs: Phaser.Types.Physics.Matter.MatterCollisionPair[] }) {
    for (const p of ev.pairs) { const pl = this.pairPlat(p); if (pl) this.contactNow = pl; }
  }

  /** Primer contacto con una plataforma: golpe fuerte o de lado = explosión; si no, se anota cómo fue para el perfecto. */
  private onCollide(ev: { pairs: Phaser.Types.Physics.Matter.MatterCollisionPair[] }) {
    if (!this.alive) return;
    for (const p of ev.pairs) {
      const pl = this.pairPlat(p);
      if (!pl) continue;
      this.contactNow = pl;
      const r = this.rocket;
      const rvx = r.velocity.x - pl.vx, rvy = r.velocity.y - pl.vy;
      const speed = Math.hypot(rvx, rvy);
      const ang = Phaser.Math.Angle.Wrap(r.angle);
      const top = pl.body.position.y - 13;
      const above = r.position.y < top - 18 && Math.abs(r.position.x - pl.body.position.x) < pl.w / 2 + 26;
      if (!above && speed > 2.5) return this.crash();
      if (speed > T.hardSpeed || (Math.abs(ang) > T.hardAngle && speed > 2)) return this.crash();
      if (!pl.impact) pl.impact = { speed, angle: Math.abs(ang), off: Math.abs(this.footX() - pl.body.position.x) };
      if (speed > 1.2) {
        audio.tone(180 + Math.min(speed, 7) * 20, 0.08, 'triangle', 0.12, 110);
        if (speed > 4.5) this.cameras.main.shake(100, 0.004);
      }
    }
  }

  private footX() {
    const r = this.rocket, a = r.angle, ly = this.d.y + 42;
    return r.position.x + this.d.x * Math.cos(a) - ly * Math.sin(a);
  }

  /** Antes de cada paso: plataformas, propulsor y viento. */
  private beforeStep() {
    this.stepN++;
    for (const p of this.plats) {
      if (!p.freq) continue;
      const s = Math.sin(p.phase + p.freq * this.stepN);
      const nx = p.bx + p.ax * s, ny = p.by + p.ay * s;
      p.vx = nx - p.body.position.x; p.vy = ny - p.body.position.y;
      M.Body.setPosition(p.body, { x: nx, y: ny }, true); // con velocidad: el rozamiento arrastra al cohete
    }
    this.contact = this.contactNow;
    this.contactNow = null;
    const r = this.rocket;
    if (!r || !this.alive) return;

    const thrusting = this.hold && this.fuel > 0;
    const ang = Phaser.Math.Angle.Wrap(r.angle);
    if (thrusting) {
      const f = T.thrust * r.mass * 0.001; // misma escala que la gravedad de Matter
      M.Body.applyForce(r, r.position, { x: Math.sin(ang) * f, y: -Math.cos(ang) * f });
      this.fuel = Math.max(0, this.fuel - T.burn / 60);
    }
    // Inclinación: al propulsar apunta a la plataforma siguiente (y frena si va pasada); al soltar, se endereza.
    let target = 0;
    if (thrusting) {
      const nx = this.nextPlat();
      if (nx) {
        const dx = nx.body.position.x - r.position.x;
        const lim = this.contact ? 0.12 : T.maxLean; // en el suelo despega casi recto
        target = Phaser.Math.Clamp(dx * T.aimGain - (r.velocity.x - nx.vx) * T.aimDamp, -lim, lim);
      }
    }
    if (thrusting || !this.contact) {
      const av = r.angularVelocity + (target - ang) * T.spring - r.angularVelocity * T.springDamp;
      M.Body.setAngularVelocity(r, Phaser.Math.Clamp(av, -0.12, 0.12));
    }
    if (this.wind && !this.contact) M.Body.applyForce(r, r.position, { x: this.wind * r.mass * 0.001, y: 0 });
  }

  /** Después de cada paso: aterrizaje asentado, vuelco, caída al vacío y sin combustible. */
  private afterStep() {
    if (!this.alive || !this.rocket) return;
    const r = this.rocket;
    const ang = Phaser.Math.Angle.Wrap(r.angle);
    const pl = this.contactNow;
    if (pl) {
      const rel = Math.hypot(r.velocity.x - pl.vx, r.velocity.y - pl.vy);
      if (Math.abs(ang) > 1.15) return this.crash();
      if (rel < 0.7 && Math.abs(ang) < 0.35 && !this.hold) this.settle++; else this.settle = 0;
      if (this.settle === 10) this.landed(pl);
      if (this.fuel <= 0 && this.settle > 10) { this.emptyT++; if (this.emptyT > 75) return this.crash(true); }
    } else {
      this.settle = 0;
      let ref = -Infinity;
      for (const p of this.plats) if (p.i >= this.cur && p.i <= this.cur + 1) ref = Math.max(ref, p.body.position.y);
      if (r.position.y > ref + 520) return this.crash();
    }
  }

  private nextPlat() { return this.plats.find((p) => p.i > this.cur) ?? null; }

  /** Aterrizaje asentado sobre una plataforma. Si es nueva: puntos, combustible y quizá perfecto. */
  private landed(pl: Plat) {
    const imp = pl.impact;
    pl.impact = undefined;
    if (pl.i <= this.cur) return;
    const gained = pl.i - this.cur;
    this.cur = pl.i;
    const perfect = !!imp && imp.speed < T.perfectSpeed && imp.angle < T.perfectAngle && imp.off < pl.zone / 2 + 4;
    let pts = gained;
    if (perfect) {
      this.combo++;
      pts += Math.min(this.combo, 3);
      this.fuel = Math.min(100, this.fuel + T.refuelPerfect);
      save.set('perfects', save.get('perfects') + 1);
      this.sprite.setTexture('rocket2'); this.faceT = 1.2;
      this.burst.explode(14, this.sprite.x, this.sprite.y + 20);
      audio.tone(660, 0.1, 'square', 0.1); this.time.delayedCall(90, () => audio.tone(880, 0.1, 'square', 0.1));
      this.time.delayedCall(180, () => audio.tone(1320, 0.22, 'square', 0.1));
    } else {
      this.combo = 0;
      this.fuel = Math.min(100, this.fuel + T.refuel);
      audio.tone(520, 0.1, 'triangle', 0.12, 700);
    }
    this.score += pts;
    this.events.emit('score', this.score, perfect, pts);
    const pop = this.pop;
    this.tweens.killTweensOf(pop);
    pop.setText(`+${pts}`).setColor(perfect ? '#ffd23f' : '#ffffff').setScale(perfect ? 1 : 0.75)
      .setPosition(this.sprite.x, this.sprite.y - 100).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: pop, y: pop.y - 70, duration: 1200, ease: 'Cubic.out' });
    this.tweens.add({ targets: pop, alpha: 0, delay: 700, duration: 500 });
    // mundo infinito: añadir delante y quitar detrás
    while (this.plats[this.plats.length - 1].i < this.cur + 5) this.addPlatform();
    this.plats = this.plats.filter((p) => {
      if (p.i >= this.cur - 1) return true;
      this.matter.world.remove(p.body); p.view.destroy(); return false;
    });
  }

  /* ---------------------------------------------------------------- bucle */

  update(_t: number, dtMs: number) {
    const r = this.rocket;
    if (!r) return;
    this.hold = this.alive && (this.registry.get('hold') || this.keys.some((k) => k.isDown));
    if (!this.paused) {
      // rawDelta: tiempo real (el delta de Phaser viene suavizado y topado a 16,7 ms)
      this.acc += Math.min(this.game.loop.rawDelta || dtMs, 100);
      let n = 0;
      while (this.acc >= STEP_MS && n < 4) { this.matter.world.step(STEP_MS); this.acc -= STEP_MS; n++; }
      if (n === 4) this.acc = 0;
      if (this.alive && n > 0) this.weather(n);
    }
    const dt = dtMs / 1000;

    // gráficos siguen a la física
    const a = r.angle, cos = Math.cos(a), sin = Math.sin(a);
    const sx = r.position.x + this.d.x * cos - this.d.y * sin, sy = r.position.y + this.d.x * sin + this.d.y * cos;
    this.sprite.setPosition(sx, sy).setRotation(a);
    const thrusting = this.alive && this.hold && this.fuel > 0;
    const nzx = sx - 34 * sin, nzy = sy + 34 * cos;
    this.flame.setVisible(thrusting).setPosition(nzx, nzy).setRotation(a);
    if (thrusting) this.flame.setScale((0.5 + Math.random() * 0.12) / K * 1.6, (0.62 + Math.random() * 0.25) / K * 1.6);
    this.exhaust.setPosition(nzx - sin * 22, nzy + cos * 22);
    this.exhaust.emitting = thrusting;
    this.engine?.set(thrusting ? 0.9 : 0, thrusting ? 1.6 : 0);
    if (this.alive) {
      this.faceT -= dt;
      if (this.faceT <= 0) this.sprite.setTexture(r.velocity.y > 6.5 && !this.contact ? 'rocket1' : 'rocket0');
    }

    const t = this.time.now;
    const next = this.nextPlat();
    for (const p of this.plats) {
      p.view.setPosition(p.body.position.x, p.body.position.y);
      const jetS = (0.8 + Math.sin(t / 60 + p.i) * 0.2) / K;
      for (const j of p.jets) j.setScale(1 / K, jetS);
      const isNext = p === next;
      p.beacon.setVisible(isNext && Math.floor(t / 350) % 2 === 0);
      p.target.setFillStyle(isNext ? 0xffd23f : 0xffffff, isNext ? 1 : 0.35);
    }
    this.events.emit('fuel', this.fuel);

    // cámara: entre el cohete y la plataforma siguiente (se ve a dónde saltar), siempre suave
    const cam = this.cameras.main;
    const tx = next ? r.position.x * 0.55 + next.body.position.x * 0.45 : r.position.x;
    const ty = (next ? r.position.y * 0.6 + next.body.position.y * 0.4 : r.position.y) - 40;
    const k = 1 - Math.exp(-Math.min(this.game.loop.rawDelta || dtMs, 100) / 1000 * 3.2);
    this.camX += (tx - this.camX) * k; this.camY += (ty - this.camY) * k;
    // el cohete nunca se sale del margen seguro (ni tapa el marcador)
    const hw = cam.width / cam.zoom / 2, hh = cam.height / cam.zoom / 2;
    const mx = Math.min(140, hw * 0.4), top = Math.min(190, hh * 0.55), bottom = Math.min(130, hh * 0.4);
    this.camX = Phaser.Math.Clamp(this.camX, r.position.x - hw + mx, r.position.x + hw - mx);
    this.camY = Phaser.Math.Clamp(this.camY, r.position.y - hh + bottom, r.position.y + hh - top);
    cam.centerOn(this.camX, this.camY);

    // cielo con paralaje
    this.skyFar.tilePositionX = cam.scrollX * 0.04; this.skyFar.tilePositionY = cam.scrollY * 0.04;
    this.skyNear.tilePositionX = cam.scrollX * 0.12; this.skyNear.tilePositionY = cam.scrollY * 0.12;
    const vw = cam.width / cam.zoom, vh = cam.height / cam.zoom;
    for (const pl of this.planets) {
      const f = pl.getData('f') as number;
      const px = pl.x - cam.scrollX * f, py = pl.y - cam.scrollY * f;
      if (px < -pl.width) pl.x += vw + pl.width * 2;
      if (py > vh + pl.height) pl.y -= vh + pl.height * 2;
    }
  }

  /** Ráfagas de viento a partir de la plataforma 12. */
  private weather(steps: number) {
    const s = steps / 60;
    if (this.windT > 0) {
      this.windT -= s;
      if (this.windT <= 0) { this.wind = 0; this.events.emit('wind', 0); this.nextGust = this.rnd.realInRange(5, 9); }
    } else if (this.cur >= 12) {
      if (!this.nextGust) this.nextGust = this.rnd.realInRange(3, 6);
      this.nextGust -= s;
      if (this.nextGust <= 0) {
        const strength = Math.min(0.06, 0.025 + (this.cur - 12) * 0.0012);
        this.wind = (this.rnd.frac() < 0.5 ? -1 : 1) * strength;
        this.windT = this.rnd.realInRange(2, 3.2);
        this.events.emit('wind', Math.sign(this.wind));
        audio.noise(0.6, 0.12, 500);
      }
    }
  }

  /* ---------------------------------------------------------------- final y revivir */

  /** Explosión (golpe fuerte, de lado, vuelco o caída al vacío). outOfFuel: se queda sin combustible y se apaga. */
  crash(outOfFuel = false) {
    if (!this.alive || !this.rocket || !this.sys.isActive()) return;
    this.alive = false;
    this.hold = false;
    this.wind = 0; this.windT = 0;
    this.events.emit('wind', 0);
    portal.gameplayStop();
    this.exhaust.emitting = false;
    this.flame.setVisible(false);
    const x = this.sprite.x, y = this.sprite.y;
    if (outOfFuel) {
      this.sprite.setTexture('rocket1');
      audio.tone(300, 0.5, 'sine', 0.12, 90);
      const p = this.add.particles(x, y + 30, 'puff', { speed: { min: 20, max: 60 }, lifespan: 900, scale: { start: 0.6, end: 0 }, tint: 0x9aa0b8, emitting: false }).setDepth(5);
      p.explode(8);
    } else {
      this.sprite.setVisible(false);
      M.Body.setStatic(this.rocket, true);
      audio.noise(0.5, 0.55, 700);
      audio.tone(220, 0.5, 'sawtooth', 0.12, 50);
      this.cameras.main.shake(260, 0.012);
      const fire = this.add.particles(x, y, 'puff', {
        speed: { min: 80, max: 340 }, lifespan: { min: 400, max: 900 }, scale: { start: 1.1, end: 0 },
        tint: [0xffd23f, 0xff9f43, 0xff5d5d, 0xffffff], emitting: false,
      }).setDepth(5);
      fire.explode(26);
      const bits = this.add.particles(x, y, 'shard', {
        speed: { min: 150, max: 420 }, angle: { min: 180, max: 360 }, gravityY: 700, lifespan: 1200, rotate: { min: 0, max: 360 }, emitting: false,
      }).setDepth(5);
      bits.explode(8);
      const bits2 = this.add.particles(x, y, 'shard2', {
        speed: { min: 150, max: 420 }, angle: { min: 180, max: 360 }, gravityY: 700, lifespan: 1200, rotate: { min: 0, max: 360 }, emitting: false,
      }).setDepth(5);
      bits2.explode(6);
    }
    this.time.delayedCall(800, () => {
      if (this.alive) return; // ya revivió
      const best = save.get('best');
      const newBest = this.score > best;
      if (newBest) save.set('best', this.score);
      this.events.emit('over', { score: this.score, best: Math.max(best, this.score), newBest, canRevive: portal.hasRewarded && !this.revived });
    });
  }

  /** Alias para scripts/sdk-test.mjs (que llama a breakEgg() en todos los juegos). */
  breakEgg() { this.crash(); }

  /** Revivir tras anuncio con recompensa: cohete nuevo sobre la última plataforma, combustible repuesto (una vez por partida). */
  revive() {
    this.revived = true;
    const pl = this.plats.find((p) => p.i === this.cur) ?? this.plats[0];
    const r = this.rocket;
    M.Body.setStatic(r, false);
    M.Body.setAngle(r, 0);
    M.Body.setPosition(r, { x: pl.body.position.x - this.d.x, y: pl.body.position.y - 13 - 43 - this.d.y });
    M.Body.setVelocity(r, { x: 0, y: 0 });
    M.Body.setAngularVelocity(r, 0);
    this.sprite.setVisible(true).setTexture('rocket0');
    this.fuel = Math.max(this.fuel, 70);
    this.settle = 0; this.emptyT = 0; this.combo = 0; this.wind = 0; this.windT = 0; this.nextGust = 0;
    this.events.emit('wind', 0);
    for (const p of this.plats) p.impact = undefined;
    this.alive = true;
    portal.gameplayStart();
  }
}
