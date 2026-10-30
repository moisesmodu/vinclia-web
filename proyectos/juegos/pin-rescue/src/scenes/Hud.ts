import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import { LEVELS } from '../levels';
import type { Play } from './Play';

type DoneInfo = { level: number; stars: number; newBest: boolean; last: boolean; coins: number; canDouble: boolean };

/**
 * Interface over the level: level number, the three star slots of this try, sound / restart / levels buttons, the
 * optional "skip with an ad" button (after 3 failed tries), the 10 s tutorial and the level-complete panel.
 * restart(), revive() (= skip the level with a rewarded ad), home(), next() and `over` are used by the tests.
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  over?: Phaser.GameObjects.Container;
  private busy = false;
  private layoutFns: (() => void)[] = [];
  private skipBtn?: Phaser.GameObjects.Container;
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialStart = 0;
  /** ×2 button of the level-complete panel (the automatic test presses it too). */
  dbl: ReturnType<typeof doubleButton> = null;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.over = undefined; this.busy = false; this.layoutFns = []; this.skipBtn = undefined; this.dbl = null;
    this.tutorial = undefined; this.tutorialStart = 0;

    const level = this.play.level;
    const boxIc = this.add.image(0, 0, 'ic-pin');
    const lvl = bigNumber(this, 0, 0, 44, `${level}`).setOrigin(0, 0.5);
    const slots = [0, 1, 2].map(() => this.add.image(0, 0, 'ic-star-off'));
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 28, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    const again = iconButton(this, 0, 0, 'replay', PALETTE.green, 28, () => this.restart());
    const home = iconButton(this, 0, 0, 'grid', PALETTE.purple, 28, () => this.home());
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      boxIc.setPosition(36 * s, 38 * s).setDisplaySize(54 * s, 54 * s);
      lvl.setPosition(66 * s, 42 * s).setScale(s);
      slots.forEach((im, k) => im.setPosition(lvl.x + lvl.displayWidth + (40 + k * 44) * s, 40 * s).setDisplaySize(42 * s, 42 * s));
      sound.setPosition(w - 40 * s, 40 * s).setScale(s);
      again.setPosition(w - 106 * s, 40 * s).setScale(s);
      home.setPosition(w - 172 * s, 40 * s).setScale(s);
      this.skipBtn?.setPosition(w - 250 * s, 40 * s).setScale(s);
    });

    this.play.events.on('stars', (n: number) => {
      slots.forEach((im, k) => {
        const on = n > k, was = im.texture.key === 'ic-star';
        im.setTexture(on ? 'ic-star' : 'ic-star-off');
        if (on && !was) { const d = im.displayWidth; this.tweens.add({ targets: im, displayWidth: { from: d * 1.6, to: d }, displayHeight: { from: d * 1.6, to: d }, duration: 240, ease: 'Back.out' }); }
      });
    });
    this.play.events.on('fails', (n: number) => {
      // stuck? after 3 failed tries, offer to skip the level with a rewarded ad (never forced)
      if (n >= 3 && !this.skipBtn && portal.hasRewarded && this.play.level < LEVELS.length) this.addSkip();
    });
    this.play.events.on('complete', (r: DoneInfo) => this.showDone(r));
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['stars', 'fails', 'complete', 'retry']) this.play.events.off(ev);
    });

    if (!save.get('tutorialDone') && level === 1) this.showTutorial();
    this.input.keyboard?.on('keydown-ESC', () => this.home());
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1100, this.scale.height / 640), 0.6, 1.4); }
  private layout() { for (const f of this.layoutFns) f(); }

  private addSkip() {
    const c = iconButton(this, 0, 0, 'video', 0xff8a4c, 28, () => this.skip());
    c.add(this.add.image(20, -22, 'ic-skip').setDisplaySize(26, 26).setTint(PALETTE.ink));
    this.skipBtn = c;
    pulse(this, c, 0.08);
    this.layout();
  }

  update() {
    // tutorial: its 10 s start on the first frame of play; it ends with the first pull
    if (this.tutorial) {
      if (!this.tutorialStart && this.play.started) this.tutorialStart = this.time.now;
      const done = this.play.pulledOnce || (this.tutorialStart && this.time.now - this.tutorialStart > 10000);
      if (done) {
        const c = this.tutorial;
        this.tutorial = undefined;
        save.set('tutorialDone', true);
        this.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
      } else {
        const m = this.play.pinScreen(0);
        if (m) this.tutorial.setPosition(m.x, m.y);
      }
    }
  }

  /* -------------------------------------------------------------- tutorial (10 s, no text): a finger taps the first pin's ring */

  private showTutorial() {
    const c = this.add.container(0, 0).setDepth(20);
    this.tutorial = c;
    const s = this.ui();
    const ring = this.add.circle(0, 0, 40, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.95);
    const arrow = this.add.triangle(-70, 0, 0, -16, 0, 16, -26, 0, 0xffffff).setStrokeStyle(4, PALETTE.ink);
    const hand = this.add.image(10, 6, 'ic-hand').setDisplaySize(110, 110).setOrigin(0.45, 0.05);
    c.add([ring, arrow, hand]);
    c.setScale(s);
    this.tweens.add({ targets: hand, y: 20, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.inOut', hold: 120 });
    this.tweens.add({ targets: ring, scale: 1.4, alpha: 0.15, duration: 640, repeat: -1 });
    this.tweens.add({ targets: arrow, x: -96, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  /* -------------------------------------------------------------- level-complete panel */

  private showDone(r: DoneInfo) {
    const w = this.scale.width, h = this.scale.height, s = this.ui();
    const c = this.add.container(0, 0).setDepth(30);
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.45).setInteractive();
    const pw = Math.min(560 * s, w - 24), k = pw / 560 < s ? pw / 560 : s;
    const panel = this.add.rectangle(w / 2, h / 2 - 30 * k, pw, 250 * k, 0xf2fbff, 0.97).setStrokeStyle(8 * k, PALETTE.ink);
    c.add([shade, panel]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.over = c;
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    const top = h / 2 - 30 * k - 125 * k;
    const sy = top + 70 * k;
    for (let i = 0; i < 3; i++) {
      const on = r.stars > i;
      const st = this.add.image(w / 2 + (i - 1) * 110 * k, sy - (i === 1 ? 14 : 0) * k, on ? 'ic-star' : 'ic-star-off').setDisplaySize(10, 10);
      c.add(st);
      this.tweens.add({ targets: st, displayWidth: 100 * k, displayHeight: 100 * k, delay: 150 + i * 220, duration: 260, ease: 'Back.out',
        onStart: () => { if (on) audio.tone(660 + i * 180, 0.14, 'triangle', 0.14, 1200 + i * 200); } });
    }
    const ry = top + 172 * k;
    const coinIc = this.add.image(w / 2 - 40 * k, ry, 'ic-coin').setDisplaySize(56 * k, 56 * k);
    const coinN = bigNumber(this, coinIc.x + 36 * k, ry + 2 * k, 50 * k, `+${r.coins}`).setOrigin(0, 0.5);
    c.add([coinIc, coinN]);
    // ×2 coins with a rewarded ad (once per level), on the top edge of the panel, away from the buttons
    this.dbl = null;
    if (r.canDouble) {
      this.dbl = doubleButton(this, {
        x: w / 2, y: top - 52 * k, s: k, currencyIcon: 'ic-coin', earned: r.coins,
        onDoubled: () => {
          const extra = this.play.doubleCoins();
          coinN.setText(`+${r.coins + extra}`);
          this.tweens.add({ targets: [coinIc, coinN], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (this.dbl) c.add(this.dbl);
    }
    if (r.stars === 3 && r.newBest) {
      const burst = this.add.particles(0, -20, 'ic-star', {
        x: { min: 0, max: w }, speedY: { min: 80, max: 260 }, lifespan: 2200, scale: { start: 0.22 * k, end: 0.12 * k },
        rotate: { min: 0, max: 360 }, gravityY: 300, emitting: false,
      }).setDepth(31);
      burst.explode(22);
      setTimeout(() => { if (burst.active) burst.destroy(); }, 2600);
    }
    const by = h / 2 + 140 * k;
    const levels = iconButton(this, w / 2 - 150 * k, by + 10 * k, 'grid', PALETTE.purple, 40 * k, () => this.home());
    const replay = iconButton(this, r.last ? w / 2 : w / 2 + 150 * k, r.last ? by : by + 10 * k, 'replay', PALETTE.blue, (r.last ? 62 : 40) * k, () => this.restart());
    c.add([levels, replay]);
    if (!r.last) {
      const next = iconButton(this, w / 2, by, 'play', PALETTE.green, 62 * k, () => this.next());
      pulse(this, next, 0.05);
      c.add(next);
      this.input.keyboard?.once('keydown-SPACE', () => this.next());
    } else {
      pulse(this, replay, 0.05);
      this.input.keyboard?.once('keydown-SPACE', () => this.restart());
    }
  }

  /* -------------------------------------------------------------- actions */

  /** Same level from scratch (one click; no ad). */
  restart() {
    if (this.busy) return;
    this.busy = true;
    this.play.startLevel(this.play.level, false);
  }

  /** Next level: a level transition, where the interstitial may play (at most every 3 levels). */
  next() {
    if (this.busy) return;
    this.busy = true;
    this.play.startLevel(Math.min(LEVELS.length, this.play.level + 1), true);
  }

  /** The rewarded ad of this game: skip the level. (Named revive() too, for the test scripts.) */
  async skip() {
    if (this.busy || !portal.hasRewarded || this.play.level >= LEVELS.length) return;
    this.busy = true;
    const wasPaused = this.play.paused;
    this.play.paused = true;
    portal.gameplayStop();
    const ok = await portal.rewardedBreak();
    if (!this.scene.isActive()) return;
    if (!ok) {
      this.busy = false;
      this.play.paused = wasPaused;
      if (!this.over) portal.gameplayStart();
      return;
    }
    this.play.skip();
  }
  revive() { return this.skip(); }

  /** Back to the level select. */
  home() {
    if (this.busy) return;
    this.busy = true;
    this.scene.stop('Play');
    this.scene.start('Levels');
  }
}
