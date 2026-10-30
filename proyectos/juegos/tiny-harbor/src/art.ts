import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { LAYOUTS, type Kind, type LayoutName, type Theme } from './data';

/** Gráficos de Tiny Harbor dibujados por código (estilo Nuvolet: contorno grueso, colores planos), horneados en texturas. */
export const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;
const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

export function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void, replace = false) {
  if (scene.textures.exists(key)) { if (!replace) return; scene.textures.remove(key); }
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export const SEA: Record<Theme, number> = { village: 0x39b8e0, tropic: 0x2fd0d0, city: 0x3a9ad6 };
export const LAND: Record<Theme, number> = { village: 0x7ccf5a, tropic: 0xf4d58d, city: 0xb9c3cc };
export const QUAY: Record<Theme, [number, number]> = { village: [0xc98a4b, 0x9a6233], tropic: [0xd9a05b, 0xa8733a], city: [0x8d99a6, 0x6b7682] };

/* ------------------------------------------------------------------ barco (96×176, proa arriba, centro 48,88) */
export const BOAT_W = 96, BOAT_H = 176;
export const HULLS: Record<string, number> = { red: 0xff4b4b, blue: 0x4aa8ff, green: 0x3ddc84, yellow: 0xffc21a, purple: 0x9b6bff, pirate: 0x3a3550, gold: 0xffd23f };
const ROOFS = [0xff8a4c, 0x4aa8ff, 0x3ddc84, 0xff6fae];
/** Huecos de la bodega (centro del barco = 0,0): 2 columnas × 3 filas y una segunda capa encima. */
export const HOLD: [number, number][] = [];
for (const layer of [0, 1]) for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) HOLD.push([-10 + c * 20 - layer * 3, -30 + r * 19 - layer * 5]);

function hullPts(cx: number, cy: number, s = 1) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i <= 10; i++) { const a = i / 10; pts.push(V(cx + 40 * s * Math.sin((a * Math.PI) / 2), cy - 82 * s + 64 * s * a)); }
  pts.push(V(cx + 40 * s, cy + 52 * s));
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; pts.push(V(cx + 40 * s * Math.cos(a), cy + 52 * s + 28 * s * Math.sin(a))); }
  for (let i = 10; i >= 0; i--) { const a = i / 10; pts.push(V(cx - 40 * s * Math.sin((a * Math.PI) / 2), cy - 82 * s + 64 * s * a)); }
  return pts;
}

export function drawBoat(g: G, hull: number, roof: number, flag: string, cx = 48, cy = 88) {
  // sombra en el agua
  g.fillStyle(0x0b4f74, 0.25); g.fillPoints(hullPts(cx + 5, cy + 7), true);
  const outer = hullPts(cx, cy);
  g.fillStyle(hull); g.fillPoints(outer, true);
  // franja blanca de la borda
  g.fillStyle(0xffffff); g.fillPoints(hullPts(cx, cy + 1, 0.86), true);
  g.fillStyle(0xf3dcb0); g.fillPoints(hullPts(cx, cy + 2, 0.78), true);
  g.lineStyle(5, INK); g.strokePoints(outer, true, true);
  // bodega
  g.fillStyle(0x8a5a3c); g.fillRoundedRect(cx - 24, cy - 44, 48, 64, 8);
  g.lineStyle(3, INK); g.strokeRoundedRect(cx - 24, cy - 44, 48, 64, 8);
  g.lineStyle(2, 0x6b4129); for (let y = cy - 32; y < cy + 18; y += 12) g.lineBetween(cx - 22, y, cx + 22, y);
  // cara en la proa
  g.fillStyle(INK); g.fillEllipse(cx - 10, cy - 60, 7, 9); g.fillEllipse(cx + 10, cy - 60, 7, 9);
  g.fillStyle(0xffffff); g.fillCircle(cx - 9, cy - 62, 2); g.fillCircle(cx + 11, cy - 62, 2);
  g.fillStyle(0xff8fa3, 0.8); g.fillCircle(cx - 19, cy - 52, 4); g.fillCircle(cx + 19, cy - 52, 4);
  g.lineStyle(3, INK); g.beginPath(); g.arc(cx, cy - 54, 6, 0.3, Math.PI - 0.3); g.strokePath();
  // cabina (popa) con techo y ventanas
  g.fillStyle(0xffffff); g.fillRoundedRect(cx - 27, cy + 26, 54, 42, 10);
  g.lineStyle(4, INK); g.strokeRoundedRect(cx - 27, cy + 26, 54, 42, 10);
  g.fillStyle(roof); g.fillRoundedRect(cx - 22, cy + 30, 44, 22, 7);
  g.lineStyle(3, INK); g.strokeRoundedRect(cx - 22, cy + 30, 44, 22, 7);
  g.fillStyle(0x7fd3ff); for (const x of [-16, -3, 10]) { g.fillRoundedRect(cx + x, cy + 56, 8, 7, 2); }
  // chimenea
  g.fillStyle(INK); g.fillCircle(cx, cy + 41, 9);
  g.fillStyle(0xff4b4b); g.fillCircle(cx, cy + 41, 7);
  g.fillStyle(INK); g.fillCircle(cx, cy + 41, 4);
  // bandera (cosmético) a estribor de la popa
  if (flag) drawFlag(g, flag, cx + 30, cy + 64, 0.55);
}

