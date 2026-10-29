import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';
import { BH, JELLY, SLICE, TEX_W } from './config';
import { shade } from './scenes/Boot';

const INK = PALETTE.ink;

/** Paletas de gelatina (7 sabores cada una, se repiten al apilar). */
const PALETTES: Record<string, number[]> = {
  candy: JELLY,
  pastel: [0xffb3d1, 0xffd0a8, 0xfff1a8, 0xc8f0a8, 0xa8f0e4, 0xb3d9ff, 0xd4c2ff],
  neon: [0xff2e88, 0xff7a00, 0xfff200, 0x39ff14, 0x00f5d4, 0x00b3ff, 0xb026ff],
  ocean: [0x0077b6, 0x0096c7, 0x00b4d8, 0x48cae4, 0x90e0ef, 0x3fd8c4, 0x2ec4b6],
  sunset: [0xff5e5b, 0xff8c42, 0xffb347, 0xffd166, 0xef476f, 0xc06c84, 0x9b5de5],
};

/** Tienda de Jelly Stack: paletas de sabores y estilos de cara. Se paga con estrellas (una por caída perfecta). */
export const ITEMS: ShopItem[] = [
  { id: 'candy', slot: 'palette', price: 0, icon: 'pal-candy' },
  { id: 'pastel', slot: 'palette', price: 15, icon: 'pal-pastel' },
  { id: 'ocean', slot: 'palette', price: 30, icon: 'pal-ocean' },
  { id: 'sunset', slot: 'palette', price: 50, icon: 'pal-sunset' },
  { id: 'neon', slot: 'palette', price: 80, icon: 'pal-neon' },
  { id: 'classic', slot: 'face', price: 0, icon: 'face-pv-classic', bg: 0xff6fae },
  { id: 'cat', slot: 'face', price: 20, icon: 'face-pv-cat', bg: 0xff6fae },
  { id: 'cool', slot: 'face', price: 40, icon: 'face-pv-cool', bg: 0xff6fae },
  { id: 'fangs', slot: 'face', price: 70, icon: 'face-pv-fangs', bg: 0xff6fae },
];
export const DEFAULTS = { palette: 'candy', face: 'classic' };
/** Recompensa diaria (estrellas) del día 1 al 7. */
export const DAILY = [3, 5, 8, 10, 12, 15, 25];

/** Colores de la paleta equipada (para teñir gotas y trozos). */
export const palette = () => PALETTES[equippedId(save, 'palette', DEFAULTS.palette, ITEMS)] ?? JELLY;

/** Vuelve a dibujar jelly0..6 y las caras con lo equipado. */
export function applyJelly(scene: Phaser.Scene) {
  palette().forEach((c, i) => redrawTexture(scene, `jelly${i}`, TEX_W, BH, (g) => drawJelly(g, c)));
  const style = equippedId(save, 'face', DEFAULTS.face, ITEMS);
  for (const mood of ['happy', 'blink', 'joy', 'oh'] as const) redrawTexture(scene, `face-${mood}`, FW, FH, (g) => drawFace(g, mood, style));
}

/** Vistas previas de la tienda: torre de 4 bloques de cada paleta y cara feliz de cada estilo. */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, cols] of Object.entries(PALETTES)) {
    if (scene.textures.exists(`pal-${id}`)) continue;
    redrawTexture(scene, `pal-${id}`, 140, 130, (g) => {
      for (let i = 0; i < 4; i++) {
        const c = cols[(i * 2) % cols.length], y = 100 - i * 30, w = 120 - i * 14, x = 70 - w / 2;
        g.fillStyle(INK); g.fillRoundedRect(x, y, w, 30, 10);
        g.fillStyle(shade(c, -0.2)); g.fillRoundedRect(x + 4, y + 4, w - 8, 22, 7);
        g.fillStyle(c); g.fillRoundedRect(x + 4, y + 4, w - 8, 15, 7);
        g.fillStyle(0xffffff, 0.8); g.fillRoundedRect(x + 12, y + 7, w - 24, 4, 2);
      }
    });
  }
  for (const id of ['classic', 'cat', 'cool', 'fangs']) {
    if (!scene.textures.exists(`face-pv-${id}`)) redrawTexture(scene, `face-pv-${id}`, FW, FH, (g) => drawFace(g, 'happy', id));
  }
}

/**
 * One jelly block as a 3-slice source (corners fixed, middle stretched): the game resizes it to any width
 * with a single NineSlice object. Flat colours, darker base band, glossy highlight and a thick ink outline.
 */
