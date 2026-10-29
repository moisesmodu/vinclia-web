import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import * as Sim from '../sim';
import { T, P, parse, init, step, doorPos, type Parsed, type State, type Input } from '../sim';
import { LEVELS } from '../levels';
import { save, starsFor, saveResult, levelBest, PALETTES, paletteOf } from '../state';

const SOLIDISH = '#DFC<>X';
const HERO_SCALE = 0.72;

type Face = 'n' | 'b' | 'j' | 'o' | 'x' | 'h';

/**
 * One level. The simulation (sim.ts) runs at a fixed 120 Hz on real elapsed time (rawDelta), so the game plays the
 * same at 30 or 144 FPS; this scene draws it. Dying never ends the run: the hero pops back at the start in half a
 * second and the death counter goes up. The level only ends at the door (or with breakEgg(), the "give up" panel).
 * Public names used by the tests: SIM, level, deaths, alive, started, finished, breakEgg(), complete(), skip().
 */
export class Play extends Phaser.Scene {
  /** Simulation and level data for trick-floor/test-niveles.mjs. */
  static SIM = { ...Sim, LEVELS };
  private static firstRun = true;
  /** Levels finished since the last interstitial (one ad at most every 3 levels). */
  static sinceAd = 0;

  level = 1;
  L!: Parsed;
  s!: State;
  deaths = 0;
  alive = false;
  started = false;
  finished = false;
  /** Touch buttons, set by Hud each frame. */
  touch: Input = { l: false, r: false, j: false };
  /** Scripted input (performance test autopilot), combined with the keys and the touch buttons. */
  auto: Input = { l: false, r: false, j: false };
  /** For the tutorial: distance walked and whether the player jumped. */
  walked = 0;
  jumped = false;

  private acc = 0;
  private paused = false;
  private runId = 0;
  private pal = 0;
  private hero!: Phaser.GameObjects.Container;
  private heroBody!: Phaser.GameObjects.Image;
  private heroFace!: Phaser.GameObjects.Image;
  private face: Face = 'n';
  private faceUntil = 0;
  private blinkAt = 0;
  private sq = { x: 1, y: 1 };
  private dyn?: Phaser.GameObjects.Container;
  private trapImgs: Phaser.GameObjects.Image[][] = [];
  private darts: { block: Phaser.GameObjects.Image; dart: Phaser.GameObjects.Image; gone: boolean }[] = [];
  private zones: { c: number; img: Phaser.GameObjects.Image }[] = [];
  private springImgs: Phaser.GameObjects.Image[] = [];
  private door!: Phaser.GameObjects.Container;
  private doorFace!: Phaser.GameObjects.Image;
  private legs: Phaser.GameObjects.Image[] = [];
  private bg!: Phaser.GameObjects.TileSprite;
  private fx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private crumbs!: Phaser.GameObjects.Particles.ParticleEmitter;
  private keys: Record<string, Phaser.Input.Keyboard.Key[]> = {};
  private cam = { x: 0, y: 0, snap: true };
  private band = { top: 0, bottom: 0, z: 1, touch: false };

  constructor() { super('Play'); }