/** Bandera en un mástil: (x, y) = pie del mástil. Lienzo de la vista previa: 80×80 con s = 1. */
export function drawFlag(g: G, id: string, x: number, y: number, s = 1) {
  g.lineStyle(4 * s, INK); g.lineBetween(x, y, x, y - 56 * s);
  const fx = x + 2 * s, fy = y - 56 * s, fw = 36 * s, fh = 26 * s;
  const cols: Record<string, number> = { star: 0x4aa8ff, heart: 0xffffff, pirate: 0x2b2340, rainbow: 0xff4b4b, checker: 0xffffff };
  g.fillStyle(cols[id] ?? 0xffffff); g.fillRect(fx, fy, fw, fh);
  if (id === 'rainbow') { [0xff4b4b, 0xffc21a, 0x3ddc84, 0x4aa8ff].forEach((c, i) => { g.fillStyle(c); g.fillRect(fx, fy + (i * fh) / 4, fw, fh / 4 + 0.5); }); }
  if (id === 'checker') { g.fillStyle(INK); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) g.fillRect(fx + (i * fw) / 4, fy + (j * fh) / 3, fw / 4 + 0.5, fh / 3 + 0.5); }
  if (id === 'star') { const c = V(fx + fw / 2, fy + fh / 2); const p: Phaser.Math.Vector2[] = []; for (let i = 0; i < 10; i++) { const r = (i % 2 ? 4.5 : 10) * s, a = -Math.PI / 2 + (i * Math.PI) / 5; p.push(V(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r)); } g.fillStyle(0xffd23f); g.fillPoints(p, true); }
  if (id === 'heart') { g.fillStyle(0xff4f7a); g.fillCircle(fx + fw / 2 - 5 * s, fy + fh / 2 - 3 * s, 6 * s); g.fillCircle(fx + fw / 2 + 5 * s, fy + fh / 2 - 3 * s, 6 * s); g.fillTriangle(fx + fw / 2 - 11 * s, fy + fh / 2 - 1 * s, fx + fw / 2 + 11 * s, fy + fh / 2 - 1 * s, fx + fw / 2, fy + fh / 2 + 10 * s); }
  if (id === 'pirate') { g.fillStyle(0xffffff); g.fillCircle(fx + fw / 2, fy + fh / 2 - 2 * s, 7 * s); g.fillRect(fx + fw / 2 - 4 * s, fy + fh / 2 + 3 * s, 8 * s, 5 * s); g.fillStyle(INK); g.fillCircle(fx + fw / 2 - 3 * s, fy + fh / 2 - 3 * s, 2 * s); g.fillCircle(fx + fw / 2 + 3 * s, fy + fh / 2 - 3 * s, 2 * s); }
  g.lineStyle(3 * s, INK); g.strokeRect(fx, fy, fw, fh);
}

