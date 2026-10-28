import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { save } from '../state';

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
      onPlay: () => this.go(),
    });
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
