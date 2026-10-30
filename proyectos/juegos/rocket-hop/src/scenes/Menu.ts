import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyRocket } from '../cosmeticos';

/** Pantalla de inicio (común): fondo, nombre, jugar, récord, aterrizajes perfectos acumulados y sonido. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    menuScreen(this, {
      title: 'ROCKET HOP',
      background: this.textures.exists('menu-bg') ? 'menu-bg' : undefined,
      best: save.get('best'),
      coins: save.get('perfects'),
      muted: save.get('muted'),
      onMute: (m) => save.set('muted', m),
      onPlay: () => { if (!modalOpen(this)) this.go(); },
    });
    // contador de perfectos que dibuja menuScreen: el texto justo después de su icono de estrella
    const list = this.children.list;
    const coins = list[list.findIndex((o) => (o as Phaser.GameObjects.Image).texture?.key === 'ic-star') + 1] as Phaser.GameObjects.Text | undefined;
    // tienda de cosméticos (esquina inferior izquierda) y recompensa diaria
    const extras = menuExtras(this, {
      save, currency: 'perfects', currencyIcon: 'ic-star', items: ITEMS, defaults: DEFAULTS, daily: DAILY, color: 0x9b6bff,
      onChange: () => applyRocket(this), onWallet: (n) => coins?.setText?.(`${n}`),
    });
    const place = () => extras.place(Math.max(0.6, Math.min(this.scale.width / 1280, this.scale.height / 720)));
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
    this.cameras.main.fadeOut(180, 33, 26, 120);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Play'); this.going = false; });
  }
}