/** Texturas de los barcos con el casco y la bandera equipados (boat0..3: distinto color de techo). */
export function makeBoats(scene: Phaser.Scene, hull: string, flag: string) {
  ROOFS.forEach((r, i) => tex(scene, `boat${i}`, BOAT_W, BOAT_H, (g) => drawBoat(g, HULLS[hull] ?? HULLS.red, r, flag), true));
}

/* ------------------------------------------------------------------ cajas (30×30) */
export function drawCrate(g: G, theme: Theme | 'gold', cx = 15, cy = 15, s = 1) {
  const w = 26 * s, h = 26 * s;
  g.lineStyle(3 * s, INK);
  if (theme === 'city') {
    const cols = [0xff4b4b, 0x4aa8ff];
    g.fillStyle(cols[0]); g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 3 * s); g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 3 * s);
    g.lineStyle(2 * s, 0xb83232); for (let i = 1; i < 5; i++) g.lineBetween(cx - w / 2 + (i * w) / 5, cy - h / 2 + 3 * s, cx - w / 2 + (i * w) / 5, cy + h / 2 - 3 * s);
  } else {
    const base = theme === 'tropic' ? 0xffd23f : theme === 'gold' ? 0xffc21a : 0xd99a5b;
    g.fillStyle(base); g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 3 * s); g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 3 * s);
    g.lineStyle(2.5 * s, theme === 'tropic' ? 0xc99a00 : 0x8a5a3c);
    g.lineBetween(cx - w / 2 + 3 * s, cy - h / 2 + 3 * s, cx + w / 2 - 3 * s, cy + h / 2 - 3 * s);
    g.strokeRect(cx - w / 2 + 3 * s, cy - h / 2 + 3 * s, w - 6 * s, h - 6 * s);
    if (theme === 'village') { g.fillStyle(0x7fc8ff); g.fillEllipse(cx, cy, 14 * s, 7 * s); g.fillTriangle(cx + 6 * s, cy, cx + 11 * s, cy - 4 * s, cx + 11 * s, cy + 4 * s); }
    if (theme === 'tropic') { g.fillStyle(0xffe680); g.fillEllipse(cx - 2 * s, cy, 16 * s, 7 * s); g.lineStyle(2 * s, INK); g.strokeEllipse(cx - 2 * s, cy, 16 * s, 7 * s); }
  }
  g.fillStyle(0xffffff, 0.35); g.fillRect(cx - w / 2 + 3 * s, cy - h / 2 + 3 * s, w - 6 * s, 3 * s);
}

/* ------------------------------------------------------------------ grúa, remolcador, señales */
function makeCrane(scene: Phaser.Scene) {
  // base (64×64, centro): plataforma con rayas
  tex(scene, 'crane-base', 72, 72, (g) => {
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(8, 12, 60, 60, 10);
    g.fillStyle(0xffc21a); g.fillRoundedRect(4, 4, 60, 60, 10);
    g.fillStyle(INK); for (let i = 0; i < 4; i++) g.fillTriangle(8 + i * 15, 60, 16 + i * 15, 48, 22 + i * 15, 60);
    g.lineStyle(5, INK); g.strokeRoundedRect(4, 4, 60, 60, 10);
    g.fillStyle(0x7fd3ff); g.fillRoundedRect(16, 14, 36, 22, 5); g.lineStyle(3, INK); g.strokeRoundedRect(16, 14, 36, 22, 5);
    g.fillStyle(INK); g.fillCircle(34, 34, 9); g.fillStyle(0x8d99a6); g.fillCircle(34, 34, 5);
  });
  // brazo (celosía) de 150 de largo, origen en el pivote (izquierda, centro)
  tex(scene, 'crane-arm', 160, 26, (g) => {
    g.fillStyle(0xffc21a); g.fillRoundedRect(2, 3, 154, 20, 8);
    g.lineStyle(3, 0xc98a00); for (let x = 14; x < 150; x += 16) { g.lineBetween(x, 5, x + 8, 21); g.lineBetween(x + 8, 21, x + 16, 5); }
    g.lineStyle(4, INK); g.strokeRoundedRect(2, 3, 154, 20, 8);
  });
  tex(scene, 'hook', 24, 24, (g) => { g.lineStyle(4, INK); g.fillStyle(0x8d99a6); g.fillCircle(12, 12, 8); g.strokeCircle(12, 12, 8); g.fillStyle(INK); g.fillCircle(12, 12, 3); });
  tex(scene, 'slot', 120, 200, (g) => {
    g.lineStyle(6, 0xffffff, 0.85);
    for (let y = 10; y < 190; y += 26) { g.lineBetween(8, y, 8, y + 14); g.lineBetween(112, y, 112, y + 14); }
    for (let x = 10; x < 112; x += 26) { g.lineBetween(x, 8, x + 14, 8); g.lineBetween(x, 192, x + 14, 192); }
  });
}

