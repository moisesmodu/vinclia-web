import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { makeExtraIcons } from '@comun/iconos';
import { save } from '../state';
import { applyPlow, makeCosmetics } from '../cosmeticos';

const INK = PALETTE.ink;
/** Los 4 colores de los regalos: [papel, lazo]. */
export const GIFT_COLORS: [number, number][] = [
  [0xff4f5e, 0xffe066], // rojo con lazo dorado
  [0x35c46a, 0xff4f5e], // verde con lazo rojo
  [0x4aa8ff, 0xffffff], // azul con lazo blanco
  [0xffc93c, 0xb34dff], // dorado con lazo morado
];

/** Carga el fondo del menú y la música; todo lo demás se dibuja por código. */
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
    this.makePlow();
    this.makeWheel();
    this.makeGifts();
    this.makeSleigh();
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

  /** Quitanieves naranja con pala amarilla delante. Origen de diseño (centro del chasis) en (110, 84). */
  private makePlow() {
    applyPlow(this);
    this.tex('beacon', 40, 40, (g) => { g.fillStyle(0xffc21a, 0.55); g.fillCircle(20, 20, 20); g.fillStyle(0xfff3a0, 0.9); g.fillCircle(20, 20, 9); });
  }

  private makeWheel() {
    this.tex('wheel', 56, 56, (g) => {
      g.fillStyle(0x2b2b33); g.fillCircle(28, 28, 26);
      g.lineStyle(4, INK); g.strokeCircle(28, 28, 25);
      g.fillStyle(0xbfc4d0); g.fillCircle(28, 28, 12);
      g.lineStyle(3, INK); g.strokeCircle(28, 28, 12);
      g.fillStyle(0x6b7080);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.fillCircle(28 + Math.cos(a) * 6, 28 + Math.sin(a) * 6, 2.4); }
      // cadenas para la nieve
      g.fillStyle(0xdfe6f5);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillCircle(28 + Math.cos(a) * 22, 28 + Math.sin(a) * 22, 2.6); }
    });
  }

  /** Regalos de 64 px (se escalan al tamaño de cada caja) en los 4 colores, con lazo. */
  private makeGifts() {
    GIFT_COLORS.forEach(([paper, ribbon], i) => {
      this.tex(`gift${i}`, 64, 64, (g) => {
        g.fillStyle(paper); g.fillRoundedRect(3, 3, 58, 58, 8);
        g.fillStyle(0xffffff, 0.22);
        for (let k = 0; k < 4; k++) g.fillCircle(14 + (k % 2) * 34, 16 + Math.floor(k / 2) * 32, 4);
        g.fillStyle(ribbon); g.fillRect(27, 3, 10, 58); g.fillRect(3, 27, 58, 10);
        g.lineStyle(5, INK); g.strokeRoundedRect(3, 3, 58, 58, 8);
        g.lineStyle(3, INK); g.strokeRect(27, 3, 10, 58); g.strokeRect(3, 27, 58, 10);
        // lazo
        g.fillStyle(ribbon);
        g.fillEllipse(22, 16, 18, 12); g.fillEllipse(42, 16, 18, 12);
        g.lineStyle(3, INK); g.strokeEllipse(22, 16, 18, 12); g.strokeEllipse(42, 16, 18, 12);
        g.fillCircle(32, 20, 5); g.strokeCircle(32, 20, 5);
      });
    });
    this.tex('dot', 8, 8, (g) => { g.fillStyle(0xffffff); g.fillCircle(4, 4, 4); });
    this.tex('flake', 16, 16, (g) => { g.fillStyle(0xffffff, 0.95); g.fillCircle(8, 8, 5); g.fillStyle(0xffffff, 0.35); g.fillCircle(8, 8, 8); });
    this.tex('poof', 32, 32, (g) => { g.fillStyle(0xffffff, 0.9); g.fillCircle(16, 16, 15); });
  }

  /** Trineo rojo de Papá Noel con saco (meta cada 150 m). Base en (90, 120). */
  private makeSleigh() {
    this.tex('sleigh', 200, 130, (g) => {
      // saco
      g.fillStyle(0xb5835a); g.fillEllipse(70, 44, 74, 64);
      g.lineStyle(5, INK); g.strokeEllipse(70, 44, 74, 64);
      g.fillStyle(0xd9a77a); g.fillEllipse(60, 30, 20, 14);
      // caja del trineo
      g.fillStyle(0xe8323f);
      g.fillPoints([new Phaser.Math.Vector2(16, 58), new Phaser.Math.Vector2(150, 58), new Phaser.Math.Vector2(176, 30),
        new Phaser.Math.Vector2(188, 38), new Phaser.Math.Vector2(162, 98), new Phaser.Math.Vector2(30, 98), new Phaser.Math.Vector2(10, 70)], true);
      g.lineStyle(5, INK);
      g.strokePoints([new Phaser.Math.Vector2(16, 58), new Phaser.Math.Vector2(150, 58), new Phaser.Math.Vector2(176, 30),
        new Phaser.Math.Vector2(188, 38), new Phaser.Math.Vector2(162, 98), new Phaser.Math.Vector2(30, 98), new Phaser.Math.Vector2(10, 70)], true, true);
      g.fillStyle(0xffd23f); g.fillRect(24, 68, 128, 8); g.lineStyle(3, INK); g.strokeRect(24, 68, 128, 8);
      // patines
      g.lineStyle(6, INK);
      g.lineBetween(46, 98, 46, 114); g.lineBetween(132, 98, 132, 114);
      g.lineStyle(7, 0xffd23f);
      g.beginPath(); g.moveTo(14, 116); g.lineTo(168, 116); g.arc(168, 104, 12, Math.PI / 2, -Math.PI / 2, true); g.strokePath();
    });
    this.tex('pole', 30, 200, (g) => {
      // poste de bastón de caramelo con estrella
      g.fillStyle(0xffffff); g.fillRect(10, 30, 10, 170);
      g.fillStyle(0xff4f5e);
      for (let y = 30; y < 200; y += 20) g.fillTriangle(10, y + 10, 20, y, 20, y + 8);
      g.lineStyle(3, INK); g.strokeRect(10, 30, 10, 170);
    });
  }

  /** Abetos, colinas nevadas lejanas y luna. */
  private makeScenery() {
    this.tex('tree', 120, 190, (g) => {
      g.fillStyle(0x6b4a33); g.fillRect(52, 150, 16, 40);
      const layer = (y: number, w: number, hgt: number) => {
        g.fillStyle(0x1f7a4d); g.fillTriangle(60 - w / 2, y + hgt, 60, y, 60 + w / 2, y + hgt);
        g.lineStyle(4, INK); g.strokeTriangle(60 - w / 2, y + hgt, 60, y, 60 + w / 2, y + hgt);
        g.fillStyle(0xffffff); g.fillTriangle(60 - w * 0.18, y + hgt * 0.36, 60, y + 2, 60 + w * 0.18, y + hgt * 0.36);
      };
      layer(80, 112, 74); layer(42, 88, 66); layer(8, 62, 56);
    });
    // luces en dos fases: se alternan para que parpadeen
    const spots = [[44, 58], [76, 52], [34, 98], [66, 92], [90, 104], [24, 140], [56, 134], [88, 146], [60, 26]];
    const cols = [0xff5d5d, 0xffd23f, 0x3ddc84, 0x4aa8ff, 0xff8ad8];
    for (let phase = 0; phase < 2; phase++) {
      this.tex(`tree-lights${phase}`, 120, 190, (g) => {
        spots.forEach(([x, y], i) => {
          const c = cols[(i + phase * 2) % cols.length];
          g.fillStyle(c, 0.35); g.fillCircle(x, y, 8);
          g.fillStyle(c); g.fillCircle(x, y, 4);
        });
        g.fillStyle(0xffd23f); g.fillCircle(60, 10, 7);
      });
    }
    const hills = (key: string, color: number, amp: number, base: number, f: number, seed: number) =>
      this.tex(key, 1024, 400, (g) => {
        g.fillStyle(color);
        // las 4 filas de abajo quedan transparentes: al repetir la textura no aparece una línea en el cielo
        const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, 396)];
        for (let x = 0; x <= 1024; x += 16) {
          const k = (x / 1024) * Math.PI * 2;
          pts.push(new Phaser.Math.Vector2(x, base - amp * (0.6 * Math.sin(k * f + seed) + 0.4 * Math.sin(k * (f * 2 + 1) + seed * 2))));
        }
        pts.push(new Phaser.Math.Vector2(1024, 396));
        g.fillPoints(pts, true);
        // pequeños abetos oscuros en la cresta
        g.fillStyle(Phaser.Display.Color.ValueToColor(color).darken(18).color);
        for (let x = 20; x < 1024; x += 37 + ((x * 7) % 23)) {
          const k = (x / 1024) * Math.PI * 2;
          const y = base - amp * (0.6 * Math.sin(k * f + seed) + 0.4 * Math.sin(k * (f * 2 + 1) + seed * 2));
          g.fillTriangle(x - 9, y + 6, x, y - 22, x + 9, y + 6);
        }
      });
    hills('hills-far', 0x4c6aa8, 60, 200, 2, 1.3);
    hills('hills-near', 0x8aa6d8, 70, 250, 3, 0.4);
    this.tex('moon', 140, 140, (g) => {
      g.fillStyle(0xfff6d8, 0.12); g.fillCircle(70, 70, 70);
      g.fillStyle(0xfff6d8, 0.2); g.fillCircle(70, 70, 54);
      g.fillStyle(0xfff3c4); g.fillCircle(70, 70, 40);
      g.fillStyle(0xeadca8); g.fillCircle(58, 62, 7); g.fillCircle(84, 82, 5); g.fillCircle(80, 56, 4);
    });
    this.tex('sky', 4, 256, (g) => {
      g.fillGradientStyle(0x0b1640, 0x0b1640, 0x3a4f9a, 0x3a4f9a, 1);
      g.fillRect(0, 0, 4, 256);
    });
  }
}
