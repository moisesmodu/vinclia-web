import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { makeExtraIcons } from '@comun/iconos';
import { bootDone } from '@comun/boot';
import { save } from '../state';
import { JAR_H, JAR_W, WALL } from '../config';
import { applyJelly, drawCloud, makeCosmetics } from '../cosmeticos';

const INK = PALETTE.ink;
export const RIM = 22; // jar texture: space above the rim

/** Loads the two files of the game (menu art, music) and draws every other graphic by code, baked into textures. */
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
    makeCosmetics(this);
    this.makeScenery();
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }

  private tex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
    if (this.textures.exists(key)) this.textures.remove(key);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeScenery() {
    const W = JAR_W + 2 * WALL, H = JAR_H + WALL + RIM;
    // jar, back: soft glass behind the jellies
    this.tex('jar-back', W, H, (g) => {
      g.fillStyle(0xffffff, 0.3); g.fillRoundedRect(WALL, RIM, JAR_W, JAR_H, 0);
      g.fillStyle(0xffffff, 0.16);
      for (let i = 0; i < 5; i++) g.fillRect(WALL + 40 + i * 110, RIM, 26, JAR_H);
      g.fillStyle(0x2b2340, 0.1); g.fillEllipse(W / 2, RIM + JAR_H - 8, JAR_W * 0.9, 30);
    });
    // jar, front: thick glass walls with ink outline, glints and rim lips
    this.tex('jar-front', W, H, (g) => {
      const glass = 0xbfe6ff;
      g.fillStyle(INK);
      g.fillRoundedRect(0, RIM - 6, WALL + 6, JAR_H + 6, { tl: 10, tr: 0, bl: 0, br: 0 });
      g.fillRoundedRect(W - WALL - 6, RIM - 6, WALL + 6, JAR_H + 6, { tl: 0, tr: 10, bl: 0, br: 0 });
      g.fillRoundedRect(0, RIM + JAR_H - 6, W, WALL + 6, { tl: 0, tr: 0, bl: 22, br: 22 });
      g.fillStyle(INK); g.fillRoundedRect(-0, RIM - 16, WALL + 18, 22, 11); g.fillRoundedRect(W - WALL - 18, RIM - 16, WALL + 18, 22, 11);
      // glass body (inside the ink), then cut the inner area back to transparent with the back colour
      g.fillStyle(glass);
      g.fillRoundedRect(6, RIM, WALL - 6, JAR_H, { tl: 6, tr: 0, bl: 0, br: 0 });
      g.fillRoundedRect(W - WALL, RIM, WALL - 6, JAR_H, { tl: 0, tr: 6, bl: 0, br: 0 });
      g.fillRoundedRect(6, RIM + JAR_H, W - 12, WALL - 6, { tl: 0, tr: 0, bl: 16, br: 16 });
      g.fillStyle(0xe4f5ff); g.fillRoundedRect(4, RIM - 12, WALL + 10, 14, 7); g.fillRoundedRect(W - WALL - 14, RIM - 12, WALL + 10, 14, 7);
      g.fillStyle(0xffffff, 0.9); g.fillRoundedRect(10, RIM + 30, 7, JAR_H * 0.55, 3.5); g.fillRoundedRect(W - 17, RIM + 60, 6, JAR_H * 0.3, 3);
    });
    // the top line (dashed) and the aim guide (dots)
    this.tex('line', JAR_W, 10, (g) => {
      g.fillStyle(0xffffff);
      for (let x = 0; x < JAR_W; x += 30) g.fillRoundedRect(x + 3, 1, 18, 8, 4);
    });
    this.tex('aim', 12, 24, (g) => { g.fillStyle(0xffffff); g.fillCircle(6, 6, 4.5); });
    // particles: jelly droplet (tinted), sparkle, ring
    this.tex('drop', 28, 28, (g) => { g.fillStyle(0xffffff); g.fillCircle(14, 14, 12); g.fillStyle(0xffffff, 1); });
    this.tex('spark', 48, 48, (g) => {
      g.fillStyle(0xffffff);
      g.fillPoints([
        new Phaser.Math.Vector2(24, 0), new Phaser.Math.Vector2(29, 19), new Phaser.Math.Vector2(48, 24),
        new Phaser.Math.Vector2(29, 29), new Phaser.Math.Vector2(24, 48), new Phaser.Math.Vector2(19, 29),
        new Phaser.Math.Vector2(0, 24), new Phaser.Math.Vector2(19, 19),
      ], true);
    });
    this.tex('ring', 128, 128, (g) => { g.lineStyle(10, 0xffffff); g.strokeCircle(64, 64, 58); });
    // clouds with a face: the little holder of the next jelly and the big one that floats away
    this.tex('holder', 150, 84, (g) => drawCloud(g, 150, 84));
    this.tex('bigcloud', 340, 190, (g) => drawCloud(g, 340, 190));
    // sky decoration: soft cloud, star dot, hills
    this.tex('sky-cloud', 240, 110, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(70, 66, 40); g.fillCircle(120, 50, 48); g.fillCircle(172, 66, 38); g.fillRoundedRect(36, 62, 172, 42, 21);
    });
    this.tex('star-dot', 16, 16, (g) => { g.fillStyle(0xffffff); g.fillCircle(8, 8, 3.5); g.fillStyle(0xffffff, 0.35); g.fillCircle(8, 8, 8); });
    this.tex('hill', 512, 256, (g) => { g.fillStyle(0xffffff); g.fillEllipse(256, 256, 512, 400); });
  }
}
