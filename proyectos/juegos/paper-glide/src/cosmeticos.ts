import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;
export type Face = 'normal' | 'happy' | 'scared';

/** Papel: [ala, quilla (más oscura)]. */
const PAPERS: Record<string, [number, number]> = {
  white: [0xffffff, 0xd9e2f2],
  sky: [0x8fd8ff, 0x5fb4e8],
  mint: [0x9ff0c4, 0x62cf95],
  pink: [0xffb3d6, 0xf283b4],
  sun: [0xffe066, 0xf2b631],
  night: [0x5b5f9e, 0x3e4178],
};
/** Color del dibujo de cada papel. */
const INKS: Record<string, number> = { white: 0xff5d5d, sky: 0xffffff, mint: 0x2f8f6b, pink: 0xffffff, sun: 0xff7a3d, night: 0xffd23f };
const PATTERNS = ['stripes', 'dots', 'stars', 'bands'] as const;
export const TRAILS = ['wind', 'rainbow', 'stars', 'hearts'] as const;

/** Tienda de Paper Glide: papel, dibujo y estela. Se paga con monedas (las mejoras van aparte, en src/mejoras.ts). */
export const ITEMS: ShopItem[] = [
  { id: 'white', slot: 'paper', price: 0, icon: 'pv-paper-white' },
  { id: 'sky', slot: 'paper', price: 40, icon: 'pv-paper-sky' },
  { id: 'mint', slot: 'paper', price: 80, icon: 'pv-paper-mint' },
  { id: 'pink', slot: 'paper', price: 120, icon: 'pv-paper-pink' },
  { id: 'sun', slot: 'paper', price: 180, icon: 'pv-paper-sun' },
  { id: 'night', slot: 'paper', price: 300, icon: 'pv-paper-night' },
  { id: 'stripes', slot: 'pattern', price: 0, icon: 'pv-pat-stripes' },
  { id: 'dots', slot: 'pattern', price: 60, icon: 'pv-pat-dots' },
  { id: 'stars', slot: 'pattern', price: 140, icon: 'pv-pat-stars' },
  { id: 'bands', slot: 'pattern', price: 220, icon: 'pv-pat-bands' },
  { id: 'wind', slot: 'trail', price: 0, icon: 'pv-trail-wind', bg: 0x8fd8ff },
  { id: 'rainbow', slot: 'trail', price: 100, icon: 'pv-trail-rainbow', bg: 0x8fd8ff },
  { id: 'tstars', slot: 'trail', price: 200, icon: 'pv-trail-stars', bg: 0x5b5f9e },
  { id: 'hearts', slot: 'trail', price: 260, icon: 'pv-trail-hearts', bg: 0x8fd8ff },
];
export const DEFAULTS = { paper: 'white', pattern: 'stripes', trail: 'wind' };
/** Recompensa diaria (monedas) del día 1 al 7. */
export const DAILY = [15, 20, 30, 40, 50, 65, 100];

export const PLANE_W = 220, PLANE_H = 124;

/** Estela equipada: textura de partícula y tintes. */
export function trailLook(): { tex: string; tint: number[]; scale: number } {
  const t = equippedId(save, 'trail', DEFAULTS.trail, ITEMS);
  if (t === 'rainbow') return { tex: 'p-dot', tint: [0xff5d5d, 0xff9f43, 0xffd23f, 0x3ddc84, 0x4aa8ff, 0x9b6bff], scale: 0.55 };
  if (t === 'tstars') return { tex: 'p-star', tint: [0xffd23f, 0xffffff], scale: 0.5 };
  if (t === 'hearts') return { tex: 'p-heart', tint: [0xff6fae, 0xff5d5d], scale: 0.5 };
  return { tex: 'p-dot', tint: [0xffffff], scale: 0.45 };
}