  async create(data?: { level?: number; transition?: boolean }) {
    // the scene instance is reused on restart: nothing from the previous level may survive
    this.level = Phaser.Math.Clamp(data?.level ?? this.registry.get('level') ?? 1, 1, LEVELS.length);
    this.registry.set('level', this.level);
    this.deaths = 0; this.alive = false; this.started = false; this.finished = false; this.paused = false; this.acc = 0;
    this.walked = 0; this.jumped = false; this.face = 'n'; this.faceUntil = 0; this.blinkAt = 0; this.sq = { x: 1, y: 1 };
    this.touch = { l: false, r: false, j: false };
    this.auto = { l: false, r: false, j: false };
    this.dyn = undefined; this.trapImgs = []; this.darts = []; this.zones = []; this.springImgs = []; this.legs = [];
    this.cam = { x: 0, y: 0, snap: true };
    this.pal = paletteOf(this.level);
    this.L = parse(LEVELS[this.level - 1]);
    this.s = init(this.L);

    const pal = PALETTES[this.pal];
    this.cameras.main.setBackgroundColor(pal.wall);
    this.bg = this.add.tileSprite(0, 0, 10, 10, `wall${this.pal}`).setScrollFactor(0).setDepth(-10);
    this.buildStatic();
    this.buildTraps();
    this.buildHero();
    this.fx = this.add.particles(0, 0, 'dot', {
      speed: { min: 120, max: 420 }, lifespan: 650, scale: { start: 1.1, end: 0 }, gravityY: 900, emitting: false,
      tint: [0x6ee7bd, 0x4fd6a8, 0xb8f7e0, 0xffffff],
    }).setDepth(5);
    this.crumbs = this.add.particles(0, 0, 'crumb', {
      speed: { min: 60, max: 260 }, angle: { min: 200, max: 340 }, lifespan: 700, scale: { start: 0.9, end: 0.2 }, rotate: { min: 0, max: 360 },
      gravityY: 1400, emitting: false, tint: [pal.base, pal.light, pal.dark],
    }).setDepth(4);

    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.keys = {
      l: [K.LEFT, K.A].map((k) => kb.addKey(k)),
      r: [K.RIGHT, K.D].map((k) => kb.addKey(k)),
      j: [K.UP, K.W, K.SPACE, K.Z].map((k) => kb.addKey(k)),
    };

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      this.runId++;
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      this.scene.stop('Hud');
    });

    save.set('runs', save.get('runs') + 1);
    const run = ++this.runId;
    // Interstitial only at a natural break between levels, never on deaths, never on the first level of the
    // session and at most once every 3 finished levels (the portal adds its own frequency cap on top).
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

  /* ------------------------------------------------------------------ building the level */

  private ch(c: number, r: number) {
    if (c < 0 || c >= this.L.w) return '#';
    if (r < 0) return '#';
    if (r >= this.L.h) return '#';
    return this.L.rows[r][c];
  }

  private tileKey(c: number, r: number) {
    return `tile${SOLIDISH.includes(this.ch(c, r - 1)) ? '' : 't'}${this.pal}`;
  }

  /** Static blocks and spikes go into Blitters (one draw call each); the outside of the castle is plain jelly. */
  private buildStatic() {
    const L = this.L, pal = PALETTES[this.pal];
    const plain = this.add.blitter(0, 0, `tile${this.pal}`).setDepth(0);
    const top = this.add.blitter(0, 0, `tilet${this.pal}`).setDepth(0);
    const spikes = this.add.blitter(0, 0, 'spike').setDepth(0.2);
    for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++) {
      const ch = L.rows[r][c];
      if (ch === '#') (SOLIDISH.includes(this.ch(c, r - 1)) ? plain : top).create(c * T, r * T);
      if (ch === '^') spikes.create(c * T, r * T);
      if (ch === 'v') spikes.create(c * T, r * T).setFlipY(true);
    }
    const W = L.w * T, H = L.h * T, big = 3000;
    for (const [x, y, w, h] of [[-big, -big, big, H + 2 * big], [W, -big, big, H + 2 * big], [0, H, W, big], [0, -big, W, big]]) {
      this.add.rectangle(x, y, w, h, pal.dark).setOrigin(0, 0).setDepth(-1);
    }
    for (const sp of L.springs) this.springImgs.push(this.add.image(sp.c * T + T / 2, (sp.r + 1) * T, 'spring').setOrigin(0.5, 1).setDepth(0.3));
  }

  /** Traps and the door: rebuilt on every respawn so each life starts with every trick hidden again. */
  private buildTraps() {
    this.dyn?.destroy(true);
    this.dyn = this.add.container(0, 0).setDepth(1);
    const L = this.L;
    this.trapImgs = L.groups.map((g) => g.cells.map(([c, r]) => {
      if (g.kind === '!') {
        const im = this.add.image(c * T + T / 2, g.down ? r * T : (r + 1) * T, 'spike').setOrigin(0.5, 1).setScale(1, 0).setVisible(false);
        if (g.down) im.setOrigin(0.5, 0).setFlipY(true);
        this.dyn!.add(im);
        return im;
      }
      const im = this.add.image(c * T + T / 2, r * T + T / 2, this.tileKey(c, r));
      this.dyn!.add(im);
      return im;
    }));
    this.darts = L.flyers.map((f) => {
      const block = this.add.image(f.c * T + T / 2, f.r * T + T / 2, this.tileKey(f.c, f.r));
      const dart = this.add.image(0, f.r * T + T / 2, 'dart').setVisible(false).setFlipX(f.dir < 0);
      this.dyn!.add([block, dart]);
      return { block, dart, gone: false };
    });
    this.zones = [];
    for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++) {
      const z = L.zone[r * L.w + c];
      if (!z) continue;
      const img = this.add.image(c * T + T / 2, r * T + T / 2, 'zone').setAlpha(0).setAngle(z === 1 ? 0 : 180);
      this.dyn.add(img);
      this.zones.push({ c, img });
    }
    const d = L.doors[0];
    this.doorFace = this.add.image(0, -42, 'door-face').setVisible(false);
    this.legs = [this.add.image(-11, -2, 'leg').setVisible(false), this.add.image(11, -2, 'leg').setVisible(false)];
    const doorImg = this.add.image(0, -42, 'door');
    this.door = this.add.container(d.x, d.y, [...this.legs, doorImg, this.doorFace]).setDepth(0.5);
    this.dyn.add(this.door);
    if (d.flip) this.door.setScale(1, -1);
  }

  private buildHero() {
    this.heroBody = this.add.image(0, 6, 'hero').setOrigin(0.5, 1).setScale(HERO_SCALE);
    this.heroFace = this.add.image(0, 6, 'face-n').setOrigin(0.5, 1).setScale(HERO_SCALE);
    this.hero = this.add.container(this.s.x, this.s.y + P.HH, [this.heroBody, this.heroFace]).setDepth(2);
  }

  /* ------------------------------------------------------------------ camera and layout */

  /** Zoom so the castle height fits (desktop) or the hero is big enough (phones); portrait leaves room for the buttons. */
  layout() {
    const w = this.scale.width, h = this.scale.height, portrait = h > w;
    const touch = !!this.registry.get('touch');
    const u = Phaser.Math.Clamp(Math.min(w / 1100, h / 640), 0.6, 1.4);
    const worldH = this.L.h * T;
    const top = portrait ? 96 * u : 64 * u;
    const bottom = portrait && touch ? h - Math.min(280, h * 0.3) : h;
    let z = Math.min((bottom - top) / worldH, w / ((portrait ? 10 : 12) * T));
    if (!portrait && touch) z = Math.max(z, h / (9.5 * T));
    z = Phaser.Math.Clamp(z, 0.3, 3);
    this.band = { top, bottom, z, touch };
    const cam = this.cameras.main;
    cam.setSize(w, h).setZoom(z);
    this.bg.setPosition(w / 2, h / 2).setSize(w / z + 4, h / z + 4);
    this.cam.snap = true;
  }

  private updateCamera(dt: number) {
    const w = this.scale.width, h = this.scale.height, { top, bottom, z, touch } = this.band;
    const vw = w / z, vh = h / z, W = this.L.w * T, H = this.L.h * T;
    const mx = touch ? 3 * T : 0;
    let tx = this.s.x + this.s.face * T * 1.2;
    tx = W + 2 * mx <= vw ? W / 2 : Phaser.Math.Clamp(tx, vw / 2 - mx, W - vw / 2 + mx);
    const off = ((top + bottom) / 2 - h / 2) / z;     // the band centre is this far below the screen centre (world px)
    let ty: number;
    if (H <= (bottom - top) / z) ty = H / 2 - off;
    else ty = Phaser.Math.Clamp(this.s.y - off, vh / 2 - top / z, H + (touch ? 1.5 * T : 0) - vh / 2 + (h - bottom) / z);
    const k = this.cam.snap ? 1 : Math.min(1, dt * 0.008);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.cam.snap = false;
    const cam = this.cameras.main;
    cam.centerOn(this.cam.x, this.cam.y);
    this.bg.tilePositionX = cam.scrollX * 0.5;
    this.bg.tilePositionY = cam.scrollY * 0.5;
  }

  /* ------------------------------------------------------------------ loop */

  private input_(): Input {
    const k = this.keys, any = (a: Phaser.Input.Keyboard.Key[]) => a.some((x) => x.isDown);
    const t = this.touch, a = this.auto;
    return { l: any(k.l) || t.l || a.l, r: any(k.r) || t.r || a.r, j: any(k.j) || t.j || a.j };
  }

  update(_t: number, dtMs: number) {
    if (!this.s) return;
    if (this.alive && this.started && !this.paused) {
      const inp = this.input_();
      // real elapsed time (Phaser's delta is smoothed and capped), 120 Hz fixed steps, at most 30 per frame
      this.acc += Math.min(this.game.loop.rawDelta || dtMs, 250);
      const stepMs = P.DT * 1000;
      let n = 0;
      const x0 = this.s.x;
      while (this.acc >= stepMs && n < 30) {
        step(this.L, this.s, inp);
        this.handleEvents();
        this.acc -= stepMs; n++;
        if (this.s.dead || this.s.won) break;
      }
      if (n === 30) this.acc = 0;
      this.walked += Math.abs(this.s.x - x0);
      if (this.s.dead) this.onDeath();
      else if (this.s.won) this.complete();
    }
    this.draw(dtMs);
  }

  private handleEvents() {
    const s = this.s;
    for (const e of s.ev) {
      const [k, arg] = e.split(':');
      const i = arg !== undefined ? +arg.split(',')[0] : -1;
      switch (k) {
        case 'jump': audio.tone(520, 0.09, 'square', 0.06, 820); this.squash(0.78, 1.22); this.jumped = true; break;
        case 'land': audio.noise(0.06, 0.12, 500); this.squash(1.28, 0.74); break;
        case 'bonk': audio.tone(220, 0.08, 'square', 0.06, 160); break;
        case 'wobble': audio.tone(170, 0.22, 'sawtooth', 0.05, 110); this.scare(); break;
        case 'drop': audio.tone(320, 0.4, 'triangle', 0.12, 70); this.burst(this.L.groups[i].cells); this.scare(); break;
        case 'trap': audio.tone(140, 0.14, 'square', 0.07, 320); this.scare(); break;
        case 'thud': audio.noise(0.25, 0.4, 300); this.cameras.main.shake(140, 0.006); this.burst(this.L.groups[i].cells, this.s.grp[i].oy); break;
        case 'fake': audio.noise(0.18, 0.14, 2600); this.scare(); break;
        case 'pop': audio.tone(950, 0.08, 'square', 0.08, 1500); this.scare(); break;
        case 'dart': audio.noise(0.22, 0.14, 3200); this.scare(); break;
        case 'dartHit': audio.tone(420, 0.06, 'square', 0.05, 300); break;
        case 'door': this.giggle(); break;
        case 'flip': this.flipped(); break;
        case 'spring': {
          audio.tone(260, 0.3, 'sine', 0.16, 900);
          const im = this.springImgs[this.L.springs.findIndex((p) => p.c === i)];
          if (im) this.tweens.add({ targets: im, scaleY: { from: 0.5, to: 1 }, duration: 260, ease: 'Back.out' });
          this.squash(0.75, 1.3);
          break;
        }
      }
    }
    s.ev.length = 0;
  }

  private squash(x: number, y: number) { this.sq = { x, y }; }
  private setFace(f: Face, ms = 0) { this.face = f; this.faceUntil = ms ? this.time.now + ms : 0; }
  private scare() { if (this.alive) this.setFace('o', 700); }

  private burst(cells: [number, number][], oy = 0) {
    for (const [c, r] of cells) this.crumbs.explode(4, c * T + T / 2, r * T + T / 2 + oy);
  }

  private giggle() {
    audio.tone(700, 0.07, 'triangle', 0.1, 950);
    this.time.delayedCall(90, () => audio.tone(820, 0.07, 'triangle', 0.1, 1100));
    this.time.delayedCall(180, () => audio.tone(960, 0.1, 'triangle', 0.1, 1300));
    this.doorFace.setVisible(true);
    this.scare();
  }

  private flipped() {
    const up = this.s.g === -1;
    audio.tone(up ? 300 : 900, 0.3, 'sine', 0.12, up ? 900 : 300);
    // reveal the zone the hero just crossed
    const c = Math.floor(this.s.x / T);
    for (const z of this.zones) if (z.c === c) this.tweens.add({ targets: z.img, alpha: 0.9, duration: 150 });
    this.setFace('o', 600);
  }

  /* ------------------------------------------------------------------ drawing */

  private draw(dt: number) {
    const s = this.s, L = this.L, now = this.time.now;
    // hero
    const g = s.g;
    this.sq.x += (1 - this.sq.x) * Math.min(1, dt * 0.014);
    this.sq.y += (1 - this.sq.y) * Math.min(1, dt * 0.014);
    const run = s.grounded && Math.abs(s.vx) > 40 ? Math.sin(now / 55) * 0.05 : 0;
    if (this.alive) {
      this.hero.setPosition(s.x, s.y + P.HH * g).setScale(this.sq.x * s.face * (1 + run), this.sq.y * g * (1 - run));
      let f: Face = this.face;
      if (this.faceUntil && now > this.faceUntil) { this.face = 'n'; this.faceUntil = 0; f = 'n'; }
      if (!this.faceUntil) {
        f = s.grounded ? 'n' : 'j';
        if (now > this.blinkAt) { if (now > this.blinkAt + 120) this.blinkAt = now + 1800 + Math.random() * 2400; else f = 'b'; }
      }
      this.heroFace.setTexture(`face-${f}`);
    }

    // traps
    L.groups.forEach((gr, i) => {
      const st = s.grp[i], imgs = this.trapImgs[i];
      if (gr.kind === 'D' || gr.kind === 'F') {
        if (st.st === 1) imgs.forEach((im, k) => im.setX(gr.cells[k][0] * T + T / 2 + Math.sin(now / 18 + k) * 2.5));
        else if (st.st >= 2) imgs.forEach((im, k) => im.setPosition(gr.cells[k][0] * T + T / 2, gr.cells[k][1] * T + T / 2 + st.oy).setAngle(st.oy * (k % 2 ? 0.08 : -0.08)).setAlpha(Math.max(0, 1 - st.oy / 500)));
      } else if (gr.kind === 'C') {
        if (st.st === 1) imgs.forEach((im, k) => im.setX(gr.cells[k][0] * T + T / 2 + Math.sin(now / 15 + k) * 2));
        else if (st.st >= 2) imgs.forEach((im, k) => im.setPosition(gr.cells[k][0] * T + T / 2, gr.cells[k][1] * T + T / 2 + st.oy));
      } else if (gr.kind === 'X') {
        if (st.st >= 1 && imgs[0].alpha === 1) imgs.forEach((im) => this.tweens.add({ targets: im, alpha: 0.3, duration: 120 }));
      } else if (gr.kind === '!') {
        if (st.st >= 1) imgs.forEach((im) => im.setVisible(true).setScale(1, st.st === 2 ? 1 : Math.min(1, 1 - st.t / P.POP_TIME)));
      }
    });
    L.flyers.forEach((f, i) => {
      const fs = s.fly[i], d = this.darts[i];
      if (fs.st >= 1 && d.block.visible) d.block.setVisible(false);
      if (fs.st === 1) d.dart.setVisible(true).setX(fs.x);
      else if (fs.st === 2 && !d.gone) { d.gone = true; d.dart.setVisible(false); this.fx.explode(6, fs.x, f.r * T + T / 2); }
    });

    // door
    const dp = doorPos(L, s);
    this.door.setPosition(dp.x, dp.y).setScale(1, dp.flip ? -1 : 1);
    const legsOn = dp.moving;
    this.legs.forEach((l, k) => l.setVisible(legsOn).setAngle(legsOn ? Math.sin(now / 40 + k * Math.PI) * 30 : 0));
    if (!this.finished) this.door.setAngle(dp.moving ? Math.sin(now / 50) * 8 : 0);

    this.updateCamera(dt);
  }

  /* ------------------------------------------------------------------ death, respawn, door */

  private onDeath() {
    if (!this.alive) return;
    this.alive = false;
    this.deaths++;
    save.set('totalDeaths', save.get('totalDeaths') + 1);
    const s = this.s;
    this.heroFace.setTexture('face-x');
    this.fx.explode(22, s.x, s.y);
    this.tweens.add({ targets: this.hero, scaleX: 1.6 * s.face, scaleY: 0.25 * s.g, alpha: 0, duration: 220, ease: 'Quad.out' });
    this.cameras.main.shake(150, 0.007);
    audio.noise(0.22, 0.32, 700);
    audio.tone(420, 0.3, 'sawtooth', 0.09, 90);
    this.events.emit('deaths', this.deaths);
    this.later(480, () => this.respawn());
  }

  /** Back to the start of the level with every trap hidden again (instant, no game over). */
  private respawn() {
    if (this.finished) return;
    this.s = init(this.L);
    this.buildTraps();
    this.tweens.killTweensOf(this.hero);
    this.hero.setAlpha(1);
    this.sq = { x: 0.6, y: 1.4 };
    this.setFace('n');
    this.acc = 0;
    this.cam.snap = true;
    this.alive = true;
    audio.tone(600, 0.12, 'sine', 0.08, 900);
  }

  /** Real-time wait (not frames), cancelled if the scene restarts. */
  private later(ms: number, fn: () => void) {
    const run = this.runId;
    window.setTimeout(() => { if (run === this.runId) fn(); }, ms);
  }

  /** Reached the door: stars by deaths, progress saved, next level unlocked. */
  complete() {
    if (this.finished) return;
    this.finished = true;
    this.alive = false;
    portal.gameplayStop();
    const stars = starsFor(this.level, this.deaths);
    const newBest = saveResult(this.level, this.deaths, stars);
    Play.sinceAd++;
    if (stars === 3) portal.happyTime();
    this.setFace('h');
    this.heroFace.setTexture('face-h');
    this.tweens.add({ targets: this.hero, y: this.hero.y - 30 * this.s.g, duration: 180, yoyo: true, ease: 'Quad.out' });
    this.tweens.add({ targets: this.door, scaleX: 0.15, duration: 260, delay: 260, yoyo: true, hold: 200 });
    this.tweens.add({ targets: this.hero, alpha: 0, delay: 420, duration: 200 });
    audio.tone(523, 0.12, 'square', 0.09);
    this.time.delayedCall(120, () => audio.tone(659, 0.12, 'square', 0.09));
    this.time.delayedCall(240, () => audio.tone(784, 0.3, 'square', 0.09));
    const d = doorPos(this.L, this.s);
    this.add.particles(d.x, d.y - 50 * (d.flip ? -1 : 1), 'dot', {
      speed: { min: 200, max: 560 }, lifespan: 1300, gravityY: 800, scale: { start: 1.1, end: 0.3 },
      tint: [0xffd23f, 0x4fd6a8, 0x9b6bff, 0xff7eb6, 0xffffff], emitting: false,
    }).setDepth(5).explode(50);
    this.later(800, () => this.events.emit('complete', {
      level: this.level, deaths: this.deaths, stars, best: levelBest(this.level), newBest, last: this.level >= LEVELS.length,
    }));
  }

  /** Ends the run (the "give up" panel: replay, levels, or skip with a rewarded ad). Also used by scripts/sdk-test.mjs. */
  breakEgg() {
    if (this.finished) return;
    this.alive = false;
    this.finished = true;
    portal.gameplayStop();
    this.events.emit('over', { level: this.level, deaths: this.deaths, canSkip: portal.hasRewarded && this.level < LEVELS.length });
  }

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
}
