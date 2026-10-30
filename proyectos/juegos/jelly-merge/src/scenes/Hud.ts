import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { uiScale } from '@comun/pantallas';
import { save } from '../state';
import { jellyKey } from '../cosmeticos';
import { JAR_W, JAR_H, HOLD_Y, RADII, TEX, TIERS, WALL } from '../config';
import type { Play } from './Play';

type OverInfo = { score: number; best: number; newBest: boolean; coins: number; tier: number; clouds: number; canRevive: boolean; canDouble: boolean };

/**
 * UI layer above the run (no zoom): score, best, coins of the run, sound, the next jelly, the ladder of sizes
 * (lit up to the biggest made in this run), 10 s tutorial hand and the end screen with one-click restart.
 * It also takes the pointer: move = aim, release = drop (mouse and touch).
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialLeft = 0;     // ms, counted down in update() (starts with the first frame, not in create)
  /** End panel (the automated tests wait for it). */
  over?: Phaser.GameObjects.Container;
  /** ×2 button of the end panel (the automated tests press it). */
  dbl: ReturnType<typeof doubleButton> = null;
  /** Revive button of the end panel (only once per run, only with rewarded ads). */
  reviveBtn: Phaser.GameObjects.Container | null = null;
  private layoutFns: (() => void)[] = [];
  private busy = false;
  private downOk = false;
  private ladder: Phaser.GameObjects.Image[] = [];

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.layoutFns = []; this.over = undefined; this.dbl = null; this.reviveBtn = null; this.tutorial = undefined; this.tutorialLeft = 0;
    this.busy = false; this.downOk = false; this.ladder = [];

    const score = bigNumber(this, 0, 0, 72, '0');
    const bestIc = this.add.image(0, 0, 'ic-trophy');
    const best = bigNumber(this, 0, 0, 28, `${save.get('best')}`).setOrigin(0, 0.5);
    const coinIc = this.add.image(0, 0, 'ic-coin');
    const coins = bigNumber(this, 0, 0, 36, '0').setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    // next jelly in a bubble
    const nextBg = this.add.circle(0, 0, 50, 0xffffff, 0.9).setStrokeStyle(6, PALETTE.ink);
    const next = this.add.image(0, 0, jellyKey(this.play.nextTier));
    const nextC = this.add.container(0, 0, [nextBg, next]);
    // ladder of sizes: tiny → biggest → cloud
    for (let t = 0; t <= TIERS; t++) this.ladder.push(this.add.image(0, 0, t < TIERS ? jellyKey(t) : 'bigcloud').setAlpha(t === 0 ? 1 : 0.3));
    const lightLadder = (top: number) => this.ladder.forEach((im, t) => im.setAlpha(t <= top ? 1 : 0.3));
    lightLadder(this.play.topTier);

    this.layoutFns.push(() => {
      const w = this.scale.width, h = this.scale.height, s = uiScale(this), portrait = h > w * 1.05;
      const jl = this.play.toScreen(-JAR_W / 2 - WALL, 0), jr = this.play.toScreen(JAR_W / 2 + WALL, -JAR_H);
      const z = this.play.zoom;
      if (portrait) {
        score.setPosition(w / 2, 46 * s).setScale(s);
        bestIc.setPosition(w / 2 - 20 * s, 96 * s).setDisplaySize(28 * s, 28 * s);
        best.setPosition(w / 2 + 2 * s, 97 * s).setScale(s);
        coinIc.setPosition(30 * s, 40 * s).setDisplaySize(40 * s, 40 * s);
        coins.setPosition(56 * s, 42 * s).setScale(s);
        sound.setPosition(w - 40 * s, 40 * s).setScale(s);
        nextC.setPosition(w - 44 * s, 124 * s).setScale(s * 0.7);
      } else {
        // left of the jar: score, best, coins; right: next bubble; sound in the corner
        const lx = Math.max(110 * s, jl.x / 2);
        score.setPosition(lx, h * 0.2).setScale(s);
        bestIc.setPosition(lx - 22 * s, h * 0.2 + 56 * s).setDisplaySize(32 * s, 32 * s);
        best.setPosition(lx + 2 * s, h * 0.2 + 57 * s).setScale(s);
        coinIc.setPosition(lx - 26 * s, h * 0.2 + 104 * s).setDisplaySize(40 * s, 40 * s);
        coins.setPosition(lx + 2 * s, h * 0.2 + 106 * s).setScale(s);
        sound.setPosition(w - 46 * s, 46 * s).setScale(s);
        const rx = Math.min(w - 90 * s, (jr.x + w) / 2);
        nextC.setPosition(rx, this.play.toScreen(0, HOLD_Y).y).setScale(s);
      }
      const fit = () => next.setScale(Math.min(1, 40 / RADII[this.play.nextTier]) / TEX);
      fit();
      this.events.off('fitNext'); this.events.on('fitNext', fit);
      // ladder: a row under the jar in portrait, a column left of the jar in landscape
      const n = this.ladder.length;
      if (portrait) {
        const y = Math.min(h - 34 * s, jl.y + (WALL + 10) * z + 30 * s), span = Math.min(w - 30, 420 * s), step = span / (n - 1);
        this.ladder.forEach((im, t) => im.setPosition(w / 2 - span / 2 + t * step, y).setScale(Math.min(step * 0.92, 18 * s + t * 2.4 * s) / (t < TIERS ? RADII[t] * 2 * TEX : 340)));
      } else {
        const x = Math.max(40 * s, jl.x - 60 * s), y0 = h * 0.4, step = Math.min(44 * s, (h * 0.5) / (n - 1));
        this.ladder.forEach((im, t) => im.setPosition(x, y0 + t * step).setScale(Math.min(step * 0.95, 20 * s + t * 3 * s) / (t < TIERS ? RADII[t] * 2 * TEX : 340)));
      }
    });

    this.play.events.on('score', (n: number) => {
      score.setText(`${n}`);
      const base = uiScale(this);
      this.tweens.killTweensOf(score);
      score.setScale(base * 1.2);
      this.tweens.add({ targets: score, scale: base, duration: 160, ease: 'Back.out' });
    });
    this.play.events.on('coins', (n: number) => coins.setText(`${n}`));
    this.play.events.on('next', (t: number) => {
      next.setTexture(jellyKey(t));
      this.events.emit('fitNext');
      const k = next.scale;
      next.setScale(k * 0.3);
      this.tweens.add({ targets: next, scale: k, duration: 240, ease: 'Back.out' });
    });
    this.play.events.on('tier', (t: number) => {
      lightLadder(t);
      const im = this.ladder[t], k = im.scale;
      this.tweens.add({ targets: im, scale: k * 1.6, duration: 160, yoyo: true, ease: 'Sine.out' });
    });
    this.play.events.on('cloud', () => {
      lightLadder(TIERS);
      const im = this.ladder[TIERS], k = im.scale;
      this.tweens.add({ targets: im, scale: k * 1.8, duration: 200, yoyo: true, repeat: 1 });
    });
    this.play.events.on('merge', (tier: number, chain: number, x: number, y: number, pts: number) => {
      // floating points where it merged (+ the chain number from 2 merges in a row)
      const s = uiScale(this);
      const t = bigNumber(this, x, y, (tier >= TIERS - 1 ? 64 : 34 + Math.min(tier, 8) * 2) * s, `+${pts}`).setDepth(15);
      if (chain >= 2) t.setColor('#ffd23f');
      this.tweens.add({ targets: t, y: y - 70 * s, alpha: 0, duration: 800, ease: 'Sine.out', onComplete: () => t.destroy() });
    });
    this.play.events.on('dropped', () => this.endTutorial());
    this.play.events.on('over', (r: OverInfo) => this.showOver(r));

    // the one input: move = aim, release = drop (not when the press started on a button)
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (!this.over) this.play.aimScreen(p.x); });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, hit: Phaser.GameObjects.GameObject[]) => {
      this.downOk = hit.length === 0 && !this.over;
      if (this.downOk) this.play.aimScreen(p.x);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.downOk || this.over) return;
      this.downOk = false;
      this.play.aimScreen(p.x);
      this.play.drop();
    });
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['score', 'coins', 'next', 'tier', 'cloud', 'merge', 'dropped', 'over']) this.play.events.off(ev);
    });

    if (!save.get('tutorialDone') || save.get('runs') <= 2) this.showTutorial();
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private layout() {
    // Play lays its camera out on the same resize event: wait one tick so the jar position is up to date
    for (const f of this.layoutFns) f();
    this.time.delayedCall(0, () => { for (const f of this.layoutFns) f(); });
  }

  /* ------------------------------------------------------------ tutorial (10 s, no text) */

  private showTutorial() {
    const c = this.add.container(0, 0).setDepth(20);
    const ring = this.add.circle(0, 0, 46, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.9);
    const hand = this.add.image(12, -10, 'ic-hand').setDisplaySize(110, 110).setOrigin(0.45, 0.05);
    const arrowL = this.add.image(-120, -40, 'ic-play').setDisplaySize(54, 54).setAngle(180).setTint(PALETTE.yellow);
    const arrowR = this.add.image(120, -40, 'ic-play').setDisplaySize(54, 54).setTint(PALETTE.yellow);
    const slide = this.add.container(0, 0, [ring, hand]);
    c.add([arrowL, arrowR, slide]);
    this.tutorial = c;
    this.tutorialLeft = 10000;
    // slide left and right (aim), then lift the finger (drop): ring pops on release
    this.tweens.chain({
      targets: slide, loop: -1, tweens: [
        { x: -90, duration: 520, ease: 'Sine.inOut' },
        { x: 90, duration: 900, ease: 'Sine.inOut' },
        { x: 0, duration: 450, ease: 'Sine.inOut' },
        { y: -26, duration: 160, ease: 'Sine.out', onStart: () => { ring.setScale(1).setAlpha(1); this.tweens.add({ targets: ring, scale: 1.6, alpha: 0, duration: 380 }); } },
        { y: 0, duration: 160, delay: 260 },
      ],
    });
    this.tweens.add({ targets: [arrowL, arrowR], alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
    this.layoutFns.push(() => {
      const p = this.play.toScreen(0, -JAR_H * 0.55);
      c.setPosition(p.x, p.y).setScale(uiScale(this));
    });
  }

  private endTutorial() {
    const t = this.tutorial;
    if (!t) return;
    this.tutorial = undefined;
    save.set('tutorialDone', true);
    this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
  }

  update(_t: number, dt: number) {
    if (!this.tutorial) return;
    this.tutorialLeft -= Math.min(this.game.loop.rawDelta || dt, 100);
    if (this.tutorialLeft <= 0) this.endTutorial();
  }

  /* ------------------------------------------------------------ end of run */

  private showOver(r: OverInfo) {
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    const w = this.scale.width, h = this.scale.height, s = Math.min(uiScale(this), (w - 24) / 540);
    const c = this.add.container(0, 0).setDepth(30);
    this.over = c;
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.45).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.25).fillRoundedRect(w / 2 - 260 * s, h / 2 - 160 * s, 520 * s, 300 * s, 36 * s);
    panel.fillStyle(0xffffff, 0.97).fillRoundedRect(w / 2 - 260 * s, h / 2 - 170 * s, 520 * s, 300 * s, 36 * s);
    panel.lineStyle(8 * s, PALETTE.ink).strokeRoundedRect(w / 2 - 260 * s, h / 2 - 170 * s, 520 * s, 300 * s, 36 * s);
    // the biggest jelly of the run, a bit worried, wobbling
    const t = Math.min(r.tier, TIERS - 1);
    const jelly = this.add.image(w / 2 - 165 * s, h / 2 - 70 * s, jellyKey(t, 'w'));
    const js = (95 * s) / (RADII[t] * 2 * TEX);
    jelly.setScale(js);
    this.tweens.add({ targets: jelly, scaleY: js * 0.86, scaleX: js * 1.1, duration: 280, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const score = bigNumber(this, w / 2 + 50 * s, h / 2 - 76 * s, 92 * s, `${r.score}`);
    const trophy = this.add.image(w / 2 - 150 * s, h / 2 + 34 * s, 'ic-trophy').setDisplaySize(52 * s, 52 * s);
    const best = bigNumber(this, w / 2 - 116 * s, h / 2 + 36 * s, 46 * s, `${r.best}`).setOrigin(0, 0.5);
    const coinIc = this.add.image(w / 2 + 70 * s, h / 2 + 34 * s, 'ic-coin').setDisplaySize(50 * s, 50 * s);
    const coinN = bigNumber(this, w / 2 + 104 * s, h / 2 + 36 * s, 46 * s, `+${r.coins}`).setOrigin(0, 0.5);
    c.add([shade, panel, jelly, score, trophy, best, coinIc, coinN]);
    if (r.newBest) {
      const burst = this.add.particles(w / 2, h / 2 - 80 * s, 'ic-star', {
        speed: { min: 200, max: 520 }, lifespan: 1000, scale: { start: 0.35 * s, end: 0 }, gravityY: 500, emitting: false,
      });
      burst.explode(26);
      c.add(burst);
      this.tweens.add({ targets: [trophy, best], scale: '*=1.2', duration: 300, yoyo: true, repeat: 2 });
      [523, 659, 784].forEach((f, i) => window.setTimeout(() => audio.tone(f, 0.15, 'square', 0.1), i * 120));
    }
    // restart in one click (big button), back to the menu, revive with an ad if the portal has rewarded ads
    const by = h / 2 + 200 * s;
    const replay = iconButton(this, w / 2, by, 'replay', PALETTE.green, 62 * s, () => this.restart());
    pulse(this, replay, 0.05);
    const home = iconButton(this, w / 2 - 150 * s, by + 10 * s, 'home', PALETTE.purple, 38 * s, () => this.home());
    c.add([replay, home]);
    this.reviveBtn = r.canRevive ? iconButton(this, w / 2 + 150 * s, by + 10 * s, 'video', PALETTE.yellow, 44 * s, () => this.revive()) : null;
    if (this.reviveBtn) c.add(this.reviveBtn);
    this.dbl = null;
    if (r.canDouble) {
      this.dbl = doubleButton(this, {
        x: w / 2, y: h / 2 - 205 * s, s, currencyIcon: 'ic-coin', earned: r.coins,
        onDoubled: () => {
          const extra = this.play.doubleCoins();
          coinN.setText(`+${r.coins + extra}`);
          this.tweens.add({ targets: [coinIc, coinN], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (this.dbl) c.add(this.dbl);
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  restart() {
    if (this.busy) return;
    this.busy = true;
    this.play.scene.restart(); // the interstitial (if due) is requested when the run starts
  }

  async revive() {
    if (this.busy || !this.over) return;
    this.busy = true;
    const ok = await portal.rewardedBreak();
    this.busy = false;
    if (!ok || !this.over) return;
    this.over.destroy();
    this.over = undefined;
    this.dbl = null;
    this.input.keyboard?.removeAllListeners('keydown-SPACE');
    this.play.revive();
  }

  home() {
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}
