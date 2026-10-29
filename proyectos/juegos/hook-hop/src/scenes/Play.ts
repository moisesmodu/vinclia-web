import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { save } from '../state';
import { K } from './Boot';

const DT = 1 / 60;
const STEP_MS = 1000 / 60;

/** Ajustes del balanceo (los que se tocan para equilibrar el juego). Mundo en px, tiempo en s. */
const T = {
  gravity: 1750,
  grabRange: 560,      // distancia máxima para engancharse
  ropeMax: 400,        // la liana se recoge hasta esta longitud...
  ropeMin: 130,        // ...y nunca es más corta que esta
  reel: 520,           // px/s al recoger
  pump: 430,           // impulso tangencial al balancearse (abajo del todo)
  maxSpeed: 1450,
  graceSpeed: 720,     // balanceo de la salida, antes de la primera pulsación
  releaseBoost: 1.05,
  bounce: 1120,        // rebote en las setas
  hand: 60,            // de centro del mono a la mano
  radius: 28,
  pxPerM: 40,
  waterY: 700,         // superficie del río
  deathY: 750,         // por debajo: fin de la partida
  mushTop: 560,
  viewH: 800,          // altura de mundo visible en apaisado
};

type Anchor = {
  x: number; y: number; frag: boolean; snapT: number; t: number; broken: boolean;
  img: Phaser.GameObjects.Image; hang: Phaser.GameObjects.Image;
};
type Banana = { x: number; y: number; img: Phaser.GameObjects.Image; taken: boolean };
type Mush = { x: number; img: Phaser.GameObjects.Image };

