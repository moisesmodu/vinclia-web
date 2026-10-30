import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save, season } from '../state';
import { ITEMS, DEFAULTS, DAILY, refreshClub } from '../cosmeticos';

/** Title screen: art, play, titles won, coins, division, shop, daily reward and sound. No text but the name. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    portal.gameplayStop();
    const bg = this.add.image(0, 0, 'menu-bg').setOrigin(0.5);
    const shadeTop = this.add.rectangle(0, 0, 10, 10, 0x2b2340, 0.18).setOrigin(0, 0);
    const logo = this.add.text(0, 0, 'PENALTY SEASON', {
      fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif',
      fontSize: '96px', color: '#ffd23f', stroke: '#2b2340', strokeThickness: 16, align: 'center',
      shadow: { offsetX: 0, offsetY: 8, color: '#2b2340', fill: true, blur: 0, stroke: true },
    }).setOrigin(0.5);
    this.tweens.add({ targets: logo, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);
    const se = season();
    const cup = this.add.image(0, 0, `div-${se.div}`);
    const trophy = this.add.image(0, 0, 'ic-trophy');
    const best = bigNumber(this, 0, 0, 44, `${save.get('best')}`).setOrigin(0, 0.5);
    const coin = this.add.image(0, 0, 'ic-coin');
    const coins = bigNumber(this, 0, 0, 44, `${save.get('coins')}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'ic-coin', items: ITEMS, defaults: DEFAULTS, daily: DAILY,
      onChange: () => refreshClub(this),
      onWallet: (n) => coins.setText(`${n}`),
    });

    this.input.keyboard?.on('keydown-SPACE', () => { if (!modalOpen(this)) this.go(); });
    this.input.keyboard?.on('keydown-ENTER', () => { if (!modalOpen(this)) this.go(); });

    const layout = () => {
      const w = this.scale.width, h = this.scale.height, portrait = h > w;
      bg.setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      shadeTop.setSize(w, h);
      const u = Math.min(w / 1280, h / 720);
      logo.setText(portrait ? 'PENALTY\nSEASON' : 'PENALTY SEASON').setLineSpacing(-10);
      logo.setPosition(w / 2, h * (portrait ? 0.17 : 0.15)).setScale(Math.min(portrait ? 0.95 : 1.5, (w * 0.9) / logo.width, Math.max(0.45, u * (portrait ? 1.6 : 1.1))));
      play.setPosition(w / 2, h * (portrait ? 0.47 : 0.46)).setScale(Math.max(0.7, u * 1.1));
      const s = Math.max(0.6, u);
      const rowY = play.y + (portrait ? 125 : 108) * Math.max(0.7, u * 1.1);
      cup.setPosition(w / 2 - 170 * s, rowY).setDisplaySize(62 * s, 62 * s);
      trophy.setPosition(w / 2 - 95 * s, rowY).setDisplaySize(52 * s, 52 * s);
      best.setPosition(trophy.x + 32 * s, rowY).setScale(s);
      coin.setPosition(w / 2 + 40 * s, rowY).setDisplaySize(50 * s, 50 * s);
      coins.setPosition(coin.x + 32 * s, rowY).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
      extras.place(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  /** Play: to the season screen (also called by the automatic tests). */
  go() {
    if (this.going) return;
    this.going = true;
    const sm = this.sound as Phaser.Sound.WebAudioSoundManager;
    (sm as any).context?.resume?.();
    if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.4 }).play();
    this.cameras.main.fadeOut(160, 127, 208, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Hub'); this.going = false; });
  }
}
