import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { makeExtraIcons } from '@comun/iconos';
import { save } from '../state';
import { applyPlane, makeCosmetics } from '../cosmeticos';
import { makeUpgradeIcons } from '../mejoras';

const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;
export const BALLOONS = [0xff5d5d, 0xffd23f, 0x9b6bff, 0x3ddc84];
/** Suelo (la franja de césped del parque continúa con este color). */
export const GRASS = 0x7bd65a;

/**
 * Carga los dos archivos del juego (fondo del menú y música) y dibuja por código todo lo demás, horneado en
 * texturas una sola vez: avión, monedas, globos, pájaros, aros, corrientes y las cuatro capas del paralaje.
 */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    makeExtraIcons(this);
    makeUpgradeIcons(this);
    save.load();
    applyPlane(this);
    makeCosmetics(this);
    this.tex('coin', 72, 72, (g) => this.coin(g));
    BALLOONS.forEach((c, i) => this.tex(`balloon${i}`, 90, 150, (g) => this.balloon(g, c)));
    this.tex('bird0', 120, 90, (g) => this.bird(g, 0));
    this.tex('bird1', 120, 90, (g) => this.bird(g, 1));
    this.tex('ring-back', 70, 180, (g) => this.ring(g, true));
    this.tex('ring-front', 70, 180, (g) => this.ring(g, false));
    this.tex('wisp', 60, 120, (g) => this.wisp(g));
    this.tex('draft', 64, 64, (g) => {
      // columna de aire que sube: turquesa translúcido, más claro en el centro, bordes marcados
      for (let i = 0; i < 32; i++) { const d = Math.abs(i - 15.5) / 16; g.fillStyle(0x6ff2e0, 0.34 * (1 - d * d) + 0.06); g.fillRect(i * 2, 0, 2, 64); }
      g.fillStyle(0xffffff, 0.35); g.fillRect(0, 0, 3, 64); g.fillRect(61, 0, 3, 64);
    });
    this.tex('puff', 48, 48, (g) => { g.fillStyle(0xffffff); g.fillCircle(24, 24, 22); });
    this.tex('flag', 90, 150, (g) => this.flag(g));
    this.tex('sky', 4, 256, (g) => {
      for (let i = 0; i < 64; i++) {
        const t = i / 63;
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x4fb3ff), Phaser.Display.Color.ValueToColor(0xc8efff), 63, i);
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(0, t * 252, 4, 5);
      }
    });
    this.tex('px-clouds', 1024, 360, (g) => this.clouds(g));
    this.tex('px-hills', 1024, 300, (g) => this.hills(g));
    this.tex('px-town', 1024, 320, (g) => this.town(g));
    this.tex('px-park', 1024, 200, (g) => this.park(g));
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }

  private tex(key: string, w: number, h: number, draw: (g: G) => void) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** Moneda con estrella (como en la portada). */
  private coin(g: G) {
    g.fillStyle(0xc98a00); g.fillCircle(36, 39, 32);
    g.fillStyle(0xffd23f); g.fillCircle(36, 35, 32);
    g.lineStyle(5, 0xf2a900); g.strokeCircle(36, 35, 23);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 15, a = -Math.PI / 2 + (i * Math.PI) / 5; pts.push(new Phaser.Math.Vector2(36 + Math.cos(a) * r, 36 + Math.sin(a) * r)); }
    g.fillStyle(0xf2a900); g.fillPoints(pts, true);
    g.fillStyle(0xffffff, 0.75); g.fillEllipse(24, 22, 9, 14);
    g.lineStyle(5, INK); g.strokeCircle(36, 36, 33);
  }

  private balloon(g: G, c: number) {
    g.lineStyle(3, INK); g.beginPath(); g.moveTo(45, 100); g.lineTo(40, 118); g.lineTo(50, 132); g.lineTo(44, 148); g.strokePath();
    g.fillStyle(c); g.fillEllipse(45, 52, 76, 92);
    g.fillStyle(0xffffff, 0.5); g.fillEllipse(30, 32, 16, 26);
    g.fillStyle(c); g.fillTriangle(37, 104, 53, 104, 45, 94);
    g.lineStyle(5, INK); g.strokeEllipse(45, 52, 76, 92); g.strokeTriangle(37, 104, 53, 104, 45, 97);
  }

  /** Pájaro azul (mira a la izquierda: vuela hacia el avión). frame 0 = alas arriba, 1 = abajo. */
  private bird(g: G, frame: number) {
    g.lineStyle(5, INK);
    const wing = frame === 0 ? [{ x: 62, y: 46 }, { x: 88, y: 6 }, { x: 98, y: 40 }] : [{ x: 62, y: 50 }, { x: 92, y: 84 }, { x: 100, y: 52 }];
    g.fillStyle(0x3b82e8); g.fillPoints(wing, true); g.strokePoints(wing, true, true);
    g.fillStyle(0x4aa8ff); g.fillEllipse(58, 52, 74, 50); g.strokeEllipse(58, 52, 74, 50);
    g.fillStyle(0xffffff); g.fillEllipse(54, 62, 40, 22);
    // cola
    const tail = [{ x: 92, y: 48 }, { x: 116, y: 36 }, { x: 112, y: 60 }];
    g.fillStyle(0x3b82e8); g.fillPoints(tail, true); g.strokePoints(tail, true, true);
    g.fillStyle(0x4aa8ff); g.fillEllipse(58, 52, 70, 46);
    g.fillStyle(0xffffff); g.fillEllipse(54, 62, 40, 20);
    g.lineStyle(5, INK); g.strokeEllipse(58, 52, 74, 50);
    // pico y ojo
    g.fillStyle(0xffa62b); g.fillTriangle(22, 42, 6, 50, 24, 54); g.lineStyle(4, INK); g.strokeTriangle(22, 42, 6, 50, 24, 54);
    g.fillStyle(0xffffff); g.fillCircle(38, 40, 10); g.fillStyle(INK); g.fillCircle(35, 41, 6); g.fillStyle(0xffffff); g.fillCircle(33, 38, 2);
  }

  /** Aro de turbo dorado, en dos mitades (detrás y delante del avión). */
  private ring(g: G, back: boolean) {
    g.lineStyle(26, INK); g.beginPath(); g.arc(35, 90, 62, back ? Math.PI / 2 : -Math.PI / 2, back ? Math.PI * 1.5 : Math.PI / 2, false); g.strokePath();
    g.lineStyle(16, back ? 0xe0a800 : 0xffd23f); g.beginPath(); g.arc(35, 90, 62, back ? Math.PI / 2 : -Math.PI / 2, back ? Math.PI * 1.5 : Math.PI / 2, false); g.strokePath();
    if (!back) { g.lineStyle(5, 0xffffff, 0.8); g.beginPath(); g.arc(35, 90, 60, -1.2, -0.3, false); g.strokePath(); }
  }

  /** Remolino de la corriente de aire: flecha curva hacia arriba. */
  private wisp(g: G) {
    g.lineStyle(9, 0xffffff, 0.85);
    g.beginPath(); g.moveTo(30, 116);
    for (let i = 0; i <= 20; i++) { const t = i / 20; g.lineTo(30 + Math.sin(t * Math.PI * 2) * 14, 116 - t * 92); }
    g.strokePath();
    g.fillStyle(0xffffff, 0.9); g.fillTriangle(14, 30, 46, 30, 30, 4);
  }

  /** Banderín del récord. */
  private flag(g: G) {
    g.fillStyle(INK); g.fillRect(10, 8, 9, 142);
    g.fillStyle(0xffd23f); g.fillTriangle(19, 12, 86, 34, 19, 58);
    g.lineStyle(5, INK); g.strokeTriangle(19, 12, 86, 34, 19, 58);
    g.fillStyle(0xffffff); g.fillCircle(14, 8, 8); g.lineStyle(4, INK); g.strokeCircle(14, 8, 8);
  }

  private clouds(g: G) {
    const puff = (x: number, y: number, s: number) => {
      for (const dx of [-1024, 0, 1024]) {
        g.fillStyle(0xd7ecff); g.fillEllipse(x + dx, y + 10 * s, 150 * s, 50 * s);
        g.fillStyle(0xffffff);
        g.fillCircle(x + dx - 40 * s, y, 30 * s); g.fillCircle(x + dx, y - 14 * s, 40 * s); g.fillCircle(x + dx + 42 * s, y, 28 * s);
        g.fillRect(x + dx - 70 * s, y, 140 * s, 22 * s);
      }
    };
    puff(130, 90, 1.1); puff(430, 220, 0.8); puff(700, 70, 1.3); puff(930, 250, 0.7);
  }

  private hills(g: G) {
    const ridge = (base: number, amp: number, col: number, f: number, ph: number) => {
      const pts: { x: number; y: number }[] = [{ x: 0, y: 300 }];
      for (let x = 0; x <= 1024; x += 16) pts.push({ x, y: base - amp * (0.6 * Math.sin((x / 1024) * Math.PI * 2 * f + ph) + 0.4 * Math.sin((x / 1024) * Math.PI * 2 * f * 2 + ph * 2)) });
      pts.push({ x: 1024, y: 300 });
      g.fillStyle(col); g.fillPoints(pts, true);
    };
    ridge(150, 70, 0xa9c8f2, 2, 0.5);
    ridge(200, 45, 0x8fd0a8, 3, 1.7);
  }

  /** Pueblo de colores (casas, torre del reloj). Suelo en y = 320. */
  private town(g: G) {
    const roofs = [0xff7a5c, 0x4aa8ff, 0xff5d5d, 0x9b6bff, 0xff9f43];
    const walls = [0xfff1c9, 0xffd3a8, 0xbfe6ff, 0xffe066, 0xf7c6e0];
    let x = 6, i = 0;
    while (x < 1000) {
      const w = 70 + ((i * 37) % 40), h = 90 + ((i * 53) % 110);
      if (x + w > 1018) break;
      if (i === 5) { // torre del reloj
        g.fillStyle(0xffd3a8); g.fillRect(x, 320 - 240, 60, 240); g.lineStyle(5, INK); g.strokeRect(x, 320 - 240, 60, 240);
        g.fillStyle(0xff5d5d); g.fillTriangle(x - 8, 82, x + 68, 82, x + 30, 20); g.strokeTriangle(x - 8, 82, x + 68, 82, x + 30, 20);
        g.fillStyle(0xffffff); g.fillCircle(x + 30, 116, 18); g.strokeCircle(x + 30, 116, 18);
        g.lineStyle(4, INK); g.lineBetween(x + 30, 116, x + 30, 104); g.lineBetween(x + 30, 116, x + 39, 116);
        x += 68; i++; continue;
      }
      const wall = walls[i % walls.length], roof = roofs[(i * 3) % roofs.length];
      g.fillStyle(wall); g.fillRect(x, 320 - h, w, h);
      g.lineStyle(5, INK); g.strokeRect(x, 320 - h, w, h);
      g.fillStyle(roof); g.fillTriangle(x - 8, 320 - h, x + w + 8, 320 - h, x + w / 2, 320 - h - 34);
      g.strokeTriangle(x - 8, 320 - h, x + w + 8, 320 - h, x + w / 2, 320 - h - 34);
      g.fillStyle(0x6cc8ff);
      for (let wy = 320 - h + 16; wy < 300 - 24; wy += 34) for (let wx = x + 12; wx < x + w - 22; wx += 26) { g.fillRect(wx, wy, 14, 18); }
      g.lineStyle(3, INK); g.fillStyle(0x8a5a3c); g.fillRect(x + w / 2 - 9, 290, 18, 30);
      x += w + 10 + ((i * 17) % 18); i++;
    }
  }

  /** Parque cercano: árboles, arbustos y farolas. Línea del suelo en y = 170; césped hasta abajo. */
  private park(g: G) {
    g.fillStyle(GRASS); g.fillRect(0, 168, 1024, 32);
    g.fillStyle(0x62c048); for (let x = 0; x < 1024; x += 40) g.fillEllipse(x + 20, 172, 36, 8);
    const tree = (x: number, s: number) => {
      g.fillStyle(0x8a5a3c); g.fillRect(x - 8 * s, 170 - 60 * s, 16 * s, 60 * s);
      g.lineStyle(4, INK); g.strokeRect(x - 8 * s, 170 - 60 * s, 16 * s, 60 * s);
      g.fillStyle(0x3ddc84); g.fillCircle(x, 170 - 86 * s, 40 * s); g.fillCircle(x - 30 * s, 170 - 64 * s, 28 * s); g.fillCircle(x + 30 * s, 170 - 64 * s, 28 * s);
      g.lineStyle(5, INK); g.strokeCircle(x, 170 - 86 * s, 40 * s);
      g.fillStyle(0x3ddc84); g.fillCircle(x, 170 - 70 * s, 34 * s);
      g.fillStyle(0xffffff, 0.3); g.fillCircle(x - 12 * s, 170 - 100 * s, 10 * s);
    };
    const bush = (x: number) => { g.fillStyle(0x2fb873); g.fillEllipse(x, 160, 70, 34); g.lineStyle(4, INK); g.strokeEllipse(x, 160, 70, 34); g.fillStyle(0xff9ec7); g.fillCircle(x - 14, 154, 4); g.fillCircle(x + 12, 150, 4); };
    const lamp = (x: number) => { g.fillStyle(INK); g.fillRect(x - 3, 100, 6, 70); g.fillStyle(0xffe066); g.fillCircle(x, 98, 10); g.lineStyle(4, INK); g.strokeCircle(x, 98, 10); };
    tree(80, 1); bush(190); lamp(260); tree(360, 1.2); bush(470); tree(560, 0.9); lamp(660); bush(740); tree(850, 1.1); bush(960);
    g.lineStyle(5, INK); g.lineBetween(0, 170, 1024, 170);
  }
}
