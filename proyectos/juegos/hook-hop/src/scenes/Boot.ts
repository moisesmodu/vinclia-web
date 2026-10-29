import Phaser from 'phaser';
import { makeIconTextures, PALETTE } from '@comun/ui';
import { bootDone } from '@comun/boot';
import { save } from '../state';

const INK = PALETTE.ink;
const INK_CSS = '#2b2340';
/** Las texturas de sprites se dibujan al doble de resolución y se muestran a 0,5 (nítidas con zoom de cámara). */
export const K = 2;

/** Colores de Hook Hop (los de las portadas): mono marrón y crema, lianas verdes, plátanos amarillos, setas rojas. */
export const C = {
  fur: 0x9a5b34, furDark: 0x7a4426, cream: 0xffe2b0, vine: 0x4cbb4a, vineDark: 0x2f8a3a, wood: 0xa8703f,
  banana: 0xffd23f, mush: 0xff5d5d, water: 0x38b6e6,
};

/**
 * Carga los dos archivos del juego (fondo del menú y música) y dibuja por código todo lo demás:
 * mono (3 caras), nudos de liana, liana en mosaico, plátano, seta, partículas y las capas de la jungla (paralaje).
 */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    for (let face = 0; face < 3; face++) this.makeMonkey(face);
    const rt = this.make.renderTexture({ x: 0, y: 0, width: 112 * K, height: 112 * K }, false);
    rt.draw('monkey1', 8 * K, 0);
    rt.saveTexture('monkey-ic');
    this.makeAnchors();
    this.makeVine();
    this.makeBanana();
    this.makeMushroom();
    this.makeBits();
    this.makeLayers();
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
   * Mono de 96×112 (unidades de diseño). Centro del cuerpo (48, 70): es el origen físico. La mano que agarra la
   * liana está en (48, 8), 62 unidades por encima. face: 0 contento, 1 emocionado (volando), 2 asustado (cayendo).
   */
  private makeMonkey(face: number) {
    const k = K;
    this.tex(`monkey${face}`, 96 * k, 112 * k, (g) => {
      const limb = (x1: number, y1: number, x2: number, y2: number, w = 10) => {
        g.lineStyle((w + 6) * k, INK); g.lineBetween(x1 * k, y1 * k, x2 * k, y2 * k);
        g.lineStyle(w * k, C.fur); g.lineBetween(x1 * k, y1 * k, x2 * k, y2 * k);
        g.fillStyle(INK); g.fillCircle(x1 * k, y1 * k, (w + 6) / 2 * k); g.fillCircle(x2 * k, y2 * k, (w + 6) / 2 * k);
        g.fillStyle(C.fur); g.fillCircle(x1 * k, y1 * k, w / 2 * k); g.fillCircle(x2 * k, y2 * k, w / 2 * k);
      };
      // cola enroscada
      g.lineStyle(13 * k, INK); g.beginPath(); g.arc(20 * k, 86 * k, 13 * k, -0.2, Math.PI * 1.45); g.strokePath();
      g.lineStyle(7 * k, C.furDark); g.beginPath(); g.arc(20 * k, 86 * k, 13 * k, -0.2, Math.PI * 1.45); g.strokePath();
      // brazo que agarra (detrás de la cabeza) y mano
      limb(58, 72, 48, 12);
      g.fillStyle(C.cream); g.lineStyle(4 * k, INK);
      g.fillCircle(48 * k, 9 * k, 7.5 * k); g.strokeCircle(48 * k, 9 * k, 7.5 * k);
      // piernas
      limb(40, 92, 33, 105, 9); limb(56, 92, 64, 105, 9);
      g.fillStyle(C.cream); g.lineStyle(3.5 * k, INK);
      g.fillEllipse(31 * k, 106 * k, 15 * k, 9 * k); g.strokeEllipse(31 * k, 106 * k, 15 * k, 9 * k);
      g.fillEllipse(66 * k, 106 * k, 15 * k, 9 * k); g.strokeEllipse(66 * k, 106 * k, 15 * k, 9 * k);
      // cuerpo y barriga
      g.fillStyle(C.fur); g.lineStyle(4.5 * k, INK);
      g.fillEllipse(48 * k, 80 * k, 40 * k, 34 * k); g.strokeEllipse(48 * k, 80 * k, 40 * k, 34 * k);
      g.fillStyle(C.cream); g.fillEllipse(48 * k, 84 * k, 22 * k, 20 * k);
      // otro brazo (suelto, hacia fuera)
      if (face === 1) limb(34, 70, 16, 54, 9); else if (face === 2) limb(34, 72, 12, 62, 9); else limb(34, 74, 22, 88, 9);
      // orejas
      for (const ex of [22, 74]) {
        g.fillStyle(C.fur); g.lineStyle(4 * k, INK); g.fillCircle(ex * k, 48 * k, 10 * k); g.strokeCircle(ex * k, 48 * k, 10 * k);
        g.fillStyle(C.cream); g.fillCircle(ex * k, 48 * k, 5.5 * k);
      }
      // cabeza
      g.fillStyle(C.fur); g.lineStyle(4.5 * k, INK); g.fillCircle(48 * k, 46 * k, 25 * k); g.strokeCircle(48 * k, 46 * k, 25 * k);
      // pelo de punta
      g.fillStyle(C.fur); g.lineStyle(4 * k, INK);
      const tuft = [new Phaser.Math.Vector2(42 * k, 24 * k), new Phaser.Math.Vector2(47 * k, 13 * k), new Phaser.Math.Vector2(50 * k, 22 * k), new Phaser.Math.Vector2(56 * k, 15 * k), new Phaser.Math.Vector2(57 * k, 25 * k)];
      g.fillPoints(tuft, false); g.strokePoints(tuft, false);
      g.fillCircle(48 * k, 46 * k, 22 * k);
      // cara crema
      g.fillStyle(C.cream);
      g.fillCircle(39 * k, 44 * k, 10.5 * k); g.fillCircle(57 * k, 44 * k, 10.5 * k); g.fillEllipse(48 * k, 56 * k, 32 * k, 20 * k);
      // ojos
      g.fillStyle(INK);
      if (face === 1) {
        g.lineStyle(3.5 * k, INK);
        g.beginPath(); g.arc(39 * k, 46 * k, 5 * k, Math.PI * 1.1, Math.PI * 1.9); g.strokePath();
        g.beginPath(); g.arc(57 * k, 46 * k, 5 * k, Math.PI * 1.1, Math.PI * 1.9); g.strokePath();
      } else if (face === 2) {
        g.fillStyle(0xffffff); g.lineStyle(3 * k, INK);
        g.fillCircle(39 * k, 43 * k, 7 * k); g.strokeCircle(39 * k, 43 * k, 7 * k);
        g.fillCircle(57 * k, 43 * k, 7 * k); g.strokeCircle(57 * k, 43 * k, 7 * k);
        g.fillStyle(INK); g.fillCircle(39 * k, 44 * k, 3 * k); g.fillCircle(57 * k, 44 * k, 3 * k);
      } else {
        g.fillCircle(39 * k, 44 * k, 4.5 * k); g.fillCircle(57 * k, 44 * k, 4.5 * k);
        g.fillStyle(0xffffff); g.fillCircle(40.5 * k, 42.5 * k, 1.6 * k); g.fillCircle(58.5 * k, 42.5 * k, 1.6 * k);
      }
      // nariz
      g.fillStyle(INK); g.fillEllipse(45 * k, 53 * k, 3 * k, 2.4 * k); g.fillEllipse(51 * k, 53 * k, 3 * k, 2.4 * k);
      // boca
      if (face === 1) {
        g.fillStyle(INK); g.beginPath(); g.arc(48 * k, 58 * k, 8 * k, 0, Math.PI); g.closePath(); g.fillPath();
        g.fillStyle(0xff7a8a); g.fillEllipse(48 * k, 63 * k, 8 * k, 4 * k);
      } else if (face === 2) {
        g.fillStyle(INK); g.fillEllipse(48 * k, 61 * k, 7 * k, 9 * k);
      } else {
        g.lineStyle(3.5 * k, INK); g.beginPath(); g.arc(48 * k, 56 * k, 7 * k, 0.25, Math.PI - 0.25); g.strokePath();
      }
      // mejillas
      g.fillStyle(0xff9a9a, 0.6); g.fillCircle(31 * k, 54 * k, 4 * k); g.fillCircle(65 * k, 54 * k, 4 * k);
    });
  }

  /** Nudo de liana (56×56, centro 28,28): normal (madera y hojas verdes) y frágil (rama clara agrietada, hojas secas). */
  private makeAnchors() {
    const k = K;
    for (const frag of [false, true]) {
      this.tex(frag ? 'anchor-f' : 'anchor', 56 * k, 56 * k, (g) => {
        const leaf = frag ? 0xd8b04a : C.vine;
        g.lineStyle(3.5 * k, INK);
        for (const [x, y, w, h] of [[12, 22, 22, 12], [44, 22, 22, 12], [28, 10, 12, 20]] as const) {
          g.fillStyle(leaf); g.fillEllipse(x * k, y * k, w * k, h * k); g.strokeEllipse(x * k, y * k, w * k, h * k);
        }
        g.fillStyle(frag ? 0xe2c08a : C.wood); g.lineStyle(4.5 * k, INK);
        g.fillCircle(28 * k, 30 * k, 15 * k); g.strokeCircle(28 * k, 30 * k, 15 * k);
        g.lineStyle(3 * k, frag ? 0xa8804a : 0x7a4a26); g.strokeCircle(28 * k, 30 * k, 8 * k);
        if (frag) {
          g.lineStyle(3 * k, INK);
          g.beginPath(); g.moveTo(20 * k, 18 * k); g.lineTo(26 * k, 26 * k); g.lineTo(22 * k, 32 * k); g.lineTo(28 * k, 40 * k); g.strokePath();
          g.beginPath(); g.moveTo(38 * k, 22 * k); g.lineTo(33 * k, 30 * k); g.lineTo(38 * k, 36 * k); g.strokePath();
        }
      });
    }
    // anillo de "este es el que vas a agarrar"
    this.tex('ring', 80 * k, 80 * k, (g) => {
      g.lineStyle(9 * k, INK, 0.5); g.strokeCircle(40 * k, 40 * k, 33 * k);
      g.lineStyle(5 * k, 0xffffff); g.strokeCircle(40 * k, 40 * k, 33 * k);
    });
  }

  /** Liana en mosaico horizontal (32×16): se estira y gira como TileSprite (cuerda y lianas colgantes). */
  private makeVine() {
    const k = K;
    for (const [key, fill, dark] of [['vine', C.vine, C.vineDark], ['vine-bg', 0x3a9a48, 0x2a7a38]] as const) {
      this.tex(key, 32 * k, 16 * k, (g) => {
        g.fillStyle(INK); g.fillRect(0, 2 * k, 32 * k, 12 * k);
        g.fillStyle(fill); g.fillRect(0, 4.5 * k, 32 * k, 7 * k);
        g.lineStyle(2.5 * k, dark);
        g.lineBetween(4 * k, 11 * k, 12 * k, 5 * k); g.lineBetween(20 * k, 11 * k, 28 * k, 5 * k);
        g.fillStyle(0xffffff, 0.3); g.fillRect(0, 5.5 * k, 32 * k, 1.5 * k);
      });
    }
    // liana vertical de fondo (de la copa al nudo): una imagen por nudo, todas en el mismo lote de dibujo
    this.tex('hang', 16 * k, 1400 * k, (g) => {
      g.fillStyle(INK); g.fillRect(2 * k, 0, 12 * k, 1400 * k);
      g.fillStyle(0x3a9a48); g.fillRect(4.5 * k, 0, 7 * k, 1400 * k);
      g.lineStyle(2.5 * k, 0x2a7a38);
      for (let y = 0; y < 1400; y += 16) g.lineBetween(5 * k, (y + 4) * k, 11 * k, (y + 12) * k);
    });
  }

  /** Plátano (48×48). */
  private makeBanana() {
    const k = K;
    this.tex('banana', 48 * k, 48 * k, (g) => {
      const pts: Phaser.Math.Vector2[] = [];
      const cx = 22, cy = 12;
      for (let i = 0; i <= 16; i++) { const a = 0.35 + (i / 16) * 2.0; pts.push(new Phaser.Math.Vector2((cx + Math.cos(a) * 30) * k, (cy + Math.sin(a) * 30) * k)); }
      for (let i = 16; i >= 0; i--) { const a = 0.5 + (i / 16) * 1.75; pts.push(new Phaser.Math.Vector2((cx + 4 + Math.cos(a) * 20) * k, (cy - 2 + Math.sin(a) * 20) * k)); }
      g.fillStyle(C.banana); g.fillPoints(pts, true);
      g.lineStyle(4 * k, INK); g.strokePoints(pts, true, true);
      g.fillStyle(0xfff3a0); g.fillEllipse(22 * k, 37 * k, 12 * k, 4 * k);
      g.fillStyle(0x6b4a2a); g.fillCircle((cx + Math.cos(0.4) * 26) * k, (cy + Math.sin(0.4) * 26) * k, 3.2 * k);
      g.fillCircle((cx + Math.cos(2.3) * 26) * k, (cy + Math.sin(2.3) * 26) * k, 3.2 * k);
    });
  }

  /** Seta saltarina (150×190): sombrero a y = 12 (el borde superior es la superficie que rebota) y tallo largo. */
  private makeMushroom() {
    const k = K;
    this.tex('mush', 150 * k, 190 * k, (g) => {
      g.fillStyle(0xfff1d6); g.lineStyle(5 * k, INK);
      g.fillRoundedRect(56 * k, 50 * k, 38 * k, 136 * k, 14 * k); g.strokeRoundedRect(56 * k, 50 * k, 38 * k, 136 * k, 14 * k);
      g.fillStyle(0xe8cfa8); g.fillRect(64 * k, 70 * k, 8 * k, 110 * k);
      const cap: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; cap.push(new Phaser.Math.Vector2((75 + Math.cos(a) * 70) * k, (66 + Math.sin(a) * 54) * k)); }
      for (let i = 0; i <= 10; i++) { const t = i / 10; cap.push(new Phaser.Math.Vector2((145 - t * 140) * k, (66 + Math.sin(t * Math.PI) * 10) * k)); }
      g.fillStyle(C.mush); g.fillPoints(cap, true);
      g.fillStyle(0xffffff);
      for (const [x, y, r] of [[45, 40, 10], [80, 26, 12], [110, 48, 9], [62, 60, 6], [120, 30, 5]] as const) g.fillCircle(x * k, y * k, r * k);
      g.lineStyle(5 * k, INK); g.strokePoints(cap, true, true);
      g.fillStyle(0xffffff, 0.35); g.fillEllipse(48 * k, 28 * k, 22 * k, 8 * k);
    });
  }

  private makeBits() {
    const k = K;
    this.tex('leaf', 20 * k, 12 * k, (g) => { g.fillStyle(C.vine); g.fillEllipse(10 * k, 6 * k, 18 * k, 10 * k); g.lineStyle(2 * k, INK); g.strokeEllipse(10 * k, 6 * k, 18 * k, 10 * k); });
    this.tex('drop', 14 * k, 14 * k, (g) => { g.fillStyle(0xbdeeff); g.fillCircle(7 * k, 7 * k, 6 * k); g.lineStyle(2 * k, INK); g.strokeCircle(7 * k, 7 * k, 6 * k); });
    this.tex('spark', 12 * k, 12 * k, (g) => { g.fillStyle(0xffffff); g.fillCircle(6 * k, 6 * k, 6 * k); });
  }

  /* -------------------------------------------------- capas de la jungla (Canvas 2D, una sola vez) */

  private canvas(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
    if (this.textures.exists(key)) return;
    const t = this.textures.createCanvas(key, w, h)!;
    draw(t.context);
    t.refresh();
  }

  private makeLayers() {
    // cielo: degradado vertical (se estira a la vista)
    this.canvas('sky', 8, 512, (c) => {
      const gr = c.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, '#6fd0ff'); gr.addColorStop(0.65, '#c8f3ff'); gr.addColorStop(1, '#e9fff4');
      c.fillStyle = gr; c.fillRect(0, 0, 8, 512);
    });
    const W = 1024;
    // copia a izquierda y derecha para que el mosaico no tenga costura
    const wrap = (c: CanvasRenderingContext2D, fn: (ox: number) => void) => { for (const ox of [-W, 0, W]) { c.save(); c.translate(ox, 0); fn(ox); c.restore(); } };
    const rnd = new Phaser.Math.RandomDataGenerator(['hook-hop']);
    // lejos: colinas de copas de árbol, verde claro
    this.canvas('far', W, 420, (c) => {
      c.lineJoin = 'round';
      const bumps: [number, number, number][] = [];
      for (let x = 0; x < W; x += 70) bumps.push([x + rnd.between(-10, 10), 150 + rnd.between(-50, 40), rnd.between(60, 95)]);
      for (const [col, dy, lw] of [['#a9e6b8', 0, 4], ['#86d39b', 90, 5]] as const) {
        wrap(c, () => {
          c.beginPath();
          for (const [x, y, r] of bumps) { const rr = r * (dy ? 0.9 : 1); c.moveTo(x + (dy ? 35 : 0) + rr, y + dy); c.arc(x + (dy ? 35 : 0), y + dy, rr, 0, Math.PI * 2); }
          c.fillStyle = col; c.fill();
          c.fillRect(-40, 200 + dy, W + 80, 420);
        });
        c.strokeStyle = 'rgba(43,35,64,0.25)'; c.lineWidth = lw;
        wrap(c, () => { for (const [x, y, r] of bumps) { c.beginPath(); c.arc(x + (dy ? 35 : 0), y + dy, r * (dy ? 0.9 : 1), Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } });
      }
    });
    // medio: troncos con copas grandes y lianas colgando (abajo opaco)
    this.canvas('mid', W, 600, (c) => {
      c.lineJoin = 'round'; c.lineCap = 'round';
      const trees: [number, number][] = [];
      for (let x = 60; x < W; x += 205) trees.push([x + rnd.between(-30, 30), rnd.between(90, 170)]);
      wrap(c, () => {
        for (const [x, top] of trees) {
          c.fillStyle = '#a37a5a'; c.strokeStyle = 'rgba(43,35,64,0.55)'; c.lineWidth = 6;
          c.beginPath(); c.moveTo(x - 22, 600); c.lineTo(x - 14, top + 40); c.lineTo(x + 14, top + 40); c.lineTo(x + 26, 600); c.closePath(); c.fill(); c.stroke();
          c.strokeStyle = '#8a6448'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 4, 590); c.lineTo(x - 2, top + 120); c.stroke();
        }
        for (const [x, top] of trees) {
          c.fillStyle = '#74cc8a'; c.strokeStyle = 'rgba(43,35,64,0.55)'; c.lineWidth = 6;
          c.beginPath();
          c.moveTo(x - 5, top + 30); c.arc(x - 55, top + 30, 50, 0, Math.PI * 2); c.moveTo(x + 105, top + 30); c.arc(x + 55, top + 30, 50, 0, Math.PI * 2); c.moveTo(x + 62, top); c.arc(x, top, 62, 0, Math.PI * 2);
          c.stroke(); c.fill();
          c.fillStyle = '#8fdaa0'; c.beginPath(); c.arc(x - 18, top - 20, 26, 0, Math.PI * 2); c.fill();
        }
        // matorrales del suelo
        c.fillStyle = '#4fb86a'; c.strokeStyle = 'rgba(43,35,64,0.7)'; c.lineWidth = 6;
        c.beginPath(); for (let x = 0; x <= W; x += 64) { const yy = 520 + (x % 128 ? 10 : -6); c.moveTo(x + 52, yy); c.arc(x, yy, 52, 0, Math.PI * 2); } c.stroke(); c.fill();
        c.fillRect(-40, 530, W + 80, 80);
      });
    });
    // arriba: hojas del dosel colgando del borde superior (enmarcan la vista)
    this.canvas('canopy', W, 190, (c) => {
      c.lineJoin = 'round';
      const leaves: [number, number, number, number][] = [];
      for (let x = 0; x < W; x += 46) leaves.push([x + rnd.between(-8, 8), rnd.between(40, 120), rnd.between(22, 34), rnd.realInRange(-0.5, 0.5)]);
      wrap(c, () => {
        c.fillStyle = '#2f9a48'; c.strokeStyle = INK_CSS; c.lineWidth = 5;
        c.beginPath(); for (let x = -20; x <= W + 20; x += 52) { c.moveTo(x + 48, 0); c.arc(x, 0, 48, 0, Math.PI * 2); } c.stroke(); c.fill();
        for (const [x, y, r, a] of leaves) {
          c.save(); c.translate(x, y); c.rotate(a);
          c.fillStyle = y > 80 ? '#46c167' : '#3aab57';
          c.beginPath(); c.ellipse(0, 0, r * 0.6, r, 0, 0, Math.PI * 2); c.fill(); c.stroke();
          c.strokeStyle = '#2a7a38'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(0, r * 0.8); c.stroke();
          c.strokeStyle = INK_CSS; c.lineWidth = 5;
          c.restore();
        }
      });
    });
    // río (borde ondulado arriba)
    this.canvas('water', 256, 160, (c) => {
      c.fillStyle = '#38b6e6';
      c.beginPath(); c.moveTo(0, 22);
      for (let x = 0; x <= 256; x += 8) c.lineTo(x, 22 + Math.sin((x / 256) * Math.PI * 4) * 8);
      c.lineTo(256, 160); c.lineTo(0, 160); c.closePath(); c.fill();
      c.strokeStyle = INK_CSS; c.lineWidth = 6; c.beginPath();
      for (let x = 0; x <= 256; x += 8) c[x ? 'lineTo' : 'moveTo'](x, 22 + Math.sin((x / 256) * Math.PI * 4) * 8);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 5; c.lineCap = 'round';
      for (const [x, y, l] of [[30, 60, 50], [150, 80, 70], [90, 120, 40], [210, 130, 30]] as const) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y); c.stroke(); }
      c.fillStyle = '#2a9ccd'; c.fillRect(0, 150, 256, 10);
    });
  }
}