function drawTug(g: G, cx: number, cy: number) {
  g.fillStyle(0x0b4f74, 0.25); g.fillEllipse(cx + 4, cy + 6, 50, 84);
  g.fillStyle(0xff8a1f); g.fillEllipse(cx, cy, 48, 82); g.lineStyle(5, INK); g.strokeEllipse(cx, cy, 48, 82);
  g.fillStyle(INK); for (const y of [-26, 0, 26]) { g.fillCircle(cx - 23, cy + y, 6); g.fillCircle(cx + 23, cy + y, 6); }
  g.fillStyle(0xffffff); g.fillRoundedRect(cx - 14, cy - 6, 28, 30, 7); g.lineStyle(3, INK); g.strokeRoundedRect(cx - 14, cy - 6, 28, 30, 7);
  g.fillStyle(0x7fd3ff); g.fillRoundedRect(cx - 9, cy - 3, 18, 8, 3);
  g.fillStyle(INK); g.fillCircle(cx, cy + 15, 6); g.fillStyle(0xffd23f); g.fillCircle(cx, cy + 15, 3.5);
  g.fillStyle(INK); g.fillEllipse(cx - 7, cy - 24, 5, 7); g.fillEllipse(cx + 7, cy - 24, 5, 7);
}

/** Iconos de las mejoras (lienzo 80×80). */
const PAD_ICONS: Record<string, (g: G) => void> = {
  berth: (g) => { // grúa con signo +
    g.fillStyle(0xffc21a); g.lineStyle(4, INK);
    g.fillRoundedRect(14, 44, 26, 26, 5); g.strokeRoundedRect(14, 44, 26, 26, 5);
    g.fillRoundedRect(22, 12, 10, 34, 3); g.strokeRoundedRect(22, 12, 10, 34, 3);
    g.fillRoundedRect(22, 10, 46, 10, 4); g.strokeRoundedRect(22, 10, 46, 10, 4);
    g.lineStyle(3, INK); g.lineBetween(62, 20, 62, 36); g.fillStyle(0xd99a5b); g.fillRect(54, 36, 16, 14); g.strokeRect(54, 36, 16, 14);
    plus(g, 60, 64);
  },
  crane: (g) => { // grúa y rayo
    g.fillStyle(0xffc21a); g.lineStyle(4, INK);
    g.fillRoundedRect(10, 46, 26, 24, 5); g.strokeRoundedRect(10, 46, 26, 24, 5);
    g.fillRoundedRect(18, 14, 10, 34, 3); g.strokeRoundedRect(18, 14, 10, 34, 3);
    g.fillRoundedRect(18, 12, 40, 10, 4); g.strokeRoundedRect(18, 12, 40, 10, 4);
    bolt(g, 58, 50);
  },
  hull: (g) => { g.save(); g.translateCanvas(10, 6); g.scaleCanvas(0.42, 0.42); drawBoat(g, HULLS.red, ROOFS[0], ''); g.restore(); plus(g, 60, 62); },
  cargo: (g) => { drawCrate(g, 'gold', 34, 44, 1.5); star(g, 60, 22, 13); },
  buoy: (g) => {
    g.lineStyle(4, INK); g.fillStyle(0xff4b4b); g.fillCircle(36, 42, 22); g.strokeCircle(36, 42, 22);
    g.fillStyle(0xffffff); g.fillRect(16, 36, 40, 12); g.lineStyle(3, INK); g.strokeRect(16, 36, 40, 12);
    g.lineStyle(4, INK); g.lineBetween(36, 20, 36, 8); g.fillStyle(0xffd23f); g.fillCircle(36, 8, 6); g.strokeCircle(36, 8, 6);
    plus(g, 62, 64);
  },
  tug: (g) => { g.save(); g.translateCanvas(16, -2); g.scaleCanvas(0.85, 0.85); drawTug(g, 28, 48); g.restore(); },
  pilot: (g) => { // gorra de capitán
    g.lineStyle(4, INK); g.fillStyle(0xffffff); g.fillEllipse(40, 36, 58, 34); g.strokeEllipse(40, 36, 58, 34);
    g.fillStyle(0x2b2340); g.fillRoundedRect(14, 40, 52, 14, 6); g.strokeRoundedRect(14, 40, 52, 14, 6);
    g.fillStyle(0x2b2340); g.fillEllipse(40, 60, 44, 14); g.strokeEllipse(40, 60, 44, 14);
    g.fillStyle(0xffd23f); g.fillCircle(40, 30, 7); g.lineStyle(3, INK); g.strokeCircle(40, 30, 7);
  },
  gate: (g) => drawLighthouse(g, 40, 74, 0.62),
  star: (g) => { star(g, 40, 40, 32); },
};
function plus(g: G, x: number, y: number) {
  g.fillStyle(PALETTE.green); g.lineStyle(3, INK); g.fillCircle(x, y, 13); g.strokeCircle(x, y, 13);
  g.fillStyle(0xffffff); g.fillRect(x - 7, y - 2.5, 14, 5); g.fillRect(x - 2.5, y - 7, 5, 14);
}
function bolt(g: G, x: number, y: number) {
  const p = [V(x + 2, y - 20), V(x - 12, y + 2), V(x - 1, y + 2), V(x - 5, y + 20), V(x + 12, y - 4), V(x + 1, y - 4)];
  g.fillStyle(0xffd23f); g.fillPoints(p, true); g.lineStyle(3, INK); g.strokePoints(p, true, true);
}
function star(g: G, x: number, y: number, r: number) {
  const p: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; p.push(V(x + Math.cos(a) * rr, y + Math.sin(a) * rr)); }
  g.fillStyle(0xffd23f); g.fillPoints(p, true); g.lineStyle(3, 0xc98a00); g.strokePoints(p, true, true);
}