/**
 * La partida. Una sola mecánica: mantener = engancharse a la liana más cercana por delante (cuerda, balanceo);
 * soltar = salir volando con el impulso. Plátanos en el aire, setas que rebotan, lianas frágiles que se rompen
 * y nudos cada vez más separados. Caer al río = fin.
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  // estado público (lo leen el Hud y las pruebas)
  p = { x: 0, y: 0 };
  v = { x: 0, y: 0 };
  anchor: Anchor | null = null;
  anchors: Anchor[] = [];
  target: Anchor | null = null;
  alive = false;
  started = false;
  revived = false;
  hold = false;
  score = 0;
  bananas = 0;
  grabs = 0;
  private savedBananas = 0;
  private ropeL = 0;
  private grace = true;
  private pressUsed = false;
  private spin = 0;
  private rot = 0;
  private maxX = 0;
  private paused = false;
  private acc = 0;
  private lastX = 0;
  private lastY = 0;
  private faceT = 0;
  private overT = 0;
  private items: Banana[] = [];
  private mushes: Mush[] = [];
  private rnd!: Phaser.Math.RandomDataGenerator;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private monkey!: Phaser.GameObjects.Image;
  private rope!: Phaser.GameObjects.TileSprite;
  private ring!: Phaser.GameObjects.Image;
  private sky!: Phaser.GameObjects.Image;
  private far!: Phaser.GameObjects.TileSprite;
  private mid!: Phaser.GameObjects.TileSprite;
  private canopy!: Phaser.GameObjects.TileSprite;
  private water!: Phaser.GameObjects.TileSprite;
  private deep!: Phaser.GameObjects.Rectangle;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private leaves!: Phaser.GameObjects.Particles.ParticleEmitter;
  private drops!: Phaser.GameObjects.Particles.ParticleEmitter;
  private camX = 0;
  private camY = 0;
  private camSnap = true;

  constructor() { super('Play'); }

  async create() {
    // la instancia se reutiliza al reiniciar: nada de la partida anterior puede sobrevivir
    this.anchors = []; this.items = []; this.mushes = []; this.anchor = null; this.target = null;
    this.alive = true; this.started = false; this.revived = false; this.hold = false; this.score = 0; this.bananas = 0;
    this.grabs = 0; this.savedBananas = 0; this.grace = true; this.pressUsed = false; this.spin = 0; this.rot = 0;
    this.maxX = 0; this.paused = false; this.acc = 0; this.faceT = 0; this.overT = 0;
    this.registry.set('hold', false);
    this.rnd = new Phaser.Math.RandomDataGenerator([`${Date.now()}`]);

    this.makeBackground();
    this.rope = this.add.tileSprite(0, 0, 64 * K, 16 * K, 'vine').setOrigin(0, 0.5).setScale(1 / K).setDepth(3).setVisible(false);
    this.ring = this.add.image(0, 0, 'ring').setScale(0.5 / K).setDepth(2.5).setVisible(false);
    this.tweens.add({ targets: this.ring, scale: 0.62 / K, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.monkey = this.add.image(0, 0, 'monkey0').setOrigin(0.5, 70 / 112).setScale(1 / K).setDepth(4);
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 120, max: 320 }, lifespan: 450, scale: { start: 0.9 / K * 2, end: 0 }, tint: [0xffd23f, 0xffffff], emitting: false,
    }).setDepth(5);
    this.leaves = this.add.particles(0, 0, 'leaf', {
      speed: { min: 80, max: 260 }, lifespan: 1100, gravityY: 500, rotate: { min: 0, max: 360 }, scale: 1 / K * 1.4, emitting: false,
    }).setDepth(5);
    this.drops = this.add.particles(0, 0, 'drop', {
      speed: { min: 200, max: 520 }, angle: { min: 225, max: 315 }, lifespan: 900, gravityY: 1400, scale: { start: 1.3 / K * 1.5, end: 0.4 / K }, emitting: false,
    }).setDepth(6);

    // mundo inicial: primer nudo encima de la salida; el mono cuelga y se balancea hasta la primera pulsación
    this.lastX = 0; this.lastY = 120;
    const a0 = this.spawnAnchor(0, 120, false);
    while (this.lastX < 2600) this.addSegment();
    this.p = { x: a0.x - 120, y: a0.y + 200 };
    this.v = { x: 520, y: 0 };
    this.attach(a0, true);
    this.camSnap = true;

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.keys = ['SPACE', 'UP', 'W'].map((k) => this.input.keyboard!.addKey(k));

    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
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
    this.started = true;
    portal.gameplayStart();
  }

  /* ---------------------------------------------------------------- mundo */

  private makeBackground() {
    this.sky = this.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
    this.far = this.add.tileSprite(0, 0, 1024, 420, 'far').setOrigin(0, 1).setScrollFactor(0).setDepth(-9);
    this.mid = this.add.tileSprite(0, 0, 1024, 600, 'mid').setOrigin(0, 1).setScrollFactor(0).setDepth(-8);
    this.canopy = this.add.tileSprite(0, 0, 1024, 190, 'canopy').setOrigin(0, 0).setScrollFactor(0).setDepth(0.5);
    this.water = this.add.tileSprite(0, T.waterY - 22, 1024, 160, 'water').setOrigin(0, 0).setDepth(7);
    this.deep = this.add.rectangle(0, T.waterY + 136, 1024, 2000, 0x2a9ccd).setOrigin(0, 0).setDepth(7);
  }

  private spawnAnchor(x: number, y: number, frag: boolean, snapT = 1.5): Anchor {
    const hang = this.add.image(x, y + 4, 'hang').setOrigin(0.5, 1).setScale(1 / K).setDepth(1);
    const img = this.add.image(x, y, frag ? 'anchor-f' : 'anchor').setScale(1 / K).setDepth(2);
    const a: Anchor = { x, y, frag, snapT, t: -1, broken: false, img, hang };
    this.anchors.push(a);
    return a;
  }

  /** Un tramo: nudo siguiente (cada vez más lejos y más a menudo frágil), plátanos en el aire y quizá una seta. */
  private addSegment() {
    const m = this.lastX / T.pxPerM;
    const d = Phaser.Math.Clamp(m / 1800, 0, 1.35); // sigue subiendo un poco después de 1800 m
    const r = this.rnd;
    const gap = 300 + 230 * d + r.between(-40, 50) + (m > 250 && r.frac() < 0.12 + 0.25 * d ? 110 : 0);
    const x = this.lastX + gap;
    const y = Phaser.Math.Clamp(this.lastY + r.between(-110, 110), 20, 210 + 70 * Math.min(1, d));
    const frag = m > 50 && r.frac() < Math.min(0.8, 0.15 + 0.5 * d);
    const px = this.lastX, py = this.lastY;
    this.spawnAnchor(x, y, frag, Math.max(0.7, 1.5 - 0.65 * d));
    // plátanos: arco bajo (en la parte baja del balanceo) o alto (para los que salen disparados)
    if (r.frac() < 0.65) {
      const n = r.between(3, 4), high = r.frac() < 0.35 + 0.2 * d;
      const base = Math.max(py, y);
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0.5 : i / (n - 1);
        const bx = px + gap * (0.3 + u * 0.5);
        const by = high ? Math.min(py, y) - 30 - Math.sin(u * Math.PI) * 110 : base + 205 - Math.sin(u * Math.PI) * 55;
        this.items.push({ x: bx, y: by, taken: false, img: this.add.image(bx, by, 'banana').setScale(0.82 / K).setDepth(3).setRotation(-0.3) });
      }
    }
    // setas saltarinas: muchas al principio (red de seguridad), pocas después
    if (m < 30 || r.frac() < 0.5 - 0.4 * d) {
      const mx = px + gap * r.realInRange(0.35, 0.65);
      if (!this.mushes.some((q) => Math.abs(q.x - mx) < 200)) {
        this.mushes.push({ x: mx, img: this.add.image(mx, T.mushTop - 12, 'mush').setOrigin(0.5, 0).setScale(1 / K).setDepth(6) });
      }
    }
    this.lastX = x; this.lastY = y;
  }

  /** Zoom: en apaisado se ve siempre la misma altura de mundo; en vertical, una anchura mínima. */
  private layout() {
    const w = this.scale.width, h = this.scale.height;
    const cam = this.cameras.main;
    cam.setSize(w, h);
    const z = h > w ? Phaser.Math.Clamp(w / 520, 0.35, 1.6) : Phaser.Math.Clamp(Math.min(h / T.viewH, w / 1300), 0.3, 1.6);
    cam.setZoom(z);
  }

  /** Vista en coordenadas de pantalla para objetos con scrollFactor 0 (el zoom se aplica respecto al centro). */
  private view() {
    const cam = this.cameras.main, w = cam.width, h = cam.height, z = cam.zoom;
    const vw = w / z, vh = h / z;
    return { x0: w / 2 - vw / 2, y0: h / 2 - vh / 2, vw, vh };
  }

  /* ---------------------------------------------------------------- física (60 Hz fijos) */

  private attach(a: Anchor, grace = false) {
    this.anchor = a;
    const d = Math.hypot(this.p.x - a.x, this.p.y - a.y);
    this.ropeL = Math.max(T.ropeMin, d);
    this.grace = grace;
    if (a.frag && a.t < 0) a.t = 0;
    this.rope.setVisible(true);
    if (!grace) {
      this.grabs++;
      audio.tone(520, 0.09, 'triangle', 0.14, 820);
      this.events.emit('grab', this.grabs);
    }
  }

  private release() {
    const a = this.anchor!;
    this.anchor = null;
    this.rope.setVisible(false);
    const dx = this.p.x - a.x, dy = this.p.y - a.y, d = Math.hypot(dx, dy) || 1;
    // giro: sigue la velocidad angular del balanceo (voltereta si sale rápido)
    const vt = (this.v.x * -dy + this.v.y * dx) / d;
    this.spin = Phaser.Math.Clamp(vt / d, -12, 12);
    this.v.x *= T.releaseBoost; this.v.y *= T.releaseBoost;
    this.faceT = 0.5;
    audio.noise(0.18, 0.12, 1400);
  }

  private findTarget(): Anchor | null {
    let best: Anchor | null = null, bd = Infinity;
    for (const a of this.anchors) {
      if (a.broken || a.x < this.p.x - 30 || a.y > this.p.y + 40) continue;
      const d = Math.hypot(a.x - this.p.x, a.y - this.p.y);
      if (d < T.grabRange && d < bd) { bd = d; best = a; }
    }
    return best;
  }

  private step() {
    const p = this.p, v = this.v;
    // entrada: pulsar engancha (una vez por pulsación); soltar suelta
    if (this.anchor) {
      if (this.hold) { this.grace = false; this.pressUsed = true; }
      else if (!this.grace) this.release();
    } else if (this.hold && !this.pressUsed) {
      const t = this.findTarget();
      if (t) { this.attach(t); this.pressUsed = true; }
    }
    if (!this.hold) this.pressUsed = false;

    v.y += T.gravity * DT;
    const a = this.anchor;
    if (a) {
      // recoger la liana y balancearse (impulso tangencial en la parte baja del arco, más hacia delante)
      if (this.ropeL > T.ropeMax) this.ropeL = Math.max(T.ropeMax, this.ropeL - T.reel * DT);
      const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy) || 1;
      const nx = dx / d, ny = dy / d;
      const tx = -ny, ty = nx;
      const vt = v.x * tx + v.y * ty;
      const dir = vt >= 0 ? 1 : -1;
      const fwd = tx * dir > 0 ? 1 : 0.55;
      if (ny > 0) { const k = T.pump * ny * fwd * DT * dir; v.x += tx * k; v.y += ty * k; }
      if (a.t >= 0) {
        a.t += DT;
        if (a.t >= a.snapT) { this.snap(a); }
      }
    }
    // velocidad máxima (más baja en el balanceo de salida)
    const sp = Math.hypot(v.x, v.y), cap = this.grace ? T.graceSpeed : T.maxSpeed;
    if (sp > cap) { v.x *= cap / sp; v.y *= cap / sp; }
    v.x *= 0.9995;

    const oy = p.y;
    p.x += v.x * DT; p.y += v.y * DT;
    // restricción de cuerda (solo tensa: puede ir floja)
    const b = this.anchor;
    if (b) {
      const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
      if (d > this.ropeL) {
        const nx = dx / d, ny = dy / d;
        p.x = b.x + nx * this.ropeL; p.y = b.y + ny * this.ropeL;
        const vr = v.x * nx + v.y * ny;
        if (vr > 0) { v.x -= nx * vr; v.y -= ny * vr; }
      }
    }
    // frágiles agarradas antes siguen crujiendo aunque ya no estés colgado
    for (const q of this.anchors) if (q !== b && q.t >= 0 && !q.broken) { q.t += DT; if (q.t >= q.snapT) this.snap(q); }

    // setas: rebote al caer encima
    const top = T.mushTop - T.radius;
    if (v.y > 0 && oy <= top && p.y >= top) {
      for (const m of this.mushes) {
        if (Math.abs(p.x - m.x) < 78) {
          p.y = top;
          v.y = -Math.max(T.bounce, Math.min(1300, v.y * 0.95));
          v.x = Math.max(v.x, 430);
          if (this.anchor) { this.anchor = null; this.rope.setVisible(false); }
          this.spin = 8; this.faceT = 0.8;
          audio.tone(220, 0.22, 'triangle', 0.18, 620);
          this.tweens.killTweensOf(m.img);
          m.img.setScale(1 / K);
          this.tweens.add({ targets: m.img, scaleY: 0.8 / K, scaleX: 1.12 / K, duration: 90, yoyo: true, ease: 'Quad.out' });
          this.leaves.explode(5, m.x, T.mushTop);
          break;
        }
      }
    }

    // plátanos
    for (const it of this.items) {
      if (it.taken) continue;
      const dx = it.x - p.x, dy = it.y - p.y;
      if (dx * dx + dy * dy < 54 * 54) {
        it.taken = true;
        this.bananas++;
        this.events.emit('bananas', this.bananas);
        this.sparks.explode(8, it.x, it.y);
        this.tweens.add({ targets: it.img, scale: 1.3 / K, alpha: 0, y: it.y - 40, duration: 220, onComplete: () => it.img.setVisible(false) });
        audio.tone(880 + (this.bananas % 5) * 90, 0.08, 'square', 0.08, 1320 + (this.bananas % 5) * 90);
      }
    }

    // distancia
    if (p.x > this.maxX) {
      this.maxX = p.x;
      const s = Math.floor(this.maxX / T.pxPerM);
      if (s !== this.score) { this.score = s; this.events.emit('score', s); }
    }
    if (p.y > T.deathY) this.fall();
  }

  /** La liana frágil se rompe: el nudo cae entre hojas; si colgabas de ella, sales con tu velocidad. */
  private snap(a: Anchor) {
    a.broken = true; a.t = -1;
    if (this.anchor === a) { this.anchor = null; this.rope.setVisible(false); this.spin = 3; this.faceT = 0.6; }
    audio.noise(0.25, 0.4, 1600);
    audio.tone(300, 0.15, 'sawtooth', 0.06, 140);
    this.leaves.explode(8, a.x, a.y);
    a.img.clearTint();
    this.tweens.add({ targets: a.img, y: a.y + 700, angle: 200, alpha: 0, duration: 1100, ease: 'Quad.in' });
    this.tweens.add({ targets: a.hang, y: a.y - 260, duration: 500, ease: 'Back.out' });
  }

  /* ---------------------------------------------------------------- bucle */

  update(_t: number, dtMs: number) {
    if (!this.monkey) return;
    const raw = Math.min(this.game.loop.rawDelta || dtMs, 100);
    this.hold = this.alive && (this.registry.get('hold') || this.keys.some((k) => k.isDown));
    if (!this.paused && this.alive) {
      // rawDelta: tiempo real (el delta de Phaser viene suavizado y topado a 16,7 ms)
      this.acc += raw;
      let n = 0;
      while (this.acc >= STEP_MS && n < 5 && this.alive) { this.step(); this.acc -= STEP_MS; n++; }
      if (n === 5) this.acc = 0;
    }
    const dt = raw / 1000;
    const p = this.p, v = this.v;
    if (!this.alive && this.overT > 0) { this.overT -= dt; if (this.overT <= 0) this.showOver(); }

    // mono: colgado mira a la liana; en el aire gira y se endereza poco a poco
    const a = this.anchor;
    if (a) {
      this.rot = Math.atan2(a.x - p.x, -(a.y - p.y));
    } else {
      this.rot += this.spin * dt;
      this.spin *= Math.pow(0.2, dt);
      if (Math.abs(this.spin) < 1.5) {
        const want = Phaser.Math.Clamp(v.x * 0.0003, -0.4, 0.4);
        this.rot = Phaser.Math.Angle.RotateTo(this.rot, want, 4 * dt);
      }
    }
    this.monkey.setPosition(p.x, p.y).setRotation(this.rot);
    this.faceT -= dt;
    if (this.alive) {
      const face = a ? 0 : (v.y > 500 && p.y > T.mushTop - 160 ? 2 : this.faceT > 0 || v.y < 0 ? 1 : 0);
      this.monkey.setTexture(`monkey${face}`);
    }

    // liana: de nudo a mano; las frágiles se tiñen y tiemblan antes de romperse
    if (a) {
      const hx = p.x + Math.sin(this.rot) * T.hand, hy = p.y - Math.cos(this.rot) * T.hand;
      const len = Math.hypot(hx - a.x, hy - a.y);
      let jx = 0, jy = 0;
      if (a.t >= 0) {
        const f = a.t / a.snapT;
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0xffffff), Phaser.Display.Color.ValueToColor(0xc0703a), 100, Math.floor(f * 100));
        const tint = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
        this.rope.setTint(tint); a.img.setTint(tint);
        if (f > 0.45) { const s = (f - 0.45) * 7; jx = (Math.random() - 0.5) * s; jy = (Math.random() - 0.5) * s; }
      } else this.rope.clearTint();
      this.rope.setPosition(a.x + jx, a.y + jy).setRotation(Math.atan2(hy - a.y, hx - a.x)).setSize(len * K, 16 * K);
      a.img.setPosition(a.x + jx, a.y + jy);
    }
    // crujidos de aviso
    for (const q of this.anchors) {
      if (q.t < 0 || q.broken) continue;
      const f = q.t / q.snapT, prev = (q.t - dt) / q.snapT;
      if ((f > 0.5 && prev <= 0.5) || (f > 0.8 && prev <= 0.8)) { audio.noise(0.08, 0.22, 2400); this.leaves.explode(2, q.x, q.y); }
    }

    // nudo al que te engancharías ahora (anillo)
    this.target = this.alive && !a ? this.findTarget() : null;
    this.ring.setVisible(!!this.target);
    if (this.target) this.ring.setPosition(this.target.x, this.target.y);

    this.updateCamera(raw);
    this.recycle();
  }

  private updateCamera(raw: number) {
    const cam = this.cameras.main, z = cam.zoom;
    const vw = cam.width / z, vh = cam.height / z;
    const p = this.p;
    const tx = p.x + vw * 0.14 + Phaser.Math.Clamp(this.v.x * 0.12, -80, 160);
    const ty = Math.min(215 + p.y * 0.55, T.waterY + 130 - vh / 2);
    const k = this.camSnap ? 1 : 1 - Math.exp(-raw / 1000 * 4);
    this.camSnap = false;
    this.camX += (tx - this.camX) * k; this.camY += (ty - this.camY) * k;
    // el mono nunca sale de la vista
    this.camX = Phaser.Math.Clamp(this.camX, p.x - vw / 2 + 120, p.x + vw / 2 - 120);
    this.camY = Phaser.Math.Clamp(this.camY, p.y - vh / 2 + 160, p.y + vh / 2 - 120);
    cam.centerOn(this.camX, this.camY);

    // paralaje: cielo y capas pegados a la vista, desplazados según la cámara
    const vv = this.view();
    const sx = cam.scrollX + cam.width / 2 - vw / 2, sy = cam.scrollY + cam.height / 2 - vh / 2; // esquina superior izquierda en el mundo
    const lift = Phaser.Math.Clamp((T.waterY + 130 - vh) - sy, 0, 2000); // cuánto ha subido la cámara sobre su tope
    this.sky.setPosition(vv.x0, vv.y0).setDisplaySize(vv.vw, vv.vh);
    this.far.setPosition(vv.x0, vv.y0 + vv.vh + 40 + lift * 0.08).setSize(vv.vw + 2, 420);
    this.far.tilePositionX = sx * 0.12;
    this.mid.setPosition(vv.x0, vv.y0 + vv.vh + 90 + lift * 0.3).setSize(vv.vw + 2, 600);
    this.mid.tilePositionX = sx * 0.35;
    this.canopy.setPosition(vv.x0, vv.y0 - 20 - Math.min(170, lift * 0.25)).setSize(vv.vw + 2, 190);
    this.canopy.tilePositionX = sx * 1.15;
    this.water.setPosition(sx - 10, T.waterY - 22).setSize(vw + 20, 160);
    this.water.tilePositionX = sx + this.time.now * 0.03;
    this.deep.setPosition(sx - 10, T.waterY + 136).setSize(vw + 20, 2000);
  }

  /** Mundo infinito: crear por delante y quitar lo que queda detrás de la cámara. */
  private recycle() {
    const cam = this.cameras.main, vw = cam.width / cam.zoom;
    const left = this.camX - vw / 2 - 500, right = this.camX + vw / 2 + 900;
    while (this.lastX < right) this.addSegment();
    if (this.anchors.length && this.anchors[0].x < left && this.anchors[0] !== this.anchor) {
      this.anchors = this.anchors.filter((q) => {
        if (q.x >= left || q === this.anchor) return true;
        this.tweens.killTweensOf(q.img); this.tweens.killTweensOf(q.hang);
        q.img.destroy(); q.hang.destroy(); return false;
      });
      this.items = this.items.filter((it) => { if (it.x >= left) return true; this.tweens.killTweensOf(it.img); it.img.destroy(); return false; });
      this.mushes = this.mushes.filter((m) => { if (m.x >= left) return true; this.tweens.killTweensOf(m.img); m.img.destroy(); return false; });
    }
  }

  /* ---------------------------------------------------------------- final y revivir */

  /** Caída al río (o fin forzado por las pruebas). */
  fall() {
    if (!this.alive || !this.sys.isActive()) return;
    this.alive = false;
    this.hold = false;
    this.anchor = null;
    this.rope.setVisible(false);
    this.ring.setVisible(false);
    portal.gameplayStop();
    this.monkey.setTexture('monkey2');
    this.drops.explode(18, this.p.x, T.waterY);
    this.tweens.add({ targets: this.monkey, y: T.waterY + 60, alpha: 0, duration: 400 });
    audio.noise(0.45, 0.45, 600);
    audio.tone(500, 0.45, 'sine', 0.14, 120);
    this.cameras.main.shake(160, 0.006);
    // plátanos de la partida a la hucha (solo los nuevos si ya había revivido)
    save.set('coins', save.get('coins') + this.bananas - this.savedBananas);
    this.savedBananas = this.bananas;
    this.overT = 0.75;
  }

  /** Pantalla final 0,75 s después de caer (con tiempo real: el reloj de la escena va lento si bajan los FPS). */
  private showOver() {
    {
      const best = save.get('best');
      const newBest = this.score > best;
      if (newBest) save.set('best', this.score);
      this.events.emit('over', { score: this.score, best: Math.max(best, this.score), newBest, canRevive: portal.hasRewarded && !this.revived });
    }
  }

  /** Alias para scripts/sdk-test.mjs (que llama a breakEgg() en todos los juegos). */
  breakEgg() { this.fall(); }

  /** Revivir tras anuncio con recompensa (una vez por partida): colgado del último nudo sano, esperando la pulsación. */
  revive() {
    this.revived = true;
    this.overT = 0;
    let a = this.anchors.filter((q) => !q.broken && q.x <= this.p.x + 60).pop() ?? this.anchors.find((q) => !q.broken);
    if (!a) a = this.spawnAnchor(this.p.x, 120, false);
    a.frag = false; a.t = -1; a.img.setTexture('anchor').clearTint();
    this.tweens.killTweensOf(this.monkey);
    this.monkey.setAlpha(1).setTexture('monkey0');
    this.p = { x: a.x - 60, y: a.y + 220 };
    this.v = { x: 420, y: 0 };
    this.spin = 0;
    this.registry.set('hold', false);
    this.hold = false;
    this.attach(a, true);
    this.alive = true;
    portal.gameplayStart();
  }
}
