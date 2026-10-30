import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, playerSkinKey } from '../cosmeticos';

/** Pantalla de inicio: arte, nombre a todo color, jugar, récord, gotas, tienda, recompensa diaria y sonido. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    portal.gameplayStop();
    const bg = this.add.image(0, 0, 'menu-bg').setOrigin(0.5);
    // nombre: cada letra de un color de pintura, con contorno grueso y un baile suave
    const logo = this.add.container(0, 0);
    const colors = ['#ff5fa8', '#4aa8ff', '#ffc928', '#3ddc84', '#9b6bff', '#ff8a3d', '#22cfc0', '#ff4f5e', '#4aa8ff'];
    const lines = ['PAINT', 'GRAB'];
    let ci = 0;
    lines.forEach((word, li) => {
      const letters = word.split('').map((ch) => this.add.text(0, 0, ch, {
        fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif', fontSize: '112px',
        color: colors[ci++ % colors.length], stroke: '#2b2340', strokeThickness: 18,
        shadow: { offsetX: 0, offsetY: 9, color: '#2b2340', fill: true, blur: 0, stroke: true },
      }).setOrigin(0.5));
      const total = letters.reduce((a, t) => a + t.width - 14, 0);
      let x = -total / 2;
      letters.forEach((t, k) => {
        t.setPosition(x + (t.width - 14) / 2, li * 112 - 56).setAngle(k % 2 ? 4 : -4);
        x += t.width - 14;
        this.tweens.add({ targets: t, y: t.y - 8, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: k * 90 + li * 300 });
        logo.add(t);
      });
    });
    const hero = this.add.image(0, 0, playerSkinKey());
    const face = this.add.image(0, 0, 'face-happy');

    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);
    const trophy = this.add.image(0, 0, 'ic-trophy');
    const best = bigNumber(this, 0, 0, 44, `${save.get('best').toFixed(1)}%`).setOrigin(0, 0.5);
    const drop = this.add.image(0, 0, 'ic-drop');
    const drops = bigNumber(this, 0, 0, 44, `${save.get('drops')}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle(); save.set('muted', m); sound.setIcon(m ? 'mute' : 'sound');
    });
    const extras = menuExtras(this, {
      save, currency: 'drops', currencyIcon: 'ic-drop', items: ITEMS, defaults: DEFAULTS, daily: DAILY,
      onWallet: (n) => drops.setText(`${n}`),
      onChange: () => hero.setTexture(playerSkinKey()),
    });
    this.tweens.add({ targets: [hero, face], y: '-=10', duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.input.keyboard?.on('keydown-SPACE', () => { if (!modalOpen(this)) this.go(); });
    this.input.keyboard?.on('keydown-ENTER', () => { if (!modalOpen(this)) this.go(); });

    const layout = () => {
      const w = this.scale.width, h = this.scale.height, portrait = h > w;
      bg.setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      const u = Math.min(w / 1280, h / 720);
      const ls = portrait ? Math.min(w / 700, h / 1100) : Math.max(0.42, u * 0.95);
      logo.setPosition(w / 2, h * (portrait ? 0.2 : 0.22)).setScale(ls);
      const ps = Math.max(0.7, portrait ? Math.min(w / 520, 1.2) : u * 1.1);
      play.setPosition(w / 2, h * (portrait ? 0.52 : 0.6)).setScale(ps);
      // en vertical el fondo se recorta por el centro (sin sus pintores): sale uno entre el nombre y el botón
      const hs = Math.min(w / 520, 1.3);
      hero.setVisible(portrait).setPosition(w / 2, (logo.y + 120 * ls + play.y - 80 * ps) / 2).setScale(hs);
      face.setVisible(portrait).setPosition(hero.x, hero.y + 4 * hs).setScale(hs);
      const s = Math.max(0.6, Math.min(u, portrait ? w / 560 : 2));
      const rowY = play.y + 120 * ps;
      trophy.setPosition(play.x - 150 * s, rowY).setDisplaySize(52 * s, 52 * s);
      best.setPosition(trophy.x + 34 * s, rowY).setScale(s);
      drop.setPosition(play.x + 50 * s, rowY).setDisplaySize(50 * s, 50 * s);
      drops.setPosition(drop.x + 32 * s, rowY).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
      extras.place(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  /** Empezar a jugar (también lo llaman las pruebas automáticas). */
  go() {
    if (this.going) return;
    this.going = true;
    const sm = this.sound as Phaser.Sound.WebAudioSoundManager;
    (sm as any).context?.resume?.();
    if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.4 }).play();
    this.cameras.main.fadeOut(180, 154, 163, 180);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Play', { round: 1 });
      this.going = false;
    });
  }
}
