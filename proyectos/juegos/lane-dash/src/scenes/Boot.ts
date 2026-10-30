import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { makeExtraIcons } from '@comun/iconos';
import { save } from '../state';
import { applyCart, drawCart, makeCosmetics } from '../cosmeticos';

const INK = PALETTE.ink;
/** Píxeles de textura por unidad de mundo (1 unidad = ancho de un carril). Play escala con S / z / PX. */
export const PX = 240;

type G = Phaser.GameObjects.Graphics;

/** Carga los dos archivos del juego (fondo del menú y música) y dibuja por código todo lo demás (cero descargas). */
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
    // carrito del jugador (visto desde atrás, con la cara en el panel trasero) con la pintura y el banderín de la tienda
    applyCart(this);
    makeCosmetics(this);
    // carrito aparcado (obstáculo: cambia de carril)
    this.tex('ocart', 280, 400, (g) => { g.translateCanvas(0, 120); drawCart(g, 0x4aa8ff, 0xffd23f, 'sleepy', 1, false); });
    this.tex('box', 260, 170, (g) => this.boxes(g));
    this.tex('sign0', 250, 1000, (g) => this.sign(g, 0xffd23f, 0xff5d5d));
    this.tex('sign1', 250, 1000, (g) => this.sign(g, 0x9b6bff, 0xffd23f));
    this.tex('wet', 250, 330, (g) => this.wet(g));
    this.tex('coin', 80, 80, (g) => this.coin(g));
    this.tex('tag-turbo', 150, 110, (g) => this.tag(g, 0xff5d5d, 'turbo'));
    this.tex('tag-magnet', 150, 110, (g) => this.tag(g, 0x3ddc84, 'magnet'));
    this.tex('puff', 48, 48, (g) => { g.fillStyle(0xffffff); g.fillCircle(24, 24, 22); });
    this.tex('streak', 8, 90, (g) => { g.fillStyle(0xffffff); g.fillRoundedRect(0, 0, 8, 90, 4); });
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

  /** Dos cajas apiladas (se saltan). 260×170, suelo en y = 162. */
  private boxes(g: G) {
    g.fillStyle(0x000000, 0.18); g.fillEllipse(130, 160, 240, 20);
    g.lineStyle(8, INK);
    const box = (x: number, y: number, w: number, h: number) => {
      g.fillStyle(0xe0a15e); g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
      g.fillStyle(0xf6d29a); g.fillRect(x + w / 2 - 14, y + 4, 28, h - 8);
      g.fillStyle(0xb9773a); g.fillRect(x + 4, y + 4, w - 8, 8);
    };
    box(14, 82, 232, 78);
    box(46, 12, 168, 70);
  }

  /** Cartel colgante de oferta (se pasa agachado). 250×1000: tablero abajo (0,5 u), cadenas hasta el techo. */
  private sign(g: G, color: number, mark: number) {
    g.lineStyle(7, INK);
    g.lineBetween(46, 0, 46, 880); g.lineBetween(204, 0, 204, 880); // cadenas (más largas que el techo: se recortan solas)
    g.translateCanvas(0, 400);
    g.fillStyle(color); g.fillRoundedRect(6, 474, 238, 120, 18); g.strokeRoundedRect(6, 474, 238, 120, 18);
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(18, 482, 214, 18, 9);
    // estrella de oferta
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 ? 26 : 44, a = (i * Math.PI) / 8;
      pts.push(new Phaser.Math.Vector2(125 + Math.cos(a) * r, 536 + Math.sin(a) * r * 0.9));
    }
    g.fillStyle(mark); g.fillPoints(pts, true); g.lineStyle(6, INK); g.strokePoints(pts, true, true);
    g.fillStyle(0xffffff); g.fillCircle(125, 536, 11);
    for (const x of [46, 204]) { g.fillStyle(0x8a8fa8); g.fillCircle(x, 474, 9); }
  }

  /** Señal de suelo mojado con charco (cambia de carril). 250×330, suelo en y = 318. */
  private wet(g: G) {
    g.translateCanvas(0, 40);
    g.fillStyle(0x6cc8ff, 0.8); g.fillEllipse(125, 268, 240, 36);
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(80, 262, 50, 10);
    g.lineStyle(9, INK);
    const pts = [{ x: 96, y: -32 }, { x: 154, y: -32 }, { x: 214, y: 270 }, { x: 36, y: 270 }];
    g.fillStyle(0xffd23f); g.fillPoints(pts, true); g.strokePoints(pts, true, true);
    g.fillStyle(INK); g.fillRect(36, 236, 178, 12);
    // triángulo de aviso con figura resbalando
    g.lineStyle(7, INK); g.fillStyle(0xffffff);
    g.fillTriangle(125, 50, 68, 166, 182, 166); g.strokeTriangle(125, 50, 68, 166, 182, 166);
    g.fillStyle(INK); g.fillCircle(116, 100, 9);
    g.lineStyle(7, INK); g.lineBetween(118, 110, 130, 134); g.lineBetween(130, 134, 150, 150); g.lineBetween(130, 134, 106, 152);
    g.lineBetween(122, 118, 104, 120); g.lineBetween(122, 118, 144, 108);
  }

  private coin(g: G) {
    g.fillStyle(0xffd23f); g.fillCircle(40, 40, 36);
    g.lineStyle(7, 0xc98a00); g.strokeCircle(40, 40, 33);
    g.lineStyle(6, 0xf2a900); g.strokeCircle(40, 40, 20);
    g.fillStyle(0xffffff, 0.8); g.fillEllipse(28, 26, 12, 18);
  }

  /** Etiqueta de oferta: turbo (rayo) o imán. */
  private tag(g: G, color: number, kind: 'turbo' | 'magnet') {
    const pts = [{ x: 8, y: 55 }, { x: 40, y: 10 }, { x: 140, y: 10 }, { x: 140, y: 100 }, { x: 40, y: 100 }];
    g.fillStyle(color); g.fillPoints(pts, true); g.lineStyle(8, INK); g.strokePoints(pts, true, true);
    g.fillStyle(0xffffff); g.fillCircle(36, 55, 9); g.lineStyle(5, INK); g.strokeCircle(36, 55, 9);
    if (kind === 'turbo') {
      const b = [{ x: 98, y: 18 }, { x: 70, y: 60 }, { x: 92, y: 60 }, { x: 80, y: 94 }, { x: 122, y: 46 }, { x: 98, y: 46 }, { x: 112, y: 18 }];
      g.fillStyle(0xffd23f); g.fillPoints(b, true); g.lineStyle(5, INK); g.strokePoints(b, true, true);
    } else {
      g.lineStyle(20, INK); g.beginPath(); g.arc(94, 46, 26, 0, Math.PI, false); g.strokePath();
      g.lineStyle(12, 0xff5d5d); g.beginPath(); g.arc(94, 46, 26, 0, Math.PI, false); g.strokePath();
      g.fillStyle(0xffffff); g.lineStyle(5, INK);
      g.fillRect(62, 22, 12, 22); g.strokeRect(62, 22, 12, 22); g.fillRect(114, 22, 12, 22); g.strokeRect(114, 22, 12, 22);
    }
  }
}