/** Vistas previas de la tienda y partículas de estela (una vez, en Boot). */
export function makeCosmetics(scene: Phaser.Scene) {
  const once = (key: string, w: number, h: number, draw: (g: G) => void) => { if (!scene.textures.exists(key)) redrawTexture(scene, key, w, h, draw); };
  for (const id of Object.keys(PAPERS)) once(`pv-paper-${id}`, PLANE_W, PLANE_H, (g) => drawPlane(g, id, 'stripes', 'normal'));
  for (const id of PATTERNS) once(`pv-pat-${id}`, PLANE_W, PLANE_H, (g) => drawPlane(g, 'sky', id, 'happy'));
  once('p-dot', 32, 32, (g) => { g.fillStyle(0xffffff); g.fillCircle(16, 16, 14); });
  once('p-star', 40, 40, (g) => { g.fillStyle(0xffffff); g.fillPoints(starPts(20, 21, 19, 8), true); });
  once('p-heart', 40, 40, (g) => heart(g, 20, 20, 17, 0xffffff));
  // estelas: un avión pequeño con su rastro
  const trailPv = (key: string, draw: (g: G) => void) => once(key, 260, 130, (g) => {
    draw(g);
    g.save(); g.translateCanvas(150, 30); g.scaleCanvas(0.48, 0.48); drawPlane(g, 'white', 'stripes', 'happy'); g.restore();
  });
  trailPv('pv-trail-wind', (g) => { for (let i = 0; i < 6; i++) { g.fillStyle(0xffffff, 0.35 + i * 0.1); g.fillCircle(20 + i * 24, 92 - i * 6, 6 + i * 2); } });
  trailPv('pv-trail-rainbow', (g) => {
    const c = [0xff5d5d, 0xff9f43, 0xffd23f, 0x3ddc84, 0x4aa8ff, 0x9b6bff];
    c.forEach((col, i) => { g.lineStyle(7, col); g.beginPath(); g.arc(150, 170 + i * 7, 135, Math.PI * 1.08, Math.PI * 1.48); g.strokePath(); });
  });
  trailPv('pv-trail-stars', (g) => { for (let i = 0; i < 5; i++) { g.fillStyle(i % 2 ? 0xffffff : 0xffd23f); g.fillPoints(starPts(24 + i * 28, 96 - i * 8, 8 + i * 2, 4 + i), true); } });
  trailPv('pv-trail-hearts', (g) => { for (let i = 0; i < 5; i++) heart(g, 24 + i * 28, 96 - i * 8, 7 + i * 2, i % 2 ? 0xff5d5d : 0xff6fae); });
}

/** Vuelve a dibujar el avión del jugador (sus tres caras) con el papel y el dibujo equipados. */
export function applyPlane(scene: Phaser.Scene) {
  const paper = equippedId(save, 'paper', DEFAULTS.paper, ITEMS);
  const pat = equippedId(save, 'pattern', DEFAULTS.pattern, ITEMS);
  for (const f of ['normal', 'happy', 'scared'] as Face[]) redrawTexture(scene, `plane-${f}`, PLANE_W, PLANE_H, (g) => drawPlane(g, paper, pat, f));
}

function starPts(cx: number, cy: number, r: number, ri: number) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? ri : r, a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr));
  }
  return pts;
}
function heart(g: G, cx: number, cy: number, r: number, col: number) {
  g.fillStyle(col);
  g.fillCircle(cx - r * 0.45, cy - r * 0.2, r * 0.52); g.fillCircle(cx + r * 0.45, cy - r * 0.2, r * 0.52);
  g.fillTriangle(cx - r * 0.95, cy, cx + r * 0.95, cy, cx, cy + r * 0.95);
}

// Geometría del avión de perfil (morro a la derecha). Ala de arriba: N-A-F; quilla: N-F-K.
const N = { x: 212, y: 62 }, A = { x: 12, y: 5 }, F = { x: 60, y: 64 }, K = { x: 86, y: 120 };
const lerp = (p: { x: number; y: number }, q: { x: number; y: number }, t: number) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
/** Banda transversal del triángulo (p0 = vértice trasero de arriba, p1 = vértice trasero de abajo) entre u0 y u1 (0 = cola, 1 = morro). */
function band(g: G, p0: typeof N, p1: typeof N, u0: number, u1: number) {
  g.fillPoints([lerp(p0, N, u0), lerp(p0, N, u1), lerp(p1, N, u1), lerp(p1, N, u0)], true);
}

