import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyLook } from '../cosmeticos';

/** Pantalla de inicio (común): fondo, nombre, jugar, récord, monedas, tienda, recompensa diaria y sonido. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    menuScreen(this, {
      title: 'HOOP BOUNCE',
      background: this.textures.exists('menu-bg') ? 'menu-bg' : undefined,
      best: save.get('best'),
      coins: save.get('coins'),
      muted: save.get('muted'),
      onMute: (m) => save.set('muted', m),
      onPlay: () => { if (!modalOpen(this)) this.go(); },
      bgPortraitOrigin: 0.5,
      portraitLogoY: 0.16,
      portraitPlayY: 0.5,
    });
    // contador de monedas que dibuja menuScreen (la estrella común pasa a ser la moneda del juego)
    const list = this.children.list;
    const i = list.findIndex((o) => (o as Phaser.GameObjects.Image).texture?.key === 'ic-star');
    const icon = list[i] as Phaser.GameObjects.Image | undefined;
    const coins = list[i + 1] as Phaser.GameObjects.Text | undefined;
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'coin', items: ITEMS, defaults: DEFAULTS, daily: DAILY,
      onChange: () => applyLook(this), onWallet: (n) => coins?.setText?.(`${n}`),
    });
    const place = () => {
      const s = Math.max(0.6, Math.min(this.scale.width / 1280, this.scale.height / 720));
      if (icon) icon.setTexture('coin').setDisplaySize(48 * s, 48 * s);
      extras.place(s);
    };
    place();
    this.scale.on('resize', place);
    this.events.once('shutdown', () => this.scale.off('resize', place));
  }

  /** Empezar partida (también lo llama la prueba de SDK). */
  go() {
    if (this.going) return;
    this.going = true;
    ((this.sound as any).context as AudioContext | undefined)?.resume?.();
    if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.4 }).play();
    this.cameras.main.fadeOut(160, 255, 241, 214);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Play'); this.going = false; });
  }
}
