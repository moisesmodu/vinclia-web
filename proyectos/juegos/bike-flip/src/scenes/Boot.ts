import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { save } from '../state';

/** Carga de archivos (arte de Higgsfield, música de ElevenLabs) y gráficos por código. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Descomenta cuando el juego tenga su arte y su música en public/assets/:
    // this.load.image('menu-bg', 'assets/menu-bg.jpg');
    // this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    // Gráficos del ejemplo dibujados por código (cero descargas).
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(PALETTE.yellow); g.fillCircle(32, 32, 30); g.lineStyle(5, PALETTE.ink); g.strokeCircle(32, 32, 28);
    g.generateTexture('hero', 64, 64); g.clear();
    g.fillStyle(PALETTE.red); g.fillRoundedRect(0, 0, 60, 60, 10); g.lineStyle(5, PALETTE.ink); g.strokeRoundedRect(2, 2, 56, 56, 10);
    g.generateTexture('block', 60, 60); g.destroy();
    save.load();
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }
}