/** Faro: (x, y) = pie. Unos 150 de alto con s = 1. */
export function drawLighthouse(g: G, x: number, y: number, s = 1) {
  g.lineStyle(5 * s, INK);
  const body = [V(x - 26 * s, y), V(x - 17 * s, y - 104 * s), V(x + 17 * s, y - 104 * s), V(x + 26 * s, y)];
  g.fillStyle(0xffffff); g.fillPoints(body, true);
  g.fillStyle(0xff4b4b);
  for (const [a, b] of [[0, 0.2], [0.4, 0.6], [0.8, 1]]) {
    const y0 = y - a * 104 * s, y1 = y - b * 104 * s, w0 = 26 - a * 9, w1 = 26 - b * 9;
    g.fillPoints([V(x - w0 * s, y0), V(x - w1 * s, y1), V(x + w1 * s, y1), V(x + w0 * s, y0)], true);
  }
  g.strokePoints(body, true, true);
  g.fillStyle(0xfff1a8); g.fillRect(x - 15 * s, y - 128 * s, 30 * s, 24 * s); g.strokeRect(x - 15 * s, y - 128 * s, 30 * s, 24 * s);
  g.fillStyle(0xff4b4b); g.fillTriangle(x - 21 * s, y - 128 * s, x + 21 * s, y - 128 * s, x, y - 150 * s);
  g.strokeTriangle(x - 21 * s, y - 128 * s, x + 21 * s, y - 128 * s, x, y - 150 * s);
  g.fillStyle(INK); g.fillRect(x - 24 * s, y - 106 * s, 48 * s, 5 * s);
}