function drawJelly(g: Phaser.GameObjects.Graphics, c: number) {
  const w = TEX_W, h = BH, r = 24, lw = 7;
  g.fillStyle(INK); g.fillRoundedRect(0, 0, w, h, r);
  const i = lw;
  g.fillStyle(shade(c, -0.22)); g.fillRoundedRect(i, i, w - 2 * i, h - 2 * i, r - lw + 2);
  g.fillStyle(c); g.fillRoundedRect(i, i, w - 2 * i, h - 2 * i - 18, r - lw + 2);
  g.fillStyle(shade(c, 0.28)); g.fillRoundedRect(i + 4, i + 3, w - 2 * i - 8, 22, 10);
  g.fillStyle(0xffffff, 0.9); g.fillRoundedRect(SLICE - 4, i + 8, w - 2 * SLICE + 8, 9, 4.5);
  g.fillStyle(0xffffff, 0.95); g.fillCircle(i + 10, i + 13, 5.5);
  g.fillStyle(0xffffff, 0.35); g.fillCircle(w - i - 12, h - i - 28, 4);
}

const FW = 120, FH = 56;

/** Faces for the top block: happy, blink, joy (perfect drop) and dizzy (miss), plus the shop style on top. */
function drawFace(g: Phaser.GameObjects.Graphics, mood: 'happy' | 'blink' | 'joy' | 'oh', style: string) {
  const W = FW;
  const eye = (x: number, y: number) => {
    g.fillStyle(INK); g.fillCircle(x, y, 9);
    g.fillStyle(0xffffff); g.fillCircle(x + 3, y - 3, 3.4); g.fillCircle(x - 3, y + 3.5, 1.6);
  };
  const cheeks = () => { g.fillStyle(0xff3d7f, 0.45); g.fillEllipse(18, 34, 18, 10); g.fillEllipse(W - 18, 34, 18, 10); };
  const smile = (open: boolean) => {
    g.lineStyle(5, INK);
    if (open) {
      g.fillStyle(INK); g.slice(W / 2, 30, 12, 0, Math.PI, false); g.fillPath();
      g.fillStyle(0xff6f8f); g.fillCircle(W / 2, 37, 5);
    } else {
      g.beginPath(); g.arc(W / 2, 28, 9, 0.25, Math.PI - 0.25, false); g.strokePath();
    }
  };
  cheeks();
  if (mood === 'happy') { eye(38, 22); eye(W - 38, 22); smile(false); }
  if (mood === 'blink') { g.lineStyle(5, INK); g.lineBetween(30, 23, 46, 23); g.lineBetween(W - 46, 23, W - 30, 23); smile(false); }
  if (mood === 'joy') {
    g.lineStyle(5, INK);
    g.beginPath(); g.arc(38, 25, 8, Math.PI + 0.2, -0.2, false); g.strokePath();
    g.beginPath(); g.arc(W - 38, 25, 8, Math.PI + 0.2, -0.2, false); g.strokePath();
    smile(true);
  }
  if (mood === 'oh') {
    g.lineStyle(5, INK);
    for (const x of [38, W - 38]) { g.lineBetween(x - 7, 15, x + 7, 29); g.lineBetween(x + 7, 15, x - 7, 29); }
    g.fillStyle(INK); g.fillEllipse(W / 2, 36, 14, 16);
  }
  // estilo de la tienda
  if (style === 'cat') {
    g.lineStyle(3, INK);
    for (const s of [-1, 1]) {
      const x0 = W / 2 + s * 30;
      g.lineBetween(x0, 30, x0 + s * 22, 26); g.lineBetween(x0, 34, x0 + s * 24, 35); g.lineBetween(x0, 38, x0 + s * 20, 44);
    }
    g.fillStyle(0xff6f8f); g.fillTriangle(W / 2 - 6, 17, W / 2 + 6, 17, W / 2, 24);
    g.lineStyle(2.5, INK); g.strokeTriangle(W / 2 - 6, 17, W / 2 + 6, 17, W / 2, 24);
  }
  if (style === 'cool' && mood !== 'oh') {
    g.fillStyle(INK);
    g.fillRoundedRect(22, 12, 32, 20, { tl: 4, tr: 4, bl: 12, br: 12 });
    g.fillRoundedRect(W - 54, 12, 32, 20, { tl: 4, tr: 4, bl: 12, br: 12 });
    g.fillRect(52, 15, 16, 5);
    g.fillStyle(0xffffff, 0.55); g.fillRect(27, 16, 8, 4); g.fillRect(W - 49, 16, 8, 4);
  }
  if (style === 'fangs') {
    g.fillStyle(0xffffff); g.lineStyle(2.5, INK);
    for (const x of [W / 2 - 7, W / 2 + 7]) {
      const y = mood === 'joy' ? 31 : mood === 'oh' ? 44 : 34;
      g.fillTriangle(x - 4, y, x + 4, y, x, y + 9); g.strokeTriangle(x - 4, y, x + 4, y, x, y + 9);
    }
  }
}
