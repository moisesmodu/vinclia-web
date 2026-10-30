import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyMonkey } from '../cosmeticos';

/** Pantalla de inicio (común): fondo, nombre, jugar, récord, plátanos acumulados y sonido. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    menuScreen(this, {
      title: 'HOOK HOP',
      background: this.textures.exists('menu-bg') ? 'menu-bg' : undefined,
      best: save.get('best'),
      coins: save.get('coins'),
      muted: save.get('muted'),
      onMute: (m) => save.set('muted', m),
      onPlay: () => { if (!modalOpen(this)) this.go(); },
      // en vertical se encuadra la cara del mono (derecha del fondo) y el botón de jugar baja a la parte de las hojas
      bgPortraitOrigin: 0.74,
      portraitLogoY: 0.08,
      portraitPlayY: 0.77,
    });
    // contador de plátanos que dibuja menuScreen (la estrella común pasa a ser un plátano): el texto va justo después
    const list = this.children.list;
    const i = list.findIndex((o) => (o as Phaser.GameObjects.Image).texture?.key === 'ic-star');
    const icon = list[i] as Phaser.GameObjects.Image | undefined;
    const coins = list[i + 1] as Phaser.GameObjects.Text | undefined;
    // tienda de cosméticos (esquina inferior izquierda) y recompensa diaria
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'banana', items: ITEMS, defaults: DEFAULTS, daily: DAILY, color: 0xff9f43,
      onChange: () => applyMonkey(this), onWallet: (n) => coins?.setText?.(`${n}`),
    });
    const place = () => {
      const u = Math.min(this.scale.width / 1280, this.scale.height / 720);
      // el plátano ocupa el sitio de la estrella (mismo tamaño en pantalla)
      if (icon) icon.setTexture('banana').setDisplaySize(52 * Math.max(0.6, u), 52 * Math.max(0.6, u));
      extras.place(Math.max(0.6, u));
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
    this.cameras.main.fadeOut(180, 155, 231, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Play'); this.going = false; });
  }
}
