import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { makeExtraIcons } from '@comun/iconos';
import { save } from '../state';
import { applyLook, drawWheel, makeCosmetics } from '../cosmeticos';

const INK = PALETTE.ink;

/** Carga el fondo del menú y la música; todo lo demás se dibuja por código (paleta de granja al atardecer). */
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
    makeCosmetics(this);
    this.tex('wheel', 56, 56, (g) => drawWheel(g, 28, 28, 26));
    this.tex('wheel-s', 44, 44, (g) => drawWheel(g, 22, 22, 20));
    this.makeSheep();
    this.makeDepot();
    this.makeScenery();
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }

  private tex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** Oveja de lana esponjosa con cara negra, mirando a la derecha (cuerpo físico 40×28 en el centro). */
  private makeSheep() {
    this.tex('sheep', 72, 60, (g) => {
      // patas
      g.fillStyle(INK);
      for (const x of [20, 30, 44, 54]) g.fillRoundedRect(x - 3, 40, 6, 16, 3);
      // lana: nube de círculos
      const puffs = [[18, 30, 12], [30, 22, 13], [44, 22, 13], [54, 30, 11], [24, 38, 11], [40, 38, 12], [52, 38, 10], [36, 30, 14]];
      g.fillStyle(INK);
      for (const [x, y, r] of puffs) g.fillCircle(x, y, r + 3);
      g.fillStyle(0xfff8ee);
      for (const [x, y, r] of puffs) g.fillCircle(x, y, r);
      g.fillStyle(0xffffff); g.fillCircle(30, 20, 6); g.fillCircle(42, 18, 5);
      // cabeza
      g.fillStyle(0x3a3150); g.fillEllipse(60, 28, 20, 24);
      g.lineStyle(3, INK); g.strokeEllipse(60, 28, 20, 24);
      g.fillStyle(0x3a3150); g.fillEllipse(52, 22, 10, 6); g.strokeEllipse(52, 22, 10, 6);
      g.fillStyle(0xfff8ee); g.fillCircle(58, 16, 6);
      // ojos y mejillas
      g.fillStyle(0xffffff); g.fillCircle(58, 27, 4.2); g.fillCircle(66, 27, 4.2);
      g.fillStyle(INK); g.fillCircle(59, 28, 2.2); g.fillCircle(67, 28, 2.2);
      g.fillStyle(0xff9fb0, 0.9); g.fillCircle(56, 34, 2.5); g.fillCircle(68, 34, 2.5);
    });
  }

  /** Depósito cada 200 m: granero rojo con silo y arco de llegada con banderín. */
  private makeDepot() {
    this.tex('barn', 260, 220, (g) => {
      const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
      // silo
      g.fillStyle(0xc9ccd6); g.fillRoundedRect(186, 40, 56, 176, { tl: 28, tr: 28, bl: 0, br: 0 });
      g.lineStyle(5, INK); g.strokeRoundedRect(186, 40, 56, 176, { tl: 28, tr: 28, bl: 0, br: 0 });
      g.lineStyle(3, 0x8a93a6); for (let y = 80; y < 210; y += 26) g.lineBetween(188, y, 240, y);
      // granero
      const body = [V(10, 216), V(10, 96), V(50, 50), V(150, 50), V(190, 96), V(190, 216)];
      g.fillStyle(0xd9483b); g.fillPoints(body, true);
      g.lineStyle(5, INK); g.strokePoints(body, true, true);
      g.fillStyle(0xffffff); g.fillPoints([V(2, 100), V(46, 42), V(154, 42), V(198, 100), V(186, 104), V(148, 58), V(52, 58), V(14, 104)], true);
      g.lineStyle(4, INK); g.strokePoints([V(2, 100), V(46, 42), V(154, 42), V(198, 100), V(186, 104), V(148, 58), V(52, 58), V(14, 104)], true, true);
      // puerta con aspa
      g.fillStyle(0xa8302a); g.fillRect(56, 128, 88, 88);
      g.lineStyle(6, 0xffffff); g.strokeRect(56, 128, 88, 88); g.lineBetween(56, 128, 144, 216); g.lineBetween(144, 128, 56, 216);
      g.lineStyle(4, INK); g.strokeRect(53, 125, 94, 94);
      // ventana del pajar
      g.fillStyle(0xffd23f); g.fillRect(84, 74, 32, 28); g.lineStyle(4, INK); g.strokeRect(84, 74, 32, 28);
      g.fillStyle(0xe8a92a); g.fillRect(84, 92, 32, 10);
    });
    this.tex('gate', 60, 220, (g) => {
      // poste de llegada con banderín amarillo y franjas
      g.fillStyle(0xffffff); g.fillRect(24, 40, 12, 180);
      g.fillStyle(0xff8a2a); for (let y = 40; y < 220; y += 28) g.fillRect(24, y, 12, 14);
      g.lineStyle(3, INK); g.strokeRect(24, 40, 12, 180);
      g.fillStyle(0xffd23f); g.fillTriangle(36, 6, 60, 20, 36, 36);
      g.lineStyle(3, INK); g.strokeTriangle(36, 6, 60, 20, 36, 36);
      g.fillStyle(INK); g.fillRect(32, 4, 5, 40);
    });
  }

  /** Cielo de atardecer, sol, nubes rosadas, colinas lejanas, balas de paja, valla, girasoles y molino. */
  private makeScenery() {
    // cielo: degradado pintado fila a fila (generateTexture va por canvas y no admite fillGradientStyle)
    this.tex('sky', 4, 256, (g) => {
      const stops: [number, number][] = [[0, 0x5a3f9a], [0.55, 0xff7e6b], [1, 0xffc56b]];
      for (let y = 0; y < 256; y += 2) {
        const t = y / 255, i = t < stops[1][0] ? 0 : 1;
        const k = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(stops[i][1]), Phaser.Display.Color.ValueToColor(stops[i + 1][1]), 100, k * 100);
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(0, y, 4, 2);
      }
    });
    this.tex('sun', 220, 220, (g) => {
      g.fillStyle(0xfff0a8, 0.14); g.fillCircle(110, 110, 110);
      g.fillStyle(0xfff0a8, 0.22); g.fillCircle(110, 110, 84);
      g.fillStyle(0xffe27a); g.fillCircle(110, 110, 62);
      g.fillStyle(0xfff6c8); g.fillCircle(96, 96, 22);
    });
    this.tex('cloud', 220, 90, (g) => {
      g.fillStyle(0xffd0c2, 0.95);
      g.fillCircle(60, 55, 32); g.fillCircle(105, 40, 40); g.fillCircle(150, 55, 30); g.fillRoundedRect(30, 50, 160, 34, 17);
      g.fillStyle(0xffb3a0, 0.9); g.fillRoundedRect(36, 70, 150, 14, 7);
    });
    const hills = (key: string, color: number, amp: number, base: number, f: number, seed: number, deco: 'trees' | 'farm') =>
      this.tex(key, 1024, 400, (g) => {
        g.fillStyle(color);
        // las 4 filas de abajo quedan transparentes: al repetir la textura no aparece una línea en el cielo
        const y = (x: number) => { const k = (x / 1024) * Math.PI * 2; return base - amp * (0.6 * Math.sin(k * f + seed) + 0.4 * Math.sin(k * (f * 2 + 1) + seed * 2)); };
        const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, 396)];
        for (let x = 0; x <= 1024; x += 16) pts.push(new Phaser.Math.Vector2(x, y(x)));
        pts.push(new Phaser.Math.Vector2(1024, 396));
        g.fillPoints(pts, true);
        const dark = Phaser.Display.Color.ValueToColor(color).darken(14).color;
        g.fillStyle(dark);
        if (deco === 'trees') {
          for (let x = 30; x < 1000; x += 53 + ((x * 7) % 31)) { g.fillCircle(x, y(x) - 10, 13); g.fillRect(x - 2, y(x) - 4, 4, 10); }
        } else {
          // graneros y silos diminutos a lo lejos
          for (const x of [180, 610, 900]) {
            const yy = y(x);
            g.fillRect(x - 16, yy - 22, 32, 24); g.fillTriangle(x - 20, yy - 20, x, yy - 36, x + 20, yy - 20);
            g.fillRoundedRect(x + 20, yy - 40, 12, 42, { tl: 6, tr: 6, bl: 0, br: 0 });
          }
        }
      });
    hills('hills-far', 0xb86a8f, 60, 200, 2, 1.3, 'farm');
    hills('hills-near', 0xe08a5a, 70, 250, 3, 0.4, 'trees');
    this.tex('hay', 70, 56, (g) => {
      g.fillStyle(0xf2c14e); g.fillRoundedRect(3, 6, 64, 48, 12);
      g.lineStyle(3, 0xc8922a); for (let x = 14; x < 64; x += 12) g.lineBetween(x, 10, x - 4, 50);
      g.fillStyle(0xd9542f); g.fillRect(20, 6, 6, 48); g.fillRect(46, 6, 6, 48);
      g.lineStyle(4, INK); g.strokeRoundedRect(3, 6, 64, 48, 12);
    });
    this.tex('fence', 120, 60, (g) => {
      g.fillStyle(0xfff3e0);
      g.fillRect(0, 16, 120, 9); g.fillRect(0, 34, 120, 9);
      for (const x of [8, 58, 108]) g.fillRoundedRect(x - 5, 4, 10, 56, { tl: 5, tr: 5, bl: 0, br: 0 });
      g.lineStyle(3, INK);
      g.strokeRect(0, 16, 120, 9); g.strokeRect(0, 34, 120, 9);
      for (const x of [8, 58, 108]) g.strokeRoundedRect(x - 5, 4, 10, 56, { tl: 5, tr: 5, bl: 0, br: 0 });
    });
    this.tex('flower', 40, 110, (g) => {
      g.lineStyle(5, 0x3f8f3a); g.lineBetween(20, 34, 20, 110);
      g.fillStyle(0x5cb84a); g.fillEllipse(28, 70, 18, 9); g.fillEllipse(12, 84, 18, 9);
      g.fillStyle(0xffc21a);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.fillCircle(20 + Math.cos(a) * 12, 22 + Math.sin(a) * 12, 7); }
      g.fillStyle(0x7a4a24); g.fillCircle(20, 22, 9);
      g.lineStyle(2.5, INK); g.strokeCircle(20, 22, 9);
    });
    this.tex('mill', 150, 220, (g) => {
      const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
      g.fillStyle(0xfff3e0); g.fillPoints([V(58, 220), V(66, 80), V(84, 80), V(92, 220)], true);
      g.lineStyle(4, INK); g.strokePoints([V(58, 220), V(66, 80), V(84, 80), V(92, 220)], true, true);
      g.lineStyle(3, INK); for (let y = 110; y < 220; y += 28) g.lineBetween(62, y, 88, y + 14);
    });
    this.tex('blades', 140, 140, (g) => {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const p = (u: number, v: number) => new Phaser.Math.Vector2(70 + c * u - s * v, 70 + s * u + c * v);
        g.fillStyle(0xffffff); g.fillPoints([p(10, -4), p(66, -12), p(66, 8), p(10, 4)], true);
        g.lineStyle(3, INK); g.strokePoints([p(10, -4), p(66, -12), p(66, 8), p(10, 4)], true, true);
      }
      g.fillStyle(0xd9483b); g.fillCircle(70, 70, 9); g.lineStyle(3, INK); g.strokeCircle(70, 70, 9);
    });
    this.tex('dot', 8, 8, (g) => { g.fillStyle(0xffffff); g.fillCircle(4, 4, 4); });
    this.tex('poof', 32, 32, (g) => { g.fillStyle(0xffffff, 0.9); g.fillCircle(16, 16, 15); });
    this.tex('dust', 32, 32, (g) => { g.fillStyle(0xe8c48a, 0.9); g.fillCircle(16, 16, 15); });
  }
}
