import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { makeExtraIcons } from '@comun/iconos';
import { save } from '../state';
import { applyLook, makeCosmetics, makeFaces, drawBall, drawFace } from '../cosmeticos';

const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;

/** Carga los dos archivos del juego (fondo del menú y música) y dibuja por código todo lo demás. */
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
    applyLook(this);
    makeFaces(this);
    makeCosmetics(this);
    this.tex('coin', 80, 80, (g) => {
      g.fillStyle(0xffd23f); g.fillCircle(40, 40, 36);
      g.lineStyle(7, 0xc98a00); g.strokeCircle(40, 40, 33);
      g.lineStyle(6, 0xf2a900); g.strokeCircle(40, 40, 20);
      g.fillStyle(0xffffff, 0.8); g.fillEllipse(28, 26, 12, 18);
    });
    // tablero de lado (36×200): el aro se engancha a media altura por el lado de dentro
    this.tex('board', 40, 200, (g) => {
      g.fillStyle(0xffffff); g.fillRoundedRect(4, 4, 32, 192, 10);
      g.fillStyle(0xff5d5d); g.fillRect(14, 60, 12, 90);
      g.lineStyle(7, INK); g.strokeRoundedRect(4, 4, 32, 192, 10);
    });
    this.tex('arm', 16, 16, (g) => { g.fillStyle(0x8a8fa8); g.fillRect(0, 0, 16, 16); g.fillStyle(INK); g.fillRect(0, 0, 16, 3); g.fillRect(0, 13, 16, 3); });
    this.tex('flame', 48, 48, (g) => { g.fillStyle(0xffffff); g.fillCircle(24, 24, 22); });
    this.tex('spark', 24, 24, (g) => { g.fillStyle(0xffffff); g.fillCircle(12, 12, 10); });
    // bola dorada de bonificación (estrella dentro de un anillo)
    this.tex('gold-orb', 120, 120, (g) => {
      g.fillStyle(0xffd23f, 0.35); g.fillCircle(60, 60, 58);
      g.fillStyle(0xffc928); g.fillCircle(60, 60, 42); g.lineStyle(7, INK); g.strokeCircle(60, 60, 42);
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 26, a = -Math.PI / 2 + (i * Math.PI) / 5; pts.push(new Phaser.Math.Vector2(60 + Math.cos(a) * r, 60 + Math.sin(a) * r)); }
      g.fillStyle(0xffffff); g.fillPoints(pts, true); g.lineStyle(4, INK); g.strokePoints(pts, true, true);
    });
    // vidas: pelotita llena o apagada
    this.tex('life', 200, 200, (g) => { drawBall(g, 'basket'); });
    this.tex('life-off', 200, 200, (g) => { g.fillStyle(0x000000, 0.25); g.fillCircle(100, 100, 72); g.lineStyle(8, 0xffffff, 0.7); g.strokeCircle(100, 100, 72); });
    // icono de fin de partida: pelota mareada
    this.tex('ball-over', 200, 200, (g) => { drawBall(g, 'basket'); drawFace(g, 'dizzy'); });
    this.tex('fire-ic', 80, 96, (g) => {
      const p = (s: number, c: number) => {
        g.fillStyle(c);
        g.fillPoints([[40, 4], [62, 40], [70, 64], [58, 88], [40, 94], [22, 88], [10, 64], [18, 40], [30, 52]].map(([x, y]) => new Phaser.Math.Vector2(40 + (x - 40) * s, 94 - (94 - y) * s)), true);
      };
      p(1, 0xff5d2d); p(0.68, 0xffa23f); p(0.38, 0xffe56b);
    });
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }

  private tex(key: string, w: number, h: number, draw: (g: G) => void) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
