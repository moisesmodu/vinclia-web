import Phaser from 'phaser';
import { makeIconTextures } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { makeExtraIcons } from '@comun/iconos';
import { save, CELL } from '../state';
import { GRID } from '../sim';
import { makeCosmetics } from '../cosmeticos';

/** Carga los dos archivos del juego (fondo del menú y música) y dibuja por código el resto. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    makeExtraIcons(this);
    makeCosmetics(this);
    this.makeYard();
    save.load();
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }

  /**
   * Suelo del patio horneado en UNA textura (asfalto, cuadrícula suave, pista de baloncesto, rayuela y dibujos de
   * tiza). Se dibuja a media resolución (8 px por celda) y se escala ×2: la tiza suave queda bien y pesa 4 veces menos.
   */
  private makeYard() {
    const S = (GRID * CELL) / 2, c = CELL / 2; // lado en px y celda en px de la textura
    const rnd = new Phaser.Math.RandomDataGenerator(['yard']);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x9aa3b4); g.fillRect(0, 0, S, S);
    // grava del asfalto
    for (let i = 0; i < 1400; i++) {
      g.fillStyle(rnd.pick([0x8b94a6, 0xa9b1c0, 0x868e9f]), 0.8);
      g.fillCircle(rnd.between(0, S), rnd.between(0, S), rnd.realInRange(0.6, 1.8));
    }
    // cuadrícula muy suave (ayuda a leer el movimiento)
    g.lineStyle(1, 0xffffff, 0.07);
    for (let k = 0; k <= GRID; k++) { g.lineBetween(k * c, 0, k * c, S); g.lineBetween(0, k * c, S, k * c); }
    // pista de baloncesto en el centro (tiza blanca y amarilla)
    const chalk = (w: number, col = 0xffffff, a = 0.75) => g.lineStyle(w, col, a);
    const cx = S / 2, cy = S / 2, cw = S * 0.62, ch = S * 0.38;
    chalk(4); g.strokeRect(cx - cw / 2, cy - ch / 2, cw, ch);
    g.lineBetween(cx, cy - ch / 2, cx, cy + ch / 2);
    g.strokeCircle(cx, cy, ch * 0.18);
    for (const s of [-1, 1]) {
      const bx = cx + s * cw / 2;
      chalk(4, 0xffe36b, 0.7);
      g.strokeRect(s < 0 ? bx : bx - ch * 0.3, cy - ch * 0.17, ch * 0.3, ch * 0.34);
      g.beginPath(); g.arc(bx, cy, ch * 0.42, s < 0 ? -Math.PI / 2 : Math.PI / 2, s < 0 ? Math.PI / 2 : Math.PI * 1.5); g.strokePath();
      chalk(4); g.strokeCircle(bx - s * ch * 0.3, cy, ch * 0.09);
    }
    // rayuela (abajo a la izquierda) y otra arriba a la derecha
    const hop = (x: number, y: number, k: number, rot: boolean) => {
      chalk(4, 0xffffff, 0.8);
      const rows = [1, 2, 1, 2, 1, 2];
      rows.forEach((n, i) => {
        for (let j = 0; j < n; j++) {
          const ox = n === 1 ? 0 : (j - 0.5) * k, oy = -i * k;
          if (rot) g.strokeRect(x + oy - k / 2, y + ox - k / 2, k, k); else g.strokeRect(x + ox - k / 2, y + oy - k / 2, k, k);
        }
      });
      if (rot) g.strokeCircle(x - 6.4 * k, y, k * 0.6); else g.strokeCircle(x, y - 6.4 * k, k * 0.6);
    };
    hop(S * 0.12, S * 0.9, c * 3.2, false);
    hop(S * 0.92, S * 0.12, c * 3.2, true);
    // dibujos de tiza de colores: sol, estrellas, corazón, flor, espiral
    const pastel = [0xffb3d9, 0xb3e0ff, 0xc9ffb3, 0xfff0a3, 0xe0c9ff];
    const sun = (x: number, y: number) => {
      chalk(4, 0xfff0a3, 0.8); g.strokeCircle(x, y, 22);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.lineBetween(x + Math.cos(a) * 30, y + Math.sin(a) * 30, x + Math.cos(a) * 42, y + Math.sin(a) * 42); }
    };
    const star = (x: number, y: number, r: number, col: number) => {
      chalk(4, col, 0.8);
      const p: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; p.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr)); }
      g.strokePoints(p, true, true);
    };
    const heart = (x: number, y: number, r: number) => {
      chalk(4, 0xffb3d9, 0.8);
      g.beginPath(); g.arc(x - r / 2, y, r / 2, Math.PI, 0); g.arc(x + r / 2, y, r / 2, Math.PI, 0); g.lineTo(x, y + r * 1.1); g.closePath(); g.strokePath();
    };
    const flower = (x: number, y: number) => {
      chalk(4, 0xe0c9ff, 0.8);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.strokeCircle(x + Math.cos(a) * 14, y + Math.sin(a) * 14, 9); }
      chalk(4, 0xfff0a3, 0.8); g.strokeCircle(x, y, 7);
    };
    sun(S * 0.18, S * 0.14);
    heart(S * 0.82, S * 0.84, 34);
    flower(S * 0.5, S * 0.12);
    flower(S * 0.88, S * 0.5);
    star(S * 0.1, S * 0.5, 26, pastel[3]);
    star(S * 0.5, S * 0.88, 30, pastel[1]);
    star(S * 0.34, S * 0.08, 18, pastel[2]);
    star(S * 0.66, S * 0.93, 18, pastel[0]);
    // espiral (caracol de tiza)
    chalk(4, 0xb3e0ff, 0.8);
    g.beginPath();
    for (let i = 0; i <= 80; i++) { const a = i * 0.22, r = 3 + i * 0.5, x = S * 0.3 + Math.cos(a) * r, y = S * 0.72 + Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.strokePath();
    // garabatos sueltos (círculos y rayas de tiza)
    for (let i = 0; i < 14; i++) {
      chalk(3, rnd.pick(pastel), 0.55);
      const x = rnd.between(20, S - 20), y = rnd.between(20, S - 20);
      if (i % 2) g.strokeCircle(x, y, rnd.between(6, 14)); else g.lineBetween(x, y, x + rnd.between(-30, 30), y + rnd.between(-20, 20));
    }
    g.generateTexture('yard', S, S);
    g.destroy();
  }
}
