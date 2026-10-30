import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyPlane } from '../cosmeticos';
import { openUpgrades, upgradeButton } from '../mejoras';

/** Pantalla de inicio (común) + mejoras del avión + tienda de cosméticos + recompensa diaria. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    menuScreen(this, {
      title: 'PAPER GLIDE',
      background: this.textures.exists('menu-bg') ? 'menu-bg' : undefined,
      best: save.get('best'),
      coins: save.get('coins'),
      muted: save.get('muted'),
      onMute: (m) => save.set('muted', m),
      onPlay: () => { if (!modalOpen(this)) this.go(); },
      bgPortraitOrigin: 0.79,
      portraitLogoY: 0.13,
      portraitPlayY: 0.6,
    });
    // contador de monedas que dibuja menuScreen (la estrella común pasa a ser la moneda del juego)
    const list = this.children.list;
    const i = list.findIndex((o) => (o as Phaser.GameObjects.Image).texture?.key === 'ic-star');
    const icon = list[i] as Phaser.GameObjects.Image | undefined;
    const coins = list[i + 1] as Phaser.GameObjects.Text | undefined;
    const play = list.find((o) => (o as Phaser.GameObjects.Container).list?.some?.((c) => (c as Phaser.GameObjects.Image).texture?.key === 'ic-play')) as Phaser.GameObjects.Container | undefined;
    const setCoins = (n: number) => { coins?.setText?.(`${n}`); up.refresh(); extras.shop.refresh(); };
    // mejoras del avión: botón grande junto al de jugar (el gancho del juego)
    const up = upgradeButton(this, 50, () => { if (!modalOpen(this)) openUpgrades(this, { onWallet: setCoins }); });
    // tienda de cosméticos (esquina inferior izquierda) y recompensa diaria
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'coin', items: ITEMS, defaults: DEFAULTS, daily: DAILY,
      onChange: () => applyPlane(this), onWallet: (n) => setCoins(n),
    });
    const place = () => {
      const w = this.scale.width, h = this.scale.height;
      const s = Math.max(0.6, Math.min(w / 1280, h / 720));
      if (icon) icon.setTexture('coin').setDisplaySize(48 * s, 48 * s);
      extras.place(s);
      // misma escala que da menuScreen al botón de jugar (su latido pisa play.scale)
      const ps = Math.max(0.7, Math.min(w / 1280, h / 720) * 1.1);
      if (play) up.setPosition(play.x + (h > w ? 150 : 180) * ps, play.y + 6 * ps).setScale(ps);
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
    this.cameras.main.fadeOut(160, 127, 211, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Play'); this.going = false; });
  }
}
