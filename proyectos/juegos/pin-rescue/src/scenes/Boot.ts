import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { makeExtraIcons } from '@comun/iconos';
import { save, THEMES } from '../state';
import { applyCosmetics, makeCosmetics, drawSlime, drawBomb, drawGem, SLIME } from '../cosmeticos';

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
    this.makeBackgrounds();
    this.makeProps();
    makeCosmetics(this);
    applyCosmetics(this);
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

  /** White 128 px icons, like the ones in comun/ui.ts, plus a few colour ones. */
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
    // level icon: a golden pin through a stone (colour icon)
    this.tex('ic-pin', s, s, (g) => {
      g.fillStyle(0x9aa7c2); g.fillRoundedRect(s * 0.42, s * 0.12, s * 0.46, s * 0.76, s * 0.08);
      g.lineStyle(s * 0.05, INK); g.strokeRoundedRect(s * 0.42, s * 0.12, s * 0.46, s * 0.76, s * 0.08);
      g.fillStyle(INK); g.fillRect(s * 0.3, s * 0.44, s * 0.62, s * 0.14);
      g.fillStyle(0xffc62b); g.fillRect(s * 0.32, s * 0.465, s * 0.6, s * 0.09);
      g.lineStyle(s * 0.12, INK); g.strokeCircle(s * 0.22, s * 0.5, s * 0.13);
      g.lineStyle(s * 0.07, 0xffc62b); g.strokeCircle(s * 0.22, s * 0.5, s * 0.13);
    });
  }

  /** A tiling stone background per theme (behind the tower). */
  private makeBackgrounds() {
    THEMES.forEach((t, i) => {
      this.tex(`bg${i}`, 256, 256, (g) => {
        g.fillStyle(t.base); g.fillRect(0, 0, 256, 256);
        g.fillStyle(t.dark, 0.3);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.fillRoundedRect(c * 64 + ((r % 2) * 32) - 28, r * 64 + 6, 56, 52, 12);
        g.fillStyle(t.light, 0.25);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.fillRoundedRect(c * 64 + ((r % 2) * 32) - 24, r * 64 + 9, 30, 8, 4);
      });
    });
  }

  private makeProps() {
    this.tex('slime-grr', SLIME.w, SLIME.h, (g) => drawSlime(g, 'grr'));
    this.tex('slime-scared', SLIME.w, SLIME.h, (g) => drawSlime(g, 'scared'));
    this.tex('bomb', 48, 48, (g) => drawBomb(g));
    this.tex('gem', 44, 44, (g) => drawGem(g));
    this.tex('dot', 14, 14, (g) => { g.fillStyle(0xffffff); g.fillCircle(7, 7, 7); });
    this.tex('puff', 48, 48, (g) => { g.fillStyle(0xffffff, 0.9); g.fillCircle(24, 24, 22); });
    this.tex('coin', 20, 20, (g) => {
      g.fillStyle(INK); g.fillCircle(10, 10, 10);
      g.fillStyle(0xffc62b); g.fillCircle(10, 10, 8);
      g.fillStyle(0xfff0a0); g.fillRect(8, 5, 3, 10);
    });
    this.tex('spark', 24, 24, (g) => {
      g.fillStyle(0xffffff);
      g.fillPoints([V(12, 0), V(15, 9), V(24, 12), V(15, 15), V(12, 24), V(9, 15), V(0, 12), V(9, 9)], true);
    });
    this.tex('cross', 96, 96, (g) => {
      g.lineStyle(26, INK); g.lineBetween(18, 18, 78, 78); g.lineBetween(78, 18, 18, 78);
      g.lineStyle(16, PALETTE.red); g.lineBetween(18, 18, 78, 78); g.lineBetween(78, 18, 18, 78);
    });
  }
}
