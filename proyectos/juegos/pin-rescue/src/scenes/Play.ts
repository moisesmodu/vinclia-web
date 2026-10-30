import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import * as Sim from '../sim';
import {
  W, H, DT, CELL, GW, GH, BS, COLS, ROWS, CRATE, WATER, LAVA, SAND, GOLD, STONE,
  init, step, pull, parse, starCount, type Level, type State, type PinS, type Ent,
} from '../sim';
import { LEVELS } from '../levels';
import { save, saveResult, levelStars, THEMES, themeOf } from '../state';
import { coinsFor, HERO, SLIME, PIN_T, type HeroFace } from '../cosmeticos';

const INK = PALETTE.ink;
/** 0xRRGGBB + alpha → the little-endian ABGR word of an ImageData pixel. */
const px = (rgb: number, a = 255) => ((a << 24) | ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff)) >>> 0;
const SH = (cols: number[], a = 255) => cols.map((c) => px(c, a));
/** Cell colours, four shades each (the shade travels with the cell, so grains and drops keep their colour). */
const COL = {
  water: SH([0x3aa0ff, 0x45a8ff, 0x2f94f5, 0x52b0ff], 225),
  waterTop: px(0xa8dcff, 240),
  lava: SH([0xff6a1a, 0xff8a1f, 0xff4d14, 0xffa62b]),
  lavaTop: px(0xffd23f),
  sand: SH([0xf2d38a, 0xe8c47a, 0xf7dd9b, 0xdcb86a]),
  gold: SH([0xffc62b, 0xffd84a, 0xf0b020, 0xffe066]),
  goldShine: px(0xfff6c8),
  stone: SH([0x7a7f95, 0x6b7088, 0x8a90a6, 0x5f6479]),
  crate: SH([0xc98a4b, 0xd99a55, 0xc08040, 0xd09050]),
  crateLine: px(0x7a4a22),
};

type PinView = { c: Phaser.GameObjects.Container; p: PinS; i: number; hit: Phaser.Geom.Rectangle; gone: boolean };

/**
 * One level. The simulation (sim.ts) runs at a fixed 120 Hz on real elapsed time (rawDelta), so it plays the same at
 * 30 or 144 FPS; the grid is drawn into one 120 × 160 canvas texture shown 4× bigger (nearest filter), the walls are
 * baked into one texture per level, pins and entities are sprites. Tap (or swipe across) a pin to pull it.
 * Losing never ends anything: the level resets in about a second (instant retry).
 * Public names used by the tests: SIM, level, s, fails, alive, started, finished, breakEgg(), complete(), skip(),
 * act(), autoplay(), pinScreen(), view.
 */
export class Play extends Phaser.Scene {
  /** Simulation and levels, for pin-rescue/test-niveles.mjs. */
  static SIM = { ...Sim, LEVELS };
  private static firstRun = true;
  /** Levels finished since the last interstitial (one ad at most every 3 levels). */
  static sinceAd = 0;

  level = 1;
  L!: Level;
  s!: State;
  fails = 0;
  alive = false;
  started = false;
  finished = false;
  paused = false;
  coinsRun = 0;
  doubled = false;
  /** For the tutorial: a pin has been pulled. */
  pulledOnce = false;
  /** Scripted pulls [sim seconds, pin] played at exact simulation times (tests, screenshots, autopilot). */
  auto: [number, number][] = [];
  view = { x: 0, y: 0, k: 1 };

  private acc = 0;
  private runId = 0;
  private theme = 0;
  private world!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.TileSprite;
  private gridTex!: Phaser.Textures.CanvasTexture;
  private img!: ImageData;
  private pix!: Uint32Array;
  private pins: PinView[] = [];
  private ents: { e: Ent; im: Phaser.GameObjects.Image; dead: boolean }[] = [];
  private hero!: Phaser.GameObjects.Image;
  private face: HeroFace = 'idle';
  private faceUntil = 0;
  private blinkAt = 0;
  private lastStars = 0;
  private lastCoinSound = 0;
  private lastHiss = 0;
  private fxSteam!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxSmoke!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxEmber!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxCoin!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxSpark!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxBoom!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dragging = false;
  private frame = 0;

