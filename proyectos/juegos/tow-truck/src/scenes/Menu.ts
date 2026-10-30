import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyLook } from '../cosmeticos';

/** Pantalla de inicio: arte, botón de jugar, récord, monedas, tienda y sonido. Sin texto salvo el nombre. */
export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    portal.gameplayStop();
    const bg = this.textures.exists('menu-bg') ? this.add.image(0, 0, 'menu-bg').setOrigin(0.5) : null;
    if (!bg) this.add.image(0, 0, 'sky').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    const logo = this.add.text(0, 0, 'TOW TRUCK', {
      fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif',
      fontSize: '96px', color: '#ffffff', stroke: '#3a1f4a', strokeThickness: 16,
      shadow: { offsetX: 0, offsetY: 8, color: '#3a1f4a', fill: true, blur: 0, stroke: true },
    }).setOrigin(0.5);
    logo.setTint(0xfff6c8, 0xfff6c8, 0xffc23a, 0xffc23a);
    this.tweens.add({ targets: logo, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);

    const trophy = this.add.image(0, 0, 'ic-trophy');
    const best = bigNumber(this, 0, 0, 44, `${save.get('best')}`).setOrigin(0, 0.5);
    const coin = this.add.image(0, 0, 'ic-coin');
    const coins = bigNumber(this, 0, 0, 44, `${save.get('coins')}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });

    // tienda de cosméticos (esquina inferior izquierda) y recompensa diaria
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'ic-coin', items: ITEMS, defaults: DEFAULTS, daily: DAILY, color: 0xff8a2a, panel: 0xfff6e8,
      onChange: () => applyLook(this), onWallet: (n) => coins.setText(`${n}`),
    });

    this.input.keyboard?.on('keydown-SPACE', () => { if (!modalOpen(this)) this.go(); });
    this.input.keyboard?.on('keydown-ENTER', () => { if (!modalOpen(this)) this.go(); });

    const layout = () => {
      const w = this.scale.width, h = this.scale.height;
      // en vertical se recorta hacia la grúa (a la derecha del arte)
      bg?.setOrigin(h > w ? 0.68 : 0.5, 0.5).setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      const u = Math.min(w / 1280, h / 720);
      const portrait = h > w;
      logo.setPosition(portrait ? w / 2 : w * 0.3, h * (portrait ? 0.13 : 0.22)).setScale(portrait ? Math.min(u * 1.5, (w - 40) / 660) : Math.max(0.42, Math.min(u, w / 1100)));
      play.setPosition(portrait ? w / 2 : w * 0.3, h * (portrait ? 0.34 : 0.55)).setScale(Math.max(0.7, u * 1.1));
      const s = Math.max(0.6, u);
      const rowY = play.y + 120 * Math.max(0.7, u * 1.1);
      trophy.setPosition(play.x - (90 + best.width * 0.5) * s, rowY).setDisplaySize(52 * s, 52 * s);
      best.setPosition(trophy.x + 34 * s, rowY).setScale(s);
      coin.setPosition(Math.max(play.x + 50 * s, best.x + best.displayWidth + 34 * s), rowY).setDisplaySize(48 * s, 48 * s);
      coins.setPosition(coin.x + 34 * s, rowY).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
      extras.place(s);
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
    this.cameras.main.fadeOut(180, 255, 154, 90);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Play');
      this.going = false;
    });
  }
}
