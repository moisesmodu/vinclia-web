import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;
export type Face = 'normal' | 'happy' | 'scared' | 'fire' | 'dizzy';
export const FACES: Face[] = ['normal', 'happy', 'scared', 'fire', 'dizzy'];

/** Texturas de la pelota: 200×200 con la pelota de radio BR en el centro (sobra sitio para el anillo del planeta). */
export const BT = 200, BR = 72;

export const BALLS = ['basket', 'emoji', 'watermelon', 'beach', 'alien', 'planet', 'disco'] as const;
export const NETS = ['white', 'red', 'rainbow', 'neon', 'gold'] as const;
export const FLOORS = ['street', 'gym', 'beach', 'space'] as const;
export type Floor = (typeof FLOORS)[number];

/** Tienda de Hoop Bounce: pelota, red y pista. Se paga con monedas. */
export const ITEMS: ShopItem[] = [
  { id: 'basket', slot: 'ball', price: 0, icon: 'pv-ball-basket' },
  { id: 'emoji', slot: 'ball', price: 40, icon: 'pv-ball-emoji' },
  { id: 'watermelon', slot: 'ball', price: 80, icon: 'pv-ball-watermelon' },
  { id: 'beach', slot: 'ball', price: 120, icon: 'pv-ball-beach' },
  { id: 'alien', slot: 'ball', price: 160, icon: 'pv-ball-alien' },
  { id: 'planet', slot: 'ball', price: 240, icon: 'pv-ball-planet', bg: 0x2b2e6e },
  { id: 'disco', slot: 'ball', price: 350, icon: 'pv-ball-disco' },
  { id: 'white', slot: 'net', price: 0, icon: 'pv-net-white', bg: 0xbfe6ff },
  { id: 'red', slot: 'net', price: 60, icon: 'pv-net-red' },
  { id: 'rainbow', slot: 'net', price: 140, icon: 'pv-net-rainbow' },
  { id: 'neon', slot: 'net', price: 200, icon: 'pv-net-neon', bg: 0x2b2e6e },
  { id: 'gold', slot: 'net', price: 300, icon: 'pv-net-gold' },
  { id: 'street', slot: 'floor', price: 0, icon: 'pv-floor-street' },
  { id: 'gym', slot: 'floor', price: 100, icon: 'pv-floor-gym' },
  { id: 'beach-court', slot: 'floor', price: 180, icon: 'pv-floor-beach' },
  { id: 'space', slot: 'floor', price: 280, icon: 'pv-floor-space' },
];
export const DEFAULTS = { ball: 'basket', net: 'white', floor: 'street' };
/** Recompensa diaria (monedas) del día 1 al 7. */
export const DAILY = [10, 15, 20, 25, 30, 40, 60];

export function equippedFloor(): Floor {
  const id = equippedId(save, 'floor', DEFAULTS.floor, ITEMS);
  return (id === 'beach-court' ? 'beach' : id) as Floor;
}

