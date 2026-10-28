import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { save } from '../state';

const INK = PALETTE.ink;

/** Carga los dos archivos del juego y dibuja por código el resto de gráficos. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    this.makeTruck();
    this.makeWheel();
    this.makeEgg();
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

  /** Camioneta roja vista de lado. Origen de diseño (centro del chasis) en (100, 70). */
  private makeTruck() {
    this.tex('truck', 200, 110, (g) => {
      const ox = 100, oy = 70;
      g.lineStyle(5, INK);
      // caja trasera
      g.fillStyle(0xd93636);
      g.fillRoundedRect(ox - 78, oy - 40, 14, 40, 4);
      g.strokeRoundedRect(ox - 78, oy - 40, 14, 40, 4);
      // chasis
      g.fillStyle(0xff4747);
      g.fillRoundedRect(ox - 80, oy - 14, 160, 28, 8);
      g.strokeRoundedRect(ox - 80, oy - 14, 160, 28, 8);
      // cabina
      g.fillStyle(0xff4747);
      g.fillRoundedRect(ox + 18, oy - 52, 52, 42, { tl: 6, tr: 18, bl: 0, br: 0 });
      g.strokeRoundedRect(ox + 18, oy - 52, 52, 42, { tl: 6, tr: 18, bl: 0, br: 0 });
      // ventana
      g.fillStyle(0x9be3ff);
      g.fillRoundedRect(ox + 30, oy - 45, 32, 22, { tl: 4, tr: 12, bl: 2, br: 2 });
      g.lineStyle(3, INK);
      g.strokeRoundedRect(ox + 30, oy - 45, 32, 22, { tl: 4, tr: 12, bl: 2, br: 2 });
      // faro y parachoques
      g.fillStyle(0xffe066); g.fillCircle(ox + 76, oy - 4, 6); g.strokeCircle(ox + 76, oy - 4, 6);
      g.fillStyle(0xc9ccd6); g.fillRoundedRect(ox + 66, oy + 6, 22, 9, 3); g.strokeRoundedRect(ox + 66, oy + 6, 22, 9, 3);
      // brillo
      g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(ox - 70, oy - 10, 80, 5, 2);
    });
  }

  private makeWheel() {
    this.tex('wheel', 56, 56, (g) => {
      g.fillStyle(0x2b2b33); g.fillCircle(28, 28, 26);
      g.lineStyle(4, INK); g.strokeCircle(28, 28, 25);
      g.fillStyle(0xbfc4d0); g.fillCircle(28, 28, 12);
      g.lineStyle(3, INK); g.strokeCircle(28, 28, 12);
      g.fillStyle(0x6b7080);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.fillCircle(28 + Math.cos(a) * 6, 28 + Math.sin(a) * 6, 2.4);
      }
      // tacos del neumático
      g.fillStyle(0x15151a);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.fillCircle(28 + Math.cos(a) * 22, 28 + Math.sin(a) * 22, 2.6);
      }
    });
  }

  /** Huevo con cara, en tres estados: entero, con una grieta y con dos. */
  private makeEgg() {
    const W = 48, H = 58;
    for (let crack = 0; crack < 3; crack++) {
      this.tex(`egg${crack}`, W, H, (g) => {
        const cx = W / 2, cy = H / 2 + 2;
        g.fillStyle(0xfff8ec); g.fillEllipse(cx, cy, 40, 50);
        g.lineStyle(4, INK); g.strokeEllipse(cx, cy, 40, 50);
        g.fillStyle(0xffffff, 0.8); g.fillEllipse(cx - 8, cy - 12, 8, 12);
        // cara: más preocupada a cada grieta
        g.fillStyle(INK);
        g.fillCircle(cx - 7, cy + 2, crack ? 3.2 : 3.6);
        g.fillCircle(cx + 7, cy + 2, crack ? 3.2 : 3.6);
        g.fillStyle(0xff9fb0, 0.8);
        g.fillCircle(cx - 13, cy + 8, 3); g.fillCircle(cx + 13, cy + 8, 3);
        g.lineStyle(2.5, INK);
        g.beginPath();
        if (crack === 0) g.arc(cx, cy + 8, 5, 0.2, Math.PI - 0.2);
        else if (crack === 1) { g.moveTo(cx - 5, cy + 11); g.lineTo(cx + 5, cy + 11); }
        else g.arc(cx, cy + 14, 5, Math.PI + 0.3, -0.3);
        g.strokePath();
        if (crack >= 1) {
          g.lineStyle(2.5, INK);
          g.beginPath(); g.moveTo(cx + 4, cy - 24); g.lineTo(cx + 9, cy - 16); g.lineTo(cx + 4, cy - 11); g.lineTo(cx + 11, cy - 6); g.strokePath();
        }
        if (crack >= 2) {
          g.beginPath(); g.moveTo(cx - 19, cy - 4); g.lineTo(cx - 12, cy - 8); g.lineTo(cx - 14, cy - 15); g.lineTo(cx - 7, cy - 19); g.strokePath();
        }
      });
    }
    this.tex('shell', 16, 14, (g) => {
      g.fillStyle(0xfff8ec); g.fillTriangle(1, 13, 8, 1, 15, 11);
      g.lineStyle(2, INK); g.strokeTriangle(1, 13, 8, 1, 15, 11);
    });
    this.tex('yolk', 16, 16, (g) => { g.fillStyle(0xffc21a); g.fillCircle(8, 8, 7); });
    // huevo roto para la pantalla final: media cáscara con borde en zigzag y yema
    this.tex('egg-broken', 96, 80, (g) => {
      g.fillStyle(0xffffff, 0.9); g.fillEllipse(48, 58, 92, 26);
      g.lineStyle(3, INK); g.strokeEllipse(48, 58, 92, 26);
      g.fillStyle(0xffc21a); g.fillCircle(48, 52, 17); g.lineStyle(3, 0xd99a00); g.strokeCircle(48, 52, 17);
      g.fillStyle(0xffffff, 0.7); g.fillCircle(42, 46, 5);
      const zig = [[10, 40], [18, 30], [24, 40], [31, 28], [37, 38]];
      g.fillStyle(0xfff8ec);
      g.fillPoints([...zig.map(([x, y]) => new Phaser.Math.Vector2(x, y)), new Phaser.Math.Vector2(36, 66), new Phaser.Math.Vector2(14, 64)], true);
      g.lineStyle(4, INK);
      g.strokePoints([...zig.map(([x, y]) => new Phaser.Math.Vector2(x, y)), new Phaser.Math.Vector2(36, 66), new Phaser.Math.Vector2(14, 64)], true);
      const zig2 = [[62, 36], [68, 26], [75, 36], [81, 24], [88, 38]];
      g.fillStyle(0xfff8ec);
      g.fillPoints([...zig2.map(([x, y]) => new Phaser.Math.Vector2(x, y)), new Phaser.Math.Vector2(84, 64), new Phaser.Math.Vector2(62, 66)], true);
      g.strokePoints([...zig2.map(([x, y]) => new Phaser.Math.Vector2(x, y)), new Phaser.Math.Vector2(84, 64), new Phaser.Math.Vector2(62, 66)], true);
    });
    this.tex('dot', 8, 8, (g) => { g.fillStyle(0xffffff); g.fillCircle(4, 4, 4); });
  }

  /** Nubes, colinas lejanas y banderín de los 100 m. */
  private makeScenery() {
    this.tex('cloud', 220, 90, (g) => {
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(60, 55, 32); g.fillCircle(105, 40, 40); g.fillCircle(150, 55, 30); g.fillRoundedRect(30, 50, 160, 34, 17);
    });
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
      });
    hills('hills-far', 0x9fdcb0, 60, 200, 2, 1.3);
    hills('hills-near', 0x6fcf7f, 70, 250, 3, 0.4);
    this.tex('flag', 40, 90, (g) => {
      g.fillStyle(INK); g.fillRect(4, 4, 6, 86);
      g.fillStyle(0xffd23f); g.fillTriangle(10, 6, 38, 18, 10, 30);
      g.lineStyle(3, INK); g.strokeTriangle(10, 6, 38, 18, 10, 30);
    });
  }
}
