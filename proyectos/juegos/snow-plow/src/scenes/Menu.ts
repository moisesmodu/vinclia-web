import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { save } from '../state';

/** Pantalla de inicio: arte, botón de jugar, récord, regalos entregados en total y sonido. Sin texto salvo el nombre. */
export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    portal.gameplayStop();
    const bg = this.textures.exists('menu-bg') ? this.add.image(0, 0, 'menu-bg').setOrigin(0.5) : null;
    if (!bg) this.add.image(0, 0, 'sky').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    const logo = this.add.text(0, 0, 'SNOW PLOW', {
      fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif',
      fontSize: '96px', color: '#ffffff', stroke: '#2b2340', strokeThickness: 16,
      shadow: { offsetX: 0, offsetY: 8, color: '#2b2340', fill: true, blur: 0, stroke: true },
    }).setOrigin(0.5);
    logo.setTint(0xffffff, 0xffffff, 0x9be3ff, 0x9be3ff);
    this.tweens.add({ targets: logo, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);

    const trophy = this.add.image(0, 0, 'ic-trophy');
    const best = bigNumber(this, 0, 0, 44, `${save.get('best')}`).setOrigin(0, 0.5);
    const gift = this.add.image(0, 0, 'gift0');
    const gifts = bigNumber(this, 0, 0, 44, `${save.get('gifts')}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    // nieve también en el menú
    this.add.particles(0, -12, 'flake', {
      x: { onEmit: () => Math.random() * this.scale.width }, speedY: { min: 40, max: 95 }, speedX: { min: -25, max: 15 },
      lifespan: 9000, scale: { min: 0.25, max: 0.7 }, alpha: { min: 0.5, max: 0.95 }, frequency: 140, maxAliveParticles: 50,
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.go());
    this.input.keyboard?.on('keydown-ENTER', () => this.go());

    const layout = () => {
      const w = this.scale.width, h = this.scale.height;
      // en vertical: cielo libre para el botón y la pala con los regalos asomando a la derecha
      bg?.setOrigin(h > w ? 0.56 : 0.5, 0.5).setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      const u = Math.min(w / 1280, h / 720);
      const portrait = h > w;
      logo.setPosition(portrait ? w / 2 : w * 0.3, h * (portrait ? 0.18 : 0.22)).setScale(Math.max(0.45, Math.min(u * (portrait ? 1.5 : 1), w / 1100)));
      play.setPosition(portrait ? w / 2 : w * 0.3, h * (portrait ? 0.42 : 0.55)).setScale(Math.max(0.7, u * 1.1));
      const s = Math.max(0.6, u);
      const rowY = play.y + 120 * Math.max(0.7, u * 1.1);
      trophy.setPosition(play.x - 110 * s, rowY).setDisplaySize(52 * s, 52 * s);
      best.setPosition(trophy.x + 34 * s, rowY).setScale(s);
      gift.setPosition(play.x + 40 * s, rowY).setDisplaySize(48 * s, 48 * s);
      gifts.setPosition(gift.x + 34 * s, rowY).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  private going = false;
  go() {
    if (this.going) return;
    this.going = true;
    const sm = this.sound as Phaser.Sound.WebAudioSoundManager;
    (sm as any).context?.resume?.();
    if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.45 }).play();
    this.cameras.main.fadeOut(180, 19, 35, 90);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Play');
      this.going = false;
    });
  }
}
