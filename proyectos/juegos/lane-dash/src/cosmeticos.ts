import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;
export type Face = 'normal' | 'happy' | 'scared' | 'duck' | 'sleepy';

/** Pinturas del carrito: [cesta, asa]. Ninguna azul con asa amarilla: así es el carrito aparcado (obstáculo). */
const PAINTS: Record<string, [number, number]> = {
  red: [0xff5d5d, 0x2ec4b6],
  green: [0x3ddc84, 0xff6fae],
  orange: [0xff9f43, 0x4aa8ff],
  purple: [0x9b6bff, 0x3ddc84],
  pink: [0xff6fae, 0x9b6bff],
  black: [0x4a4560, 0xffd23f],
};
const FLAGS = ['check', 'star', 'pirate'] as const;

/** Tienda de Lane Dash: pintura del carrito y banderín. Se paga con monedas. */
export const ITEMS: ShopItem[] = [
  { id: 'red', slot: 'paint', price: 0, icon: 'cart-pv-red' },
  { id: 'green', slot: 'paint', price: 50, icon: 'cart-pv-green' },
  { id: 'orange', slot: 'paint', price: 100, icon: 'cart-pv-orange' },
  { id: 'purple', slot: 'paint', price: 180, icon: 'cart-pv-purple' },
  { id: 'pink', slot: 'paint', price: 280, icon: 'cart-pv-pink' },
  { id: 'black', slot: 'paint', price: 450, icon: 'cart-pv-black' },
  { id: 'check', slot: 'flag', price: 80, icon: 'flag-pv-check' },
  { id: 'star', slot: 'flag', price: 150, icon: 'flag-pv-star' },
  { id: 'pirate', slot: 'flag', price: 350, icon: 'flag-pv-pirate' },
];
export const DEFAULTS = { paint: 'red', flag: '' };
/** Recompensa diaria (monedas) del día 1 al 7. */
export const DAILY = [10, 15, 20, 25, 30, 40, 60];

