import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { save } from '../state';

/** Pantalla de inicio: arte, botón de jugar, récord, estrellas y sonido. Sin texto salvo el nombre. */
export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    portal.gameplayStop();
    const bg = this.add.image(0, 0, 'menu-bg').setOrigin(0.5);
    const logo = this.add.text(0, 0, 'EGG TRUCK', {
      fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif',
      fontSize: '96px', color: '#ffd23f', stroke: '#2b2340', strokeThickness: 16,
      shadow: { offsetX: 0, offsetY: 8, color: '#2b2340', fill: true, blur: 0, stroke: true },
    }).setOrigin(0.5);
    this.tweens.add({ targets: logo, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);

    const trophy = this.add.image(0, 0, 'ic-trophy');
    const best = bigNumber(this, 0, 0, 44, `${save.get('best')}`).setOrigin(0, 0.5);
    const star = this.add.image(0, 0, 'ic-star');
    const stars = bigNumber(this, 0, 0, 44, `${save.get('stars')}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.go());
    this.input.keyboard?.on('keydown-ENTER', () => this.go());

    const layout = () => {
      const w = this.scale.width, h = this.scale.height;
      // en vertical se encuadra la camioneta (lado derecho del fondo)
      bg.setOrigin(h > w ? 0.72 : 0.5, 0.5).setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      const u = Math.min(w / 1280, h / 720) * 1.0;
      const portrait = h > w;
      logo.setPosition(portrait ? w / 2 : w * 0.3, h * (portrait ? 0.18 : 0.22)).setScale(Math.max(0.45, Math.min(u * (portrait ? 1.5 : 1), w / 1100)));
      play.setPosition(portrait ? w / 2 : w * 0.3, h * (portrait ? 0.42 : 0.55)).setScale(Math.max(0.7, u * 1.1));
      // récord y estrellas bajo el botón de jugar
      const s = Math.max(0.6, u);
      const rowY = play.y + 120 * Math.max(0.7, u * 1.1);
      trophy.setPosition(play.x - 110 * s, rowY).setDisplaySize(52 * s, 52 * s);
      best.setPosition(trophy.x + 34 * s, rowY).setScale(s);
      star.setPosition(play.x + 40 * s, rowY).setDisplaySize(50 * s, 50 * s);
      stars.setPosition(star.x + 34 * s, rowY).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  private going = false;
  private go() {
    if (this.going) return;
    this.going = true;
    const sm = this.sound as Phaser.Sound.WebAudioSoundManager;
    (sm as any).context?.resume?.();
    if (!this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.45 }).play();
    this.cameras.main.fadeOut(180, 108, 200, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Play');
      this.going = false;
    });
  }
}
