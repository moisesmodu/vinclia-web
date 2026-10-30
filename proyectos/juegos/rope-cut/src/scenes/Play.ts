import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import * as Sim from '../sim';
import { W, H, DT, P, init, step, cut, pop, puff, swipeHits, anchorOf, hookPos, spikeEnds, moverPos, starCount, type Level, type State } from '../sim';
import { LEVELS, SOLUTIONS } from '../levels';
import { save, saveResult, levelStars, THEMES, themeOf } from '../state';
import { coinsFor, candyTint, hatKey, MON } from '../cosmeticos';

type Face = 'idle' | 'open' | 'chew' | 'sad' | 'blink';

/**
 * One level. The simulation (sim.ts) runs at a fixed 120 Hz on real elapsed time (rawDelta), so it plays the same at
 * 30 or 144 FPS; this scene draws it inside a world container scaled to the screen. Swipe = cut, tap a bubble = pop,
 * tap a puffer = blow. Losing the candy never ends anything: the level resets in under a second (instant retry).
 * Public names used by the tests: SIM, level, s, fails, alive, started, finished, breakEgg(), complete(), skip(),
 * act(), swipe().
 */
export class Play extends Phaser.Scene {
  /** Simulation, levels and the designer's solutions, for rope-cut/test-niveles.mjs. */
  static SIM = { ...Sim, LEVELS, SOLUTIONS };
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
  /** Coins earned in this level and whether the ×2 rewarded ad was used. */
  coinsRun = 0;
  doubled = false;
  /** For the tutorial: a rope has been cut. */
  cutOnce = false;
  /** Scripted actions [sim seconds, action] played at exact simulation times (tests, screenshots, autopilot). */
  auto: [number, string][] = [];

  private acc = 0;
  private runId = 0;
  private theme = 0;
  private world!: Phaser.GameObjects.Container;
  private board!: Phaser.GameObjects.Image;
  private bg!: Phaser.GameObjects.TileSprite;
  private candy!: Phaser.GameObjects.Image;
  private monster!: Phaser.GameObjects.Image;
  private hat?: Phaser.GameObjects.Image;
  private face: Face = 'idle';
  private faceUntil = 0;
  private blinkAt = 0;
  private segs: Phaser.GameObjects.Image[] = [];
  private pegs: Phaser.GameObjects.Image[] = [];
  private hookImgs: { peg: Phaser.GameObjects.Image; ring: Phaser.GameObjects.Image }[] = [];
  private bubbleImgs: Phaser.GameObjects.Image[] = [];
  private starImgs: Phaser.GameObjects.Image[] = [];
  private pufferImgs: Phaser.GameObjects.Image[] = [];
  private spikeImgs: { bar: Phaser.GameObjects.TileSprite; caps: Phaser.GameObjects.Image[] }[] = [];
  private windImgs: Phaser.GameObjects.TileSprite[] = [];
  private fx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private puffFx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkle!: Phaser.GameObjects.Particles.ParticleEmitter;
  private puffFxs: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private swipeFrom: { x: number; y: number } | null = null;
  private view = { x: 0, y: 0, k: 1 };

  constructor() { super('Play'); }

