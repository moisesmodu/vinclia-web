import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save, totalStars, nextLevel } from '../state';
import { LEVELS } from '../levels';
import { ITEMS, DEFAULTS, DAILY, applyCandy } from '../cosmeticos';

/** Starts the music the first time the player presses something (browsers require it). */
export function startMusic(scene: Phaser.Scene) {
  ((scene.sound as any).context as AudioContext | undefined)?.resume?.();
  if (scene.cache.audio.exists('music') && !scene.sound.get('music')) scene.sound.add('music', { loop: true, volume: 0.4 }).play();
}

/** Title screen: art, play (next level), level select, stars, coins + shop, sound. No text except the name. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    portal.gameplayStop();
    const bg = this.add.image(0, 0, 'menu-bg');
    const logo = this.add.text(0, 0, 'ROPE CUT', {
      fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif',
      fontSize: '110px', color: '#ffd23f', stroke: '#2b2340', strokeThickness: 20,
      shadow: { offsetX: 0, offsetY: 10, color: '#2b2340', fill: true, blur: 0, stroke: true },
    }).setOrigin(0.5);
    this.tweens.add({ targets: logo, angle: { from: -2.5, to: 2.5 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);
    const lvl = bigNumber(this, 0, 0, 34, `${nextLevel()}`);
    const levels = iconButton(this, 0, 0, 'grid', PALETTE.purple, 40, () => this.levels());
    const star = this.add.image(0, 0, 'ic-star');
    const stars = bigNumber(this, 0, 0, 44, `${totalStars()}/${LEVELS.length * 3}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });

    // cosmetics shop (bottom left, coins next to it) and daily reward
    const coin = this.add.image(0, 0, 'ic-coin');
    const coins = bigNumber(this, 0, 0, 40, `${save.get('coins')}`).setOrigin(0, 0.5);
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'ic-coin', items: ITEMS, defaults: DEFAULTS, daily: DAILY, panel: 0xf2fbff,
      onChange: () => applyCandy(this), onWallet: (n) => coins.setText(`${n}`),
    });

    this.input.keyboard?.on('keydown-SPACE', () => { if (!modalOpen(this)) this.go(); });
    this.input.keyboard?.on('keydown-ENTER', () => { if (!modalOpen(this)) this.go(); });

    const layout = () => {
      const w = this.scale.width, h = this.scale.height, portrait = h > w;
      // in portrait the monster (right side of the art) stays in frame
      bg.setOrigin(portrait ? 0.8 : 0.5, 0.5).setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      const u = Math.min(w / 1280, h / 720);
      const cx = portrait ? w / 2 : w * 0.33;
      logo.setPosition(cx, h * (portrait ? 0.14 : 0.22)).setScale(portrait ? Math.min(1, (w - 36) / logo.width) : Math.max(0.38, Math.min(u, w / 1100)));
      const ps = Math.max(0.7, u * 1.1);
      play.setPosition(cx, h * (portrait ? 0.36 : 0.53)).setScale(ps);
      lvl.setPosition(play.x + 54 * ps, play.y - 52 * ps).setScale(ps);
      const s = Math.max(0.6, u);
      const rowY = play.y + 120 * ps;
      levels.setPosition(cx - 100 * s, rowY).setScale(s);
      star.setPosition(cx - 28 * s, rowY).setDisplaySize(50 * s, 50 * s);
      stars.setPosition(star.x + 32 * s, rowY).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
      extras.place(s);
      coin.setPosition(extras.shop.x + 70 * s, extras.shop.y).setDisplaySize(44 * s, 44 * s);
      coins.setPosition(coin.x + 28 * s, coin.y + 2 * s).setScale(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  /** Play the next unfinished level (also used by the test scripts). */
  go(level = nextLevel()) {
    if (this.going) return;
    this.going = true;
    startMusic(this);
    this.cameras.main.fadeOut(160, 223, 241, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Play', { level, transition: true }));
  }

  private levels() {
    if (this.going || modalOpen(this)) return;
    startMusic(this);
    this.scene.start('Levels');
  }
}
