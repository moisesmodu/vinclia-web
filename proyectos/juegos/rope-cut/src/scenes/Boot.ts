import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { makeExtraIcons } from '@comun/iconos';
import { save, THEMES } from '../state';
import { W, H } from '../sim';
import { applyCandy, makeCosmetics, drawMonster, MON } from '../cosmeticos';

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
    makeExtraIcons(this);
    save.load();
    this.makeIcons();
    this.makeBoards();
    this.makeProps();
    makeCosmetics(this);
    applyCandy(this);
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
    const s = 128, Wh = PALETTE.white;
    this.tex('ic-grid', s, s, (g) => {
      g.fillStyle(Wh);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.fillRoundedRect(s * (0.2 + i * 0.22), s * (0.2 + j * 0.22), s * 0.16, s * 0.16, s * 0.03);
    });
    this.tex('ic-skip', s, s, (g) => {
      g.fillStyle(Wh);
      g.fillTriangle(s * 0.18, s * 0.26, s * 0.18, s * 0.74, s * 0.48, s * 0.5);
      g.fillTriangle(s * 0.46, s * 0.26, s * 0.46, s * 0.74, s * 0.76, s * 0.5);
      g.fillRect(s * 0.76, s * 0.26, s * 0.08, s * 0.48);
    });
    this.tex('ic-lock', s, s, (g) => {
      g.lineStyle(s * 0.1, Wh); g.beginPath(); g.arc(s / 2, s * 0.42, s * 0.17, Math.PI, 0); g.strokePath();
      g.lineBetween(s * 0.33, s * 0.42, s * 0.33, s * 0.5); g.lineBetween(s * 0.67, s * 0.42, s * 0.67, s * 0.5);
      g.fillStyle(Wh); g.fillRoundedRect(s * 0.24, s * 0.48, s * 0.52, s * 0.36, s * 0.07);
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
    // level icon: a candy box (colour icon)
    this.tex('ic-box', s, s, (g) => {
      g.fillStyle(0xd99a4e); g.fillRoundedRect(s * 0.12, s * 0.3, s * 0.76, s * 0.56, s * 0.06);
      g.fillStyle(0xf0bd77); g.fillRoundedRect(s * 0.08, s * 0.2, s * 0.84, s * 0.18, s * 0.05);
      g.fillStyle(0xff4f5e); g.fillCircle(s / 2, s * 0.6, s * 0.14);
      g.fillStyle(0xffffff); g.fillCircle(s * 0.46, s * 0.56, s * 0.04);
      g.lineStyle(s * 0.05, INK); g.strokeRoundedRect(s * 0.12, s * 0.3, s * 0.76, s * 0.56, s * 0.06); g.strokeRoundedRect(s * 0.08, s * 0.2, s * 0.84, s * 0.18, s * 0.05);
      g.strokeCircle(s / 2, s * 0.6, s * 0.14);
    });
    // fail counter: a cracked candy (colour icon)
    this.tex('ic-crack', s, s, (g) => {
      g.fillStyle(0xffffff); g.fillCircle(s * 0.42, s * 0.52, s * 0.3); g.fillCircle(s * 0.6, s * 0.5, s * 0.3);
      g.fillStyle(0xff3b4f); g.slice(s * 0.42, s * 0.52, s * 0.3, 2.2, 3.6, false); g.fillPath(); g.slice(s * 0.6, s * 0.5, s * 0.3, -0.6, 0.6, false); g.fillPath();
      g.lineStyle(s * 0.05, INK); g.strokeCircle(s * 0.42, s * 0.52, s * 0.3); g.strokeCircle(s * 0.6, s * 0.5, s * 0.3);
      g.fillStyle(0x2b2340); g.fillTriangle(s * 0.5, s * 0.16, s * 0.56, s * 0.5, s * 0.46, s * 0.86);
    });
  }

  /** One board per theme (the level area) and a tiling cardboard background. */
  private makeBoards() {
    const bw = W + 40, bh = H + 40;
    THEMES.forEach((t, i) => {
      this.tex(`board${i}`, bw, bh, (g) => {
        g.fillStyle(0x000000, 0.15); g.fillRoundedRect(6, 12, bw - 12, bh - 14, 34);
        g.fillStyle(t.board); g.fillRoundedRect(4, 4, bw - 8, bh - 12, 34);
        g.fillStyle(t.line, 0.7);
        for (let y = 60; y < bh - 40; y += 80) for (let x = (y / 80) % 2 ? 50 : 90; x < bw - 30; x += 80) g.fillCircle(x, y, 7);
        g.lineStyle(10, t.base); g.strokeRoundedRect(4, 4, bw - 8, bh - 12, 34);
        g.lineStyle(4, INK, 0.9); g.strokeRoundedRect(1, 1, bw - 2, bh - 6, 36);
      });
      this.tex(`bg${i}`, 256, 256, (g) => {
        g.fillStyle(t.base); g.fillRect(0, 0, 256, 256);
        g.fillStyle(t.dark, 0.35);
        for (let k = 0; k < 8; k++) g.fillRect(0, k * 32 + 12, 256, 6);
        g.fillStyle(t.light, 0.35);
        g.fillCircle(64, 64, 18); g.fillCircle(192, 192, 18); g.fillCircle(192, 64, 9); g.fillCircle(64, 192, 9);
      });
    });
  }

  private makeProps() {
    // anchor peg (golden knob on a plate)
    this.tex('peg', 44, 44, (g) => {
      g.fillStyle(0x000000, 0.2); g.fillCircle(22, 25, 17);
      g.fillStyle(0xd99a00); g.fillCircle(22, 22, 17);
      g.fillStyle(0xffd23f); g.fillCircle(22, 20, 14);
      g.fillStyle(0xffffff, 0.7); g.fillEllipse(17, 15, 9, 5);
      g.lineStyle(4, INK); g.strokeCircle(22, 22, 17);
    });
    // auto-rope peg (blue) and its reach ring (scaled to the reach)
    this.tex('hookpeg', 44, 44, (g) => {
      g.fillStyle(0x2f78d9); g.fillCircle(22, 22, 17);
      g.fillStyle(0x4aa8ff); g.fillCircle(22, 20, 14);
      g.fillStyle(0xffffff); g.fillCircle(22, 21, 5);
      g.lineStyle(4, INK); g.strokeCircle(22, 22, 17);
    });
    this.tex('ring', 200, 200, (g) => {
      g.fillStyle(0x4aa8ff, 0.1); g.fillCircle(100, 100, 98);
      g.lineStyle(4, 0x2f78d9, 0.7);
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.arc(100, 100, 96, a, a + 0.16); g.strokePath(); }
    });
    // rope segment (twisted: two-tone stripes), stretched along each chain link
    this.tex('rope', 32, 12, (g) => {
      g.fillStyle(0xc9884a); g.fillRect(0, 1, 32, 10);
      g.fillStyle(0xf2c487);
      for (let x = -8; x < 32; x += 10) g.fillTriangle(x, 11, x + 5, 11, x + 11, 1), g.fillTriangle(x + 5, 11, x + 11, 1, x + 16, 1);
      g.fillStyle(INK); g.fillRect(0, 0, 32, 2); g.fillRect(0, 10, 32, 2);
    });
    // bubble
    this.tex('bubble', 112, 112, (g) => {
      g.fillStyle(0xbfe9ff, 0.28); g.fillCircle(56, 56, 52);
      g.lineStyle(5, 0xffffff, 0.9); g.strokeCircle(56, 56, 51);
      g.lineStyle(3, 0x7fc8ff, 0.8); g.strokeCircle(56, 56, 47);
      g.fillStyle(0xffffff, 0.85); g.fillEllipse(36, 32, 26, 13); g.fillCircle(78, 80, 5);
      g.lineStyle(4, 0xff9ee0, 0.45); g.beginPath(); g.arc(56, 56, 44, 0.2, 1.2); g.strokePath();
    });
    // air puffer (points right; rotated to its direction): a round blue pump with a nozzle
    this.tex('puffer', 96, 80, (g) => {
      g.fillStyle(0x2f78d9); g.fillRoundedRect(56, 28, 30, 24, 8);
      g.fillStyle(0x4aa8ff); g.fillCircle(40, 40, 32);
      g.fillStyle(0x8ccbff); g.fillEllipse(32, 26, 26, 12);
      g.lineStyle(4, INK); g.strokeCircle(40, 40, 32); g.strokeRoundedRect(56, 28, 30, 24, 8);
      g.fillStyle(0x4aa8ff); g.fillCircle(40, 40, 30);
      g.fillStyle(0x8ccbff); g.fillEllipse(32, 26, 26, 12);
      g.fillStyle(INK); g.fillCircle(32, 40, 4); g.fillCircle(50, 40, 4);
      g.fillStyle(0xff7eb6, 0.6); g.fillEllipse(26, 50, 9, 5); g.fillEllipse(56, 50, 9, 5);
      g.lineStyle(3, INK); g.beginPath(); g.arc(41, 46, 5, 0.2, Math.PI - 0.2); g.strokePath();
      g.fillStyle(0x2b2340); g.fillEllipse(86, 40, 8, 18);
    });
    this.tex('puff', 48, 48, (g) => { g.fillStyle(0xffffff, 0.9); g.fillCircle(24, 24, 22); });
    // spike bar tile (spikes on both sides of a bar), tiled along the bar
    this.tex('spike', 32, 48, (g) => {
      g.fillStyle(0xeef2ff); g.fillTriangle(2, 24, 30, 24, 16, 2); g.fillTriangle(2, 24, 30, 24, 16, 46);
      g.fillStyle(0xb9b3dd); g.fillTriangle(16, 24, 30, 24, 16, 2); g.fillTriangle(16, 24, 30, 24, 16, 46);
      g.lineStyle(2.5, INK); g.strokeTriangle(2, 24, 30, 24, 16, 2); g.strokeTriangle(2, 24, 30, 24, 16, 46);
      g.fillStyle(0x8a8296); g.fillRect(0, 18, 32, 12);
      g.fillStyle(INK); g.fillRect(0, 17, 32, 3); g.fillRect(0, 28, 32, 3);
    });
    this.tex('spikecap', 24, 24, (g) => { g.fillStyle(0x8a8296); g.fillCircle(12, 12, 10); g.lineStyle(3, INK); g.strokeCircle(12, 12, 10); });
    // wind streaks (blow right; flipped or rotated for other directions)
    this.tex('wind', 128, 64, (g) => {
      g.fillStyle(0xffffff, 0.5);
      g.fillRoundedRect(8, 10, 46, 5, 2.5); g.fillRoundedRect(70, 30, 52, 5, 2.5); g.fillRoundedRect(20, 48, 34, 5, 2.5);
      g.fillStyle(0xffffff, 0.25); g.fillRoundedRect(84, 8, 26, 4, 2); g.fillRoundedRect(0, 30, 22, 4, 2);
    });
    this.tex('windv', 64, 128, (g) => {
      g.fillStyle(0xffffff, 0.5);
      g.fillRoundedRect(10, 8, 5, 46, 2.5); g.fillRoundedRect(30, 70, 5, 52, 2.5); g.fillRoundedRect(48, 20, 5, 34, 2.5);
      g.fillStyle(0xffffff, 0.25); g.fillRoundedRect(8, 84, 4, 26, 2); g.fillRoundedRect(30, 0, 4, 22, 2);
    });
    // monster faces and its crate
    for (const f of ['idle', 'open', 'chew', 'sad', 'blink'] as const) this.tex(`mon-${f}`, MON.w, MON.h, (g) => drawMonster(g, f));
    this.tex('crate', 170, 110, (g) => {
      g.fillStyle(0xb06a2c); g.fillRoundedRect(4, 4, 162, 102, 10);
      g.fillStyle(0xd48a45); g.fillRoundedRect(10, 10, 150, 90, 6);
      g.fillStyle(0xb06a2c); g.fillRect(10, 52, 150, 6);
      g.lineStyle(6, 0xb06a2c); g.lineBetween(16, 16, 154, 96);
      g.fillStyle(0xffd23f); for (const [x, y] of [[16, 16], [154, 16], [16, 94], [154, 94]]) g.fillCircle(x, y, 4);
      g.lineStyle(4, INK); g.strokeRoundedRect(4, 4, 162, 102, 10);
    });
    this.tex('dot', 14, 14, (g) => { g.fillStyle(0xffffff); g.fillCircle(7, 7, 7); });
    this.tex('crumb', 14, 14, (g) => { g.fillStyle(0xffffff); g.fillRoundedRect(0, 0, 14, 14, 4); });
    this.tex('trail', 32, 32, (g) => { g.fillStyle(0xffffff, 0.35); g.fillCircle(16, 16, 15); g.fillStyle(0xffffff); g.fillCircle(16, 16, 9); });
  }
}
