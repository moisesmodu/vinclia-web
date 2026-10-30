import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyCosmetics } from '../cosmeticos';

/** Inicio: fondo, título, jugar, monedas ganadas (trofeo), estrellas, puesto actual, tienda, diario y sonido. */
export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }
  private going = false;

  create() {
    this.going = false;
    portal.gameplayStop();
    const bg = this.add.image(0, 0, 'menu-bg');
    const logo = this.add.text(0, 0, 'FRUIT STAND', {
      fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif',
      fontSize: '96px', color: '#ffd23f', stroke: '#2b2340', strokeThickness: 16,
      shadow: { offsetX: 0, offsetY: 8, color: '#2b2340', fill: true, blur: 0, stroke: true },
    }).setOrigin(0.5);
    this.tweens.add({ targets: logo, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);
    const trophy = this.add.image(0, 0, 'ic-trophy');
    const best = bigNumber(this, 0, 0, 40, `${save.get('best')}`).setOrigin(0, 0.5);
    const star = this.add.image(0, 0, 'ic-star');
    const stars = bigNumber(this, 0, 0, 40, `${save.get('stars')}`).setOrigin(0, 0.5);
    // puesto actual (1-3) y prestigio
    const g = save.get('game');
    const badge = this.add.circle(0, 0, 30, PALETTE.yellow).setStrokeStyle(6, PALETTE.ink);
    const standN = bigNumber(this, 0, 0, 36, `${(g.stand | 0) + 1}`);
    const pres = g.prestige ? bigNumber(this, 0, 0, 26, `×${1 + 0.5 * g.prestige}`) : null;
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle(); save.set('muted', m); sound.setIcon(m ? 'mute' : 'sound');
    });
    const extras = menuExtras(this, {
      save, currency: 'stars', currencyIcon: 'ic-star', items: ITEMS, defaults: DEFAULTS, daily: DAILY,
      onChange: () => applyCosmetics(this),
      onWallet: (n) => stars.setText(`${n}`),
    });
    this.input.keyboard?.on('keydown-SPACE', () => { if (!modalOpen(this)) this.go(); });
    this.input.keyboard?.on('keydown-ENTER', () => { if (!modalOpen(this)) this.go(); });

    const layout = () => {
      const w = this.scale.width, h = this.scale.height, portrait = h > w;
      // en vertical se encuadra el centro del fondo (hierba vacía) con el puesto a la derecha
      bg.setOrigin(portrait ? 0.7 : 0.5, 0.5).setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      const u = Math.min(w / 1280, h / 720);
      const cx = portrait ? w / 2 : w * 0.36;
      logo.setPosition(cx, h * (portrait ? 0.17 : 0.2)).setScale(Math.max(0.36, Math.min(u * (portrait ? 1.5 : 1), (w * 0.92) / 760)));
      play.setPosition(cx, h * (portrait ? 0.45 : 0.53)).setScale(Math.max(0.7, u * 1.1));
      const s = Math.max(0.6, u);
      const rowY = play.y + 118 * Math.max(0.7, u * 1.1);
      trophy.setPosition(cx - 130 * s, rowY).setDisplaySize(50 * s, 50 * s);
      best.setPosition(trophy.x + 32 * s, rowY).setScale(s);
      star.setPosition(cx + 50 * s, rowY).setDisplaySize(48 * s, 48 * s);
      stars.setPosition(star.x + 32 * s, rowY).setScale(s);
      badge.setPosition(cx - 140 * s * Math.max(0.7, u * 1.1) / s, play.y).setScale(s);
      standN.setPosition(badge.x, badge.y + 2 * s).setScale(s);
      pres?.setPosition(badge.x, badge.y + 44 * s).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
      extras.place(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  /** Empezar (también lo llama la prueba del SDK). */
  go() {
    if (this.going) return;
    this.going = true;
    ((this.sound as any).context as AudioContext | undefined)?.resume?.();
    if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.4 }).play();
    this.cameras.main.fadeOut(180, 95, 181, 74);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Play'); this.going = false; });
  }
}
