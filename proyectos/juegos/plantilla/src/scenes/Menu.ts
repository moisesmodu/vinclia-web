import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { portal } from '@comun/portal';
import { save } from '../state';

export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    menuScreen(this, {
      title: '__TITULO_LOGO__',
      background: this.textures.exists('menu-bg') ? 'menu-bg' : undefined,
      best: save.get('best'),
      coins: save.get('coins'),
      muted: save.get('muted'),
      onMute: (m) => save.set('muted', m),
      onPlay: () => {
        const ad = portal.prerollBreak(); // pre-roll (GD/GM) pedido dentro del gesto del jugador
        if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.45 }).play();
        void ad.then(() => this.scene.start('Play'));
      },
    });
  }
}