/** Avión de papel de 220×124 con cara. */
export function drawPlane(g: G, paper: string, pattern: string, face: Face) {
  const [body, keel] = PAPERS[paper] ?? PAPERS.white;
  const mark = INKS[paper] ?? 0xff5d5d;
  // sombra suave
  g.fillStyle(0x000000, 0.12); g.fillTriangle(N.x - 6, N.y + 10, F.x, F.y + 12, K.x, K.y + 6);
  // quilla (pliegue de abajo)
  g.fillStyle(keel); g.fillTriangle(N.x, N.y, F.x, F.y, K.x, K.y);
  // ala de arriba
  g.fillStyle(body); g.fillTriangle(N.x, N.y, A.x, A.y, F.x, F.y);
  // dibujo
  g.fillStyle(mark);
  if (pattern === 'stripes') {
    band(g, A, F, 0.12, 0.2); band(g, A, F, 0.26, 0.33);
    band(g, F, K, 0.12, 0.2); band(g, F, K, 0.26, 0.33);
  } else if (pattern === 'bands') {
    for (let i = 0; i < 6; i++) { band(g, A, F, 0.04 + i * 0.1, 0.09 + i * 0.1); band(g, F, K, 0.04 + i * 0.1, 0.09 + i * 0.1); }
  } else {
    const spots = [[0.2, 0.35], [0.3, 0.7], [0.42, 0.3], [0.5, 0.65], [0.62, 0.4]];
    for (const [u, v] of spots) {
      const p = lerp(lerp(A, N, u), lerp(F, N, u), v);
      if (pattern === 'dots') g.fillCircle(p.x, p.y, 6.5);
      else g.fillPoints(starPts(p.x, p.y, 9, 4), true);
      const q = lerp(lerp(F, N, u), lerp(K, N, u), v);
      if (pattern === 'dots') g.fillCircle(q.x, q.y, 5.5);
      else g.fillPoints(starPts(q.x, q.y, 7, 3), true);
    }
  }
  // pliegue (línea central) y brillo
  g.lineStyle(3, INK, 0.35); g.lineBetween(F.x + 6, F.y, N.x - 8, N.y);
  g.fillStyle(0xffffff, 0.45); g.fillTriangle(A.x + 24, A.y + 14, A.x + 64, A.y + 22, A.x + 44, A.y + 30);
  // contorno grueso
  g.lineStyle(6, INK);
  g.strokePoints([N, A, F], true, true);
  g.strokePoints([N, F, K], true, true);
  // cara (sobre el pliegue, cerca del morro)
  // la cara se dibuja a escala 1,5 alrededor de (140, 66)
  g.save(); g.translateCanvas(140, 66); g.scaleCanvas(1.5, 1.5);
  const cx = 0, cy = 0;
  g.fillStyle(0xff9ec7, 0.85); g.fillEllipse(cx - 30, cy + 14, 16, 10); g.fillEllipse(cx + 24, cy + 13, 13, 9);
  if (face === 'scared') {
    g.lineStyle(5, INK);
    for (const d of [-16, 12]) { g.lineBetween(cx + d - 7, cy - 11, cx + d + 7, cy + 3); g.lineBetween(cx + d + 7, cy - 11, cx + d - 7, cy + 3); }
    g.fillStyle(INK); g.fillEllipse(cx - 2, cy + 15, 13, 11);
  } else if (face === 'happy') {
    g.lineStyle(5, INK);
    for (const d of [-16, 12]) { g.beginPath(); g.arc(cx + d, cy - 1, 8, Math.PI + 0.25, -0.25); g.strokePath(); }
    g.fillStyle(INK); g.slice(cx - 2, cy + 8, 10, 0, Math.PI, false); g.fillPath();
    g.fillStyle(0xff5d5d); g.fillCircle(cx - 2, cy + 14, 4.5);
  } else {
    for (const d of [-16, 12]) { g.fillStyle(INK); g.fillEllipse(cx + d, cy - 4, 14, 18); g.fillStyle(0xffffff); g.fillCircle(cx + d + 2.5, cy - 9, 3.5); }
    g.lineStyle(4, INK); g.beginPath(); g.arc(cx - 2, cy + 6, 8, 0.25, Math.PI - 0.25); g.strokePath();
  }
  g.restore();
}