/* ------------------------------------------------------------------ suelo del puerto (horneado por tema y distribución) */
export function groundKey(theme: Theme, layout: LayoutName) { return `ground-${theme}-${layout}`; }

export function makeGround(scene: Phaser.Scene, theme: Theme, layout: LayoutName) {
  const L = LAYOUTS[layout];
  const key = groundKey(theme, layout);
  tex(scene, key, L.w, L.h, (g) => {
    const [q, qd] = QUAY[theme];
    // tierra
    g.fillStyle(LAND[theme]); g.fillRect(0, 0, L.w, L.landY);
    // decoración por tema en la franja de arriba
    decorate(g, theme, L.w, L.landY, layout);
    // muelle: tablones con bolardos y neumáticos
    const quay = (y0: number, y1: number, x0: number, x1: number) => {
      g.fillStyle(0x000000, 0.18); g.fillRect(x0, y1, x1 - x0, 10);
      g.fillStyle(q); g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.lineStyle(2, qd); for (let x = x0 + 40; x < x1; x += 40) g.lineBetween(x, y0, x, y1);
      g.lineStyle(4, INK); g.lineBetween(x0, y1, x1, y1); g.lineBetween(x0, y0, x1, y0);
      for (let x = x0 + 60; x < x1 - 20; x += 180) { g.fillStyle(INK); g.fillCircle(x, y0 + (y1 - y0) / 2, 7); g.fillStyle(0x6b7682); g.fillCircle(x, y0 + (y1 - y0) / 2, 4); }
    };
    quay(L.landY - 38, L.landY, 0, L.w);
    if (L.pier) {
      g.fillStyle(qd); for (let x = 60; x < 860; x += 90) g.fillRect(x - 6, L.pier.y0 - 6, 12, L.pier.y1 - L.pier.y0 + 14);
      quay(L.pier.y0, L.pier.y1, 30, 870);
      g.lineStyle(4, INK); g.lineBetween(30, L.pier.y0, 30, L.pier.y1); g.lineBetween(870, L.pier.y0, 870, L.pier.y1);
      // pasarela a tierra
      g.fillStyle(q); g.fillRect(20, L.landY, 40, L.pier.y0 - L.landY); g.lineStyle(4, INK); g.strokeRect(20, L.landY, 40, L.pier.y0 - L.landY);
      g.lineStyle(2, qd); for (let y = L.landY + 20; y < L.pier.y0; y += 20) g.lineBetween(22, y, 58, y);
    }
    // faro sobre unas rocas
    const lh = L.lighthouse;
    g.fillStyle(0x8d99a6); g.lineStyle(4, INK);
    g.fillEllipse(lh.x, lh.y + 6, 120, 52); g.strokeEllipse(lh.x, lh.y + 6, 120, 52);
    g.fillStyle(0xa9b4bf); g.fillEllipse(lh.x - 26, lh.y - 2, 44, 24); g.fillEllipse(lh.x + 24, lh.y + 4, 40, 22);
    drawLighthouse(g, lh.x, lh.y + 8, 0.85);
    // almacén
    const wh = L.warehouse;
    if (wh.x > 0) {
      g.fillStyle(0x000000, 0.18); g.fillRoundedRect(wh.x - 56, wh.y - 36, 116, 84, 8);
      g.fillStyle(theme === 'city' ? 0x4aa8ff : 0xff8a4c); g.fillRoundedRect(wh.x - 60, wh.y - 42, 116, 84, 8);
      g.lineStyle(5, INK); g.strokeRoundedRect(wh.x - 60, wh.y - 42, 116, 84, 8);
      g.fillStyle(0xffffff, 0.35); g.fillRect(wh.x - 52, wh.y - 30, 100, 8);
      g.fillStyle(0x6b4129); g.fillRoundedRect(wh.x - 22, wh.y + 2, 40, 40, 4); g.lineStyle(3, INK); g.strokeRoundedRect(wh.x - 22, wh.y + 2, 40, 40, 4);
    }
  });
  return key;
}

