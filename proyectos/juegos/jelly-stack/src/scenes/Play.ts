import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { PALETTE } from '@comun/ui';
import { save } from '../state';
import {
  BH, SLICE, MIN_W, BASE_W, MAX_W, VIEW_W, VIEW_ROWS, RANGE, PERFECT, GROW, SPEED0, SPEED_STEP, SPEED_MAX, GRAVITY, JELLY,
} from '../config';

/** A block of the tower. a/v: spring of its squash (fake soft body, visual only). */
type Block = { x: number; w: number; level: number; obj: Phaser.GameObjects.NineSlice; a: number; v: number };
/** A cut-off piece falling with jelly wobble. */
type Piece = {
  obj: Phaser.GameObjects.NineSlice | Phaser.GameObjects.Image; sx: number; sy: number;
  x: number; y: number; vx: number; vy: number; vr: number; a: number; v: number; bounces: number; dead: boolean;
};

const K = 260, C = 9;                 // spring stiffness / damping of the jelly squash
const PENTA = [0, 2, 4, 7, 9];        // major pentatonic (rising combo tone)
const GROUND_Y = 44;                  // top of the candy hill (the plate sits on y 0..44)

/**
 * Jelly Stack: a jelly block slides back and forth above the tower; one tap drops it. What hangs over the
 * block below is cut off and falls wobbling; the new block keeps only the overlap. A perfect drop keeps the full
 * width (combo; from 5 in a row the block grows). Missing completely ends the run. Score = height.
 *
 * Cheap by design: every block is ONE NineSlice (3-slice texture), the soft body is a damped spring on
 * scale, blocks far below the camera are destroyed. No physics engine.
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  alive = false;
  paused = false;
  score = 0;
  stars = 0;
  combo = 0;
  speed = SPEED0;
  revived = false;
  tower: Block[] = [];
  slider: { x: number; w: number; dir: number; range: number; level: number; color: number; obj: Phaser.GameObjects.NineSlice } | null = null;
  private pieces: Piece[] = [];
  private face!: Phaser.GameObjects.Image;
  private faceMood = 0;          // ms left of the current mood face
  private blinkIn = 2000;
  private camY = 0;
  private swayT = 0;
  private ground!: Phaser.GameObjects.Container;
  private plate!: Phaser.GameObjects.NineSlice;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private starsSaved = 0;

  constructor() { super('Play'); }

  /** Height of the tower (for the sky and the HUD). */
  get height() { return this.score; }
  /** Camera centre in world units (the Sky scene uses it for parallax). */
  get cameraY() { return this.camY; }

  async create() {
    // the scene instance is reused on restart: nothing from the previous run may survive
    this.alive = false; this.paused = false; this.score = 0; this.stars = 0; this.starsSaved = 0; this.combo = 0;
    this.speed = SPEED0; this.revived = false; this.tower = []; this.slider = null; this.pieces = [];
    this.faceMood = 0; this.blinkIn = 2000; this.swayT = 0;

    this.makeGround();
    this.addBlock(0, BASE_W, 0);
    this.face = this.add.image(0, 0, 'face-happy').setDepth(6);
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 180, max: 520 }, lifespan: 650, scale: { start: 0.9, end: 0 }, rotate: { min: 0, max: 180 },
      tint: [0xffffff, 0xfff3a0, 0xffd23f], gravityY: 300, emitting: false,
    }).setDepth(8);

    this.camY = this.targetCamY();
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.input.keyboard?.on('keydown-SPACE', this.drop, this);

    this.scene.launch('Sky');
    this.scene.launch('Hud');
    this.scene.sendToBack('Sky');
    this.events.once('shutdown', () => {
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      this.input.keyboard?.off('keydown-SPACE', this.drop, this);
      this.scene.stop('Hud');
      this.scene.stop('Sky');
    });

    save.set('runs', save.get('runs') + 1);
    this.spawnSlider();
    // Interstitial in a natural pause: before every run except the first of the session.
    if (!Play.firstRun) {
      this.paused = true;
      await portal.commercialBreak();
      this.paused = false;
    }
    Play.firstRun = false;
    this.alive = true;
    portal.gameplayStart();
  }

  /* ------------------------------------------------------------------ world */

  private layout() {
    const cam = this.cameras.main, w = this.scale.width, h = this.scale.height;
    cam.setSize(w, h);
    cam.setZoom(Math.min(w / VIEW_W, h / (VIEW_ROWS * BH)));
    cam.centerOn(0, this.camY);
  }

  private makeGround() {
    // baked textures only: a Graphics object would be re-triangulated (earcut) every frame
    const c = this.add.container(0, 0).setDepth(1);
    c.add(this.add.tileSprite(0, GROUND_Y - 8, 4000, 320, 'ground-tile').setOrigin(0.5, 0));
    c.add(this.add.rectangle(0, GROUND_Y + 310, 4000, 1400, 0x6fd36a).setOrigin(0.5, 0));
    this.ground = c;
    this.plate = this.add.nineslice(0, 22, 'plate', undefined, BASE_W + 120, 44, SLICE, SLICE, 0, 0).setDepth(2);
  }

  private bottomY(level: number) { return -level * BH; }

  private addBlock(x: number, w: number, level: number, obj?: Phaser.GameObjects.NineSlice) {
    const o = obj ?? this.add.nineslice(x, 0, `jelly${level % JELLY.length}`, undefined, w, BH, SLICE, SLICE, 0, 0);
    o.setOrigin(0.5, 1).setDepth(3).setSize(w, BH).setPosition(x, this.bottomY(level)).setScale(1);
    const b: Block = { x, w, level, obj: o, a: 0, v: 0 };
    this.tower.push(b);
    return b;
  }

  private get top() { return this.tower[this.tower.length - 1]; }

  private spawnSlider() {
    const top = this.top, level = top.level + 1;
    const dir = level % 2 ? 1 : -1;
    const range = top.w / 2 + RANGE;
    const x = -dir * range;
    const color = level % JELLY.length;
    const obj = this.add.nineslice(x, this.bottomY(level), `jelly${color}`, undefined, top.w, BH, SLICE, SLICE, 0, 0)
      .setOrigin(0.5, 1).setDepth(4);
    this.slider = { x, w: top.w, dir, range, level, color, obj };
    obj.setScale(0.7, 0.4);
    this.tweens.add({ targets: obj, scaleX: 1, scaleY: 1, duration: 260, ease: 'Back.out' });
    this.face.setTexture('face-happy');
  }

  /* ------------------------------------------------------------------ the one input */

  drop() {
    const s = this.slider;
    if (!this.alive || this.paused || !s) return;
    this.events.emit('dropped');
    const top = this.top;
    const dx = s.x - top.x;
    this.tweens.killTweensOf(s.obj);
    s.obj.setScale(1);
    if (Math.abs(dx) <= PERFECT) return this.perfect(s, top);

    const left = Math.max(s.x - s.w / 2, top.x - top.w / 2), right = Math.min(s.x + s.w / 2, top.x + top.w / 2);
    const w = right - left;
    if (w < MIN_W) return this.miss();

    // cut: the overhang falls off wobbling, the block keeps only the overlap
    const side = Math.sign(dx);
    const cutW = s.w - w, cutX = side > 0 ? right + cutW / 2 : left - cutW / 2;
    this.spawnPiece(cutX, this.bottomY(s.level), cutW, s.color, side);
    this.combo = 0;
    this.place((left + right) / 2, w, s);
    audio.tone(330 + Math.min(this.score, 40) * 6, 0.12, 'triangle', 0.14, 160);
    audio.noise(0.12, 0.18, 500);
  }

  private perfect(s: NonNullable<Play['slider']>, top: Block) {
    this.combo++;
    this.stars++;
    let w = top.w;
    if (this.combo >= 5) w = Math.min(MAX_W, w + GROW);
    this.place(top.x, w, s);
    const b = this.top, y = this.bottomY(b.level) - BH / 2;
    // sparkle + white ring + rising tone
    this.sparks.explode(8, b.x - w / 2, y);
    this.sparks.explode(8, b.x + w / 2, y);
    const ring = this.add.rectangle(b.x, y, w + 16, BH + 16).setStrokeStyle(10, 0xffffff, 0.95).setDepth(7);
    this.tweens.add({ targets: ring, scaleX: 1.12, scaleY: 1.5, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
    const n = this.combo - 1, note = 523.25 * Math.pow(2, (PENTA[n % 5] + 12 * Math.floor(n / 5)) / 12);
    audio.tone(Math.min(note, 2600), 0.22, 'triangle', 0.16, Math.min(note * 1.5, 3200));
    if (this.combo >= 5) {
      // growing back: the block puffs up to the new width
      b.obj.setSize(top.w, BH);
      this.tweens.addCounter({ from: top.w, to: w, duration: 220, ease: 'Back.out', onUpdate: (tw) => b.obj.setSize(tw.getValue() ?? w, BH) });
      audio.tone(note * 2, 0.18, 'sine', 0.1);
    }
    this.faceMood = 650;
    this.events.emit('perfect', this.combo, this.stars);
  }

  private place(x: number, w: number, s: NonNullable<Play['slider']>) {
    const b = this.addBlock(x, w, s.level, s.obj);
    this.slider = null;
    // squash: the new block and, a little, the ones below (jelly!)
    b.v = -3.2;
    for (let i = 2; i <= 4; i++) { const u = this.tower[this.tower.length - i]; if (u) u.v -= 3.2 / i; }
    this.score = b.level;
    this.speed = Math.min(SPEED_MAX, SPEED0 + this.score * SPEED_STEP);
    this.events.emit('score', this.score);
    this.spawnSlider();
  }

  private spawnPiece(x: number, bottom: number, w: number, color: number, side: number) {
    let obj: Piece['obj'];
    if (w >= MIN_W) {
      obj = this.add.nineslice(x, bottom - BH / 2, `jelly${color}`, undefined, w, BH, SLICE, SLICE, 0, 0);
    } else {
      // a sliver too thin for a block: a round jelly blob
      obj = this.add.image(x, bottom - BH / 2, 'drop').setTint(JELLY[color]);
      obj.setDisplaySize(Math.max(26, w * 1.3), BH * 0.8);
    }
    obj.setDepth(5);
    this.pieces.push({
      obj, sx: obj.scaleX, sy: obj.scaleY, x, y: bottom - BH / 2, vx: side * (90 + Math.random() * 80), vy: -160,
      vr: side * (1.6 + Math.random() * 1.6), a: 0, v: 5.5, bounces: 0, dead: false,
    });
  }

  private miss() {
    const s = this.slider!;
    this.slider = null;
    this.alive = false;
    this.combo = 0;
    portal.gameplayStop();
    const side = Math.sign(s.x - this.top.x) || 1;
    this.pieces.push({
      obj: s.obj.setOrigin(0.5).setY(this.bottomY(s.level) - BH / 2), sx: 1, sy: 1, x: s.x, y: this.bottomY(s.level) - BH / 2,
      vx: side * 160, vy: -260, vr: side * 2.4, a: 0, v: 6, bounces: 0, dead: false,
    });
    this.face.setTexture('face-oh');
    this.faceMood = Infinity;
    audio.tone(420, 0.5, 'sawtooth', 0.1, 90);
    audio.noise(0.3, 0.3, 300);
    this.cameras.main.shake(200, 0.006);
    this.time.delayedCall(900, () => {
      const best = save.get('best');
      const newBest = this.score > best;
      if (newBest) { save.set('best', this.score); portal.happyTime(); }
      save.set('coins', save.get('coins') + this.stars - this.starsSaved);
      this.starsSaved = this.stars;
      this.events.emit('over', { score: this.score, best: Math.max(best, this.score), newBest, stars: this.stars, canRevive: portal.hasRewarded && !this.revived });
    });
  }

  /** Ends the run now (used by the automatic SDK test, same name as in Egg Truck). */
  breakEgg() {
    if (!this.alive || !this.slider) return;
    this.slider.x = this.top.x + this.top.w + 200;
    this.miss();
  }

  /** Revive after a rewarded ad (once per run): a new block with the width of the top one. */
  revive() {
    this.revived = true;
    this.faceMood = 0;
    this.spawnSlider();
    this.alive = true;
    portal.gameplayStart();
  }

  /* ------------------------------------------------------------------ frame */

  private targetCamY() {
    const z = this.cameras.main.zoom || 1, viewH = this.scale.height / z;
    const level = this.slider?.level ?? this.top.level + 1;
    const sliderMid = this.bottomY(level) - BH / 2;
    // slider at ~30 % from the top of the screen; never show more than a strip of ground
    return Math.min(sliderMid + viewH * 0.2, GROUND_Y + 200 - viewH / 2);
  }

  update(_t: number, dtMs: number) {
    // rawDelta: real time (Phaser's delta is smoothed and capped at 16.7 ms)
    const d = Math.min(this.game.loop.rawDelta || dtMs, 50) / 1000;
    const s = this.slider;
    if (s && this.alive && !this.paused) {
      s.x += s.dir * this.speed * d;
      if (s.x > s.range) { s.x = s.range; s.dir = -1; } else if (s.x < -s.range) { s.x = -s.range; s.dir = 1; }
    }

    // gentle sway that grows with height (visual only; the slider sways with its row so what you see is what lands)
    this.swayT += d;
    const topL = this.top.level + 1, amp = Math.min(16, topL * 0.4) * Math.sin(this.swayT * 1.5);
    const sway = (level: number) => amp * (level / topL) * (level / topL);

    const cam = this.cameras.main, z = cam.zoom, viewH = this.scale.height / z;
    const camBottom = this.camY + viewH / 2;
    const k = Math.min(1, d * 4);
    this.camY += (this.targetCamY() - this.camY) * k;
    cam.centerOn(0, this.camY);

    // tower: wobble springs, sway, culling far below the camera
    let cut = 0;
    for (let i = 0; i < this.tower.length; i++) {
      const b = this.tower[i];
      const y = this.bottomY(b.level);
      if (y - BH > camBottom + BH) {
        if (b.obj.visible) b.obj.setVisible(false);
        if (y - BH > camBottom + 6 * BH && i < this.tower.length - 3) cut = i + 1;
        continue;
      }
      if (!b.obj.visible) b.obj.setVisible(true);
      if (b.a !== 0 || b.v !== 0) {
        b.v += (-K * b.a - C * b.v) * d; b.a += b.v * d;
        if (Math.abs(b.a) < 0.002 && Math.abs(b.v) < 0.02) { b.a = 0; b.v = 0; }
        b.obj.setScale(1 - b.a * 0.5, 1 + b.a);
      }
      b.obj.x = b.x + sway(b.level);
    }
    if (cut > 0) { for (let i = 0; i < cut; i++) this.tower[i].obj.destroy(); this.tower.splice(0, cut); }
    const groundVisible = GROUND_Y - 10 < camBottom;
    this.ground.setVisible(groundVisible); this.plate.setVisible(groundVisible);

    if (s) s.obj.x = s.x + sway(s.level);

    // face on the top-most jelly (the slider, or the top of the tower)
    const host = s ? s.obj : this.top.obj;
    const hw = s ? s.w : this.top.w;
    this.face.setVisible(!!s || this.faceMood > 0);
    this.face.setPosition(host.x, host.y - BH * 0.52 * host.scaleY).setScale(Math.min(1.3, (hw - 28) / 124) * host.scaleX);
    if (this.faceMood > 0) {
      this.faceMood -= d * 1000;
      const want = this.faceMood === Infinity ? 'face-oh' : this.faceMood > 0 ? 'face-joy' : 'face-happy';
      if (this.face.texture.key !== want) this.face.setTexture(want);
    } else {
      this.blinkIn -= d * 1000;
      if (this.blinkIn <= 0 && this.face.texture.key === 'face-happy') this.face.setTexture('face-blink');
      if (this.blinkIn < -130) { this.face.setTexture('face-happy'); this.blinkIn = 1800 + Math.random() * 2200; }
    }

    // falling pieces: gravity, spin, jelly wobble, a squishy bounce on the grass
    for (const p of this.pieces) {
      if (p.dead) continue;
      p.vy += GRAVITY * d;
      p.x += p.vx * d; p.y += p.vy * d;
      p.obj.rotation += p.vr * d;
      p.v += (-K * 0.7 * p.a - C * 0.5 * p.v) * d; p.a += p.v * d;
      if (p.y > GROUND_Y - BH * 0.35 && p.vy > 0 && p.bounces < 2) {
        p.y = GROUND_Y - BH * 0.35; p.vy *= -0.32; p.vx *= 0.5; p.vr *= 0.4; p.v += 6; p.bounces++;
        if (p.bounces === 2) { p.vy = 0; p.vx = 0; p.vr = 0; this.tweens.add({ targets: p.obj, alpha: 0, delay: 500, duration: 400, onComplete: () => { p.dead = true; } }); }
        audio.tone(200, 0.08, 'sine', 0.08, 120);
      }
      if (p.bounces >= 2) p.y = GROUND_Y - BH * 0.35;
      p.obj.setPosition(p.x, p.y).setScale(p.sx * (1 - p.a * 0.45), p.sy * (1 + p.a * 0.7));
      if (p.y > camBottom + 400) p.dead = true;
    }
    if (this.pieces.some((p) => p.dead)) {
      this.pieces = this.pieces.filter((p) => { if (p.dead) p.obj.destroy(); return !p.dead; });
    }
  }
}