/** Vistas previas de la tienda (una vez, en Boot). */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const id of BALLS) {
    const key = `pv-ball-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, BT, BT, (g) => { drawBall(g, id); drawFace(g, 'happy'); });
  }
  for (const id of NETS) {
    const key = `pv-net-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 240, 190, (g) => { g.translateCanvas(20, 30); drawRim(g, 'back'); drawNet(g, id); drawRim(g, 'front'); });
  }
  for (const id of FLOORS) {
    const key = `pv-floor-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 240, 180, (g) => {
      drawCourt(g, id, { x0: -40, y0: 700, w: 800, h: 600, k: 0.3, worldW: 720 });
      g.lineStyle(6, INK); g.strokeRoundedRect(3, 3, 234, 174, 14);
    });
  }
}

/** Vuelve a dibujar la pelota y la red del jugador con lo equipado en la tienda. */
export function applyLook(scene: Phaser.Scene) {
  const ball = equippedId(save, 'ball', DEFAULTS.ball, ITEMS);
  const net = equippedId(save, 'net', DEFAULTS.net, ITEMS);
  redrawTexture(scene, 'ball-skin', BT, BT, (g) => drawBall(g, ball));
  redrawTexture(scene, 'ball-gold', BT, BT, (g) => drawBall(g, 'gold'));
  redrawTexture(scene, 'net', 200, 130, (g) => drawNet(g, net));
}

/** Caras de la pelota (no giran con ella: van en una imagen aparte). */
export function makeFaces(scene: Phaser.Scene) {
  for (const f of FACES) if (!scene.textures.exists(`face-${f}`)) redrawTexture(scene, `face-${f}`, BT, BT, (g) => drawFace(g, f));
  // aro: mitad de atrás (detrás de la pelota) y de delante (delante de la pelota, con la red)
  if (!scene.textures.exists('rim-back')) redrawTexture(scene, 'rim-back', 200, 40, (g) => drawRim(g, 'back'));
  if (!scene.textures.exists('rim-front')) redrawTexture(scene, 'rim-front', 200, 40, (g) => drawRim(g, 'front'));
}

/* ---------------------------------------------------------------- dibujo */

const C = BT / 2;

function circlePts(cx: number, cy: number, r: number, a0: number, a1: number, n = 24) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
  return pts;
}

/** Pelota sin cara. Centro (100, 100), radio 72. */
export function drawBall(g: G, id: string) {
  const r = BR;
  const base: Record<string, number> = {
    basket: 0xff8a3d, emoji: 0xffd23f, watermelon: 0x2fa84f, beach: 0xffffff, alien: 0x8be36b, planet: 0x4aa8ff, disco: 0xc9d3e8, gold: 0xffc928,
  };
  if (id === 'planet') {
    // anillo de atrás
    g.lineStyle(14, INK); g.strokeEllipse(C, C + 6, 190, 46);
    g.lineStyle(8, 0xffb14a); g.strokeEllipse(C, C + 6, 190, 46);
  }
  g.fillStyle(base[id] ?? 0xff8a3d); g.fillCircle(C, C, r);
  g.save();
  if (id === 'basket' || id === 'gold') {
    g.lineStyle(5, id === 'gold' ? 0xe0a800 : 0xc9601e);
    g.lineBetween(C, C - r + 2, C, C + r - 2);
    g.lineBetween(C - r + 2, C, C + r - 2, C);
    g.beginPath(); g.arc(C - r * 1.25, C, r * 0.95, -0.72, 0.72); g.strokePath();
    g.beginPath(); g.arc(C + r * 1.25, C, r * 0.95, Math.PI - 0.72, Math.PI + 0.72); g.strokePath();
  } else if (id === 'watermelon') {
    g.fillStyle(0x1d7a37);
    for (let i = -3; i <= 3; i++) {
      const x = C + i * 22;
      const pts: Phaser.Math.Vector2[] = [];
      const half = Math.sqrt(Math.max(0, r * r - (x - C) * (x - C))) - 3;
      for (let k = 0; k <= 12; k++) { const y = C - half + (2 * half * k) / 12; pts.push(new Phaser.Math.Vector2(x - 5 + (k % 2 ? 6 : -1), y)); }
      for (let k = 12; k >= 0; k--) { const y = C - half + (2 * half * k) / 12; pts.push(new Phaser.Math.Vector2(x + 5 + (k % 2 ? 6 : -1), y)); }
      if (half > 6) g.fillPoints(pts, true);
    }
    g.fillStyle(0xb5f08a, 0.5); g.fillEllipse(C - 30, C - 38, 30, 16);
  } else if (id === 'beach') {
    const cols = [0xff5d5d, 0xffd23f, 0x4aa8ff];
    for (let i = 0; i < 6; i++) {
      if (i % 2) continue;
      g.fillStyle(cols[(i / 2) % 3]);
      const a0 = (i * Math.PI) / 3 - Math.PI / 2, a1 = ((i + 1) * Math.PI) / 3 - Math.PI / 2;
      g.fillPoints([new Phaser.Math.Vector2(C, C), ...circlePts(C, C, r, a0, a1, 10)], true);
    }
    g.fillStyle(0xffffff); g.fillCircle(C, C, 14);
  } else if (id === 'alien') {
    g.fillStyle(0x5cc24a); g.fillCircle(C - 40, C - 34, 10); g.fillCircle(C + 44, C + 30, 8); g.fillCircle(C + 30, C - 48, 6);
    g.fillCircle(C - 50, C + 30, 7);
  } else if (id === 'planet') {
    g.fillStyle(0x3ddc84);
    g.fillEllipse(C - 26, C - 30, 54, 34); g.fillEllipse(C + 34, C + 24, 46, 40); g.fillEllipse(C - 40, C + 36, 30, 22);
    g.fillStyle(0xffffff, 0.8); g.fillEllipse(C + 20, C - 46, 40, 10);
  } else if (id === 'disco') {
    for (let y = -r; y < r; y += 16) for (let x = -r; x < r; x += 16) {
      if ((x + 8) * (x + 8) + (y + 8) * (y + 8) > (r - 6) * (r - 6)) continue;
      const v = ((x * 7 + y * 13) >>> 0) % 5;
      g.fillStyle([0xffffff, 0xe6ecf5, 0xa9b6cc, 0xff9ec7, 0x9fe3ff][v]); g.fillRect(C + x + 1, C + y + 1, 14, 14);
    }
  } else if (id === 'emoji') {
    g.fillStyle(0xffe680, 0.7); g.fillCircle(C - 6, C - 6, r - 10);
  }
  g.restore();
  // brillo y contorno
  g.fillStyle(0xffffff, 0.35); g.fillEllipse(C - 30, C - 40, 34, 18);
  g.lineStyle(8, INK); g.strokeCircle(C, C, r);
  if (id === 'planet') {
    // anillo de delante (mitad de abajo)
    g.lineStyle(14, INK); g.beginPath();
    g.strokePoints(ellipseArc(C, C + 6, 95, 23, 0.1, Math.PI - 0.1), false, false);
    g.lineStyle(8, 0xffb14a);
    g.strokePoints(ellipseArc(C, C + 6, 95, 23, 0.1, Math.PI - 0.1), false, false);
  }
}

function ellipseArc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 24) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry)); }
  return pts;
}

/** Cara (sobre cualquier pelota). */
export function drawFace(g: G, f: Face) {
  const cx = C, cy = C + 4;
  g.fillStyle(0xff7aa8, 0.75); g.fillEllipse(cx - 44, cy + 16, 20, 12); g.fillEllipse(cx + 44, cy + 16, 20, 12);
  g.lineStyle(7, INK);
  const eye = (x: number, y: number, rr: number, px = 0, py = 0) => {
    g.fillStyle(0xffffff); g.fillEllipse(x, y, rr * 1.7, rr * 2.1); g.lineStyle(5, INK); g.strokeEllipse(x, y, rr * 1.7, rr * 2.1);
    g.fillStyle(INK); g.fillCircle(x + px, y + py + 2, rr * 0.62);
    g.fillStyle(0xffffff); g.fillCircle(x + px + rr * 0.25, y + py - rr * 0.2, rr * 0.22);
  };
  if (f === 'normal') {
    eye(cx - 24, cy - 14, 14); eye(cx + 24, cy - 14, 14);
    g.lineStyle(6, INK); g.beginPath(); g.arc(cx, cy + 12, 14, 0.25, Math.PI - 0.25); g.strokePath();
  } else if (f === 'happy') {
    g.lineStyle(7, INK);
    for (const d of [-24, 24]) { g.beginPath(); g.arc(cx + d, cy - 8, 12, Math.PI + 0.25, -0.25); g.strokePath(); }
    g.fillStyle(INK); g.slice(cx, cy + 8, 22, 0, Math.PI, false); g.fillPath();
    g.fillStyle(0xff5d73); g.fillEllipse(cx, cy + 22, 22, 12);
  } else if (f === 'scared') {
    eye(cx - 24, cy - 16, 16, 0, -3); eye(cx + 24, cy - 16, 16, 0, -3);
    g.fillStyle(INK); g.fillEllipse(cx, cy + 22, 18, 22);
    g.fillStyle(0x6cc8ff); g.fillTriangle(cx + 58, cy - 46, cx + 50, cy - 28, cx + 66, cy - 28); g.fillCircle(cx + 58, cy - 26, 8);
  } else if (f === 'fire') {
    eye(cx - 24, cy - 12, 13, 2, 0); eye(cx + 24, cy - 12, 13, -2, 0);
    g.lineStyle(7, INK); g.lineBetween(cx - 42, cy - 40, cx - 12, cy - 30); g.lineBetween(cx + 42, cy - 40, cx + 12, cy - 30);
    g.fillStyle(INK); g.slice(cx, cy + 10, 20, 0, Math.PI, false); g.fillPath();
    g.fillStyle(0xffffff); g.fillRect(cx - 16, cy + 10, 32, 6);
  } else {
    g.lineStyle(7, INK);
    for (const d of [-24, 24]) { g.lineBetween(cx + d - 10, cy - 24, cx + d + 10, cy - 4); g.lineBetween(cx + d + 10, cy - 24, cx + d - 10, cy - 4); }
    g.beginPath();
    g.strokePoints([0, 1, 2, 3, 4, 5, 6].map((i) => new Phaser.Math.Vector2(cx - 18 + i * 6, cy + 20 + (i % 2 ? -5 : 5))), false, false);
  }
}

/** Mitad de atrás o de delante del aro (elipse 200×~30, centro (100, 18)). */
export function drawRim(g: G, part: 'back' | 'front') {
  const a0 = part === 'back' ? Math.PI : 0, a1 = part === 'back' ? Math.PI * 2 : Math.PI;
  const pts = ellipseArc(100, 18, 92, 12, a0, a1);
  g.lineStyle(16, INK); g.strokePoints(pts, false, false);
  g.lineStyle(9, part === 'back' ? 0xd63c3c : 0xff4f4f); g.strokePoints(pts, false, false);
  if (part === 'front') { g.lineStyle(3, 0xffffff, 0.5); g.strokePoints(ellipseArc(100, 16, 88, 11, 0.5, Math.PI - 0.5), false, false); }
}

/** Red colgando del aro: arriba de 12 a 188 (y = 22), abajo de 52 a 148 (y = 122). */
export function drawNet(g: G, id: string) {
  const top = 22, bot = 122, n = 7;
  const col = (i: number) => id === 'rainbow' ? [0xff5d5d, 0xff9f43, 0xffd23f, 0x3ddc84, 0x4aa8ff, 0x9b6bff, 0xff6fae, 0xff5d5d][i % 8]
    : ({ white: 0xffffff, red: 0xff5d5d, neon: 0x3dffb0, gold: 0xffd23f } as Record<string, number>)[id] ?? 0xffffff;
  const at = (t: number, y: number) => { const k = (y - top) / (bot - top); const l = 12 + 40 * k, r = 188 - 40 * k; return l + (r - l) * t; };
  const lw = id === 'gold' ? 7 : 5;
  const strands: [number, number, number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    // diagonales cruzadas (rombos)
    const t0 = i / n, t1 = Math.min(1, (i + 1) / n), t2 = Math.max(0, (i - 1) / n);
    const ym = (top + bot) / 2;
    strands.push([at(t0, top), top, at(t1, ym), ym, i]);
    strands.push([at(t1, ym), ym, at(t0, bot), bot, i]);
    strands.push([at(t0, top), top, at(t2, ym), ym, i + 3]);
    strands.push([at(t2, ym), ym, at(t0, bot), bot, i + 3]);
  }
  g.lineStyle(lw + 4, INK, id === 'neon' ? 0.6 : 0.85);
  for (const [x1, y1, x2, y2] of strands) g.lineBetween(x1, y1, x2, y2);
  for (const [x1, y1, x2, y2, i] of strands) { g.lineStyle(lw, col(i)); g.lineBetween(x1, y1, x2, y2); }
  g.lineStyle(lw + 4, INK); g.lineBetween(at(0, bot), bot, at(1, bot), bot);
  g.lineStyle(lw, col(2)); g.lineBetween(at(0, bot), bot, at(1, bot), bot);
}

/* ---------------------------------------------------------------- pista (fondo) */

export type View = { x0: number; y0: number; w: number; h: number; k: number; worldW: number };
export const FLOOR_Y = 1080;

const THEMES: Record<Floor, { top: number; bot: number; floor: number; floor2: number; line: number }> = {
  gym: { top: 0xfff1d6, bot: 0xffe0b0, floor: 0xf2b866, floor2: 0xe0a04e, line: 0xffffff },
  street: { top: 0x6cc8ff, bot: 0xbfe9ff, floor: 0x3aa6a0, floor2: 0x2f8f8a, line: 0xffd23f },
  beach: { top: 0x5fc4ff, bot: 0xfff0c2, floor: 0xf6d58e, floor2: 0xe9c274, line: 0xffffff },
  space: { top: 0x1b1840, bot: 0x4b2a7a, floor: 0x3b3570, floor2: 0x2e2860, line: 0x3dffb0 },
};

/**
 * Fondo de la pista en el rectángulo visible del mundo (x0, y0, w, h) a escala k (píxeles por unidad).
 * Paredes acolchadas fuera de 0..worldW y suelo desde FLOOR_Y. Todo horneado una vez.
 */
export function drawCourt(g: G, id: Floor, v: View) {
  const t = THEMES[id];
  const X = (x: number) => (x - v.x0) * v.k, Y = (y: number) => (y - v.y0) * v.k;
  const W = v.w * v.k, H = v.h * v.k;
  // degradado en bandas (generateTexture usa Canvas, que no pinta fillGradientStyle)
  const top = v.y0 < 0 ? Y(0) : 0, n = 28, bandH = (Y(FLOOR_Y) - top) / n;
  g.fillStyle(t.top); g.fillRect(0, 0, W, top + 1);
  for (let i = 0; i < n; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(t.top), Phaser.Display.Color.ValueToColor(t.bot), n - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(0, top + i * bandH, W, bandH + 1);
  }
  const rnd = new Phaser.Math.RandomDataGenerator(['court' + id]);
  if (id === 'gym') {
    // paneles de pared y banderines
    g.fillStyle(0xffe6c2);
    for (let x = -400; x < v.worldW + 400; x += 160) g.fillRect(X(x), Y(FLOOR_Y - 330), 150 * v.k, 300 * v.k);
    g.fillStyle(0xbfe6ff); for (let x = 40; x < v.worldW; x += 260) g.fillRoundedRect(X(x), Y(140), 170 * v.k, 120 * v.k, 12 * v.k);
    g.lineStyle(6 * v.k, 0xffffff); for (let x = 40; x < v.worldW; x += 260) { g.lineBetween(X(x + 85), Y(140), X(x + 85), Y(260)); g.lineBetween(X(x), Y(200), X(x + 170), Y(200)); }
    const cols = [0xff5d5d, 0xffd23f, 0x3ddc84, 0x4aa8ff, 0x9b6bff];
    for (let x = -300, i = 0; x < v.worldW + 300; x += 60, i++) { g.fillStyle(cols[i % 5]); g.fillTriangle(X(x), Y(330), X(x + 50), Y(330), X(x + 25), Y(380)); }
    g.lineStyle(4 * v.k, 0x8a6a4a); g.lineBetween(X(-300), Y(330), X(v.worldW + 300), Y(330));
  } else if (id === 'street') {
    g.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 6; i++) { const x = rnd.between(-200, v.worldW + 200), y = rnd.between(80, 520); g.fillEllipse(X(x), Y(y), 200 * v.k, 60 * v.k); g.fillEllipse(X(x + 50), Y(y - 24), 120 * v.k, 70 * v.k); }
    g.fillStyle(0x9fd3f0);
    for (let x = -500; x < v.worldW + 500; x += 90) { const hh = rnd.between(160, 380); g.fillRect(X(x), Y(FLOOR_Y - 120 - hh), 80 * v.k, (hh + 120) * v.k); }
    g.fillStyle(0x5cc24a); for (let x = -500; x < v.worldW + 500; x += 70) g.fillCircle(X(x), Y(FLOOR_Y - 110), 70 * v.k);
    // valla de malla (rombos)
    g.lineStyle(3 * v.k, 0x2f8f8a, 0.55);
    for (let x = -700; x < v.worldW + 700; x += 40) { g.lineBetween(X(x), Y(FLOOR_Y - 150), X(x + 150), Y(FLOOR_Y)); g.lineBetween(X(x), Y(FLOOR_Y - 150), X(x - 150), Y(FLOOR_Y)); }
    g.lineStyle(5 * v.k, 0x2f8f8a); for (let x = -500; x < v.worldW + 500; x += 200) g.lineBetween(X(x), Y(FLOOR_Y - 150), X(x), Y(FLOOR_Y));
    g.lineStyle(6 * v.k, 0x2f8f8a); g.lineBetween(X(-500), Y(FLOOR_Y - 150), X(v.worldW + 500), Y(FLOOR_Y - 150));
  } else if (id === 'beach') {
    g.fillStyle(0xfff3a0); g.fillCircle(X(v.worldW * 0.78), Y(200), 90 * v.k);
    g.fillStyle(0xffffff, 0.9); for (let i = 0; i < 4; i++) { const x = rnd.between(-200, v.worldW + 200), y = rnd.between(80, 400); g.fillEllipse(X(x), Y(y), 180 * v.k, 50 * v.k); }
    g.fillStyle(0x2fb5e0); g.fillRect(0, Y(FLOOR_Y - 220), W, 220 * v.k);
    g.fillStyle(0x7fd8f5); for (let x = -500; x < v.worldW + 500; x += 80) g.fillEllipse(X(x), Y(FLOOR_Y - 220), 70 * v.k, 18 * v.k);
    for (const px of [-120, v.worldW + 120]) {
      g.fillStyle(0x9a6a3a); g.fillRect(X(px - 12), Y(FLOOR_Y - 520), 24 * v.k, 520 * v.k);
      g.fillStyle(0x3ddc84); for (let a = 0; a < 5; a++) g.fillEllipse(X(px + Math.cos(a * 1.3) * 80), Y(FLOOR_Y - 530 + Math.sin(a * 1.3) * 30), 170 * v.k, 40 * v.k);
    }
  } else {
    for (let i = 0; i < 160; i++) {
      g.fillStyle(0xffffff, rnd.realInRange(0.3, 1));
      g.fillCircle(rnd.realInRange(0, W), rnd.realInRange(0, Y(FLOOR_Y)), rnd.realInRange(1, 3.2) * Math.max(0.6, v.k));
    }
    g.fillStyle(0xff9ec7); g.fillCircle(X(v.worldW * 0.18), Y(220), 70 * v.k);
    g.fillStyle(0xffd23f); g.fillCircle(X(v.worldW * 0.86), Y(560), 40 * v.k);
    g.lineStyle(8 * v.k, 0xffb14a); g.strokeEllipse(X(v.worldW * 0.86), Y(560), 130 * v.k, 30 * v.k);
  }
  // gradas con público fuera de la pista (se ven en pantallas anchas); la pelota rebota en su borde
  const HEADS = [0xffd2a8, 0xe0a070, 0x9a6440, 0xffe0c4, 0xc78a5a];
  const SHIRTS = [0xff5d5d, 0xffd23f, 0x3ddc84, 0x9b6bff, 0xff9f43, 0xffffff, 0xff6fae];
  for (const [a, b] of [[v.x0 - 10, 0], [v.worldW, v.x0 + v.w + 10]]) {
    if (b <= a) continue;
    g.fillStyle(id === 'space' ? 0x2a2560 : 0x3f8fe0); g.fillRect(X(a), 0, (b - a) * v.k, Y(FLOOR_Y));
    for (let y = FLOOR_Y - 20, row = 0; y > v.y0 - 100; y -= 96, row++) {
      g.fillStyle(id === 'space' ? 0x3b3570 : 0x2f6fd0); g.fillRect(X(a), Y(y), (b - a) * v.k, 22 * v.k);
      for (let x = a + 18 + (row % 2) * 22; x < b - 10; x += 44) {
        if (rnd.frac() < 0.18) continue;
        const hy = y - 40 - rnd.between(0, 8);
        g.fillStyle(rnd.pick(SHIRTS)); g.fillRoundedRect(X(x - 17), Y(hy + 14), 34 * v.k, 30 * v.k, 10 * v.k);
        g.fillStyle(rnd.pick(HEADS)); g.fillCircle(X(x), Y(hy), 14 * v.k);
        if (rnd.frac() < 0.15) { g.lineStyle(6 * v.k, rnd.pick(HEADS)); g.lineBetween(X(x + 14), Y(hy + 18), X(x + 22), Y(hy - 20)); }
      }
    }
  }
  g.lineStyle(10 * v.k, INK); g.lineBetween(X(0), 0, X(0), Y(FLOOR_Y)); g.lineBetween(X(v.worldW), 0, X(v.worldW), Y(FLOOR_Y));
  // suelo con tablas en perspectiva
  g.fillStyle(t.floor); g.fillRect(0, Y(FLOOR_Y), W, H - Y(FLOOR_Y) + 2);
  g.fillStyle(t.floor2);
  for (let y = FLOOR_Y + 30, s = 30; y < v.y0 + v.h; y += s, s *= 1.35) g.fillRect(0, Y(y), W, 6 * v.k);
  g.lineStyle(8 * v.k, t.line);
  g.lineBetween(0, Y(FLOOR_Y + 20), W, Y(FLOOR_Y + 20));
  g.strokeEllipse(X(v.worldW / 2), Y(FLOOR_Y + 70), 360 * v.k, 70 * v.k);
  g.lineStyle(10 * v.k, INK); g.lineBetween(0, Y(FLOOR_Y), W, Y(FLOOR_Y));
}