  async create(data?: { level?: number; transition?: boolean }) {
    // the scene instance is reused on restart: nothing from the previous level may survive
    this.level = Phaser.Math.Clamp(data?.level ?? this.registry.get('level') ?? 1, 1, LEVELS.length);
    this.registry.set('level', this.level);
    this.fails = 0; this.alive = false; this.started = false; this.finished = false; this.paused = false; this.acc = 0;
    this.coinsRun = 0; this.doubled = false; this.cutOnce = false; this.auto = []; this.face = 'idle'; this.faceUntil = 0; this.blinkAt = 0;
    this.segs = []; this.pegs = []; this.hookImgs = []; this.bubbleImgs = []; this.starImgs = []; this.pufferImgs = [];
    this.spikeImgs = []; this.windImgs = []; this.swipeFrom = null; this.hat = undefined;
    this.theme = themeOf(this.level);
    this.L = LEVELS[this.level - 1];

    const th = THEMES[this.theme];
    this.cameras.main.setBackgroundColor(th.base);
    this.bg = this.add.tileSprite(0, 0, 10, 10, `bg${this.theme}`).setOrigin(0, 0).setScrollFactor(0);
    this.world = this.add.container(0, 0);
    this.board = this.add.image(W / 2, H / 2, `board${this.theme}`);
    this.world.add(this.board);
    this.buildLevel();

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.input.keyboard?.on('keydown-R', () => this.restart());

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

  /* ------------------------------------------------------------------ building the level (also on every retry) */

  private buildLevel() {
    // everything but the board is rebuilt from scratch
    const old = this.world.list.filter((o) => o !== this.board);
    this.tweens.killTweensOf(old);
    this.world.remove(old, true);
    this.segs = []; this.pegs = []; this.hookImgs = []; this.bubbleImgs = []; this.starImgs = []; this.pufferImgs = [];
    this.spikeImgs = []; this.windImgs = [];
    const L = this.L, add = <T extends Phaser.GameObjects.GameObject>(o: T) => { this.world.add(o); return o; };
    this.s = init(L, true);

    for (const w of L.winds || []) {
      const vert = Math.abs(w.fy) > Math.abs(w.fx);
      const ts = add(this.add.tileSprite(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h, vert ? 'windv' : 'wind'));
      ts.setFlip(!vert && w.fx < 0, vert && w.fy > 0).setTint(0x3f9ae0).setAlpha(0.9);
      this.windImgs.push(ts);
      const z = add(this.add.rectangle(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h, 0x9fd6ff, 0.28));
      z.setStrokeStyle(3, 0x6fbfff, 0.5);
      this.world.sendToBack(z); this.world.sendToBack(this.board);
    }
    // the monster sits on its crate
    const [mx, my] = L.monster;
    add(this.add.image(mx, my + (MON.h - MON.my) - 6, 'crate').setOrigin(0.5, 0));
    this.monster = add(this.add.image(mx, my, 'mon-idle').setOrigin(MON.mx / MON.w, MON.my / MON.h));
    const hk = hatKey();
    if (hk) this.hat = add(this.add.image(mx, my - MON.my + 40, hk).setOrigin(0.5, 74 / 80));
    this.tweens.add({ targets: [this.monster], scaleY: 0.96, scaleX: 1.03, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    for (const sp of L.spikes || []) {
      const bar = add(this.add.tileSprite(0, 0, 32, 48, 'spike'));
      const caps = [add(this.add.image(0, 0, 'spikecap')), add(this.add.image(0, 0, 'spikecap'))];
      this.spikeImgs.push({ bar, caps });
      void sp;
    }
    L.stars.forEach(([x, y]) => {
      const st = add(this.add.image(x, y, 'ic-star').setDisplaySize(64, 64));
      this.tweens.add({ targets: st, angle: { from: -8, to: 8 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.starImgs.push(st);
    });
    (L.hooks || []).forEach((h) => {
      const r = h.r ?? P.HOOK_R;
      const ring = add(this.add.image(h.p[0], h.p[1], 'ring').setDisplaySize(r * 2, r * 2));
      const peg = add(this.add.image(h.p[0], h.p[1], 'hookpeg'));
      this.hookImgs.push({ peg, ring });
    });
    (L.bubbles || []).forEach(([x, y]) => this.bubbleImgs.push(add(this.add.image(x, y, 'bubble').setDisplaySize(96, 96))));
    this.puffFxs = [];
    (L.puffers || []).forEach((pf) => {
      this.pufferImgs.push(add(this.add.image(pf.p[0], pf.p[1], 'puffer').setOrigin(40 / 96, 0.5).setAngle(pf.dir)));
      this.puffFxs.push(add(this.add.particles(0, 0, 'puff', {
        speed: { min: 200, max: 380 }, angle: { min: pf.dir - 18, max: pf.dir + 18 }, lifespan: 420,
        scale: { start: 0.45, end: 1.2 }, alpha: { start: 0.85, end: 0 }, emitting: false,
      })));
    });
    // ropes on top of the props, anchors on top of the ropes, then the candy
    this.segLayer = add(this.add.container(0, 0));
    L.ropes.forEach((r) => this.pegs.push(add(this.add.image(r.a[0], r.a[1], 'peg'))));
    this.candy = add(this.add.image(this.s.x, this.s.y, 'candy').setDisplaySize(56, 56));
    // bubbles carrying the candy are drawn over it
    this.bubbleImgs.forEach((b) => this.world.bringToTop(b));
    this.fx = add(this.add.particles(0, 0, 'crumb', {
      speed: { min: 120, max: 420 }, lifespan: 700, scale: { start: 0.9, end: 0 }, rotate: { min: 0, max: 360 }, gravityY: 900, emitting: false,
      tint: candyTint(),
    }));
    this.sparkle = add(this.add.particles(0, 0, 'dot', {
      speed: { min: 80, max: 260 }, lifespan: 450, scale: { start: 0.9, end: 0 }, emitting: false, tint: [0xffd23f, 0xfff3b0, 0xffffff],
    }));
    this.puffFx = add(this.add.particles(0, 0, 'puff', {
      speed: { min: 160, max: 320 }, lifespan: 420, scale: { start: 0.5, end: 1.1 }, alpha: { start: 0.8, end: 0 }, emitting: false,
    }));
    this.trail = add(this.add.particles(0, 0, 'trail', {
      lifespan: 220, scale: { start: 0.9, end: 0.1 }, alpha: { start: 0.9, end: 0 }, emitting: false, tint: 0xffffff,
    }));
    this.draw();
  }
  private segLayer!: Phaser.GameObjects.Container;

  /** The level fills the screen, keeping its proportions (720 × 800 plus a margin); room for the HUD on top. */
  layout() {
    const w = this.scale.width, h = this.scale.height;
    this.bg.setSize(w, h);
    const ui = Phaser.Math.Clamp(Math.min(w / 1100, h / 640), 0.6, 1.4);
    let top = 0;
    const k0 = Math.min(w / (W + 60), h / (H + 60));
    // when there is no room for the HUD beside the level, leave a band on top
    if ((w - W * k0) / 2 < 230 * ui) top = 76 * ui;
    const k = Math.min(w / (W + 44), (h - top) / (H + 50));
    this.view = { k, x: w / 2 - (W * k) / 2, y: top + (h - top) / 2 - (H * k) / 2 };
    this.world.setScale(k).setPosition(this.view.x, this.view.y);
  }

  /* ------------------------------------------------------------------ input: swipe, tap */

  private toWorld(p: Phaser.Input.Pointer) { return { x: (p.x - this.view.x) / this.view.k, y: (p.y - this.view.y) / this.view.k }; }

  private onDown(p: Phaser.Input.Pointer) {
    if (!this.alive || this.paused) return;
    const q = this.toWorld(p);
    // tap a puffer: blow
    const L = this.L;
    for (let j = 0; j < (L.puffers || []).length; j++) {
      const pf = L.puffers![j];
      if (Math.hypot(q.x - pf.p[0], q.y - pf.p[1]) < 62) { this.act(`f${j}`); this.swipeFrom = null; return; }
    }
    // tap the bubble carrying the candy: pop
    if (this.s.bubble >= 0 && Math.hypot(q.x - this.s.x, q.y - this.s.y) < 80) { this.act('p'); this.swipeFrom = null; return; }
    this.swipeFrom = q;
    this.trail.emitParticleAt(q.x, q.y, 1);
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (!p.isDown || !this.swipeFrom || !this.alive) return;
    const q = this.toWorld(p);
    this.swipe(this.swipeFrom.x, this.swipeFrom.y, q.x, q.y);
    // trail: a few dots along the segment
    const d = Math.hypot(q.x - this.swipeFrom.x, q.y - this.swipeFrom.y), n = Math.min(6, Math.ceil(d / 18));
    for (let i = 1; i <= n; i++) this.trail.emitParticleAt(this.swipeFrom.x + ((q.x - this.swipeFrom.x) * i) / n, this.swipeFrom.y + ((q.y - this.swipeFrom.y) * i) / n, 1);
    this.swipeFrom = q;
  }

  private onUp() { this.swipeFrom = null; }

  /** Cuts every rope the segment (world coordinates) crosses. Used by the input and by the tests. */
  swipe(x0: number, y0: number, x1: number, y1: number) {
    if (!this.alive) return 0;
    let n = 0;
    for (const [i, k] of swipeHits(this.s, x0, y0, x1, y1)) if (cut(this.s, i, k)) n++;
    if (n) this.cutOnce = true;
    this.handleEvents();
    return n;
  }

  /** A scripted action: c<i> cut rope i, p pop, f<j> blow puffer j (tests and the tutorial). */
  act(a: string) {
    if (!this.alive) return;
    if (a[0] === 'c') { if (cut(this.s, +a.slice(1))) this.cutOnce = true; }
    else if (a === 'p') pop(this.s);
    else if (a[0] === 'f') puff(this.L, this.s, +a.slice(1));
    this.handleEvents();
  }

  /* ------------------------------------------------------------------ loop */

  update() {
    if (!this.started || this.paused) return;
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
    for (const w of this.windImgs) {
      const i = this.windImgs.indexOf(w), z = this.L.winds![i];
      if (Math.abs(z.fy) > Math.abs(z.fx)) w.tilePositionY -= (z.fy / 1700) * 9 * dt * 60;
      else w.tilePositionX -= (z.fx / 1700) * 9 * dt * 60;
    }
    this.draw();
  }

  private handleEvents() {
    const s = this.s;
    for (const e of s.ev) {
      if (e === 'cut') { audio.noise(0.12, 0.25, 3200); audio.tone(900, 0.08, 'triangle', 0.06, 500); }
      else if (e.startsWith('star')) this.takeStar(+e.slice(4));
      else if (e === 'bubble') { audio.tone(520, 0.25, 'sine', 0.12, 880); }
      else if (e === 'pop') { audio.tone(1200, 0.06, 'square', 0.08, 1800); audio.noise(0.08, 0.2, 2400); this.burstBubble(); }
      else if (e.startsWith('puff')) this.puffed(+e.slice(4));
      else if (e === 'hook') { audio.tone(330, 0.18, 'triangle', 0.12, 660); }
      else if (e === 'eat') this.complete();
      else if (e === 'spike' || e === 'out') this.lose();
    }
    s.ev.length = 0;
  }

  private takeStar(i: number) {
    const st = this.starImgs[i];
    audio.tone(880 + starCount(this.s) * 220, 0.16, 'triangle', 0.14, 1500 + starCount(this.s) * 200);
    if (st) {
      this.tweens.killTweensOf(st);
      this.tweens.add({ targets: st, scale: st.scale * 1.8, alpha: 0, angle: 180, duration: 320, ease: 'Quad.out', onComplete: () => st.setVisible(false) });
      this.sparkle.explode(10, st.x, st.y);
    }
    this.events.emit('stars', starCount(this.s));
  }

  private burstBubble() {
    const i = this.s.bubbles.findIndex((b, k) => b === 2 && this.bubbleImgs[k].visible);
    const b = this.bubbleImgs[i];
    if (!b) return;
    this.puffFx.explode(8, b.x, b.y);
    this.tweens.add({ targets: b, scale: b.scale * 1.4, alpha: 0, duration: 140, onComplete: () => b.setVisible(false) });
  }

  private puffed(j: number) {
    const pf = this.L.puffers![j], im = this.pufferImgs[j];
    audio.noise(0.25, 0.3, 900);
    audio.tone(300, 0.15, 'sine', 0.08, 180);
    const a = (pf.dir * Math.PI) / 180;
    this.puffFxs[j]?.explode(7, pf.p[0] + Math.cos(a) * 50, pf.p[1] + Math.sin(a) * 50);
    this.tweens.add({ targets: im, scaleX: 0.75, scaleY: 1.2, duration: 80, yoyo: true });
  }

  /* ------------------------------------------------------------------ drawing */

  private draw() {
    const s = this.s, L = this.L, now = this.time.now;
    // candy (rolls with its horizontal speed)
    if (!s.dead) {
      this.candy.setPosition(s.x, s.y);
      this.candy.rotation += (s.x - s.px) * 0.02;
    }
    // ropes: one stretched image per chain link (no live Graphics)
    let k = 0;
    for (const r of s.ropes) {
      for (let i = 0; i < r.n; i++) {
        if (i === r.cutAt) continue;
        const x0 = r.x[i], y0 = r.y[i], x1 = r.x[i + 1], y1 = r.y[i + 1];
        let im = this.segs[k];
        if (!im) { im = this.add.image(0, 0, 'rope').setOrigin(0, 0.5); this.segLayer.add(im); this.segs.push(im); }
        const d = Math.hypot(x1 - x0, y1 - y0);
        im.setVisible(true).setPosition(x0, y0).setRotation(Math.atan2(y1 - y0, x1 - x0)).setDisplaySize(d + 3, 11);
        k++;
      }
    }
    for (; k < this.segs.length; k++) this.segs[k].setVisible(false);
    // moving anchors, pegs, spikes, bubbles
    L.ropes.forEach((r, i) => { if (r.move) { const p = moverPos(r.a, r.move, s.t); this.pegs[i].setPosition(p[0], p[1]); } });
    (L.hooks || []).forEach((h, i) => {
      const p = hookPos(L, i, s.t), im = this.hookImgs[i];
      im.peg.setPosition(p[0], p[1]);
      im.ring.setPosition(p[0], p[1]).setVisible(!s.hooks[i]);
    });
    (L.spikes || []).forEach((_, i) => {
      const [a, b] = spikeEnds(L, i, s.t), im = this.spikeImgs[i];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      im.bar.setPosition((a[0] + b[0]) / 2, (a[1] + b[1]) / 2).setSize(len, 48).setRotation(Math.atan2(b[1] - a[1], b[0] - a[0]));
      im.caps[0].setPosition(a[0], a[1]); im.caps[1].setPosition(b[0], b[1]);
    });
    (L.bubbles || []).forEach(([x, y], i) => {
      const im = this.bubbleImgs[i], st = s.bubbles[i];
      if (st === 0) im.setPosition(x, y + Math.sin(now / 400 + i) * 5);
      else if (st === 1) im.setPosition(s.x, s.y);
    });
    // monster: opens wide when the candy comes close, blinks now and then
    const [mx, my] = L.monster;
    let f: Face = this.face;
    if (this.faceUntil && now > this.faceUntil) { this.face = 'idle'; this.faceUntil = 0; }
    if (!this.faceUntil && !this.finished) {
      const d = Math.hypot(s.x - mx, s.y - my);
      f = this.alive && !s.dead && d < 190 ? 'open' : 'idle';
      if (f === 'idle' && now > this.blinkAt) { if (now > this.blinkAt + 130) this.blinkAt = now + 1800 + Math.random() * 2600; else f = 'blink'; }
    } else f = this.face;
    this.monster.setTexture(`mon-${f}`);
    if (this.hat) this.hat.setPosition(mx, my - MON.my + 40 + (this.monster.scaleY - 1) * 60);
  }

  private setFace(f: Face, ms = 0) { this.face = f; this.faceUntil = ms ? this.time.now + ms : 0; }

  /* ------------------------------------------------------------------ win, lose, retry */

  /** The candy is lost (spikes, fell out, or breakEgg()): instant retry of the same level, no ad. */
  private lose() {
    if (!this.alive || this.finished) return;
    this.alive = false;
    this.fails++;
    save.set('fails', save.get('fails') + 1);
    const s = this.s;
    if (s.dead === 'spike' || !s.dead) {
      this.fx.explode(22, s.x, s.y);
      this.candy.setVisible(false);
      audio.noise(0.25, 0.35, 700);
    } else audio.tone(500, 0.4, 'sine', 0.08, 140);
    audio.tone(420, 0.3, 'sawtooth', 0.06, 110);
    this.setFace('sad', 900);
    this.cameras.main.shake(140, 0.005);
    this.events.emit('fails', this.fails);
    this.later(900, () => this.retry());
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

  /** The monster ate the candy: stars saved, next level unlocked, coins paid. */
  complete() {
    if (this.finished) return;
    this.finished = true;
    this.alive = false;
    portal.gameplayStop();
    const stars = starCount(this.s);
    const before = levelStars(this.level);
    saveResult(this.level, stars);
    this.coinsRun = coinsFor(stars);
    save.set('coins', save.get('coins') + this.coinsRun);
    Play.sinceAd++;
    if (stars === 3) portal.happyTime();
    this.candy.setVisible(false);
    for (const r of this.s.ropes) r.pinEnd = false;
    this.setFace('chew');
    this.tweens.add({ targets: this.monster, scaleX: 1.2, scaleY: 0.85, duration: 120, yoyo: true, repeat: 2 });
    audio.tone(300, 0.08, 'square', 0.08, 200);
    window.setTimeout(() => audio.tone(300, 0.08, 'square', 0.08, 200), 160);
    window.setTimeout(() => { audio.tone(523, 0.12, 'square', 0.08); audio.tone(659, 0.12, 'square', 0.06); }, 360);
    window.setTimeout(() => audio.tone(784, 0.3, 'square', 0.08), 480);
    const [mx, my] = this.L.monster;
    this.add.particles(0, 0, 'dot', {
      speed: { min: 200, max: 520 }, lifespan: 1200, gravityY: 800, scale: { start: 1.1, end: 0.3 },
      tint: [0xffd23f, 0x3ddc84, 0x9b6bff, 0xff7eb6, 0xffffff], emitting: false,
    }).setPosition(this.view.x + mx * this.view.k, this.view.y + (my - 40) * this.view.k).explode(46);
    this.later(1000, () => {
      this.setFace('idle');
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

  /** Breaks the candy (as if it hit spikes): fail + instant retry. Used by the SDK test. */
  breakEgg() {
    if (!this.alive) return;
    this.s.dead = 'spike';
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
  autoplay(script: [number, string][] = SOLUTIONS[this.level - 1]) {
    if (this.finished) return;
    this.buildLevel();
    this.acc = 0;
    this.alive = true;
    this.events.emit('stars', 0);
    this.auto = script.map((e) => [e[0], e[1]] as [number, string]);
  }

  /** Anchor of rope i right now (tutorial hand). */
  ropeMid(i = 0) {
    const r = this.s.ropes[i];
    if (!r) return null;
    const a = anchorOf(this.L, r, this.s.t);
    return { x: this.view.x + ((a[0] + this.s.x) / 2) * this.view.k, y: this.view.y + ((a[1] + this.s.y) / 2) * this.view.k };
  }
}
