import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { save } from '../state';

export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    menuScreen(this, {
      title: 'JELLY STACK',
      background: this.textures.exists('menu-bg') ? 'menu-bg' : undefined,
      best: save.get('best'),
      coins: save.get('coins'),
      muted: save.get('muted'),
      onMute: (m) => save.set('muted', m),
      onPlay: () => {
        if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.45 }).play();
        this.scene.start('Play');
      },
    });
  }
}
