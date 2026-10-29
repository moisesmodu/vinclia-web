import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { save } from '../state';
import { SLICE, TEX_W } from '../config';
import { makeExtraIcons } from '@comun/iconos';
import { applyJelly, makeCosmetics } from '../cosmeticos';

const INK = PALETTE.ink;

/** Lighten (t > 0) or darken (t < 0) a 0xRRGGBB colour. */
export function shade(c: number, t: number) {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const f = (v: number) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t));
  return (f(r) << 16) | (f(g) << 8) | f(b);
}

/** Loads the two files of the game (menu art, music) and draws every other graphic by code. */
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
    applyJelly(this);
    this.makeScenery();
    makeCosmetics(this);
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }

  private tex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeScenery() {
    // 4-point sparkle (perfect drops)
    this.tex('spark', 48, 48, (g) => {
      g.fillStyle(0xffffff);
      g.fillPoints([
        new Phaser.Math.Vector2(24, 0), new Phaser.Math.Vector2(29, 19), new Phaser.Math.Vector2(48, 24),
        new Phaser.Math.Vector2(29, 29), new Phaser.Math.Vector2(24, 48), new Phaser.Math.Vector2(19, 29),
        new Phaser.Math.Vector2(0, 24), new Phaser.Math.Vector2(19, 19),
      ], true);
    });
    // jelly droplet (tiny cut-offs and splashes), tinted per colour
    this.tex('drop', 28, 28, (g) => {
      g.fillStyle(INK); g.fillCircle(14, 14, 13);
      g.fillStyle(0xffffff); g.fillCircle(14, 14, 9);
      g.fillStyle(0xffffff, 1); g.fillCircle(10, 10, 3);
    });
    this.tex('cloud', 240, 110, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(70, 66, 40); g.fillCircle(120, 50, 48); g.fillCircle(172, 66, 38); g.fillRoundedRect(36, 62, 172, 42, 21);
    });
    this.tex('star-dot', 16, 16, (g) => { g.fillStyle(0xffffff); g.fillCircle(8, 8, 4); g.fillStyle(0xffffff, 0.35); g.fillCircle(8, 8, 8); });
    // grass strip (tiles horizontally) with candy sprinkles, and pale far hills for the sky
    this.tex('ground-tile', 256, 320, (g) => {
      g.fillStyle(INK); g.fillRect(0, 0, 256, 320);
      g.fillStyle(0x6fd36a); g.fillRect(0, 8, 256, 312);
      g.fillStyle(0x9be86f); g.fillRect(0, 8, 256, 26);
      const cols = [0xff6fae, 0xffd23f, 0x4aa8ff, 0xffffff, 0xa67bff];
      for (let i = 0; i < 9; i++) {
        g.fillStyle(cols[i % cols.length]);
        g.fillRoundedRect(8 + ((i * 97) % 220), 60 + ((i * 53) % 240), 22, 9, 4.5);
      }
    });
    this.tex('hills', 1024, 170, (g) => {
      g.fillStyle(0xffffff, 0.35);
      for (let i = 0; i < 6; i++) g.fillCircle((i + 0.3) * 1024 / 5, 200, 170 + (i % 2) * 40);
    });
    // plate under the tower (3-slice too) and candy hill
    this.tex('plate', TEX_W, 44, (g) => {
      g.fillStyle(INK); g.fillRoundedRect(0, 0, TEX_W, 44, 20);
      g.fillStyle(0xd9c8ff); g.fillRoundedRect(7, 7, TEX_W - 14, 30, 14);
      g.fillStyle(0xffffff); g.fillRoundedRect(7, 7, TEX_W - 14, 18, 9);
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(SLICE - 4, 12, TEX_W - 2 * SLICE + 8, 5, 2.5);
    });
  }
}