  constructor() { super('Play'); }

  async create(data?: { level?: number; transition?: boolean }) {
    // the scene instance is reused on restart: nothing from the previous level may survive
    this.level = Phaser.Math.Clamp(data?.level ?? this.registry.get('level') ?? 1, 1, LEVELS.length);
    this.registry.set('level', this.level);
    this.fails = 0; this.alive = false; this.started = false; this.finished = false; this.paused = false; this.acc = 0;
    this.coinsRun = 0; this.doubled = false; this.pulledOnce = false; this.auto = []; this.face = 'idle'; this.faceUntil = 0;
    this.blinkAt = 0; this.lastStars = 0; this.lastCoinSound = 0; this.lastHiss = 0; this.pins = []; this.ents = [];
    this.dragging = false; this.frame = 0;
    this.theme = themeOf(this.level);
    this.L = LEVELS[this.level - 1];

    const th = THEMES[this.theme];
    this.cameras.main.setBackgroundColor(th.base);
    this.bg = this.add.tileSprite(0, 0, 10, 10, `bg${this.theme}`).setOrigin(0, 0).setScrollFactor(0);
    this.world = this.add.container(0, 0);
    this.bakeInside();
    this.bakeWalls();
    // the material grid: one small canvas texture, redrawn every frame, shown 4× (nearest filter)
    if (this.textures.exists('grid')) this.textures.remove('grid');
    this.gridTex = this.textures.createCanvas('grid', GW, GH)!;
    this.gridTex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.img = this.gridTex.context.createImageData(GW, GH);
    this.pix = new Uint32Array(this.img.data.buffer);
    this.world.add(this.add.image(0, 0, `inside${this.theme}`).setOrigin(0, 0));
    this.world.add(this.add.image(0, 0, 'grid').setOrigin(0, 0).setScale(CELL));
    this.world.add(this.add.image(0, 0, 'walls').setOrigin(0, 0));
    this.buildLevel();

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.input.keyboard?.on('keydown-R', () => this.restart());
    for (let k = 1; k <= 9; k++) this.input.keyboard?.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][k - 1]}`, () => this.act(k - 1));

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      this.runId++;
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointerupoutside']) this.input.off(ev);
      this.scene.stop('Hud');
    });

    save.set('runs', save.get('runs') + 1);
    const run = ++this.runId;
    // Interstitial only at a natural break between levels, never on fails or restarts, never on the first level
    // of the session and at most once every 3 finished levels (the portal adds its own frequency cap on top).
    if (!Play.firstRun && data?.transition && Play.sinceAd >= 3) {
      this.paused = true;
      await portal.commercialBreak();
      Play.sinceAd = 0;
      this.paused = false;
    }
    Play.firstRun = false;
    if (run !== this.runId) return; // left the scene during the ad
    this.alive = true;
    this.started = true;
    portal.gameplayStart();
  }

  /* ------------------------------------------------------------------ baked art */

  /** The hollow inside the tower (behind the materials): dark stone with faint bricks, one texture per theme. */
  private bakeInside() {
    const key = `inside${this.theme}`;
    if (this.textures.exists(key)) return;
    const th = THEMES[this.theme];
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(th.inside); g.fillRect(0, 0, W, H);
    g.fillStyle(0xffffff, 0.035);
    for (let r = 0; r < H / 40; r++) for (let c = -1; c < W / 60 + 1; c++) g.fillRoundedRect(c * 60 + (r % 2) * 30 + 3, r * 40 + 3, 54, 34, 8);
    g.generateTexture(key, W, H);
    g.destroy();
  }

  /** Walls of this level (blocks and 45° ramps) with a thick outline and brick joints, baked into one texture. */
  private bakeWalls() {
    const pr = parse(this.L), th = THEMES[this.theme], B = BS * CELL;
    const wall = (bx: number, by: number) => bx < 0 || by < 0 || bx >= COLS || by >= ROWS || pr.walls[by * COLS + bx] === 1;
    const ramp = new Set(pr.ramps.map((r) => r.y * COLS + r.x));
    redrawTexture(this, 'walls', W, H, (g) => {
      const shapes = (fill: (x: number, y: number, w: number, h: number) => void, tri: (r: { x: number; y: number; left: boolean }) => void) => {
        for (let by = 0; by < ROWS; by++) for (let bx = 0; bx < COLS; bx++) if (wall(bx, by)) fill(bx * B, by * B, B, B);
        for (const r of pr.ramps) tri(r);
      };
      const triPts = (r: { x: number; y: number; left: boolean }) => {
        const x0 = r.x * B, y0 = r.y * B;
        return r.left ? [x0, y0, x0, y0 + B, x0 + B, y0 + B] : [x0 + B, y0, x0 + B, y0 + B, x0, y0 + B];
      };
      // outline: every shape stroked thick in ink, then filled (the fill hides the joints between walls)
      g.lineStyle(7, INK);
      shapes((x, y, w, h) => g.strokeRect(x, y, w, h), (r) => { const p = triPts(r); g.strokeTriangle(p[0], p[1], p[2], p[3], p[4], p[5]); });
      g.fillStyle(th.wall);
      shapes((x, y, w, h) => g.fillRect(x - 0.5, y - 0.5, w + 1, h + 1), (r) => { const p = triPts(r); g.fillTriangle(p[0], p[1], p[2], p[3], p[4], p[5]); });
      // bricks: a joint across every block row, staggered vertical joints, a light lip on top faces
      for (let by = 0; by < ROWS; by++) for (let bx = 0; bx < COLS; bx++) {
        if (!wall(bx, by)) continue;
        const x = bx * B, y = by * B;
        g.fillStyle(th.wallDark, 0.55);
        g.fillRect(x, y + B - 2, B, 2);
        if ((bx + by) % 2 === 0) g.fillRect(x + B / 2 - 1, y, 2, B);
        if (!wall(bx, by - 1) && !ramp.has((by - 1) * COLS + bx)) { g.fillStyle(th.wallLight); g.fillRect(x, y + 1, B, 4); }
        if ((bx * 7 + by * 13) % 11 === 0) { g.fillStyle(th.wallLight, 0.6); g.fillCircle(x + 6, y + 7, 2); }
      }
    });
  }

  /* ------------------------------------------------------------------ building the level (also on every retry) */

  private buildLevel() {
    for (const p of this.pins) p.c.destroy();
    for (const e of this.ents) e.im.destroy();
    this.pins = []; this.ents = [];
    this.world.list.filter((o) => (o as any).__fx).forEach((o) => o.destroy());
    this.s = init(this.L);
    this.lastStars = 0;

    // entities
    for (const e of this.s.ents) {
      let im: Phaser.GameObjects.Image;
      if (e.kind === 'hero') { im = this.add.image(0, 0, 'hero-idle').setOrigin(0, 0); this.hero = im; }
      else if (e.kind === 'slime') im = this.add.image(0, 0, 'slime-grr').setOrigin(0, 0);
      else if (e.kind === 'bomb') {
        im = this.add.image(0, 0, 'bomb').setOrigin(0, 0);
        this.tweens.add({ targets: im, scaleX: 1.04, scaleY: 0.96, duration: 260, yoyo: true, repeat: -1 });
      } else {
        im = this.add.image(0, 0, 'gem').setOrigin(0, 0);
        this.tweens.add({ targets: im, alpha: 0.82, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      this.world.add(im);
      this.ents.push({ e, im, dead: false });
    }
    // pins on top of the walls
    this.s.pins.forEach((p, i) => this.pins.push(this.makePin(p, i)));

    const fx = <T extends Phaser.GameObjects.GameObject>(o: T) => { (o as any).__fx = true; this.world.add(o); return o; };
    this.fxSteam = fx(this.add.particles(0, 0, 'puff', {
      speedY: { min: -120, max: -50 }, speedX: { min: -30, max: 30 }, lifespan: 700, scale: { start: 0.22, end: 0.6 },
      alpha: { start: 0.5, end: 0 }, emitting: false,
    }));
    this.fxSmoke = fx(this.add.particles(0, 0, 'puff', {
      speedY: { min: -90, max: -30 }, speedX: { min: -25, max: 25 }, lifespan: 800, scale: { start: 0.3, end: 0.8 },
      alpha: { start: 0.6, end: 0 }, tint: 0x5f6479, emitting: false,
    }));
    this.fxEmber = fx(this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 200 }, angle: { min: 200, max: 340 }, lifespan: 500, gravityY: 500, scale: { start: 0.6, end: 0 },
      tint: [0xff6a1a, 0xffd23f, 0xff4d14], emitting: false,
    }));
    this.fxCoin = fx(this.add.particles(0, 0, 'spark', {
      speed: { min: 40, max: 160 }, lifespan: 450, scale: { start: 0.7, end: 0 }, tint: [0xffd23f, 0xfff6c8], emitting: false,
    }));
    this.fxSpark = fx(this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 260 }, lifespan: 600, scale: { start: 0.9, end: 0 }, rotate: { min: 0, max: 360 },
      tint: [0xff4fa3, 0xffffff, 0x9b6bff], emitting: false,
    }));
    this.fxBoom = fx(this.add.particles(0, 0, 'puff', {
      speed: { min: 120, max: 420 }, lifespan: 600, scale: { start: 1.1, end: 0.2 }, alpha: { start: 0.95, end: 0 },
      tint: [0xffd23f, 0xff8a1f, 0xff4d14, 0xffffff], emitting: false,
    }));
    this.draw();
  }

  /** A pin: a bar along its run plus a ring handle on the side it slides out of. */
  private makePin(p: PinS, i: number): PinView {
    const horiz = p.dir === 'l' || p.dir === 'r';
    const len = (horiz ? p.w : p.h) * CELL;
    const x0 = p.x * CELL, y0 = p.y * CELL, x1 = (p.x + p.w) * CELL, y1 = (p.y + p.h) * CELL;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    // origin at the handle end; local -x points the way it slides out
    const o = { l: [x0, cy, 0], r: [x1, cy, Math.PI], u: [cx, y0, Math.PI / 2], d: [cx, y1, -Math.PI / 2] }[p.dir] as number[];
    const c = this.add.container(o[0], o[1]).setRotation(o[2]);
    const ext = 22;
    const bar = this.add.tileSprite(-ext, 0, len + ext, PIN_T + 4, 'pinbar').setOrigin(0, 0.5);
    const tip = this.add.circle(len, 0, PIN_T / 2 - 1, 0xffffff, 0).setStrokeStyle(0);
    const ring = this.add.image(-ext - 20, 0, 'pinring');
    c.add([bar, tip, ring]);
    this.world.add(c);
    // tap area: the bar plus the ring, generous for fingers
    const pad = 14;
    const ringC = { l: [x0 - ext - 20, cy], r: [x1 + ext + 20, cy], u: [cx, y0 - ext - 20], d: [cx, y1 + ext + 20] }[p.dir]!;
    const rx0 = Math.min(x0, ringC[0] - 26) - pad, ry0 = Math.min(y0, ringC[1] - 26) - pad;
    const rx1 = Math.max(x1, ringC[0] + 26) + pad, ry1 = Math.max(y1, ringC[1] + 26) + pad;
    return { c, p, i, hit: new Phaser.Geom.Rectangle(rx0, ry0, rx1 - rx0, ry1 - ry0), gone: false };
  }

  /** The board fills the screen, keeping its proportions; room for the HUD on top when there is no room beside it. */
  layout() {
    const w = this.scale.width, h = this.scale.height;
    this.bg.setSize(w, h);
    const ui = Phaser.Math.Clamp(Math.min(w / 1100, h / 640), 0.6, 1.4);
    // what has to fit: the board plus any pin handle sticking out of it
    let x0 = 0, x1 = W, y0 = 0, y1 = H;
    for (const v of this.pins) {
      x0 = Math.min(x0, v.hit.x + 10); x1 = Math.max(x1, v.hit.right - 10);
      y0 = Math.min(y0, v.hit.y + 10); y1 = Math.max(y1, v.hit.bottom - 10);
    }
    const ew = x1 - x0, eh = y1 - y0;
    let top = 0;
    const k0 = Math.min(w / (ew + 40), h / (eh + 40));
    if ((w - ew * k0) / 2 < 240 * ui) top = 78 * ui;
    const k = Math.min(w / (ew + 16), (h - top) / (eh + 20));
    this.view = { k, x: w / 2 - ((x0 + x1) / 2) * k, y: top + (h - top) / 2 - ((y0 + y1) / 2) * k };
    this.world.setScale(k).setPosition(this.view.x, this.view.y);
  }

  /* ------------------------------------------------------------------ input: tap or swipe across a pin */

  private toWorld(p: Phaser.Input.Pointer) { return { x: (p.x - this.view.x) / this.view.k, y: (p.y - this.view.y) / this.view.k }; }

  private pinAt(q: { x: number; y: number }) {
    // the smallest tap area wins (pins can be close together)
    let best = -1, area = Infinity;
    for (const v of this.pins) {
      if (v.p.pulled || !v.hit.contains(q.x, q.y)) continue;
      const a = v.hit.width * v.hit.height;
      if (a < area) { area = a; best = v.i; }
    }
    return best;
  }

  private onDown(p: Phaser.Input.Pointer) {
    if (!this.alive || this.paused) return;
    this.dragging = true;
    const i = this.pinAt(this.toWorld(p));
    if (i >= 0) this.act(i);
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (!this.dragging || !p.isDown || !this.alive || this.paused) return;
    const i = this.pinAt(this.toWorld(p));
    if (i >= 0) this.act(i);
  }

  private onUp() { this.dragging = false; }

  /** Pulls pin i (input, keyboard 1-9, tests and the autopilot). */
  act(i: number) {
    if (!this.alive || this.paused || !this.s.pins[i] || this.s.pins[i].pulled) return false;
    pull(this.s, i);
    this.pulledOnce = true;
    this.handleEvents();
    return true;
  }

  /** Screen position of pin i's ring (tutorial hand). */
  pinScreen(i = 0) {
    const v = this.pins[i];
    if (!v) return null;
    const m = v.c.getWorldTransformMatrix();
    const r = m.transformPoint(-22 - 20, 0);
    return { x: r.x, y: r.y };
  }

  /* ------------------------------------------------------------------ loop */

  update() {
    if (!this.started || this.paused) return;
    this.frame++;
    const dt = Math.min(100, this.game.loop.rawDelta) / 1000;
    this.acc += dt;
    let n = 0;
    while (this.acc >= DT && n < 12) {
      this.acc -= DT; n++;
      while (this.auto.length && this.alive && this.s.t >= this.auto[0][0] - 1e-9) this.act(this.auto.shift()![1]);
      step(this.L, this.s);
      this.handleEvents();
    }
    if (n === 12) this.acc = 0;
    this.draw();
  }

  private handleEvents() {
    const s = this.s, now = this.time.now;
    for (const f of s.fx) {
      const x = f.x * CELL + 2, y = f.y * CELL + 2;
      if (f.k === 'steam') this.fxSteam.emitParticleAt(x, y, 1);
      else if (f.k === 'smoke') this.fxSmoke.emitParticleAt(x, y, 2);
      else if (f.k === 'melt' || f.k === 'burn') this.fxEmber.emitParticleAt(x, y, 3);
      else if (f.k === 'coin') this.fxCoin.emitParticleAt(x, y, 1);
      else if (f.k === 'gem') this.fxSpark.emitParticleAt(x, y, 18);
      else if (f.k === 'eat') this.fxCoin.emitParticleAt(x, y, 3);
      else if (f.k === 'boom') { this.fxBoom.emitParticleAt(x, y, 26); this.fxEmber.emitParticleAt(x, y, 20); }
    }
    s.fx.length = 0;
    for (const e of s.ev) {
      if (e.startsWith('pull')) this.pinPulled(+e.slice(4));
      else if (e === 'hiss') { if (now - this.lastHiss > 120) { this.lastHiss = now; audio.noise(0.18, 0.12, 3400); } }
      else if (e === 'melt') { if (now - this.lastHiss > 160) { this.lastHiss = now; audio.noise(0.12, 0.1, 900); } }
      else if (e === 'collect') {
        if (now - this.lastCoinSound > 70) { this.lastCoinSound = now; audio.tone(1300 + Math.random() * 500, 0.06, 'triangle', 0.05); }
        this.setFace('happy', 260);
      } else if (e === 'gem') { [988, 1319, 1568].forEach((f, j) => window.setTimeout(() => audio.tone(f, 0.12, 'triangle', 0.1), j * 70)); this.setFace('happy', 600); }
      else if (e === 'gemlost') audio.tone(500, 0.2, 'sine', 0.08, 200);
      else if (e.startsWith('burn') || e.startsWith('drown')) this.slimeGone(+e.replace(/\D/g, ''), e.startsWith('burn'));
      else if (e.startsWith('boom')) this.boomed(+e.slice(4));
      else if (e.startsWith('eat')) { if (now - this.lastCoinSound > 90) { this.lastCoinSound = now; audio.tone(220, 0.07, 'square', 0.05, 140); } }
      else if (e === 'win') this.complete();
      else if (e === 'lose') this.lose();
    }
    s.ev.length = 0;
    const st = starCount(s);
    if (st !== this.lastStars) { this.lastStars = st; this.events.emit('stars', st); }
  }

  private pinPulled(i: number) {
    audio.tone(700, 0.08, 'triangle', 0.1, 1200);
    audio.noise(0.1, 0.15, 2600);
    const v = this.pins[i];
    if (v) this.tweens.add({ targets: v.c.list[2], scale: 1.25, duration: 90, yoyo: true });
  }

  private slimeGone(k: number, burnt: boolean) {
    const v = this.ents[k];
    if (!v || v.dead) return;
    v.dead = true;
    audio.tone(burnt ? 300 : 500, 0.3, 'sine', 0.1, burnt ? 90 : 160);
    if (burnt) { audio.noise(0.3, 0.2, 700); v.im.setTint(0x5a3a2a); }
    else { this.fxSteam.emitParticleAt(v.im.x + 38, v.im.y + 30, 6); v.im.setTexture('slime-scared'); }
    this.tweens.add({ targets: v.im, alpha: 0, scaleY: 0.3, y: v.im.y + 30, duration: 600, ease: 'Quad.in' });
  }

  private boomed(k: number) {
    const v = this.ents[k];
    if (v) { v.dead = true; v.im.setVisible(false); }
    audio.noise(0.6, 0.5, 300);
    audio.tone(120, 0.5, 'sawtooth', 0.12, 40);
    this.cameras.main.shake(260, 0.012);
  }

  /* ------------------------------------------------------------------ drawing */

  private draw() {
    // the grid texture is re-uploaded only when cells moved (or every 8th frame, for the lava shimmer and gold glints)
    if (this.s.dirty || this.frame % 8 === 0) { this.s.dirty = false; this.drawGrid(); }
    const s = this.s, now = this.time.now;
    // pins slide out with the simulation, then fly off and fade
    for (const v of this.pins) {
      const p = v.p;
      if (!p.pulled) continue;
      const d = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[p.dir]!;
      const base = { l: [p.x, (p.y + p.h / 2)], r: [p.x + p.w, p.y + p.h / 2], u: [p.x + p.w / 2, p.y], d: [p.x + p.w / 2, p.y + p.h] }[p.dir]!;
      const off = p.out * CELL;
      v.c.setPosition(base[0] * CELL + d[0] * off, base[1] * CELL + d[1] * off);
      if (p.done && !v.gone) {
        v.gone = true;
        this.tweens.add({ targets: v.c, x: v.c.x + d[0] * 160, y: v.c.y + d[1] * 160, alpha: 0, duration: 380, ease: 'Quad.in' });
      }
    }
    // entities follow their boxes
    for (const v of this.ents) {
      const e = v.e;
      if (v.dead) continue;
      if (!e.alive && e.kind === 'gem') { v.dead = true; this.tweens.add({ targets: v.im, alpha: 0, scale: 1.6, duration: 260 }); continue; }
      const x = e.x * CELL, y = e.y * CELL;
      if (e.kind === 'hero') v.im.setPosition(x - HERO.bx, y - HERO.by);
      else if (e.kind === 'slime') {
        v.im.setPosition(x - SLIME.bx, y - SLIME.by);
        v.im.setTexture(e.drown > 0.05 ? 'slime-scared' : 'slime-grr');
      } else if (e.kind === 'bomb') v.im.setPosition(x - 4, y - 8);
      else v.im.setPosition(x - 2, y - 2);
    }
    // hero face: scared when lava or a slime comes close, happy while collecting, blinks now and then
    let f: HeroFace = this.face;
    if (this.faceUntil && now > this.faceUntil) { this.face = 'idle'; this.faceUntil = 0; }
    if (!this.faceUntil) {
      f = 'idle';
      if (this.alive && !s.won && this.frame % 6 === 0) this.danger = this.dangerNear();
      if (this.danger) f = 'scared';
      else if (now > this.blinkAt) { if (now > this.blinkAt + 130) this.blinkAt = now + 1800 + Math.random() * 2600; else f = 'blink'; }
    } else f = this.face;
    this.hero.setTexture(`hero-${f}`);
  }
  private danger = false;

  /** Lava within 3 blocks of the hero, or a live slime within 2 blocks. */
  private dangerNear() {
    const s = this.s, h = s.ents.find((e) => e.kind === 'hero')!, R = 15, g = s.g;
    for (const e of s.ents) if (e.kind === 'slime' && e.alive && Math.abs(e.x - h.x) < 25 && Math.abs(e.y - h.y) < 25) return true;
    for (let y = Math.max(0, h.y - R); y < Math.min(GH, h.y + h.h + R); y += 2) {
      for (let x = Math.max(0, h.x - R); x < Math.min(GW, h.x + h.w + R); x += 2) if (g[y * GW + x] === LAVA) return true;
    }
    return false;
  }

  /** Writes every cell into the canvas texture (transparent where there is nothing). */
  private drawGrid() {
    const g = this.s.g, sh = this.s.sh, out = this.pix, t = this.frame >> 3;
    for (let y = 0; y < GH; y++) {
      const row = y * GW;
      for (let x = 0; x < GW; x++) {
        const i = row + x, c = g[i];
        let col = 0;
        if (c >= WATER) {
          const k = sh[i] & 3;
          if (c === WATER) col = y > 0 && g[i - GW] === 0 ? COL.waterTop : COL.water[k];
          else if (c === LAVA) col = y > 0 && g[i - GW] === 0 ? COL.lavaTop : COL.lava[(k + t + (x >> 2)) & 3];
          else if (c === SAND) col = COL.sand[k];
          else if (c === GOLD) col = ((i * 7 + t) & 63) === 0 ? COL.goldShine : COL.gold[k];
          else if (c === STONE) col = COL.stone[k];
        } else if (c === CRATE) col = x % BS === 0 || y % BS === BS - 1 ? COL.crateLine : COL.crate[sh[i] & 3];
        out[i] = col;
      }
    }
    this.gridTex.context.putImageData(this.img, 0, 0);
    this.gridTex.refresh();
  }

  private setFace(f: HeroFace, ms = 0) { this.face = f; this.faceUntil = ms ? this.time.now + ms : 0; }

  /* ------------------------------------------------------------------ win, lose, retry */

  /** Something went wrong (lava, slime, blast, gold lost, stuck, or breakEgg()): instant retry of the same level, no ad. */
  private lose() {
    if (!this.alive || this.finished) return;
    this.alive = false;
    this.fails++;
    save.set('fails', save.get('fails') + 1);
    this.setFace('sad', 1200);
    this.hero.setTexture('hero-sad');
    audio.tone(420, 0.3, 'sawtooth', 0.06, 110);
    audio.tone(300, 0.4, 'sine', 0.08, 140);
    this.cameras.main.shake(140, 0.005);
    const cross = this.add.image(this.hero.x + HERO.w / 2, this.hero.y + 40, 'cross').setScale(0.2);
    (cross as any).__fx = true;
    this.world.add(cross);
    this.tweens.add({ targets: cross, scale: 0.8, duration: 260, ease: 'Back.out' });
    this.events.emit('fails', this.fails);
    this.later(1100, () => this.retry());
  }

  /** Same level from the start, keeping the fail count (instant, no ad, no game over). */
  private retry() {
    if (this.finished) return;
    this.buildLevel();
    this.acc = 0;
    this.setFace('idle');
    this.alive = true;
    this.events.emit('stars', 0);
    this.events.emit('retry');
    audio.tone(600, 0.12, 'sine', 0.08, 900);
  }

  /** Real-time wait (not frames), cancelled if the scene restarts. */
  private later(ms: number, fn: () => void) {
    const run = this.runId;
    window.setTimeout(() => { if (run === this.runId) fn(); }, ms);
  }

  /** The hero got the gold and every slime is gone: stars saved, next level unlocked, coins paid. */
  complete() {
    if (this.finished) return;
    this.finished = true;
    this.alive = false;
    portal.gameplayStop();
    const stars = Math.max(1, starCount(this.s));
    const before = levelStars(this.level);
    saveResult(this.level, stars);
    this.coinsRun = coinsFor(stars);
    save.set('coins', save.get('coins') + this.coinsRun);
    Play.sinceAd++;
    if (stars === 3) portal.happyTime();
    this.setFace('happy', 100000);
    this.hero.setTexture('hero-happy');
    this.tweens.add({ targets: this.hero, y: this.hero.y - 26, duration: 180, yoyo: true, repeat: 2, ease: 'Quad.out' });
    [523, 659, 784, 1047].forEach((f, j) => window.setTimeout(() => audio.tone(f, 0.16, 'square', 0.07), j * 110));
    this.add.particles(0, 0, 'dot', {
      speed: { min: 200, max: 520 }, lifespan: 1200, gravityY: 800, scale: { start: 1.1, end: 0.3 },
      tint: [0xffd23f, 0x3ddc84, 0x9b6bff, 0xff7eb6, 0xffffff], emitting: false,
    }).setPosition(this.view.x + (this.hero.x + HERO.w / 2) * this.view.k, this.view.y + (this.hero.y + 30) * this.view.k).explode(46);
    this.later(1000, () => {
      this.events.emit('complete', {
        level: this.level, stars, newBest: stars > before, last: this.level >= LEVELS.length, coins: this.coinsRun, canDouble: !this.doubled,
      });
    });
  }

  /** ×2 with a rewarded ad on the level-complete panel: the level's coins once more (once per level). */
  doubleCoins() {
    if (this.doubled || !this.finished) return 0;
    this.doubled = true;
    save.set('coins', save.get('coins') + this.coinsRun);
    return this.coinsRun;
  }

  /** Forces a fail (as if lava reached the hero): instant retry. Used by the SDK test. */
  breakEgg() {
    if (!this.alive) return;
    this.s.dead = 'lava';
    this.lose();
  }

  /** Restart the same level (one click, no ad). */
  restart() { this.scene.restart({ level: this.level, transition: false }); }

  /** Skip the level after a rewarded ad: unlocks the next one (no stars) and starts it. No interstitial here. */
  skip() {
    const next = Math.min(LEVELS.length, this.level + 1);
    if (next > save.get('unlocked')) save.set('unlocked', next);
    this.scene.restart({ level: next, transition: false });
  }

  /** Same level again (transition false: no ad) or the next one (transition true). */
  startLevel(level: number, transition: boolean) {
    this.scene.restart({ level, transition });
  }

  /** Restarts the attempt and plays a script at exact simulation times (tests, screenshots); default: the designer's line. */
  autoplay(script: [number, number][] = this.L.sol) {
    if (this.finished) return;
    this.buildLevel();
    this.acc = 0;
    this.alive = true;
    this.events.emit('stars', 0);
    this.auto = script.map((e) => [e[0], e[1]] as [number, number]);
  }
}