/** Vistas previas de la tienda (una vez, en Boot). */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, [body, handle]] of Object.entries(PAINTS)) {
    const key = `cart-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 280, 280, (g) => drawCart(g, body, handle, 'normal', 1, true));
  }
  for (const id of FLAGS) {
    const key = `flag-pv-${id}`;
    // banderín en su palo, solo (el lienzo enmarca la parte de arriba a la derecha del carrito)
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 110, 120, (g) => { g.translateCanvas(-170, 0); drawFlag(g, id, 104); });
  }
}

/** Vuelve a dibujar el carrito del jugador (todas sus caras) con la pintura y el banderín equipados. */
export function applyCart(scene: Phaser.Scene) {
  const [body, handle] = PAINTS[equippedId(save, 'paint', DEFAULTS.paint, ITEMS)] ?? PAINTS.red;
  const flag = equippedId(save, 'flag', DEFAULTS.flag, ITEMS);
  for (const f of ['normal', 'happy', 'scared'] as Face[]) redrawTexture(scene, `cart-${f}`, 280, 280, (g) => drawCart(g, body, handle, f, 1, true, flag));
  redrawTexture(scene, 'cart-duck', 280, 280, (g) => drawCart(g, body, handle, 'duck', 0.6, true, flag));
}

/** Banderín: palo en x = 248 desde el asa (y = bottom) hasta arriba, tela hacia la izquierda. */
function drawFlag(g: G, id: string, bottom = 100) {
  const px = 248, top = 6;
  g.lineStyle(10, INK); g.lineBetween(px, bottom, px, top + 2);
  g.lineStyle(4, 0xdfe3ea); g.lineBetween(px, bottom, px, top + 2);
  const x0 = 192, y0 = top + 4, fw = px - 4 - x0, fh = 40;
  const pts = [{ x: px - 3, y: y0 }, { x: x0, y: y0 + 4 }, { x: x0 + 6, y: y0 + fh / 2 + 2 }, { x: x0, y: y0 + fh }, { x: px - 3, y: y0 + fh - 2 }];
  if (id === 'check') {
    g.fillStyle(0xffffff); g.fillPoints(pts, true);
    g.fillStyle(INK);
    const n = 4, cw = fw / n, ch = fh / 3;
    for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) g.fillRect(x0 + 4 + i * cw, y0 + 3 + j * ch, cw, ch - 1);
  } else if (id === 'star') {
    g.fillStyle(0xffd23f); g.fillPoints(pts, true);
    const st: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 6 : 14, a = -Math.PI / 2 + (i * Math.PI) / 5;
      st.push(new Phaser.Math.Vector2(x0 + fw / 2 + 3 + Math.cos(a) * r, y0 + fh / 2 + 1 + Math.sin(a) * r));
    }
    g.fillStyle(0xff5d5d); g.fillPoints(st, true);
  } else {
    g.fillStyle(INK); g.fillPoints(pts, true);
    const cx = x0 + fw / 2 + 3, cy = y0 + fh / 2 - 1;
    g.fillStyle(0xffffff); g.fillCircle(cx, cy - 2, 9); g.fillRect(cx - 5, cy + 4, 10, 6);
    g.fillStyle(INK); g.fillCircle(cx - 3.5, cy - 2, 2.6); g.fillCircle(cx + 3.5, cy - 2, 2.6);
    g.lineStyle(3, 0xffffff); g.lineBetween(cx - 11, cy + 9, cx + 11, cy + 15); g.lineBetween(cx - 11, cy + 15, cx + 11, cy + 9);
  }
  g.lineStyle(6, INK); g.strokePoints(pts, true, true);
}

/** Carrito de 280×280, suelo en y = 268. squash < 1 lo aplasta hacia el suelo (agacharse). */
export function drawCart(g: G, body: number, handle: number, face: Face, squash: number, groceries: boolean, flag = '') {
  g.fillStyle(0x000000, 0.18); g.fillEllipse(140, 266, 230, 26);
  g.save();
  g.translateCanvas(0, 268 * (1 - squash));
  g.scaleCanvas(1, squash);
  // ruedas
  for (const x of [62, 218]) {
    g.fillStyle(INK); g.fillRoundedRect(x - 16, 236, 32, 32, 10);
    g.fillStyle(0x8a8fa8); g.fillRoundedRect(x - 6, 244, 12, 16, 4);
  }
  g.fillStyle(INK); g.fillRect(56, 222, 168, 14);
  // compra que asoma
  if (groceries) {
    g.lineStyle(7, INK);
    g.fillStyle(0xf2b35b); g.fillRoundedRect(60, 40, 30, 90, 14); g.strokeRoundedRect(60, 40, 30, 90, 14); // barra de pan
    g.fillStyle(0xffffff); g.fillRect(150, 52, 46, 70); g.strokeRect(150, 52, 46, 70); // leche
    g.fillStyle(0x4aa8ff); g.fillTriangle(146, 56, 200, 56, 173, 30); g.strokeTriangle(146, 56, 200, 56, 173, 30);
    g.fillStyle(0x3ddc84); g.fillCircle(118, 92, 24); g.strokeCircle(118, 92, 24); // manzana
    g.fillStyle(0x7a4b2a); g.fillRect(116, 60, 5, 12);
    g.fillStyle(0xffd23f); g.fillCircle(212, 96, 20); g.strokeCircle(212, 96, 20); // limón
  } else {
    // carrito aparcado con una montaña de compra (demasiado alto para saltarlo)
    g.lineStyle(8, INK);
    g.fillStyle(0xe0a15e); g.fillRect(34, -6, 130, 112); g.strokeRect(34, -6, 130, 112);
    g.fillStyle(0xf6d29a); g.fillRect(88, -2, 22, 104);
    g.fillStyle(0xd08a4a); g.fillRect(124, 30, 120, 76); g.strokeRect(124, 30, 120, 76);
    g.fillStyle(0xf6d29a); g.fillRect(174, 34, 20, 68);
    for (const [x, y] of [[196, 2], [226, 2], [211, -26]]) { g.fillStyle(0xffffff); g.fillCircle(x, y, 17); g.strokeCircle(x, y, 17); g.fillStyle(0xc9d3e8); g.fillCircle(x, y, 6); }
    g.fillStyle(0x3ddc84); g.fillEllipse(98, -48, 112, 86); g.strokeEllipse(98, -48, 112, 86);
    g.lineStyle(7, 0x1f9a5a); g.lineBetween(70, -82, 64, -14); g.lineBetween(98, -88, 98, -8); g.lineBetween(126, -82, 132, -14);
    g.lineStyle(8, INK); g.strokeEllipse(98, -48, 112, 86);
  }
  // banderín de la tienda (sale de detrás del asa, lado derecho)
  if (flag) drawFlag(g, flag);
  // cesta
  g.fillStyle(body); g.lineStyle(9, INK);
  const pts = [{ x: 22, y: 98 }, { x: 258, y: 98 }, { x: 236, y: 226 }, { x: 44, y: 226 }];
  g.fillPoints(pts, true); g.strokePoints(pts, true, true);
  // rejilla
  g.lineStyle(5, 0xffffff, 0.35);
  for (let i = 1; i < 6; i++) { const t = i / 6; g.lineBetween(22 + 236 * t, 104, 44 + 192 * t, 220); }
  g.lineBetween(30, 140, 250, 140);
  // asa
  g.fillStyle(handle); g.lineStyle(8, INK);
  if (groceries) { g.fillRoundedRect(4, 82, 272, 24, 12); g.strokeRoundedRect(4, 82, 272, 24, 12); }
  else { g.fillRoundedRect(36, 64, 208, 20, 10); g.strokeRoundedRect(36, 64, 208, 20, 10); g.lineBetween(46, 84, 40, 100); g.lineBetween(234, 84, 240, 100); }
  // cara
  const cx = 140, cy = 166;
  g.fillStyle(0xffffff); g.fillRoundedRect(cx - 78, cy - 44, 156, 92, 30);
  g.lineStyle(6, INK); g.strokeRoundedRect(cx - 78, cy - 44, 156, 92, 30);
  g.fillStyle(0xff9ec7, 0.9); g.fillCircle(cx - 56, cy + 18, 11); g.fillCircle(cx + 56, cy + 18, 11);
  g.fillStyle(INK); g.lineStyle(7, INK);
  if (face === 'normal') {
    for (const d of [-30, 30]) { g.fillStyle(INK); g.fillCircle(cx + d, cy - 6, 15); g.fillStyle(0xffffff); g.fillCircle(cx + d + 5, cy - 12, 5); }
    g.beginPath(); g.arc(cx, cy + 10, 16, 0.2, Math.PI - 0.2); g.strokePath();
  } else if (face === 'happy') {
    for (const d of [-30, 30]) { g.beginPath(); g.arc(cx + d, cy - 2, 13, Math.PI + 0.2, -0.2); g.strokePath(); }
    g.fillStyle(INK); g.slice(cx, cy + 10, 20, 0, Math.PI, false); g.fillPath();
    g.fillStyle(0xff5d5d); g.fillCircle(cx, cy + 22, 8);
  } else if (face === 'scared') {
    for (const d of [-30, 30]) {
      g.lineBetween(cx + d - 11, cy - 17, cx + d + 11, cy + 5); g.lineBetween(cx + d + 11, cy - 17, cx + d - 11, cy + 5);
    }
    g.fillStyle(INK); g.fillEllipse(cx, cy + 24, 24, 18);
  } else if (face === 'duck') {
    g.lineBetween(cx - 44, cy - 14, cx - 22, cy - 4); g.lineBetween(cx - 22, cy - 4, cx - 44, cy + 6);
    g.lineBetween(cx + 44, cy - 14, cx + 22, cy - 4); g.lineBetween(cx + 22, cy - 4, cx + 44, cy + 6);
    g.lineBetween(cx - 12, cy + 22, cx + 12, cy + 22);
  } else {
    for (const d of [-30, 30]) { g.beginPath(); g.arc(cx + d, cy - 6, 13, 0.2, Math.PI - 0.2); g.strokePath(); }
    g.fillStyle(INK); g.fillCircle(cx, cy + 22, 7);
  }
  g.restore();
}
