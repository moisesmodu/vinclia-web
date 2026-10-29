import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { save, PALETTES } from '../state';
import { T } from '../sim';

const INK = PALETTE.ink;
const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

/** Loads the two files (menu art, music) and draws every other graphic by code, baked once into textures. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    this.makeIcons();
    this.makeTiles();
    this.makeHero();
    this.makeProps();
    save.load();
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }

  private tex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** White 128 px icons, like the ones in comun/ui.ts. */
  private makeIcons() {
    const s = 128, W = PALETTE.white;
    this.tex('ic-grid', s, s, (g) => {
      g.fillStyle(W);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.fillRoundedRect(s * (0.2 + i * 0.22), s * (0.2 + j * 0.22), s * 0.16, s * 0.16, s * 0.03);
    });
    this.tex('ic-skip', s, s, (g) => {
      g.fillStyle(W);
      g.fillTriangle(s * 0.18, s * 0.26, s * 0.18, s * 0.74, s * 0.48, s * 0.5);
      g.fillTriangle(s * 0.46, s * 0.26, s * 0.46, s * 0.74, s * 0.76, s * 0.5);
      g.fillRect(s * 0.76, s * 0.26, s * 0.08, s * 0.48);
    });
    this.tex('ic-lock', s, s, (g) => {
      g.lineStyle(s * 0.1, W); g.beginPath(); g.arc(s / 2, s * 0.42, s * 0.17, Math.PI, 0); g.strokePath();
      g.lineBetween(s * 0.33, s * 0.42, s * 0.33, s * 0.5); g.lineBetween(s * 0.67, s * 0.42, s * 0.67, s * 0.5);
      g.fillStyle(W); g.fillRoundedRect(s * 0.24, s * 0.48, s * 0.52, s * 0.36, s * 0.07);
      g.fillStyle(INK); g.fillCircle(s / 2, s * 0.63, s * 0.05);
    });
    this.tex('ic-star-off', s, s, (g) => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s * 0.45 : s * 0.2, a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(V(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r * 0.98 + s * 0.03));
      }
      g.fillStyle(0x000000, 0.25); g.fillPoints(pts, true);
      g.lineStyle(s * 0.06, 0xffffff, 0.6); g.strokePoints(pts, true, true);
    });
    // big chevron for the touch buttons and the tutorial (points right; rotate it for left and up)
    this.tex('ic-arrow', s, s, (g) => {
      g.fillStyle(W);
      g.fillPoints([V(s * 0.3, s * 0.18), V(s * 0.78, s * 0.5), V(s * 0.3, s * 0.82), V(s * 0.3, s * 0.62), V(s * 0.52, s * 0.5), V(s * 0.3, s * 0.38)], true);
      g.fillRoundedRect(s * 0.12, s * 0.38, s * 0.3, s * 0.24, s * 0.05);
    });
    // death counter: a squished jelly with cross eyes (colour icon)
    this.tex('ic-splat', s, s, (g) => {
      g.fillStyle(0x4fd6a8); g.lineStyle(s * 0.06, INK);
      g.fillEllipse(s / 2, s * 0.64, s * 0.86, s * 0.5); g.strokeEllipse(s / 2, s * 0.64, s * 0.86, s * 0.5);
      g.fillCircle(s * 0.14, s * 0.84, s * 0.07); g.fillCircle(s * 0.88, s * 0.82, s * 0.06);
      g.lineStyle(s * 0.06, INK);
      for (const x of [0.37, 0.63]) { g.lineBetween(s * (x - 0.07), s * 0.54, s * (x + 0.07), s * 0.66); g.lineBetween(s * (x + 0.07), s * 0.54, s * (x - 0.07), s * 0.66); }
      g.fillStyle(0xffffff, 0.6); g.fillEllipse(s * 0.3, s * 0.48, s * 0.18, s * 0.07);
    });
    // level icon: the castle door (colour icon)
    this.tex('ic-door', s, s, (g) => this.drawDoor(g, s * 0.14, s * 0.06, s * 0.72, s * 0.86, false));
    // keyboard key cap (tutorial on desktop)
    this.tex('keycap', 96, 96, (g) => {
      g.fillStyle(INK); g.fillRoundedRect(4, 10, 88, 82, 16);
      g.fillStyle(0xffffff); g.fillRoundedRect(4, 4, 88, 78, 16);
      g.lineStyle(5, INK); g.strokeRoundedRect(4, 4, 88, 78, 16);
    });
  }

  /** Castle door: golden wood in a lilac jelly arch (used by the level icon and the exit). */
  private drawDoor(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, frame = true) {
    const r = w / 2;
    if (frame) {
      g.fillStyle(0xb48cff); g.fillRoundedRect(x - w * 0.12, y - w * 0.12, w * 1.24, h + w * 0.12, { tl: r * 1.12, tr: r * 1.12, bl: 4, br: 4 });
      g.lineStyle(Math.max(3, w * 0.07), INK); g.strokeRoundedRect(x - w * 0.12, y - w * 0.12, w * 1.24, h + w * 0.12, { tl: r * 1.12, tr: r * 1.12, bl: 4, br: 4 });
    }
    g.fillStyle(0xffc23d); g.fillRoundedRect(x, y, w, h, { tl: r, tr: r, bl: 2, br: 2 });
    g.fillStyle(0xe59a14);
    for (let i = 1; i < 4; i++) g.fillRect(x + (w * i) / 4 - w * 0.02, y + h * 0.18, w * 0.04, h * 0.78);
    g.fillStyle(0xfff3b0, 0.8); g.fillRoundedRect(x + w * 0.1, y + h * 0.12, w * 0.12, h * 0.5, w * 0.06);
    g.lineStyle(Math.max(3, w * 0.07), INK); g.strokeRoundedRect(x, y, w, h, { tl: r, tr: r, bl: 2, br: 2 });
    // heart window and knob
    g.fillStyle(0xff7eb6); g.fillCircle(x + w * 0.43, y + h * 0.3, w * 0.09); g.fillCircle(x + w * 0.57, y + h * 0.3, w * 0.09);
    g.fillTriangle(x + w * 0.35, y + h * 0.32, x + w * 0.65, y + h * 0.32, x + w * 0.5, y + h * 0.43);
    g.fillStyle(INK); g.fillCircle(x + w * 0.78, y + h * 0.62, w * 0.06);
  }

  /** Jelly blocks for each palette: plain and "frosted" (open top), plus spikes and the castle wall. */
  private makeTiles() {
    PALETTES.forEach((p, i) => {
      for (const top of [false, true]) {
        this.tex(`tile${top ? 't' : ''}${i}`, T, T, (g) => {
          g.fillStyle(p.dark); g.fillRoundedRect(1, 1, T - 2, T - 2, 9);
          g.fillStyle(p.base); g.fillRoundedRect(3, 2, T - 6, T - 9, 8);
          g.fillStyle(0xffffff, 0.45); g.fillRoundedRect(8, 7, 14, 6, 3); g.fillCircle(28, 10, 2.5);
          g.fillStyle(p.light, 0.5); g.fillRoundedRect(6, T - 18, T - 12, 6, 3);
          if (top) {
            g.fillStyle(p.light); g.fillRoundedRect(1, 0, T - 2, 12, 6);
            g.fillCircle(10, 12, 5); g.fillCircle(27, 13, 6); g.fillCircle(40, 11, 4);
            g.fillStyle(0xffffff, 0.8); g.fillRoundedRect(7, 2, 16, 4, 2);
          }
          g.lineStyle(3, INK, 0.85); g.strokeRoundedRect(1.5, 1.5, T - 3, T - 3, 9);
        });
      }
      // castle wall with an arched window (background, tiles seamlessly)
      this.tex(`wall${i}`, 384, 384, (g) => {
        g.fillStyle(p.wall); g.fillRect(0, 0, 384, 384);
        g.fillStyle(p.brick);
        for (let r = 0; r < 12; r++) for (let c = 0; c < 7; c++) {
          const off = r % 2 ? 0 : 32;
          if ((r * 7 + c * 3) % 5 === 0) g.fillRoundedRect(c * 64 + off - 28, r * 32 + 4, 56, 24, 8);
        }
        // window
        const wx = 132, wy = 70, ww = 120, wh = 190;
        g.fillStyle(p.brick); g.fillRoundedRect(wx - 14, wy - 14, ww + 28, wh + 28, { tl: 74, tr: 74, bl: 10, br: 10 });
        g.fillStyle(0x9fdcff); g.fillRoundedRect(wx, wy, ww, wh, { tl: 60, tr: 60, bl: 4, br: 4 });
        g.fillStyle(0xd3f0ff); g.fillRect(wx, wy + wh * 0.62, ww, wh * 0.38);
        g.fillStyle(0xffffff); g.fillCircle(wx + 30, wy + 120, 18); g.fillCircle(wx + 52, wy + 112, 22); g.fillCircle(wx + 78, wy + 122, 16);
        g.fillStyle(0xffb3d4); g.fillRect(wx + 70, wy + 120, 26, 70); g.fillTriangle(wx + 64, wy + 122, wx + 102, wy + 122, wx + 83, wy + 82);
        g.fillRect(wx + 22, wy + 140, 20, 50); g.fillTriangle(wx + 17, wy + 142, wx + 47, wy + 142, wx + 32, wy + 112);
        g.lineStyle(6, p.dark, 0.35); g.strokeRoundedRect(wx, wy, ww, wh, { tl: 60, tr: 60, bl: 4, br: 4 });
        g.fillStyle(p.brick); g.fillRect(wx - 20, wy + wh + 8, ww + 40, 14);
        // banner
        g.fillStyle(p.base, 0.55); g.fillRect(24, 40, 44, 120); g.fillTriangle(24, 160, 68, 160, 46, 184);
      });
    });
    // spikes (pointing up; flipped for the ceiling)
    this.tex('spike', T, T, (g) => {
      for (let i = 0; i < 3; i++) {
        const x0 = 3 + i * 14;
        g.fillStyle(0xeef2ff); g.fillTriangle(x0, T - 2, x0 + 14, T - 2, x0 + 7, T * 0.42);
        g.fillStyle(0xb9b3dd); g.fillTriangle(x0 + 7, T - 2, x0 + 14, T - 2, x0 + 7, T * 0.42);
        g.lineStyle(2.5, INK); g.strokeTriangle(x0, T - 2, x0 + 14, T - 2, x0 + 7, T * 0.42);
      }
    });
    this.tex('dart', 46, 22, (g) => {
      g.fillStyle(0xff7eb6); g.fillTriangle(2, 2, 14, 11, 2, 20);
      g.fillStyle(0xeef2ff); g.fillRoundedRect(8, 7, 22, 8, 3); g.fillTriangle(28, 3, 44, 11, 28, 19);
      g.lineStyle(2.5, INK); g.strokeTriangle(28, 3, 44, 11, 28, 19); g.strokeRoundedRect(8, 7, 22, 8, 3);
    });
    this.tex('dot', 14, 14, (g) => { g.fillStyle(0xffffff); g.fillCircle(7, 7, 7); });
    this.tex('crumb', 14, 14, (g) => { g.fillStyle(0xffffff); g.fillRoundedRect(0, 0, 14, 14, 4); });
    this.tex('zone', T, T, (g) => {
      g.fillStyle(0xffffff, 0.22); g.fillRoundedRect(4, 4, T - 8, T - 8, 10);
      g.fillStyle(0xffffff, 0.85); g.fillTriangle(T / 2, 10, T - 13, 26, 13, 26); g.fillRect(T / 2 - 4, 24, 8, 14);
    });
  }

  /** The hero: a mint jelly cube with little arms and feet, plus one texture per face. */
  private makeHero() {
    const W = 64, H = 64;
    this.tex('hero', W, H, (g) => {
      g.fillStyle(0x1f9e76); g.fillEllipse(19, 58, 16, 10); g.fillEllipse(45, 58, 16, 10);       // feet
      g.lineStyle(3, INK); g.strokeEllipse(19, 58, 16, 10); g.strokeEllipse(45, 58, 16, 10);
      g.fillStyle(0x4fd6a8); g.fillCircle(6, 36, 6); g.fillCircle(58, 36, 6);                    // arms
      g.strokeCircle(6, 36, 6); g.strokeCircle(58, 36, 6);
      g.fillStyle(0x2fbf8f); g.fillRoundedRect(8, 10, 48, 47, 15);
      g.fillStyle(0x6ee7bd); g.fillRoundedRect(10, 10, 44, 41, 14);
      g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(15, 14, 13, 6, 3); g.fillCircle(33, 16, 2.5);
      g.lineStyle(3.5, INK); g.strokeRoundedRect(8, 10, 48, 47, 15);
    });
    const eyes = (g: Phaser.GameObjects.Graphics, r: number, dy = 0) => {
      for (const x of [24, 40]) {
        g.fillStyle(INK); g.fillEllipse(x, 30 + dy, r * 1.6, r * 2);
        g.fillStyle(0xffffff); g.fillCircle(x + r * 0.25, 28 + dy - r * 0.35, r * 0.38);
      }
      g.fillStyle(0xff7eb6, 0.55); g.fillEllipse(17, 40, 7, 4); g.fillEllipse(47, 40, 7, 4);
    };
    this.tex('face-n', W, H, (g) => { eyes(g, 5); g.lineStyle(2.5, INK); g.beginPath(); g.arc(32, 39, 4, 0.3, Math.PI - 0.3); g.strokePath(); });
    this.tex('face-b', W, H, (g) => { g.lineStyle(3, INK); g.lineBetween(19, 31, 28, 31); g.lineBetween(36, 31, 45, 31); g.beginPath(); g.arc(32, 39, 4, 0.3, Math.PI - 0.3); g.strokePath(); });
    this.tex('face-j', W, H, (g) => { eyes(g, 4.5, -1); g.fillStyle(INK); g.fillEllipse(32, 41, 7, 4); });
    this.tex('face-o', W, H, (g) => {
      for (const x of [24, 40]) { g.fillStyle(0xffffff); g.fillCircle(x, 29, 7.5); g.lineStyle(2.5, INK); g.strokeCircle(x, 29, 7.5); g.fillStyle(INK); g.fillCircle(x, 29, 3.5); }
      g.fillStyle(INK); g.fillEllipse(32, 43, 8, 10); g.fillStyle(0xff7eb6); g.fillEllipse(32, 46, 5, 3);
    });
    this.tex('face-x', W, H, (g) => {
      g.lineStyle(3.5, INK);
      for (const x of [24, 40]) { g.lineBetween(x - 5, 25, x + 5, 34); g.lineBetween(x + 5, 25, x - 5, 34); }
      g.beginPath(); g.arc(32, 45, 5, Math.PI + 0.4, -0.4); g.strokePath();
    });
    this.tex('face-h', W, H, (g) => {
      g.lineStyle(3.5, INK);
      for (const x of [24, 40]) { g.beginPath(); g.arc(x, 32, 5, Math.PI + 0.3, -0.3); g.strokePath(); }
      g.fillStyle(INK); g.slice(32, 38, 8, 0, Math.PI, false); g.fillPath();
      g.fillStyle(0xff7eb6); g.fillEllipse(32, 43, 7, 3.5);
      g.fillStyle(0xff7eb6, 0.6); g.fillEllipse(16, 39, 8, 4.5); g.fillEllipse(48, 39, 8, 4.5);
    });
  }

  private makeProps() {
    // exit door (56×80, bottom-centre anchor in Play)
    this.tex('door', 64, 84, (g) => this.drawDoor(g, 10, 10, 44, 72));
    // cheeky face the door shows once it has run away
    this.tex('door-face', 64, 84, (g) => {
      g.lineStyle(3, INK);
      g.lineBetween(22, 46, 28, 50); g.lineBetween(22, 54, 28, 50); g.lineBetween(42, 46, 36, 50); g.lineBetween(42, 54, 36, 50);
      g.fillStyle(INK); g.slice(32, 58, 6, 0, Math.PI, false); g.fillPath(); g.fillStyle(0xff7eb6); g.fillEllipse(32, 61, 5, 3);
    });
    this.tex('leg', 14, 16, (g) => { g.fillStyle(INK); g.fillRect(5, 0, 4, 12); g.fillEllipse(8, 13, 12, 6); });
    // jelly spring: pink cushion on a coil (sits on the bottom of its tile)
    this.tex('spring', T, T, (g) => {
      g.lineStyle(4, 0x7a6aa8);
      for (let i = 0; i < 3; i++) g.strokeEllipse(T / 2, T - 6 - i * 6, 22, 7);
      g.fillStyle(0xff5d8f); g.fillRoundedRect(6, T - 30, T - 12, 12, 6);
      g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(11, T - 28, 12, 4, 2);
      g.lineStyle(3, INK); g.strokeRoundedRect(6, T - 30, T - 12, 12, 6);
    });
    // touch button disc
    this.tex('btn', 128, 128, (g) => {
      g.fillStyle(0x000000, 0.18); g.fillCircle(64, 68, 58);
      g.fillStyle(0xffffff, 0.35); g.fillCircle(64, 64, 58);
      g.lineStyle(6, 0xffffff, 0.85); g.strokeCircle(64, 64, 55);
    });
  }
}
