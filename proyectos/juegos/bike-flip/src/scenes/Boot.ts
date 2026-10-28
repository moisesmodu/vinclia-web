import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { save } from '../state';

const INK = PALETTE.ink;
/** Paleta de Bike Flip: atardecer en el desierto (Egg Truck es cielo azul y hierba). */
export const COL = {
  sky1: 0xffe2a8, sky2: 0xff9f6e, sun: 0xfff1b8,
  mesaFar: 0xf7b183, mesaNear: 0xe9825f,
  bike: 0x19c9b4, bikeDark: 0x0f9486, rider: 0x8a5cf6, riderDark: 0x6a3fd6, helmet: 0xffd23f,
};

/** Carga los dos archivos del juego y dibuja por código el resto de gráficos. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    this.makeIcons();
    this.makeBike();
    this.makeScenery();
    this.makeDigits();
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

  /** Iconos propios (blancos, 128 px, como los de comun/ui.ts). */
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
    this.tex('ic-clock', s, s, (g) => {
      g.lineStyle(s * 0.09, W); g.strokeCircle(s / 2, s / 2, s * 0.32);
      g.lineStyle(s * 0.08, W); g.lineBetween(s / 2, s / 2, s / 2, s * 0.3); g.lineBetween(s / 2, s / 2, s * 0.65, s * 0.58);
    });
    this.tex('ic-flip', s, s, (g) => {
      g.lineStyle(s * 0.11, W);
      g.beginPath(); g.arc(s / 2, s / 2, s * 0.3, Phaser.Math.DegToRad(-40), Phaser.Math.DegToRad(250)); g.strokePath();
      const a = Phaser.Math.DegToRad(-40), x = s / 2 + Math.cos(a) * s * 0.3, y = s / 2 + Math.sin(a) * s * 0.3;
      g.fillStyle(W); g.fillTriangle(x - s * 0.17, y - s * 0.02, x + s * 0.13, y - s * 0.1, x + s * 0.04, y + s * 0.18);
    });
    // banderín de meta a cuadros (icono a color)
    this.tex('ic-finish', s, s, (g) => {
      g.fillStyle(INK); g.fillRect(s * 0.2, s * 0.12, s * 0.08, s * 0.78);
      const x0 = s * 0.28, y0 = s * 0.14, c = s * 0.11;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { g.fillStyle((i + j) % 2 ? INK : W); g.fillRect(x0 + i * c, y0 + j * c, c, c); }
      g.lineStyle(s * 0.04, INK); g.strokeRect(x0, y0, c * 5, c * 4);
    });
    this.tex('ic-flame', s, s, (g) => {
      g.fillStyle(0xff6a2b); g.fillTriangle(s * 0.5, s * 0.08, s * 0.18, s * 0.66, s * 0.82, s * 0.66); g.fillCircle(s * 0.5, s * 0.64, s * 0.32);
      g.fillStyle(PALETTE.yellow); g.fillTriangle(s * 0.5, s * 0.32, s * 0.32, s * 0.72, s * 0.68, s * 0.72); g.fillCircle(s * 0.5, s * 0.7, s * 0.18);
      g.lineStyle(s * 0.05, INK); g.strokeCircle(s * 0.5, s * 0.64, s * 0.32);
    });
    this.tex('ic-star-off', s, s, (g) => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s * 0.45 : s * 0.2, a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(new Phaser.Math.Vector2(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r * 0.98 + s * 0.03));
      }
      g.fillStyle(0x000000, 0.25); g.fillPoints(pts, true);
      g.lineStyle(s * 0.06, 0xffffff, 0.6); g.strokePoints(pts, true, true);
    });
  }

  /**
   * Moto y piloto vistos de lado (un solo dibujo). Origen de diseño en (90, 100) del lienzo de 180×150:
   * coincide con el centro del chasis en Play.ts (ruedas en ±44, +22; casco en -2, -66).
   */
  private makeBike() {
    this.tex('bike', 180, 150, (g) => {
      const L = (w: number, c: number, x1: number, y1: number, x2: number, y2: number) => { g.lineStyle(w, c); g.lineBetween(x1, y1, x2, y2); };
      const fx = (pts: number[][], fill: number, line = 5) => {
        const v = pts.map(([x, y]) => new Phaser.Math.Vector2(x, y));
        g.fillStyle(fill); g.fillPoints(v, true); g.lineStyle(line, INK); g.strokePoints(v, true, true);
      };
      // basculante y horquilla
      L(11, INK, 46, 122, 84, 104); L(5, 0xc9ccd6, 46, 122, 84, 104);
      L(11, INK, 134, 122, 116, 70); L(5, 0xc9ccd6, 134, 122, 116, 70);
      // tubo de escape
      L(10, INK, 92, 110, 52, 98); L(5, 0xdfe3ea, 92, 110, 52, 98);
      // motor
      g.fillStyle(0x4a4f5e); g.fillRoundedRect(78, 96, 30, 20, 5); g.lineStyle(4, INK); g.strokeRoundedRect(78, 96, 30, 20, 5);
      // guardabarros trasero, depósito y placa delantera
      fx([[40, 90], [86, 86], [84, 96], [52, 98]], COL.bike);
      fx([[70, 84], [116, 78], [124, 92], [96, 100], [74, 98]], COL.bike);
      fx([[108, 70], [128, 66], [130, 90], [118, 92]], COL.bikeDark);
      fx([[122, 102], [154, 98], [146, 108]], COL.bike, 4);
      // número blanco de la placa (adorno)
      g.fillStyle(0xffffff); g.fillCircle(121, 79, 6); g.lineStyle(3, INK); g.strokeCircle(121, 79, 6);
      // sillín
      g.fillStyle(0x2f2a3d); g.fillRoundedRect(58, 80, 40, 9, 4);
      // brillo
      g.fillStyle(0xffffff, 0.45); g.fillRoundedRect(80, 85, 26, 4, 2);
      // piloto: pierna, cuerpo, brazo y casco
      L(16, INK, 80, 78, 102, 86); L(10, COL.riderDark, 80, 78, 102, 86);
      L(14, INK, 102, 86, 98, 104); L(8, COL.riderDark, 102, 86, 98, 104);
      g.fillStyle(0x2f2a3d); g.fillRoundedRect(92, 100, 16, 8, 3);
      fx([[74, 80], [86, 46], [100, 48], [92, 82]], COL.rider);
      L(13, INK, 94, 54, 114, 70); L(7, COL.rider, 94, 54, 114, 70);
      g.fillStyle(0x2f2a3d); g.fillCircle(115, 70, 5);
      L(6, INK, 110, 64, 120, 62);
      // casco
      g.fillStyle(COL.helmet); g.fillCircle(88, 34, 15); g.lineStyle(5, INK); g.strokeCircle(88, 34, 15);
      g.fillStyle(INK); g.fillRoundedRect(90, 28, 14, 10, 4);
      g.fillStyle(0x9be3ff); g.fillRoundedRect(93, 30, 9, 5, 2);
      g.fillStyle(0xff5d5d); g.fillRect(74, 30, 12, 4);
      g.fillStyle(0xffffff, 0.6); g.fillCircle(82, 27, 4);
    });
    this.tex('wheel', 48, 48, (g) => {
      g.fillStyle(0x2b2b33); g.fillCircle(24, 24, 22);
      g.fillStyle(0x15151a);
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; g.fillCircle(24 + Math.cos(a) * 21, 24 + Math.sin(a) * 21, 3); }
      g.lineStyle(4, INK); g.strokeCircle(24, 24, 20);
      g.fillStyle(0xdfe3ea); g.fillCircle(24, 24, 11); g.lineStyle(3, INK); g.strokeCircle(24, 24, 11);
      g.lineStyle(2.5, 0x8a8f9e);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.lineBetween(24, 24, 24 + Math.cos(a) * 10, 24 + Math.sin(a) * 10); }
      g.fillStyle(COL.bike); g.fillCircle(24, 24, 4); g.lineStyle(2, INK); g.strokeCircle(24, 24, 4);
    });
    this.tex('flame', 70, 34, (g) => {
      g.fillStyle(0xff5a1f); g.fillTriangle(0, 17, 54, 2, 54, 32); g.fillCircle(54, 17, 15);
      g.fillStyle(0xffb52b); g.fillTriangle(14, 17, 58, 7, 58, 27); g.fillCircle(58, 17, 10);
      g.fillStyle(0xfff4b8); g.fillCircle(62, 17, 5);
    });
    this.tex('dot', 12, 12, (g) => { g.fillStyle(0xffffff); g.fillCircle(6, 6, 6); });
    this.tex('dust', 24, 24, (g) => { g.fillStyle(0xf9d9a0); g.fillCircle(12, 12, 11); g.lineStyle(3, 0xd99a56); g.strokeCircle(12, 12, 10); });
  }

  /**
   * Fuente de mapa de bits con las cifras (mismo estilo que bigNumber): el cronómetro cambia 10 veces por
   * segundo y un Text normal redibuja y vuelve a subir su textura en cada cambio.
   */
  private makeDigits() {
    if (this.cache.bitmapFont.exists('digits')) return;
    const chars = '0123456789.:+/', size = 64, stroke = 11, cellH = size + stroke * 2 + 8;
    const font = `${size}px "Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif`;
    const probe = document.createElement('canvas').getContext('2d')!;
    probe.font = font;
    const widths = [...chars].map((c) => Math.ceil(probe.measureText(c).width) + stroke * 2);
    const texW = widths.reduce((a, b) => a + b + 2, 0);
    const tex = this.textures.createCanvas('digits-tex', texW, cellH)!;
    const ctx = tex.getContext();
    ctx.font = font; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = stroke; ctx.strokeStyle = '#2b2340'; ctx.fillStyle = '#ffffff';
    const data: any = { font: 'digits', size, lineHeight: cellH, retroFont: false, chars: {} };
    let x = 0;
    [...chars].forEach((c, i) => {
      const w = widths[i];
      ctx.strokeText(c, x + stroke, cellH / 2); ctx.fillText(c, x + stroke, cellH / 2);
      data.chars[c.charCodeAt(0)] = {
        x, y: 0, width: w, height: cellH, centerX: w / 2, centerY: cellH / 2, xOffset: 0, yOffset: 0,
        xAdvance: w - stroke, data: {}, kerning: {}, u0: x / texW, v0: 0, u1: (x + w) / texW, v1: 1,
      };
      x += w + 2;
    });
    tex.refresh();
    this.cache.bitmapFont.add('digits', { data, texture: 'digits-tex', frame: null });
  }

  /** Cielo de atardecer, sol, nubes, mesetas y la meta. */
  private makeScenery() {
    if (!this.textures.exists('sky')) {
      const c = this.textures.createCanvas('sky', 4, 512)!;
      const ctx = c.getContext();
      const gr = ctx.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, '#ffd59a'); gr.addColorStop(0.6, '#ffc390'); gr.addColorStop(1, '#ff9f78');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 4, 512); c.refresh();
    }
    this.tex('sun', 220, 220, (g) => {
      g.fillStyle(0xfff6cf, 0.35); g.fillCircle(110, 110, 108);
      g.fillStyle(COL.sun); g.fillCircle(110, 110, 78);
    });
    this.tex('cloud', 220, 90, (g) => {
      g.fillStyle(0xfff7ec, 0.95);
      g.fillCircle(60, 55, 30); g.fillCircle(105, 42, 38); g.fillCircle(150, 55, 28); g.fillRoundedRect(30, 52, 160, 30, 15);
    });
    // mesetas: siluetas de techo plano (las 4 filas de abajo quedan transparentes al repetir)
    const mesas = (key: string, color: number, base: number, seed: number) => this.tex(key, 1024, 420, (g) => {
      const r = new Phaser.Math.RandomDataGenerator([key]);
      const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, 416), new Phaser.Math.Vector2(0, base)];
      let x = 0;
      while (x < 1024) {
        const wFlat = r.between(60, 180), hgt = r.between(60, 200) * (0.6 + 0.4 * Math.sin(x / 160 + seed));
        const slope = r.between(20, 40);
        pts.push(new Phaser.Math.Vector2(x + slope, base - hgt), new Phaser.Math.Vector2(Math.min(1024, x + slope + wFlat), base - hgt));
        x = Math.min(1024, x + 2 * slope + wFlat);
        pts.push(new Phaser.Math.Vector2(x, base));
        x += r.between(30, 140);
        pts.push(new Phaser.Math.Vector2(Math.min(1024, x), base));
      }
      pts.push(new Phaser.Math.Vector2(1024, base), new Phaser.Math.Vector2(1024, 416));
      g.fillStyle(color); g.fillPoints(pts, true);
      g.fillRect(0, base, 1024, 416 - base);
    });
    mesas('mesas-far', COL.mesaFar, 300, 1.3);
    mesas('mesas-near', COL.mesaNear, 330, 0.2);
    // arco de meta: dos postes y pancarta a cuadros. Origen abajo al centro.
    this.tex('finish', 260, 260, (g) => {
      const W = PALETTE.white;
      g.fillStyle(INK); g.fillRoundedRect(10, 40, 18, 220, 6); g.fillRoundedRect(232, 40, 18, 220, 6);
      g.fillStyle(0xff5d5d); g.fillRoundedRect(14, 44, 10, 212, 4); g.fillRoundedRect(236, 44, 10, 212, 4);
      const c = 22, x0 = 20, y0 = 20;
      for (let i = 0; i < 10; i++) for (let j = 0; j < 3; j++) { g.fillStyle((i + j) % 2 ? INK : W); g.fillRect(x0 + i * c, y0 + j * c, c, c); }
      g.lineStyle(6, INK); g.strokeRect(x0, y0, c * 10, c * 3);
    });
    this.tex('checker', 24, 48, (g) => {
      for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { g.fillStyle((i + j) % 2 ? PALETTE.ink : PALETTE.white); g.fillRect(i * 12, j * 12, 12, 12); }
    });
  }
}
