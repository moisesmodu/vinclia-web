import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { save } from '../state';

const INK = PALETTE.ink;
/** Las texturas se dibujan al doble de resolución y se muestran a 0,5 (nítidas con zoom de cámara). */
export const K = 2;

/** Carga los dos archivos del juego (fondo del menú y música) y dibuja por código todo lo demás. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    for (let face = 0; face < 3; face++) this.makeRocket(face);
    // icono cuadrado del cohete asustado (pantalla final)
    const rt = this.make.renderTexture({ x: 0, y: 0, width: 100 * K, height: 100 * K }, false);
    rt.draw('rocket1', 18 * K, 0);
    rt.saveTexture('rocket-ic');
    this.makeFlame();
    this.makePlatform();
    this.makeSky();
    this.makeBits();
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

  /**
   * Cohete de 64×100 (unidades de diseño). Origen de diseño (32, 50); patas apoyadas en y = 92.
   * face: 0 normal, 1 asustado (cae rápido o se estrella), 2 feliz (aterrizaje perfecto).
   */
  private makeRocket(face: number) {
    const k = K;
    this.tex(`rocket${face}`, 64 * k, 100 * k, (g) => {
      // patas
      g.lineStyle(9 * k, INK); g.lineBetween(20 * k, 64 * k, 9 * k, 88 * k); g.lineBetween(44 * k, 64 * k, 55 * k, 88 * k);
      g.lineStyle(5 * k, 0xb9c2d6); g.lineBetween(20 * k, 64 * k, 9 * k, 88 * k); g.lineBetween(44 * k, 64 * k, 55 * k, 88 * k);
      g.fillStyle(0x8a93ab); g.lineStyle(3 * k, INK);
      g.fillRoundedRect(2 * k, 85 * k, 16 * k, 7 * k, 3 * k); g.strokeRoundedRect(2 * k, 85 * k, 16 * k, 7 * k, 3 * k);
      g.fillRoundedRect(46 * k, 85 * k, 16 * k, 7 * k, 3 * k); g.strokeRoundedRect(46 * k, 85 * k, 16 * k, 7 * k, 3 * k);
      // tobera
      g.fillStyle(0x8a93ab); g.lineStyle(4 * k, INK);
      const noz = [new Phaser.Math.Vector2(24 * k, 72 * k), new Phaser.Math.Vector2(40 * k, 72 * k), new Phaser.Math.Vector2(45 * k, 84 * k), new Phaser.Math.Vector2(19 * k, 84 * k)];
      g.fillPoints(noz, true); g.strokePoints(noz, true, true);
      // aletas
      g.fillStyle(0xffc21a);
      const finL = [new Phaser.Math.Vector2(17 * k, 44 * k), new Phaser.Math.Vector2(3 * k, 74 * k), new Phaser.Math.Vector2(4 * k, 80 * k), new Phaser.Math.Vector2(18 * k, 72 * k)];
      const finR = finL.map((p) => new Phaser.Math.Vector2(64 * k - p.x, p.y));
      g.fillPoints(finL, true); g.strokePoints(finL, true, true);
      g.fillPoints(finR, true); g.strokePoints(finR, true, true);
      // cuerpo blanco con morro y franja rojos
      g.fillStyle(0xffffff); g.fillRoundedRect(14 * k, 6 * k, 36 * k, 70 * k, { tl: 18 * k, tr: 18 * k, bl: 8 * k, br: 8 * k });
      g.fillStyle(0xff4d5e); g.fillRoundedRect(14 * k, 6 * k, 36 * k, 20 * k, { tl: 18 * k, tr: 18 * k, bl: 0, br: 0 });
      g.fillRect(14 * k, 64 * k, 36 * k, 5 * k);
      g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(19 * k, 30 * k, 4 * k, 30 * k, 2 * k);
      g.lineStyle(4.5 * k, INK); g.strokeRoundedRect(14 * k, 6 * k, 36 * k, 70 * k, { tl: 18 * k, tr: 18 * k, bl: 8 * k, br: 8 * k });
      // ojo de buey con la cara
      const cx = 32 * k, cy = 44 * k;
      g.fillStyle(0xc5ccdb); g.fillCircle(cx, cy, 14.5 * k);
      g.fillStyle(0x9be3ff); g.fillCircle(cx, cy, 11 * k);
      g.lineStyle(3.5 * k, INK); g.strokeCircle(cx, cy, 14.5 * k); g.lineStyle(2.5 * k, INK); g.strokeCircle(cx, cy, 11 * k);
      g.fillStyle(INK); g.lineStyle(2.2 * k, INK);
      if (face === 0) {
        g.fillCircle(cx - 4.5 * k, cy - 1.5 * k, 2.3 * k); g.fillCircle(cx + 4.5 * k, cy - 1.5 * k, 2.3 * k);
        g.fillStyle(0xffffff); g.fillCircle(cx - 3.7 * k, cy - 2.3 * k, 0.9 * k); g.fillCircle(cx + 5.3 * k, cy - 2.3 * k, 0.9 * k);
        g.beginPath(); g.arc(cx, cy + 2.5 * k, 4 * k, 0.35, Math.PI - 0.35); g.strokePath();
      } else if (face === 1) {
        g.fillStyle(0xffffff); g.fillCircle(cx - 4.5 * k, cy - 2.5 * k, 3.4 * k); g.fillCircle(cx + 4.5 * k, cy - 2.5 * k, 3.4 * k);
        g.strokeCircle(cx - 4.5 * k, cy - 2.5 * k, 3.4 * k); g.strokeCircle(cx + 4.5 * k, cy - 2.5 * k, 3.4 * k);
        g.fillStyle(INK); g.fillCircle(cx - 4.5 * k, cy - 2.5 * k, 1.4 * k); g.fillCircle(cx + 4.5 * k, cy - 2.5 * k, 1.4 * k);
        g.fillEllipse(cx, cy + 5 * k, 4.5 * k, 5.5 * k);
      } else {
        g.lineStyle(2.4 * k, INK);
        g.beginPath(); g.arc(cx - 4.5 * k, cy, 2.6 * k, Math.PI + 0.3, -0.3); g.strokePath();
        g.beginPath(); g.arc(cx + 4.5 * k, cy, 2.6 * k, Math.PI + 0.3, -0.3); g.strokePath();
        g.fillStyle(INK); g.beginPath(); g.arc(cx, cy + 2 * k, 5 * k, 0, Math.PI); g.closePath(); g.fillPath();
        g.fillStyle(0xff8fb1, 0.8); g.fillCircle(cx - 8 * k, cy + 3 * k, 2 * k); g.fillCircle(cx + 8 * k, cy + 3 * k, 2 * k);
      }
    });
  }

  /** Llama del propulsor (origen arriba, en la tobera). */
  private makeFlame() {
    const k = K;
    this.tex('flame', 32 * k, 56 * k, (g) => {
      g.fillStyle(0xff7a1a); g.fillEllipse(16 * k, 24 * k, 26 * k, 48 * k);
      g.lineStyle(3 * k, INK); g.strokeEllipse(16 * k, 24 * k, 26 * k, 48 * k);
      g.fillStyle(0xffd23f); g.fillEllipse(16 * k, 19 * k, 16 * k, 32 * k);
      g.fillStyle(0xfff6c8); g.fillEllipse(16 * k, 14 * k, 8 * k, 16 * k);
    });
  }

  /** Plataforma flotante (fuente de un NineSlice: se estira a cualquier ancho sin deformar los bordes). */
  private makePlatform() {
    const k = K;
    this.tex('plat', 96 * k, 30 * k, (g) => {
      g.fillStyle(0x7a5cff); g.fillRoundedRect(2 * k, 2 * k, 92 * k, 26 * k, 10 * k);
      g.fillStyle(0x5a3fd6); g.fillRoundedRect(2 * k, 17 * k, 92 * k, 11 * k, { tl: 0, tr: 0, bl: 10 * k, br: 10 * k });
      g.fillStyle(0x45e0c8); g.fillRoundedRect(2 * k, 2 * k, 92 * k, 10 * k, { tl: 10 * k, tr: 10 * k, bl: 0, br: 0 });
      g.fillStyle(0xffffff, 0.45); g.fillRect(14 * k, 4 * k, 68 * k, 2.5 * k);
      g.lineStyle(4 * k, INK); g.strokeRoundedRect(2 * k, 2 * k, 92 * k, 26 * k, 10 * k);
      g.lineStyle(2.5 * k, INK); g.lineBetween(4 * k, 12 * k, 92 * k, 12 * k);
      g.fillStyle(0xffd23f); g.fillCircle(12 * k, 20 * k, 2.5 * k); g.fillCircle(84 * k, 20 * k, 2.5 * k);
    });
    // propulsor bajo la plataforma y su chorro
    this.tex('pod', 22 * k, 16 * k, (g) => {
      g.fillStyle(0x8a93ab); g.fillRoundedRect(2 * k, 2 * k, 18 * k, 12 * k, { tl: 0, tr: 0, bl: 6 * k, br: 6 * k });
      g.lineStyle(3 * k, INK); g.strokeRoundedRect(2 * k, 2 * k, 18 * k, 12 * k, { tl: 0, tr: 0, bl: 6 * k, br: 6 * k });
    });
    this.tex('jet', 16 * k, 28 * k, (g) => {
      g.fillStyle(0x6ff3ff, 0.9); g.fillEllipse(8 * k, 12 * k, 12 * k, 24 * k);
      g.fillStyle(0xffffff, 0.9); g.fillEllipse(8 * k, 8 * k, 5 * k, 12 * k);
    });
    // baliza de la plataforma siguiente
    this.tex('beacon', 20 * k, 20 * k, (g) => {
      g.fillStyle(0xffd23f, 0.35); g.fillCircle(10 * k, 10 * k, 9 * k);
      g.fillStyle(0xffd23f); g.fillCircle(10 * k, 10 * k, 5 * k);
      g.lineStyle(2.5 * k, INK); g.strokeCircle(10 * k, 10 * k, 5 * k);
    });
  }

  /** Estrellas en dos capas (mosaico) y planetas lejanos. */
  private makeSky() {
    const rnd = new Phaser.Math.RandomDataGenerator(['rocket-hop-sky']);
    this.tex('stars-far', 512, 512, (g) => {
      for (let i = 0; i < 90; i++) {
        g.fillStyle(rnd.pick([0xffffff, 0xcfd8ff, 0xffe9a8]), rnd.realInRange(0.35, 0.8));
        g.fillCircle(rnd.between(2, 510), rnd.between(2, 510), rnd.realInRange(0.8, 1.8));
      }
    });
    this.tex('stars-near', 512, 512, (g) => {
      for (let i = 0; i < 6; i++) {
        const x = rnd.between(12, 500), y = rnd.between(12, 500), r = rnd.realInRange(2.5, 4.5);
        g.fillStyle(rnd.pick([0xffffff, 0xffe066, 0x9be3ff]));
        g.fillTriangle(x - r, y, x + r, y, x, y - r * 2.2); g.fillTriangle(x - r, y, x + r, y, x, y + r * 2.2);
        g.fillTriangle(x, y - r, x, y + r, x - r * 2.2, y); g.fillTriangle(x, y - r, x, y + r, x + r * 2.2, y);
      }
      for (let i = 0; i < 12; i++) { g.fillStyle(0xffffff, 0.7); g.fillCircle(rnd.between(4, 508), rnd.between(4, 508), rnd.realInRange(1.6, 2.6)); }
    });
    const planet = (key: string, r: number, base: number, shade: number, ring: boolean) => {
      const W = (r * 2 + (ring ? r * 1.4 : 12)) * 1, H = r * 2 + 12;
      this.tex(key, W, H, (g) => {
        const cx = W / 2, cy = H / 2;
        if (ring) { g.lineStyle(10, INK); g.strokeEllipse(cx, cy, r * 3.1, r * 0.9); g.lineStyle(5, 0xffd9a0); g.strokeEllipse(cx, cy, r * 3.1, r * 0.9); }
        g.fillStyle(base); g.fillCircle(cx, cy, r);
        g.fillStyle(shade); g.fillCircle(cx + r * 0.25, cy + r * 0.25, r * 0.78);
        g.fillStyle(base); g.fillCircle(cx - r * 0.12, cy - r * 0.12, r * 0.74);
        g.fillStyle(0xffffff, 0.25); g.fillCircle(cx - r * 0.4, cy - r * 0.4, r * 0.22);
        g.fillStyle(shade, 0.8); g.fillCircle(cx + r * 0.3, cy - r * 0.2, r * 0.14); g.fillCircle(cx - r * 0.2, cy + r * 0.4, r * 0.1);
        g.lineStyle(6, INK); g.strokeCircle(cx, cy, r);
        if (ring) {
          // parte delantera del anillo por encima del planeta
          g.lineStyle(10, INK);
          g.beginPath();
          for (let a = 0; a <= Math.PI; a += 0.1) { const x = cx + Math.cos(a) * r * 1.55, y = cy + Math.sin(a) * r * 0.45; a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
          g.strokePath();
          g.lineStyle(5, 0xffd9a0);
          g.beginPath();
          for (let a = 0; a <= Math.PI; a += 0.1) { const x = cx + Math.cos(a) * r * 1.55, y = cy + Math.sin(a) * r * 0.45; a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
          g.strokePath();
        }
      });
    };
    planet('planet-a', 110, 0xff9f43, 0xe0702a, true);
    planet('planet-b', 56, 0x3ddc84, 0x22a861, false);
    planet('planet-c', 34, 0xff7eb6, 0xd8508f, false);
  }

  private makeBits() {
    this.tex('puff', 32, 32, (g) => { g.fillStyle(0xffffff); g.fillCircle(16, 16, 15); });
    this.tex('shard', 18, 12, (g) => { g.fillStyle(0xff4d5e); g.fillRect(1, 1, 16, 10); g.lineStyle(3, INK); g.strokeRect(1, 1, 16, 10); });
    this.tex('shard2', 14, 14, (g) => { g.fillStyle(0xffffff); g.fillRect(1, 1, 12, 12); g.lineStyle(3, INK); g.strokeRect(1, 1, 12, 12); });
    this.tex('streak', 90, 6, (g) => { g.fillStyle(0xffffff, 0.8); g.fillRoundedRect(0, 0, 90, 6, 3); });
  }
}
