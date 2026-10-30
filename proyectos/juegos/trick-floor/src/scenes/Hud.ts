import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import { LEVELS } from '../levels';
import { T } from '../sim';
import type { Play } from './Play';

type OverInfo = { level: number; deaths: number; canSkip: boolean };
type DoneInfo = { level: number; deaths: number; stars: number; best: number; newBest: boolean; last: boolean; coins: number; canDouble: boolean };

/**
 * Interface over the level (no zoom): level number, death counter, sound / restart / levels buttons, the optional
 * "skip with an ad" button, big on-screen left / right / jump buttons on touch screens, the 10 s tutorial and the
 * end panels. restart(), revive() (= skip the level with a rewarded ad), home() and `over` are used by
 * scripts/sdk-test.mjs.
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  over?: Phaser.GameObjects.Container;
  private busy = false;
  private layoutFns: (() => void)[] = [];
  private btns: { key: 'l' | 'r' | 'j'; c: Phaser.GameObjects.Container }[] = [];
  private touchOn = false;
  private skipBtn?: Phaser.GameObjects.Container;
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialStart = 0;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.over = undefined; this.busy = false; this.layoutFns = []; this.btns = []; this.skipBtn = undefined; this.dbl = null;
    this.tutorial = undefined; this.tutorialStart = 0;
    this.touchOn = !!this.registry.get('touch') || !!this.sys.game.device.input.touch;
    this.registry.set('touch', this.touchOn);
    // enough pointers for left/right + jump with two thumbs (and a spare)
    const mgr = this.input.manager;
    if (mgr.pointersTotal < 4) this.input.addPointer(4 - mgr.pointersTotal);

    const level = this.play.level;
    const doorIc = this.add.image(0, 0, 'ic-door');
    const lvl = bigNumber(this, 0, 0, 44, `${level}`).setOrigin(0, 0.5);
    const splat = this.add.image(0, 0, 'ic-splat');
    const deaths = bigNumber(this, 0, 0, 44, '0').setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 28, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    const again = iconButton(this, 0, 0, 'replay', PALETTE.green, 28, () => this.restart());
    const home = iconButton(this, 0, 0, 'grid', PALETTE.purple, 28, () => this.home());
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      doorIc.setPosition(36 * s, 38 * s).setDisplaySize(54 * s, 54 * s);
      lvl.setPosition(64 * s, 42 * s).setScale(s);
      splat.setPosition(lvl.x + lvl.displayWidth + 44 * s, 40 * s).setDisplaySize(52 * s, 52 * s);
      deaths.setPosition(splat.x + 30 * s, 42 * s).setScale(s);
      sound.setPosition(w - 40 * s, 40 * s).setScale(s);
      again.setPosition(w - 106 * s, 40 * s).setScale(s);
      home.setPosition(w - 172 * s, 40 * s).setScale(s);
      this.skipBtn?.setPosition(w - 250 * s, 40 * s).setScale(s);
    });

    this.play.events.on('deaths', (n: number) => {
      deaths.setText(`${n}`);
      const s = this.ui(), k = (52 * s) / 128;
      this.tweens.add({ targets: deaths, scale: { from: 1.4 * s, to: s }, duration: 220, ease: 'Back.out' });
      this.tweens.add({ targets: splat, scale: { from: 1.5 * k, to: k }, duration: 220, ease: 'Back.out' });
      // stuck? after 3 deaths, offer to skip the level with a rewarded ad (never forced)
      if (n >= 3 && !this.skipBtn && portal.hasRewarded && level < LEVELS.length) this.addSkip();
    });
    this.play.events.on('over', (r: OverInfo) => this.showOver(r));
    this.play.events.on('complete', (r: DoneInfo) => this.showDone(r));
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['deaths', 'over', 'complete']) this.play.events.off(ev);
      this.input.off('pointerdown', this.firstTouch, this);
    });

    this.makeTouchButtons();
    this.input.on('pointerdown', this.firstTouch, this);
    if (!save.get('tutorialDone') && level === 1) this.showTutorial();
    this.input.keyboard?.on('keydown-ESC', () => this.home());
    this.scale.on('resize', this.layout, this);
    this.layout();
    this.play.layout(); // the level zoom depends on whether the touch buttons are shown
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

  /* -------------------------------------------------------------- touch controls */

  /** A touch on a laptop with a touch screen switches the on-screen buttons on. */
  private firstTouch(p: Phaser.Input.Pointer) {
    if (this.touchOn || !p.wasTouch) return;
    this.touchOn = true;
    this.registry.set('touch', true);
    this.btns.forEach((b) => b.c.setVisible(true));
    this.play.layout();
    this.layout();
  }

  private makeTouchButtons() {
    const mk = (key: 'l' | 'r' | 'j', angle: number, color: number) => {
      const c = this.add.container(0, 0).setDepth(10).setVisible(this.touchOn);
      const disc = this.add.image(0, 0, 'btn');
      const ic = this.add.image(0, 0, 'ic-arrow').setAngle(angle).setDisplaySize(72, 72).setTint(color);
      c.add([disc, ic]);
      this.btns.push({ key, c });
    };
    mk('l', 180, 0xffffff); mk('r', 0, 0xffffff); mk('j', -90, PALETTE.yellow);
    this.layoutFns.push(() => {
      const w = this.scale.width, h = this.scale.height, portrait = h > w;
      // thumb-sized: about 1.5-2 cm on a phone
      const r = Phaser.Math.Clamp(Math.min(w, h) * (portrait ? 0.13 : 0.15), 46, 90);
      const s = (r * 2) / 128, y = h - r - Math.max(16, r * 0.35);
      const [L, R, J] = this.btns;
      L.c.setPosition(r + 18, y).setScale(s);
      R.c.setPosition(r * 3 + 34, y).setScale(s);
      J.c.setPosition(w - r - 22, y).setScale(s * 1.08);
    });
  }

  /** Polls every finger each frame: left/right by side, jump on the right. Generous zones, sliding works. */
  private readTouch() {
    const t = { l: false, r: false, j: false };
    if (!this.touchOn || this.over) return t;
    const [L, R, J] = this.btns;
    const rad = L.c.scaleX * 64;
    for (const p of this.input.manager.pointers) {
      if (!p.isDown || !p.wasTouch) continue;
      const x = p.x, y = p.y;
      if (y < this.scale.height * 0.35) continue;
      if (Math.hypot(x - J.c.x, y - J.c.y) < rad * 1.6 || (x > this.scale.width * 0.62 && y > J.c.y - rad * 2)) t.j = true;
      else if (y > L.c.y - rad * 1.8 && x < R.c.x + rad * 1.6) {
        if (x < (L.c.x + R.c.x) / 2) t.l = true; else t.r = true;
      }
    }
    return t;
  }

  update() {
    const t = this.readTouch();
    this.play.touch = t;
    for (const b of this.btns) {
      if (!b.c.visible) continue;
      b.c.setAlpha(t[b.key] ? 1 : 0.7);
    }

    // tutorial: starts on the first frame of play, ends when the hero has walked and jumped, or after 10 s
    if (this.tutorial) {
      if (!this.tutorialStart && this.play.started) this.tutorialStart = this.time.now;
      const done = (this.play.walked > T * 3 && this.play.jumped) || (this.tutorialStart && this.time.now - this.tutorialStart > 10000);
      if (done) {
        const c = this.tutorial;
        this.tutorial = undefined;
        save.set('tutorialDone', true);
        this.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
      }
    }
  }

  /* -------------------------------------------------------------- tutorial (10 s, no text) */

  private showTutorial() {
    const c = this.add.container(0, 0).setDepth(20);
    this.tutorial = c;
    if (this.touchOn) {
      // hands tapping the buttons
      const hands = [0, 2].map(() => this.add.image(0, 0, 'ic-hand').setDisplaySize(96, 96).setOrigin(0.45, 0.05));
      c.add(hands);
      hands.forEach((hd, k) => this.tweens.add({ targets: hd, y: '+=10', duration: 300, yoyo: true, repeat: -1, delay: k * 300 }));
      this.layoutFns.push(() => {
        const [, R, J] = this.btns;
        hands[0].setPosition(R.c.x + 10, R.c.y - 10);
        hands[1].setPosition(J.c.x + 10, J.c.y - 10);
        hands.forEach((h) => h.setScale(this.ui() * 0.75));
      });
      return;
    }
    // keyboard: arrow keys and space
    const key = (x: number, y: number, angle: number, wide = 1) => {
      const k = this.add.container(x, y);
      k.add(this.add.image(0, 0, 'keycap').setScale(wide, 1));
      if (angle === 999) k.add(this.add.rectangle(0, -2, 90, 10, PALETTE.ink));
      else k.add(this.add.image(0, -3, 'ic-arrow').setAngle(angle).setDisplaySize(56, 56).setTint(PALETTE.ink));
      c.add(k);
      return k;
    };
    const kl = key(-160, 0, 180), kr = key(-56, 0, 0), ku = key(80, 0, -90), ks = key(240, 0, 999, 1.9);
    this.tweens.add({ targets: kr, y: 6, duration: 260, yoyo: true, repeat: -1, hold: 200 });
    this.tweens.add({ targets: [ku, ks], y: 6, duration: 200, yoyo: true, repeat: -1, delay: 500, repeatDelay: 600 });
    kl.setAlpha(0.8);
    this.layoutFns.push(() => c.setPosition(this.scale.width / 2, this.scale.height * 0.36).setScale(this.ui() * 0.85));
  }

  /* -------------------------------------------------------------- end panels */

  private panel(hgt: number) {
    const w = this.scale.width, h = this.scale.height, s = this.ui();
    const c = this.add.container(0, 0).setDepth(30);
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.45).setInteractive();
    const pw = Math.min(560 * s, w - 24);
    const panel = this.add.rectangle(w / 2, h / 2 - 30 * s, pw, hgt * s, 0xfff4fb, 0.97).setStrokeStyle(8 * s, PALETTE.ink);
    c.add([shade, panel]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.over = c;
    this.btns.forEach((b) => b.c.setVisible(false));
    this.dropTutorial();
    return { c, w, h, s };
  }

  /** "Give up" panel (breakEgg): replay, levels, or skip the level with a rewarded ad. */
  private showOver(r: OverInfo) {
    const { c, w, h, s } = this.panel(230);
    const door = this.add.image(w / 2 - 120 * s, h / 2 - 46 * s, 'ic-door').setDisplaySize(90 * s, 90 * s);
    const lvl = bigNumber(this, w / 2 - 40 * s, h / 2 - 44 * s, 72 * s, `${r.level}`);
    const splat = this.add.image(w / 2 + 70 * s, h / 2 - 44 * s, 'ic-splat').setDisplaySize(70 * s, 70 * s);
    const d = bigNumber(this, w / 2 + 110 * s, h / 2 - 42 * s, 56 * s, `${r.deaths}`).setOrigin(0, 0.5);
    c.add([door, lvl, splat, d]);
    const by = h / 2 + 135 * s;
    const replay = iconButton(this, w / 2, by, 'replay', PALETTE.green, 62 * s, () => this.restart());
    pulse(this, replay, 0.05);
    c.add([replay, iconButton(this, w / 2 - 150 * s, by + 10 * s, 'grid', PALETTE.purple, 40 * s, () => this.home())]);
    if (r.canSkip) {
      const sk = iconButton(this, w / 2 + 150 * s, by + 10 * s, 'video', 0xff8a4c, 42 * s, () => this.skip());
      c.add([sk, this.add.image(sk.x + 34 * s, sk.y - 36 * s, 'ic-skip').setDisplaySize(36 * s, 36 * s).setTint(PALETTE.ink)]);
    }
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  private showDone(r: DoneInfo) {
    const { c, w, h, s } = this.panel(250);
    const top = h / 2 - 30 * s - 125 * s;
    const sy = top + 62 * s;
    for (let k = 0; k < 3; k++) {
      const on = r.stars > k;
      const st = this.add.image(w / 2 + (k - 1) * 110 * s, sy - (k === 1 ? 14 : 0) * s, on ? 'ic-star' : 'ic-star-off').setDisplaySize(10, 10);
      c.add(st);
      this.tweens.add({ targets: st, displayWidth: 100 * s, displayHeight: 100 * s, delay: 150 + k * 220, duration: 260, ease: 'Back.out',
        onStart: () => { if (on) audio.tone(660 + k * 180, 0.14, 'triangle', 0.14, 1200 + k * 200); } });
    }
    const ry = top + 165 * s;
    // deaths, best and the coins this level paid (2 per star)
    const splat = this.add.image(w / 2 - 200 * s, ry, 'ic-splat').setDisplaySize(64 * s, 64 * s);
    const d = bigNumber(this, w / 2 - 162 * s, ry + 2 * s, 60 * s, `${r.deaths}`).setOrigin(0, 0.5);
    const trophy = this.add.image(w / 2 - 36 * s, ry, 'ic-trophy').setDisplaySize(50 * s, 50 * s).setTint(0xf2a900);
    const best = bigNumber(this, w / 2 - 6 * s, ry + 2 * s, 42 * s, `${r.best}`).setOrigin(0, 0.5);
    const coinIc = this.add.image(w / 2 + 116 * s, ry, 'ic-coin').setDisplaySize(52 * s, 52 * s);
    const coinN = bigNumber(this, coinIc.x + 32 * s, ry + 2 * s, 46 * s, `+${r.coins}`).setOrigin(0, 0.5);
    c.add([splat, d, trophy, best, coinIc, coinN]);
    // ×2 coins with a rewarded ad (once per level), on the top edge of the panel, away from the buttons
    this.dbl = null;
    if (r.canDouble) {
      this.dbl = doubleButton(this, {
        x: w / 2, y: top - 52 * s, s, currencyIcon: 'ic-coin', earned: r.coins,
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
        x: { min: 0, max: w }, speedY: { min: 80, max: 260 }, lifespan: 2200, scale: { start: 0.22 * s, end: 0.12 * s },
        rotate: { min: 0, max: 360 }, gravityY: 300, emitting: false,
      }).setDepth(31);
      burst.explode(22);
      this.time.delayedCall(2600, () => burst.destroy());
    }
    const by = h / 2 + 140 * s;
    const levels = iconButton(this, w / 2 - 150 * s, by + 10 * s, 'grid', PALETTE.purple, 40 * s, () => this.home());
    const replay = iconButton(this, r.last ? w / 2 : w / 2 + 150 * s, r.last ? by : by + 10 * s, 'replay', PALETTE.blue, (r.last ? 62 : 40) * s, () => this.restart());
    c.add([levels, replay]);
    if (!r.last) {
      const next = iconButton(this, w / 2, by, 'play', PALETTE.green, 62 * s, () => this.next());
      pulse(this, next, 0.05);
      c.add(next);
      this.input.keyboard?.once('keydown-SPACE', () => this.next());
    } else {
      pulse(this, replay, 0.05);
      this.input.keyboard?.once('keydown-SPACE', () => this.restart());
    }
  }

  /** ×2 button of the level-complete panel (the automatic test presses it too). */
  dbl: ReturnType<typeof doubleButton> = null;

  private dropTutorial() {
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
  }

  /* -------------------------------------------------------------- actions */

  /** Same level from scratch, deaths back to 0 (one click; no ad). */
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

  /** The rewarded ad of this game: skip the level. (Named revive() too, for scripts/sdk-test.mjs.) */
  async skip() {
    if (this.busy || !portal.hasRewarded || this.play.level >= LEVELS.length) return;
    this.busy = true;
    const wasAlive = this.play.alive;
    this.play.alive = false;
    portal.gameplayStop();
    const ok = await portal.rewardedBreak();
    if (!this.scene.isActive()) return;
    if (!ok) {
      this.busy = false;
      if (wasAlive && !this.over) { this.play.alive = true; portal.gameplayStart(); }
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
