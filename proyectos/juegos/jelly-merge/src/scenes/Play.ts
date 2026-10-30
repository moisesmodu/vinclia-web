import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { uiScale } from '@comun/pantallas';
import { save } from '../state';
import { palette, jellyKey, type Mood } from '../cosmeticos';
import { RIM } from './Boot';
import {
  JAR_W, JAR_H, WALL, LINE_Y, OVER_S, WARN, HOLD_Y, VIEW_W, VIEW_TOP, VIEW_BOTTOM, STEP_MS, COOLDOWN, FRESH, TEX,
  RADII, TIERS, POINTS, CLOUD_PTS, SPAWN, SPAWN_LATE, LATE_S, COIN_PTS, CLOUD_COINS,
} from '../config';

/** One jelly in the jar: a Matter circle plus one image; a/v is the spring of its squash (visual only). */
type Jelly = {
  tier: number; body: MatterJS.BodyType; img: Phaser.GameObjects.Image; r: number;
  a: number; v: number; age: number; dead: boolean; mood: Mood; blink: number;
};
type Pair = { bodyA: MatterJS.BodyType; bodyB: MatterJS.BodyType; collision: { normal: { x: number; y: number } } };

const PENTA = [0, 2, 4, 7, 9];
const K = 230, C = 14;            // jelly squash spring: stiffness, damping
const SPRING_DT = 1 / 120;        // spring sub-step (s)

