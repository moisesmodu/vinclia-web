import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { save } from '../state';
import { BH, JELLY, SLICE, TEX_W } from '../config';

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
    JELLY.forEach((c, i) => this.makeJelly(`jelly${i}`, c));
    this.makeFaces();
    this.makeScenery();
    save.load();
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }

  private tex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /**
   * One jelly block as a 3-slice source (corners fixed, middle stretched): the game resizes it to any width
   * with a single NineSlice object. Flat colours, darker base band, glossy highlight and a thick ink outline.
   */
  private makeJelly(key: string, c: number) {
    const w = TEX_W, h = BH, r = 24, lw = 7;
    this.tex(key, w, h, (g) => {
      g.fillStyle(INK); g.fillRoundedRect(0, 0, w, h, r);
      const i = lw;
      g.fillStyle(shade(c, -0.22)); g.fillRoundedRect(i, i, w - 2 * i, h - 2 * i, r - lw + 2);
      g.fillStyle(c); g.fillRoundedRect(i, i, w - 2 * i, h - 2 * i - 18, r - lw + 2);
      g.fillStyle(shade(c, 0.28)); g.fillRoundedRect(i + 4, i + 3, w - 2 * i - 8, 22, 10);
      g.fillStyle(0xffffff, 0.9); g.fillRoundedRect(SLICE - 4, i + 8, w - 2 * SLICE + 8, 9, 4.5);
      g.fillStyle(0xffffff, 0.95); g.fillCircle(i + 10, i + 13, 5.5);
      g.fillStyle(0xffffff, 0.35); g.fillCircle(w - i - 12, h - i - 28, 4);
    });
  }

  /** Faces for the top block: happy, blink, joy (perfect drop) and dizzy (miss). */
  private makeFaces() {
    const W = 120, H = 56;
    const eye = (g: Phaser.GameObjects.Graphics, x: number, y: number) => {
      g.fillStyle(INK); g.fillCircle(x, y, 9);
      g.fillStyle(0xffffff); g.fillCircle(x + 3, y - 3, 3.4); g.fillCircle(x - 3, y + 3.5, 1.6);
    };
    const cheeks = (g: Phaser.GameObjects.Graphics) => {
      g.fillStyle(0xff3d7f, 0.45); g.fillEllipse(18, 34, 18, 10); g.fillEllipse(W - 18, 34, 18, 10);
    };
    const smile = (g: Phaser.GameObjects.Graphics, open: boolean) => {
      g.lineStyle(5, INK);
      if (open) {
        g.fillStyle(INK); g.slice(W / 2, 30, 12, 0, Math.PI, false); g.fillPath();
        g.fillStyle(0xff6f8f); g.fillCircle(W / 2, 37, 5);
      } else {
        g.beginPath(); g.arc(W / 2, 28, 9, 0.25, Math.PI - 0.25, false); g.strokePath();
      }
    };
    this.tex('face-happy', W, H, (g) => { cheeks(g); eye(g, 38, 22); eye(g, W - 38, 22); smile(g, false); });
    this.tex('face-blink', W, H, (g) => {
      cheeks(g); g.lineStyle(5, INK);
      g.lineBetween(30, 23, 46, 23); g.lineBetween(W - 46, 23, W - 30, 23); smile(g, false);
    });
    this.tex('face-joy', W, H, (g) => {
      cheeks(g); g.lineStyle(5, INK);
      g.beginPath(); g.arc(38, 25, 8, Math.PI + 0.2, -0.2, false); g.strokePath();
      g.beginPath(); g.arc(W - 38, 25, 8, Math.PI + 0.2, -0.2, false); g.strokePath();
      smile(g, true);
    });
    this.tex('face-oh', W, H, (g) => {
      cheeks(g); g.lineStyle(5, INK);
      for (const x of [38, W - 38]) { g.lineBetween(x - 7, 15, x + 7, 29); g.lineBetween(x + 7, 15, x - 7, 29); }
      g.fillStyle(INK); g.fillEllipse(W / 2, 36, 14, 16);
    });
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
