import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import { BH, SLICE } from '../config';
import type { Play } from './Play';

type OverInfo = { score: number; best: number; newBest: boolean; canRevive: boolean; stars: number; canDouble: boolean };

/**
 * UI layer above the run (no zoom): height, best, stars, sound, 10 s tutorial hand and the end screen with
 * one-click restart. It also takes the tap (anywhere that is not a button) and passes it to Play.drop().
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialLeft = 0;   // ms (countdown by frame delta: the scene clock's 'now' is 0 inside create())
  over?: Phaser.GameObjects.Container;
  private layoutFns: (() => void)[] = [];
  private busy = false;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.layoutFns = [];
    this.over = undefined;
    this.tutorial = undefined;
    this.busy = false;

    const score = bigNumber(this, 0, 0, 84, '0');
    const bestMark = this.add.image(0, 0, 'ic-trophy');
    const bestTxt = bigNumber(this, 0, 0, 28, `${save.get('best')}`).setOrigin(0, 0.5);
    const starIc = this.add.image(0, 0, 'ic-star');
    const stars = bigNumber(this, 0, 0, 40, '0').setOrigin(0, 0.5);
    const combo = bigNumber(this, 0, 0, 40, '').setColor('#ffd23f').setAlpha(0);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      score.setPosition(w / 2, 62 * s).setScale(s);
      bestMark.setPosition(w / 2 - 20 * s, 122 * s).setDisplaySize(32 * s, 32 * s);
      bestTxt.setPosition(w / 2 + 2 * s, 123 * s).setScale(s);
      starIc.setPosition(44 * s, 44 * s).setDisplaySize(46 * s, 46 * s);
      stars.setPosition(74 * s, 46 * s).setScale(s);
      combo.setPosition(w / 2, 170 * s);
      sound.setPosition(w - 46 * s, 46 * s).setScale(s);
    });

    this.play.events.on('score', (n: number) => {
      score.setText(`${n}`);
      const base = this.ui();
      this.tweens.killTweensOf(score);
      score.setScale(base * 1.25);
      this.tweens.add({ targets: score, scale: base, duration: 160, ease: 'Back.out' });
    });
    this.play.events.on('perfect', (c: number, n: number) => {
      stars.setText(`${n}`);
      const base = (46 * this.ui()) / starIc.width;
      this.tweens.killTweensOf(starIc);
      starIc.setScale(base);
      this.tweens.add({ targets: starIc, scale: base * 1.3, duration: 90, yoyo: true });
      if (c >= 2) {
        const s = this.ui();
        combo.setText(`×${c}`).setAlpha(1).setScale(0.4 * s).setY(170 * s);
        this.tweens.killTweensOf(combo);
        this.tweens.add({ targets: combo, scale: (c >= 5 ? 1.3 : 1) * s, duration: 200, ease: 'Back.out' });
        this.tweens.add({ targets: combo, alpha: 0, y: 150 * s, delay: 600, duration: 300 });
      }
    });
    this.play.events.on('dropped', () => this.endTutorial());
    this.play.events.on('over', (r: OverInfo) => this.showOver(r));

    // the one input: tap anywhere that is not a button
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, hit: Phaser.GameObjects.GameObject[]) => {
      if (hit.length === 0 && !this.over) this.play.drop();
    });
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['score', 'perfect', 'dropped', 'over']) this.play.events.off(ev);
    });

    if (!save.get('tutorialDone') || save.get('runs') <= 2) this.showTutorial();
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1100, this.scale.height / 640), 0.6, 1.4); }
  private layout() { for (const f of this.layoutFns) f(); }

  /* ------------------------------------------------------------ tutorial (10 s, no text) */

  private showTutorial() {
    const c = this.add.container(0, 0).setDepth(20);
    const ring = this.add.circle(0, 0, 46, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.9);
    const hand = this.add.image(12, -10, 'ic-hand').setDisplaySize(110, 110).setOrigin(0.45, 0.05);
    // a little "drop" arrow above the hand: tap = drop the jelly
    const arrow = this.add.image(0, -120, 'ic-play').setDisplaySize(64, 64).setAngle(90).setTint(PALETTE.yellow);
    c.add([ring, hand, arrow]);
    this.tutorial = c;
    this.tutorialLeft = 10000;
    this.tweens.add({ targets: hand, y: 4, duration: 220, yoyo: true, repeat: -1, ease: 'Sine.inOut', repeatDelay: 380 });
    this.tweens.add({ targets: ring, scale: 1.35, alpha: 0.2, duration: 440, repeat: -1, repeatDelay: 380 });
    this.tweens.add({ targets: arrow, y: -96, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.layoutFns.push(() => {
      // beside the tower in landscape, under the slider in portrait
      const w = this.scale.width, h = this.scale.height;
      c.setPosition(h > w ? w / 2 : w * 0.8, h * (h > w ? 0.6 : 0.5)).setScale(this.ui());
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
    this.tutorialLeft -= dt;
    if (this.tutorialLeft <= 0) this.endTutorial();
  }

  /* ------------------------------------------------------------ end of run */

  private showOver(r: OverInfo) {
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    const w = this.scale.width, h = this.scale.height, s = Math.min(this.ui(), (w - 24) / 540);
    const c = this.add.container(0, 0).setDepth(30);
    this.over = c;
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.45).setInteractive();
    const panel = this.add.rectangle(w / 2, h / 2 - 20 * s, 520 * s, 300 * s, 0xffffff, 0.96).setStrokeStyle(8 * s, PALETTE.ink);
    // a tiny dizzy jelly next to the height
    const jelly = this.add.nineslice(w / 2 - 160 * s, h / 2 - 50 * s, 'jelly0', undefined, 130, BH, SLICE, SLICE, 0, 0)
      .setOrigin(0.5, 1).setScale(0.9 * s);
    const face = this.add.image(jelly.x, jelly.y - BH * 0.5 * 0.9 * s, 'face-oh').setScale(0.8 * s);
    this.tweens.add({ targets: [jelly], scaleY: 0.8 * s, scaleX: 1.0 * s, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const score = bigNumber(this, w / 2 + 50 * s, h / 2 - 82 * s, 104 * s, `${r.score}`);
    const trophy = this.add.image(w / 2 - 150 * s, h / 2 + 30 * s, 'ic-trophy').setDisplaySize(52 * s, 52 * s);
    const best = bigNumber(this, w / 2 - 116 * s, h / 2 + 32 * s, 46 * s, `${r.best}`).setOrigin(0, 0.5);
    const starIc = this.add.image(w / 2 + 70 * s, h / 2 + 30 * s, 'ic-star').setDisplaySize(50 * s, 50 * s);
    const starN = bigNumber(this, w / 2 + 104 * s, h / 2 + 32 * s, 46 * s, `+${r.stars}`).setOrigin(0, 0.5);
    c.add([shade, panel, jelly, face, score, trophy, best, starIc, starN]);
    if (r.newBest) {
      const burst = this.add.particles(w / 2, h / 2 - 80 * s, 'ic-star', {
        speed: { min: 200, max: 520 }, lifespan: 1000, scale: { start: 0.35 * s, end: 0 }, gravityY: 500, emitting: false,
      });
      burst.explode(26);
      c.add(burst);
      this.tweens.add({ targets: [trophy, best], scale: '*=1.2', duration: 300, yoyo: true, repeat: 2 });
      audio.tone(523, 0.12, 'square', 0.1); this.time.delayedCall(120, () => audio.tone(659, 0.12, 'square', 0.1));
      this.time.delayedCall(240, () => audio.tone(784, 0.25, 'square', 0.1));
    }

    // restart in one click (big button), revive with an ad (if the portal offers it), back to the menu
    const by = h / 2 + 175 * s;
    const replay = iconButton(this, w / 2, by, 'replay', PALETTE.green, 62 * s, () => this.restart());
    pulse(this, replay, 0.05);
    const home = iconButton(this, w / 2 - 150 * s, by + 10 * s, 'home', PALETTE.purple, 38 * s, () => this.home());
    c.add([replay, home]);
    if (r.canRevive) {
      const rev = iconButton(this, w / 2 + 150 * s, by + 10 * s, 'video', PALETTE.yellow, 44 * s, () => this.revive());
      c.add(rev);
    }
    // ×2 stars with a rewarded ad (once per run), on the top edge of the panel
    this.dbl = null;
    if (r.canDouble) {
      this.dbl = doubleButton(this, {
        x: w / 2, y: h / 2 - 200 * s, s, currencyIcon: 'ic-star', earned: r.stars,
        onDoubled: () => {
          const extra = this.play.doubleStars();
          starN.setText(`+${r.stars + extra}`);
          this.tweens.add({ targets: [starIc, starN], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (this.dbl) c.add(this.dbl);
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  /** ×2 button of the game-over panel (the automated test presses it too). */
  dbl: ReturnType<typeof doubleButton> = null;

  restart() {
    if (this.busy) return;
    this.busy = true;
    this.play.scene.restart(); // the interstitial is requested when the run starts
  }

  async revive() {
    if (this.busy) return;
    this.busy = true;
    const ok = await portal.rewardedBreak();
    this.busy = false;
    if (!ok) return;
    this.over?.destroy();
    this.over = undefined;
    this.input.keyboard?.removeAllListeners('keydown-SPACE');
    this.play.revive();
  }

  home() {
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}