/**
 * Jelly Merge: move the finger or the mouse to aim, release to drop the jelly. Two jellies of the same size that
 * touch merge into the next size; two of the biggest become a cloud that floats away for bonus points. A jelly
 * above the top line for 2 s ends the run.
 *
 * Physics: Matter circles stepped at a fixed 60 Hz by an accumulator on real time (game.loop.rawDelta); all the
 * game rules (cool-down, line timer, autopilot) run inside the fixed step, so they play the same at any FPS.
 * Each jelly is ONE image whose face is baked into the texture; the soft wobble is a damped spring on its scale.
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  /** Runs finished since the last interstitial (at most one every 3 runs). */
  static sinceAd = 0;
  alive = false;
  paused = false;
  started = false;
  score = 0;
  coinsRun = 0;
  private coinsSaved = 0;
  clouds = 0;
  drops = 0;
  revived = false;
  doubled = false;
  /** Biggest tier made in this run (the HUD lights the ladder up to it). */
  topTier = 0;
  /** Seconds the stack has been over the line (0 = safe). */
  dangerT = 0;
  warn = false;
  /** Simulated seconds of this run (what a player lives through, also under turbo). */
  simT = 0;
  heldTier = 0;
  nextTier = 0;
  jellies: Jelly[] = [];
  /** Autopilot (tests): drops at a human pace in simulated time. turbo = simulation speed-up. */
  auto = false;
  turbo = 1;
  autoPace = 1.25;
  /** Autopilot: share of drops aimed at a random spot (0 = always the best spot it finds). */
  autoSloppy = 0;
  endReason = '';
  /** Perf test only: the line never ends the run (the jar stays full). */
  immortal = false;
  private autoWait = 0;
  private byBody = new Map<number, Jelly>();
  private mergeQ: [Jelly, Jelly][] = [];
  private cooldown = 0;
  private chain = 0;
  private chainT = 0;
  private acc = 0;
  private aimX = 0;
  private targetX = 0;
  private runId = 0;
  private counted = false;
  private bumpAt = 0;
  private tickAt = 0;
  private held!: Phaser.GameObjects.Image;
  private holder!: Phaser.GameObjects.Image;
  private aimLine!: Phaser.GameObjects.TileSprite;
  private line!: Phaser.GameObjects.Image;
  private drops3!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private heldPop = 1;
  private view = { z: 1, cy: 0 };

  constructor() { super('Play'); }

  async create() {
    // the scene instance is reused on restart: nothing from the previous run may survive
    this.alive = false; this.paused = false; this.started = false; this.score = 0; this.coinsRun = 0; this.coinsSaved = 0;
    this.clouds = 0; this.drops = 0; this.revived = false; this.doubled = false; this.topTier = 0; this.dangerT = 0; this.warn = false;
    this.simT = 0; this.jellies = []; this.byBody = new Map(); this.mergeQ = []; this.cooldown = 0; this.chain = 0; this.chainT = 0;
    this.acc = 0; this.aimX = 0; this.targetX = 0; this.counted = false; this.immortal = false; this.bumpAt = 0; this.tickAt = 0; this.auto = false;
    this.turbo = 1; this.autoWait = 0; this.endReason = ''; this.heldPop = 1;
    this.runId++;

    this.makeJar();
    this.held = this.add.image(0, HOLD_Y, jellyKey(0)).setDepth(7);
    this.holder = this.add.image(0, HOLD_Y - 70, 'holder').setDepth(8);
    this.drops3 = this.add.particles(0, 0, 'drop', {
      speed: { min: 160, max: 460 }, lifespan: 520, scale: { start: 0.7, end: 0 }, gravityY: 900, emitting: false,
    }).setDepth(9);
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 120, max: 420 }, lifespan: 700, scale: { start: 0.8, end: 0 }, rotate: { min: 0, max: 180 },
      tint: [0xffffff, 0xfff3a0, 0xffd23f], emitting: false,
    }).setDepth(9);

    this.matter.world.on('collisionstart', this.onStart, this);
    const kb = this.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys('LEFT,RIGHT,A,D') as Record<string, Phaser.Input.Keyboard.Key>;
      kb.on('keydown-SPACE', this.drop, this);
      kb.on('keydown-DOWN', this.drop, this);
      kb.on('keydown-S', this.drop, this);
    }

    this.heldTier = this.roll();
    this.nextTier = this.roll();
    this.showHeld();

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.scene.launch('Sky');
    this.scene.sendToBack('Sky');
    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      this.runId++;
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      // (the Matter world and its listeners are torn down by the physics plugin itself)
      kb?.off('keydown-SPACE', this.drop, this); kb?.off('keydown-DOWN', this.drop, this); kb?.off('keydown-S', this.drop, this);
      this.jellies = []; this.byBody.clear();
      this.scene.stop('Hud');
      this.scene.stop('Sky');
    });

    save.set('runs', save.get('runs') + 1);
    // Interstitial only at the natural break of a new run: never the first of the session, at most every 3 runs.
    const run = this.runId;
    if (!Play.firstRun && Play.sinceAd >= 3) {
      this.paused = true;
      await portal.commercialBreak();
      Play.sinceAd = 0;
      if (run !== this.runId) return;
      this.paused = false;
    }
    Play.firstRun = false;
    this.started = true;
    this.alive = true;
    portal.gameplayStart();
    this.events.emit('next', this.nextTier);
  }

  /* ------------------------------------------------------------------ world */

  private makeJar() {
    const ox = -JAR_W / 2 - WALL, oy = -JAR_H - RIM;
    this.add.image(ox, oy, 'jar-back').setOrigin(0).setDepth(1);
    this.add.image(ox, oy, 'jar-front').setOrigin(0).setDepth(5);
    this.line = this.add.image(0, LINE_Y, 'line').setDepth(4).setAlpha(0.55);
    this.aimLine = this.add.tileSprite(0, HOLD_Y, 12, 100, 'aim').setOrigin(0.5, 0).setDepth(2).setAlpha(0.5);
    // static walls (tall, so nothing ever leaves the jar) and the floor
    const opts = { isStatic: true, friction: 0.25, restitution: 0.1, label: 'wall' };
    const tall = JAR_H + 900;
    this.matter.add.rectangle(-JAR_W / 2 - WALL / 2, -tall / 2 + WALL, WALL, tall, opts);
    this.matter.add.rectangle(JAR_W / 2 + WALL / 2, -tall / 2 + WALL, WALL, tall, opts);
    this.matter.add.rectangle(0, WALL / 2, JAR_W + 2 * WALL, WALL, opts);
  }

  /** Fits the jar, the drop zone and the waiting jelly to the screen, below the HUD band in portrait. */
  private layout() {
    const cam = this.cameras.main, w = this.scale.width, h = this.scale.height, s = uiScale(this), portrait = h > w * 1.05;
    const top = portrait ? 118 * s : 12, bottom = h - (portrait ? 70 * s : 10);
    const z = Math.min((w - 16) / VIEW_W, (bottom - top) / (VIEW_BOTTOM - VIEW_TOP));
    const mid = (VIEW_TOP + VIEW_BOTTOM) / 2;
    const cy = mid - ((top + bottom) / 2 - h / 2) / z;
    cam.setSize(w, h).setZoom(z).centerOn(0, cy);
    this.view = { z, cy };
  }

  /** World → screen (the HUD places the next bubble and the ladder beside the jar). */
  toScreen(x: number, y: number) {
    return { x: (x) * this.view.z + this.scale.width / 2, y: (y - this.view.cy) * this.view.z + this.scale.height / 2 };
  }
  /** Screen x → world x. */
  toWorldX(sx: number) { return (sx - this.scale.width / 2) / this.view.z; }
  get zoom() { return this.view.z; }

  private roll() {
    // the first drops are small, then tiers 0..4 by weight (0..5 after LATE_S seconds)
    const w = this.simT > LATE_S ? SPAWN_LATE : SPAWN;
    const n = this.drops < 4 ? 3 : w.length;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += w[i];
    let r = Math.random() * sum;
    for (let i = 0; i < n; i++) { r -= w[i]; if (r < 0) return i; }
    return 0;
  }

  private showHeld() {
    this.held.setTexture(jellyKey(this.heldTier));
    this.heldPop = 0;
    this.clampAim();
  }

  private clampAim() {
    const lim = JAR_W / 2 - RADII[this.heldTier] - 1;
    this.targetX = Phaser.Math.Clamp(this.targetX, -lim, lim);
  }

  /* ------------------------------------------------------------------ the one input */

  /** Aim at a screen x (pointer). */
  aimScreen(sx: number) { this.aimAt(this.toWorldX(sx)); }
  aimAt(x: number) { this.targetX = x; this.clampAim(); }

  drop() {
    if (!this.alive || this.paused || this.cooldown > 0) return;
    const t = this.heldTier, r = RADII[t];
    const x = Phaser.Math.Clamp(this.aimX, -JAR_W / 2 + r + 1, JAR_W / 2 - r - 1);
    const j = this.addJelly(t, x, HOLD_Y, 0, 2);
    j.a = -0.12; j.v = 0;
    this.drops++;
    this.heldTier = this.nextTier;
    this.nextTier = this.roll();
    this.cooldown = COOLDOWN;
    this.held.setVisible(false);
    this.events.emit('dropped');
    this.events.emit('next', this.nextTier);
    audio.tone(520 - t * 30, 0.1, 'sine', 0.1, 300 - t * 20);
  }

  private addJelly(tier: number, x: number, y: number, vx = 0, vy = 0) {
    const r = RADII[tier];
    const body = this.matter.add.circle(x, y, r, {
      restitution: 0.12, friction: 0.2, frictionStatic: 0.4, frictionAir: 0.014, density: 0.0012, slop: 0.04, label: 'jelly',
    }) as MatterJS.BodyType;
    const M = (Phaser.Physics.Matter as any).Matter;
    M.Body.setVelocity(body, { x: vx, y: vy });
    const img = this.add.image(x, y, jellyKey(tier)).setScale(1 / TEX).setDepth(3);
    const j: Jelly = { tier, body, img, r, a: 0, v: 0, age: 0, dead: false, mood: 'n', blink: 1 + Math.random() * 4 };
    this.jellies.push(j);
    this.byBody.set(body.id, j);
    if (tier > this.topTier) { this.topTier = tier; this.events.emit('tier', tier); }
    return j;
  }

  private removeJelly(j: Jelly) {
    j.dead = true;
    this.matter.world.remove(j.body);
    this.byBody.delete(j.body.id);
    j.img.destroy();
  }

  /* ------------------------------------------------------------------ contacts */

  private jellyOf(b: MatterJS.BodyType) { return this.byBody.get((b.parent ?? b).id); }

  private onStart(ev: { pairs: Pair[] }) {
    for (const p of ev.pairs) {
      const a = this.jellyOf(p.bodyA), b = this.jellyOf(p.bodyB);
      if (!a && !b) continue;
      // squash on impact, by the speed along the contact normal
      const va = p.bodyA.velocity, vb = p.bodyB.velocity, n = p.collision.normal;
      const sp = Math.abs((va.x - vb.x) * n.x + (va.y - vb.y) * n.y);
      if (sp > 0.8) {
        const k = Math.min(0.3, sp * 0.035);
        // (a kick never adds up past a firm squash, also when many contacts start in one frame)
        if (a) a.v = Math.min(a.v + k * 14 * (40 / a.r) ** 0.3, 4);
        if (b) b.v = Math.min(b.v + k * 14 * (40 / b.r) ** 0.3, 4);
        if (sp > 3 && this.simT - this.bumpAt > 0.06) {
          this.bumpAt = this.simT;
          const t = (a ?? b)!.tier;
          audio.tone(260 - t * 16, 0.09, 'sine', Math.min(0.1, sp * 0.012), 140 - t * 8);
        }
      }
      this.pair(a, b);
    }
  }

  /** Same-size jellies already touching (contacts that began while merging was off, e.g. before a revive). */
  private rescan() {
    const list = ((this.matter.world as any).engine.pairs.list ?? []) as (Pair & { isActive: boolean })[];
    for (const p of list) if (p.isActive) this.pair(this.jellyOf(p.bodyA), this.jellyOf(p.bodyB));
  }

  /** Wakes every jelly above y (and around it): a sleeping jelly would float when the one under it merges away. */
  private wakeAbove(y: number) {
    const S = (Phaser.Physics.Matter as any).Matter.Sleeping;
    for (const j of this.jellies) if (!j.dead && j.body.isSleeping && j.body.position.y - j.r < y + 160) S.set(j.body, false);
  }

  private pair(a?: Jelly, b?: Jelly) {
    if (!a || !b || a.dead || b.dead || a.tier !== b.tier || !this.alive) return;
    a.dead = true; b.dead = true;
    this.mergeQ.push([a, b]);
  }

  private merge(a: Jelly, b: Jelly) {
    const pa = a.body.position, pb = b.body.position;
    const x = (pa.x + pb.x) / 2, y = (pa.y + pb.y) / 2;
    const vx = (a.body.velocity.x + b.body.velocity.x) / 4, vy = (a.body.velocity.y + b.body.velocity.y) / 4;
    const tier = a.tier + 1;
    this.removeJelly(a); this.removeJelly(b);
    this.wakeAbove(Math.max(pa.y + a.r, pb.y + b.r));
    this.chain = this.chainT > 0 ? this.chain + 1 : 1;
    this.chainT = 1.1;
    const color = palette()[Math.min(tier, TIERS - 1)];
    let pts: number;
    if (tier === TIERS - 1) {
      // the biggest jelly (crowned king) is never kept: it puffs into a cloud and floats away
      pts = POINTS[tier] + CLOUD_PTS;
      if (tier > this.topTier) { this.topTier = tier; this.events.emit('tier', tier); }
      this.floatCloud(x, y);
    } else {
      pts = POINTS[tier];
      const n = this.addJelly(tier, x, y, vx, vy);
      n.a = -0.2; n.v = -1.5;
      const lim = JAR_W / 2 - n.r;
      if (Math.abs(x) > lim) (Phaser.Physics.Matter as any).Matter.Body.setPosition(n.body, { x: Math.sign(x) * lim, y });
    }
    pts += Math.floor(pts * 0.5 * (Math.min(this.chain, 5) - 1));
    this.score += pts;
    this.coinsRun = Math.floor(this.score / COIN_PTS) + this.clouds * CLOUD_COINS;
    this.drops3.setParticleTint(color);
    this.drops3.explode(6 + Math.min(tier, 8) * 2, x, y);
    const ring = this.add.image(x, y, 'ring').setDepth(9).setTint(0xffffff).setScale(RADII[Math.min(tier, TIERS - 1)] / 64);
    this.tweens.add({ targets: ring, scale: ring.scale * 1.7, alpha: 0, duration: 320, onComplete: () => ring.destroy() });
    const note = 392 * Math.pow(2, (PENTA[tier % 5] + 12 * Math.floor(tier / 5)) / 12);
    audio.tone(note, 0.16, 'triangle', 0.15, note * 1.5);
    audio.tone(note * 2, 0.08, 'sine', 0.06);
    if (this.chain >= 2) audio.tone(note * 1.5, 0.12, 'square', 0.05);
    this.events.emit('score', this.score, pts);
    this.events.emit('coins', this.coinsRun);
    const sp = this.toScreen(x, y);
    this.events.emit('merge', tier, this.chain, sp.x, sp.y, pts);
  }

  /** The crowned king jelly appears for a moment, puffs into a happy cloud and floats out of the jar (frees room). */
  private floatCloud(x: number, y: number) {
    this.clouds++;
    save.set('clouds', save.get('clouds') + 1);
    this.coinsRun = Math.floor(this.score / COIN_PTS) + this.clouds * CLOUD_COINS;
    const king = this.add.image(x, y, jellyKey(TIERS - 1)).setDepth(10).setScale(0.5 / TEX);
    this.tweens.add({ targets: king, scale: 1.08 / TEX, duration: 260, ease: 'Back.out' });
    this.tweens.add({ targets: king, scaleY: 0.86 / TEX, duration: 110, delay: 280, yoyo: true, repeat: 1 });
    const c = this.add.image(x, y, 'bigcloud').setDepth(10).setScale(0.3).setAlpha(0);
    const run = this.runId;
    window.setTimeout(() => {
      if (run !== this.runId || !c.active) return;
      this.sparks.explode(28, x, y);
      this.tweens.add({ targets: king, alpha: 0, scale: 1.4 / TEX, duration: 200, onComplete: () => king.destroy() });
      c.setAlpha(1);
      this.tweens.add({ targets: c, scale: 0.95, duration: 380, ease: 'Back.out' });
      this.tweens.add({ targets: c, y: VIEW_TOP - 500, duration: 2600, delay: 250, ease: 'Sine.in', onComplete: () => c.destroy() });
      this.tweens.add({ targets: c, x: x + 60, duration: 650, yoyo: true, repeat: 2, ease: 'Sine.inOut' });
    }, 650);
    [523, 659, 784, 1047, 1319].forEach((f, i) => window.setTimeout(() => audio.tone(f, 0.18, 'triangle', 0.12), i * 80));
    this.cameras.main.flash(160, 255, 255, 255);
    portal.happyTime();
    this.events.emit('cloud', this.clouds);
  }

  /* ------------------------------------------------------------------ fixed step */

  private tick(dt: number) {
    this.simT += dt;
    if (this.mergeQ.length) {
      const q = this.mergeQ; this.mergeQ = [];
      for (const [a, b] of q) this.merge(a, b);
      this.jellies = this.jellies.filter((j) => !j.dead);
    }
    if (this.chainT > 0) this.chainT -= dt;
    if (this.cooldown > 0) {
      this.cooldown -= dt;
      if (this.cooldown <= 0) { this.held.setVisible(true); this.showHeld(); }
    }
    // the top line: the highest settled jelly
    let top = Infinity;
    for (const j of this.jellies) {
      j.age += dt;
      if (j.age > FRESH) top = Math.min(top, j.body.position.y - j.r);
    }
    this.warn = top < LINE_Y + WARN;
    if (top < LINE_Y) this.dangerT += dt; else this.dangerT = 0;
    if (this.dangerT > 0 && this.simT - this.tickAt > 0.5) { this.tickAt = this.simT; audio.tone(880, 0.06, 'square', 0.07); }
    if (this.dangerT >= OVER_S && !this.immortal) { this.endRun('line'); return; }
    if (this.auto) this.autopilot(dt);
  }

  update(_t: number, dtMs: number) {
    const raw = Math.min(this.game.loop.rawDelta || dtMs, 100);
    if (this.started && !this.paused) {
      // rawDelta: real time (Phaser's delta is smoothed and capped); max 4 steps per frame (×turbo for the tests)
      this.acc += raw * this.turbo;
      const max = 4 * this.turbo;
      let n = 0;
      while (this.acc >= STEP_MS && n < max && !this.paused) { this.matter.world.step(STEP_MS); this.tick(STEP_MS / 1000); this.acc -= STEP_MS; n++; }
      if (n >= max) this.acc = 0;
    }
    this.draw(raw / 1000);
  }

  /** Visuals at the display rate: positions, squash springs, faces, aim guide, the waiting jelly. */
  private draw(d: number) {
    const k = Math.min(1, d * 16);
    // keyboard aim
    const dir = (this.keys.RIGHT?.isDown || this.keys.D?.isDown ? 1 : 0) - (this.keys.LEFT?.isDown || this.keys.A?.isDown ? 1 : 0);
    if (dir && this.alive) { this.targetX += dir * 520 * d; this.clampAim(); }
    this.aimX += (this.targetX - this.aimX) * k;
    const now = this.time.now / 1000;
    const worried = this.dangerT > 0 || !this.alive && this.started;
    for (const j of this.jellies) {
      if (j.dead) continue;
      // spring in small sub-steps (stable at any frame rate), kept within a sane range
      for (let rem = d; rem > 0; rem -= SPRING_DT) {
        const h = Math.min(rem, SPRING_DT);
        j.v += (-K * j.a - C * j.v) * h; j.a += j.v * h;
      }
      j.v = Phaser.Math.Clamp(j.v, -6, 6); j.a = Phaser.Math.Clamp(j.a, -0.3, 0.3);
      if (Math.abs(j.a) < 0.001 && Math.abs(j.v) < 0.01) { j.a = 0; j.v = 0; }
      const breathe = 0.018 * Math.sin(now * 2.4 + j.body.id);
      const a = Phaser.Math.Clamp(j.a, -0.2, 0.22);
      const p = j.body.position;
      j.img.setPosition(p.x, p.y + j.r * a * 0.5).setScale((1 + a * 0.8 - breathe) / TEX, (1 - a + breathe) / TEX)
        .setRotation(Phaser.Math.Clamp(j.body.velocity.x * 0.03, -0.25, 0.25));
      // faces: worried near the line, blink now and then
      j.blink -= d;
      const want: Mood = (worried || (this.warn && p.y - j.r < LINE_Y + WARN * 2)) ? 'w' : j.blink < 0 ? 'b' : 'n';
      if (j.blink < -0.13) j.blink = 2 + Math.random() * 4;
      if (want !== j.mood) { j.mood = want; j.img.setTexture(jellyKey(j.tier, want)); }
    }
    // the waiting jelly under its little cloud
    const r = RADII[this.heldTier];
    if (this.heldPop < 1) this.heldPop = Math.min(1, this.heldPop + d * 6);
    const pop = Phaser.Math.Easing.Back.Out(this.heldPop);
    const sway = Math.sin(now * 3) * 3;
    this.held.setPosition(this.aimX, HOLD_Y + sway).setScale((pop * (1 + 0.03 * Math.sin(now * 5))) / TEX, (pop * (1 - 0.03 * Math.sin(now * 5))) / TEX);
    this.holder.setPosition(this.aimX, HOLD_Y - r - 26 + sway).setScale(0.75 + r / 300);
    // aim guide: from the waiting jelly down to where it would land
    const land = this.landing(this.aimX, r);
    const y0 = HOLD_Y + r + 6;
    this.aimLine.setVisible(this.alive && this.held.visible && land.y - r > y0 + 10).setPosition(this.aimX, y0).setSize(12, Math.max(1, land.y + r - y0));
    // the line: faint, orange when close, red and blinking when over
    if (this.dangerT > 0) this.line.setTint(0xff4d5e).setAlpha(0.6 + 0.4 * Math.abs(Math.sin(now * 10)));
    else if (this.warn) this.line.setTint(0xffa04d).setAlpha(0.85);
    else this.line.setTint(0xffffff).setAlpha(0.5);
  }

  /** Where a jelly of radius r dropped at x would first touch (centre y) and what it would touch. */
  landing(x: number, r: number) {
    let y = -r, hit: Jelly | null = null;
    for (const j of this.jellies) {
      if (j.dead) continue;
      const p = j.body.position, s = r + j.r, dx = p.x - x;
      if (Math.abs(dx) >= s) continue;
      const cy = p.y - Math.sqrt(s * s - dx * dx);
      if (cy < y) { y = cy; hit = j; }
    }
    return { y, hit };
  }

  /* ------------------------------------------------------------------ autopilot (tests) */

  /** Turns the autopilot on: aims at the spot that merges the most or keeps the pile low, then drops. */
  autoplay(on = true) { this.auto = on; this.autoWait = 0.4; }

  private autopilot(dt: number) {
    if (!this.alive || this.cooldown > 0) return;
    this.autoWait -= dt;
    if (this.autoWait > 0) return;
    const t = this.heldTier, r = RADII[t], lim = JAR_W / 2 - r - 1;
    let best = 0, bestScore = -Infinity;
    for (let i = 0; i <= 24; i++) {
      const x = -lim + (2 * lim * i) / 24;
      const { y, hit } = this.landing(x, r);
      let sc = y * 0.03 + Math.random() * 6;
      if (hit) {
        if (hit.tier === t) sc += 60;
        else if (hit.tier === t + 1) sc += 6;
        else if (hit.tier < t) sc -= 8 * (t - hit.tier);
      }
      for (const j of this.jellies) {
        if (j.dead || j.tier !== t || j === hit) continue;
        const p = j.body.position;
        if (Math.hypot(p.x - x, p.y - y) < r + j.r + 10) sc += 25;
      }
      if (sc > bestScore) { bestScore = sc; best = x; }
    }
    if (Math.random() < this.autoSloppy) best = (Math.random() * 2 - 1) * lim;
    this.aimX = this.targetX = best;
    this.drop();
    this.autoWait = this.autoPace - COOLDOWN + Math.random() * 0.5;
  }

  /** Perf test: drops n random jellies at once over the jar so the board is full from the start. */
  prefill(n: number) {
    for (let i = 0; i < n; i++) {
      const t = Math.floor(Math.random() * 4), r = RADII[t];
      const j = this.addJelly(t, (Math.random() * 2 - 1) * (JAR_W / 2 - r - 1), -r - (i % 12) * 50 - Math.floor(i / 12) * 140);
      j.age = -3;
    }
  }

  /* ------------------------------------------------------------------ end, revive, ×2 */

  private endRun(reason: string) {
    if (!this.alive) return;
    this.alive = false;
    this.paused = true;
    this.endReason = reason;
    this.dangerT = Math.max(this.dangerT, 0.01);
    portal.gameplayStop();
    if (!this.counted) { this.counted = true; Play.sinceAd++; }
    audio.tone(420, 0.5, 'sawtooth', 0.08, 110);
    audio.noise(0.3, 0.2, 300);
    this.cameras.main.shake(220, 0.006);
    this.events.emit('ended');
    const run = this.runId;
    // real time: the scene clock may be paused or slowed on a busy phone
    window.setTimeout(() => {
      if (run !== this.runId) return;
      const best = save.get('best'), newBest = this.score > best;
      if (newBest) { save.set('best', this.score); portal.happyTime(); }
      if (this.topTier > save.get('bestTier')) save.set('bestTier', this.topTier);
      save.set('coins', save.get('coins') + this.coinsRun - this.coinsSaved);
      this.coinsSaved = this.coinsRun;
      this.events.emit('over', {
        score: this.score, best: Math.max(best, this.score), newBest, coins: this.coinsRun, tier: this.topTier, clouds: this.clouds,
        canRevive: portal.hasRewarded && !this.revived, canDouble: !this.doubled,
      });
    }, 900);
  }

  /** Ends the run now (name shared by every game's automated tests). */
  breakEgg() { this.endRun('test'); }

  /** ×2 after a rewarded ad: adds this run's coins again (once per run). */
  doubleCoins() {
    if (this.doubled) return 0;
    this.doubled = true;
    save.set('coins', save.get('coins') + this.coinsRun);
    return this.coinsRun;
  }

  /** Revive after a rewarded ad (once per run): the jellies in the top part of the jar pop away. */
  revive() {
    this.revived = true;
    const cut = LINE_Y + JAR_H * 0.42;
    let gone = this.jellies.filter((j) => !j.dead && j.body.position.y - j.r < cut);
    if (gone.length < 4) gone = this.jellies.filter((j) => !j.dead).sort((a, b) => (a.body.position.y - a.r) - (b.body.position.y - b.r)).slice(0, 4);
    const cols = palette();
    gone.forEach((j, i) => {
      const p = j.body.position;
      this.drops3.setParticleTint(cols[j.tier]);
      this.drops3.explode(8, p.x, p.y);
      this.removeJelly(j);
      window.setTimeout(() => audio.tone(700 + i * 40, 0.08, 'triangle', 0.08), i * 45);
    });
    this.jellies = this.jellies.filter((j) => !j.dead);
    for (const j of this.jellies) j.age = Math.min(j.age, 0);
    this.wakeAbove(Infinity);
    this.dangerT = 0;
    this.cooldown = 0.3;
    this.acc = 0;
    this.paused = false;
    this.alive = true;
    this.rescan();
    portal.gameplayStart();
  }
}