function decorate(g: G, theme: Theme, w: number, landY: number, layout: LayoutName) {
  // franja decorativa arriba del todo (y < 50): no choca con los letreros ni con las grúas
  const tree = (x: number, y: number, r: number) => {
    g.fillStyle(0x000000, 0.15); g.fillEllipse(x + 4, y + r * 0.8, r * 1.8, r * 0.6);
    g.fillStyle(theme === 'tropic' ? 0x2fae5a : 0x3fae4a); g.lineStyle(4, INK); g.fillCircle(x, y, r); g.strokeCircle(x, y, r);
    g.fillStyle(0xffffff, 0.25); g.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.35);
  };
  const palm = (x: number, y: number) => {
    g.lineStyle(4, INK); g.fillStyle(0x3ddc84);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.fillEllipse(x + Math.cos(a) * 16, y + Math.sin(a) * 16, 30, 14); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.strokeEllipse(x + Math.cos(a) * 16, y + Math.sin(a) * 16, 30, 14); }
    g.fillStyle(0x8a5a3c); g.fillCircle(x, y, 8); g.strokeCircle(x, y, 8);
  };
  const box = (x: number, y: number, c: number) => { g.fillStyle(c); g.lineStyle(4, INK); g.fillRoundedRect(x, y, 70, 30, 4); g.strokeRoundedRect(x, y, 70, 30, 4); g.lineStyle(2, 0x000000, 0.3); for (let i = 1; i < 6; i++) g.lineBetween(x + i * 12, y + 4, x + i * 12, y + 26); };
  // camino de tierra o asfalto a lo largo
  g.fillStyle(theme === 'city' ? 0x9aa5b1 : theme === 'tropic' ? 0xe8c06f : 0xd9b77a); g.fillRect(0, landY - 92, w, 40);
  if (theme === 'city') { g.fillStyle(0xffffff, 0.8); for (let x = 20; x < w; x += 60) g.fillRect(x, landY - 74, 30, 4); }
  const xs: number[] = [];
  for (let x = 30; x < w; x += layout === 'wide' ? 115 : 95) xs.push(x);
  xs.forEach((x, i) => {
    const y = 26 + (i % 2) * 8;
    if (theme === 'village') { if (i % 3 === 1) { g.fillStyle(0xff7782); g.lineStyle(3, INK); g.fillCircle(x, y + 4, 6); g.strokeCircle(x, y + 4, 6); } else tree(x, y, 18); }
    else if (theme === 'tropic') palm(x, y + 2);
    else box(x - 35, y - 18, [0xff4b4b, 0x4aa8ff, 0x3ddc84, 0xffc21a][i % 4]);
  });
}

/** Zona de mar abierto (flechas hacia fuera y boyas). */
export function makeExit(scene: Phaser.Scene, layout: LayoutName) {
  const L = LAYOUTS[layout], e = L.exit;
  const w = e.x1 - e.x0, h = e.y1 - e.y0;
  tex(scene, `exit-${layout}`, w, h, (g) => {
    g.fillStyle(0xffffff, 0.12); g.fillRoundedRect(8, 8, w - 16, h - 16, 30);
    g.lineStyle(6, 0xffffff, 0.7);
    for (let x = 30; x < w - 30; x += 34) { g.lineBetween(x, 8, x + 18, 8); g.lineBetween(x, h - 8, x + 18, h - 8); }
    for (let y = 30; y < h - 30; y += 34) { g.lineBetween(8, y, 8, y + 18); g.lineBetween(w - 8, y, w - 8, y + 18); }
    // flechas hacia fuera (derecha en apaisado, abajo en vertical)
    const arrow = (cx: number, cy: number, ang: number) => {
      const p = [[-26, -18], [4, -18], [4, -34], [34, 0], [4, 34], [4, 18], [-26, 18]].map(([x, y]) => V(cx + x * Math.cos(ang) - y * Math.sin(ang), cy + x * Math.sin(ang) + y * Math.cos(ang)));
      g.fillStyle(0xffffff, 0.9); g.fillPoints(p, true); g.lineStyle(4, INK, 0.8); g.strokePoints(p, true, true);
    };
    if (layout === 'wide') { arrow(w / 2, h * 0.5, 0); arrow(w / 2, h * 0.78, 0); }
    else { arrow(w * 0.3, h / 2, Math.PI / 2); arrow(w * 0.7, h / 2, Math.PI / 2); }
  });
  tex(scene, 'buoy', 40, 52, (g) => {
    g.fillStyle(0x0b4f74, 0.25); g.fillEllipse(22, 44, 32, 12);
    g.fillStyle(0xff4b4b); g.lineStyle(4, INK); g.fillCircle(20, 30, 15); g.strokeCircle(20, 30, 15);
    g.fillStyle(0xffffff); g.fillRect(6, 26, 28, 8);
    g.lineStyle(3, INK); g.lineBetween(20, 15, 20, 4); g.fillStyle(0xffd23f); g.fillCircle(20, 6, 5); g.strokeCircle(20, 6, 5);
  });
}

