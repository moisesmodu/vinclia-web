import Phaser from 'phaser';
import { makeIconTextures } from '@comun/ui';
import { makeExtraIcons } from '@comun/iconos';
import { bootDone } from '@comun/boot';
import { save } from '../state';
import { makeArt } from '../art';
import { makeCosmetics } from '../cosmeticos';

/** Carga el fondo del menú y la música; el resto se dibuja por código y se hornea en texturas. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    makeExtraIcons(this);
    save.load();
    makeArt(this);
    makeCosmetics(this);
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }
}