/** Texturas que no dependen de cosméticos ni del puerto. */
export function makeArt(scene: Phaser.Scene) {
  for (const t of ['village', 'tropic', 'city', 'gold'] as const) tex(scene, `crate-${t}`, 30, 30, (g) => drawCrate(g, t));
  makeCrane(scene);
  tex(scene, 'tug', 64, 100, (g) => drawTug(g, 32, 50));
  for (const [k, d] of Object.entries(PAD_ICONS)) tex(scene, `pi-${k}`, 80, 80, d);
  // letrero de precio (130×150): tablero de madera sobre dos postes
  const sign = (key: string, top: number, side: number) => tex(scene, key, 130, 150, (g) => {
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(10, 12, 116, 134, 18);
    g.fillStyle(0x6b4129); g.fillRect(28, 120, 12, 26); g.fillRect(90, 120, 12, 26);
    g.fillStyle(side); g.fillRoundedRect(4, 4, 120, 134, 18);
    g.fillStyle(top); g.fillRoundedRect(4, 4, 120, 96, { tl: 18, tr: 18, bl: 0, br: 0 });
    g.fillStyle(0xffffff, 0.25); g.fillRoundedRect(14, 10, 100, 8, 4);
    g.lineStyle(5, INK); g.strokeRoundedRect(4, 4, 120, 134, 18); g.lineBetween(4, 100, 124, 100);
  });
  sign('sign', 0xfff6e8, 0x8a5a3c);
  sign('sign-ok', 0xe6ffe9, 0x2fae5a);
  tex(scene, 'waves', 256, 256, (g) => {
    g.lineStyle(5, 0xffffff, 0.22);
    for (const [x, y] of [[30, 40], [150, 90], [60, 170], [190, 220], [110, 10]]) { g.beginPath(); g.arc(x, y, 18, Math.PI * 1.15, Math.PI * 1.85); g.strokePath(); g.beginPath(); g.arc(x + 30, y, 18, Math.PI * 1.15, Math.PI * 1.85); g.strokePath(); }
    g.fillStyle(0xffffff, 0.12); for (const [x, y] of [[100, 60], [220, 150], [20, 230], [140, 200]]) g.fillCircle(x, y, 3);
  });
  tex(scene, 'ready', 56, 56, (g) => {
    g.fillStyle(0x000000, 0.2); g.fillCircle(29, 31, 24);
    g.fillStyle(PALETTE.green); g.fillCircle(28, 28, 24); g.lineStyle(5, 0xffffff); g.strokeCircle(28, 28, 22);
    g.lineStyle(7, 0xffffff); g.beginPath(); g.moveTo(16, 29); g.lineTo(25, 38); g.lineTo(40, 19); g.strokePath();
  });
  tex(scene, 'dot', 12, 12, (g) => { g.fillStyle(0xffffff); g.fillCircle(6, 6, 6); });
  tex(scene, 'puff', 32, 32, (g) => { g.fillStyle(0xffffff, 0.85); g.fillCircle(16, 16, 14); });
  tex(scene, 'ring', 140, 140, (g) => { g.lineStyle(10, 0xffffff, 0.9); g.strokeCircle(70, 70, 60); });
}

export function padIcon(kind: Kind, lastPort: boolean) { return kind === 'gate' && lastPort ? 'pi-star' : `pi-${kind}`; }
