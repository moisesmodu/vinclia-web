import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;

/** Colores de pintura (cuerpo del pintor, estela y territorio). */
export const COLORS: Record<string, number> = {
  pink: 0xff5fa8, blue: 0x4aa8ff, green: 0x3ddc84, yellow: 0xffc928,
  purple: 0x9b6bff, orange: 0xff8a3d, red: 0xff4f5e, teal: 0x22cfc0,
};
export const COLOR_KEYS = Object.keys(COLORS);

type Acc = '' | 'sprout' | 'bow' | 'propeller' | 'cat' | 'crown';
/** Pintores de la tienda: color + complemento. */
const SKINS: Record<string, { color: string; acc: Acc }> = {
  pink: { color: 'pink', acc: '' },
  blue: { color: 'blue', acc: '' },
  green: { color: 'green', acc: 'sprout' },
  purple: { color: 'purple', acc: 'bow' },
  orange: { color: 'orange', acc: 'propeller' },
  cat: { color: 'teal', acc: 'cat' },
  king: { color: 'yellow', acc: 'crown' },
};

/** Tienda: pintores y dibujos de estela. Precios en gotas de pintura. */
export const ITEMS: ShopItem[] = [
  { id: 'pink', slot: 'skin', price: 0, icon: 'skin-pink' },
  { id: 'blue', slot: 'skin', price: 30, icon: 'skin-blue' },
  { id: 'green', slot: 'skin', price: 60, icon: 'skin-green' },
  { id: 'purple', slot: 'skin', price: 100, icon: 'skin-purple' },
  { id: 'orange', slot: 'skin', price: 150, icon: 'skin-orange' },
  { id: 'cat', slot: 'skin', price: 220, icon: 'skin-cat' },
  { id: 'king', slot: 'skin', price: 350, icon: 'skin-king' },
  { id: 'plain', slot: 'trail', price: 0, icon: 'tr-plain', bg: 0xb9c0cf },
  { id: 'stars', slot: 'trail', price: 80, icon: 'tr-stars', bg: 0xb9c0cf },
  { id: 'chalk', slot: 'trail', price: 120, icon: 'tr-chalk', bg: 0xb9c0cf },
  { id: 'rainbow', slot: 'trail', price: 250, icon: 'tr-rainbow', bg: 0xb9c0cf },
];
export const DEFAULTS = { skin: 'pink', trail: 'plain' };
/** Recompensa diaria (gotas) del día 1 al 7. */
export const DAILY = [10, 15, 20, 25, 30, 40, 60];

export const skinId = () => equippedId(save, 'skin', DEFAULTS.skin, ITEMS);
export const trailId = () => equippedId(save, 'trail', DEFAULTS.trail, ITEMS);
export const skinColor = () => SKINS[skinId()]?.color ?? 'pink';
export const RAINBOW = [0xff4f5e, 0xff8a3d, 0xffc928, 0x3ddc84, 0x4aa8ff, 0x9b6bff];

function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

const shade = (c: number, k: number) => {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k)));
  return (f(r) << 16) | (f(g) << 8) | f(b);
};
export { shade };

/** Pintor (cuerpo de gota redonda con pies), 96×96, centro del cuerpo en (48, 52). La cara va aparte (mira hacia donde va). */
function drawBody(g: Phaser.GameObjects.Graphics, color: number, acc: Acc) {
  const cx = 48, cy = 54, r = 30;
  const dark = shade(color, 0.72);
  g.lineStyle(5, INK);
  // pies
  g.fillStyle(dark);
  g.fillEllipse(cx - 13, cy + r - 2, 18, 12); g.strokeEllipse(cx - 13, cy + r - 2, 18, 12);
  g.fillEllipse(cx + 13, cy + r - 2, 18, 12); g.strokeEllipse(cx + 13, cy + r - 2, 18, 12);
  // complementos detrás de la cabeza
  if (acc === 'cat') {
    g.fillStyle(color);
    g.fillTriangle(cx - 26, cy - 12, cx - 22, cy - 40, cx - 6, cy - 26); g.strokeTriangle(cx - 26, cy - 12, cx - 22, cy - 40, cx - 6, cy - 26);
    g.fillTriangle(cx + 26, cy - 12, cx + 22, cy - 40, cx + 6, cy - 26); g.strokeTriangle(cx + 26, cy - 12, cx + 22, cy - 40, cx + 6, cy - 26);
    g.fillStyle(0xffa3c8); g.fillTriangle(cx - 21, cy - 20, cx - 20, cy - 33, cx - 11, cy - 25); g.fillTriangle(cx + 21, cy - 20, cx + 20, cy - 33, cx + 11, cy - 25);
  }
  // cuerpo
  g.fillStyle(color); g.fillCircle(cx, cy, r);
  g.fillStyle(dark, 0.35); g.fillEllipse(cx + 4, cy + 14, 46, 22);
  g.fillStyle(color); g.fillEllipse(cx - 2, cy + 4, 50, 40);
  g.lineStyle(5, INK); g.strokeCircle(cx, cy, r);
  // brillo
  g.fillStyle(0xffffff, 0.7); g.fillEllipse(cx - 14, cy - 16, 14, 9);
  g.fillStyle(0xffffff, 0.9); g.fillCircle(cx + 12, cy - 21, 3);
  if (acc === 'crown') {
    const pts = [[-16, -22], [-16, -40], [-8, -31], [0, -46], [8, -31], [16, -40], [16, -22]].map(([x, y]) => new Phaser.Math.Vector2(cx + x, cy + y));
    g.fillStyle(0xffd23f); g.fillPoints(pts, true); g.lineStyle(4, INK); g.strokePoints(pts, true, true);
    g.fillStyle(0xff4f5e); g.fillCircle(cx, cy - 28, 3.5);
  } else if (acc === 'propeller') {
    g.fillStyle(0x4aa8ff); g.fillEllipse(cx, cy - 26, 34, 18); g.lineStyle(4, INK); g.strokeEllipse(cx, cy - 26, 34, 18);
    g.fillStyle(0xffd23f); g.fillRect(cx - 2, cy - 44, 4, 12);
    g.fillEllipse(cx - 10, cy - 44, 20, 7); g.fillEllipse(cx + 10, cy - 44, 20, 7);
    g.lineStyle(3, INK); g.strokeEllipse(cx - 10, cy - 44, 20, 7); g.strokeEllipse(cx + 10, cy - 44, 20, 7);
  } else if (acc === 'bow') {
    g.fillStyle(0xff5fa8); g.lineStyle(4, INK);
    g.fillTriangle(cx + 6, cy - 26, cx + 26, cy - 38, cx + 24, cy - 16); g.strokeTriangle(cx + 6, cy - 26, cx + 26, cy - 38, cx + 24, cy - 16);
    g.fillTriangle(cx + 6, cy - 26, cx - 12, cy - 40, cx - 10, cy - 18); g.strokeTriangle(cx + 6, cy - 26, cx - 12, cy - 40, cx - 10, cy - 18);
    g.fillCircle(cx + 6, cy - 27, 6); g.strokeCircle(cx + 6, cy - 27, 6);
  } else if (acc === 'sprout') {
    g.lineStyle(4, INK); g.lineBetween(cx, cy - 29, cx, cy - 40);
    g.fillStyle(0x7be36a);
    g.fillEllipse(cx - 9, cy - 42, 18, 10); g.strokeEllipse(cx - 9, cy - 42, 18, 10);
    g.fillEllipse(cx + 9, cy - 44, 18, 10); g.strokeEllipse(cx + 9, cy - 44, 18, 10);
  }
}

/** Cara: ojos grandes con brillo, mofletes y boca abierta (contenta, sorprendida o triste). 64×40, centro (32, 20). */
function drawFace(g: Phaser.GameObjects.Graphics, mood: 'happy' | 'wow' | 'sad') {
  const cx = 32, cy = 18;
  for (const s of [-1, 1]) {
    const ex = cx + s * 11;
    g.fillStyle(0xffffff); g.fillEllipse(ex, cy, 15, 18); g.lineStyle(3, INK); g.strokeEllipse(ex, cy, 15, 18);
    g.fillStyle(INK); g.fillCircle(ex + 1, cy + 2, 5.2);
    g.fillStyle(0xffffff); g.fillCircle(ex + 3, cy - 1, 2);
    g.fillStyle(0xff7aa8, 0.75); g.fillEllipse(cx + s * 21, cy + 12, 9, 6);
  }
  g.fillStyle(0x7a1f3d); g.lineStyle(2.5, INK);
  if (mood === 'happy') {
    g.beginPath(); g.arc(cx, cy + 12, 6, 0.1, Math.PI - 0.1); g.closePath(); g.fillPath(); g.strokePath();
  } else if (mood === 'wow') {
    g.fillEllipse(cx, cy + 15, 7, 9); g.strokeEllipse(cx, cy + 15, 7, 9);
  } else {
    g.beginPath(); g.arc(cx, cy + 19, 5, Math.PI + 0.3, -0.3); g.strokePath();
  }
}

/** Muestra de estela para la tienda (160×100) con el mismo dibujo que en el juego. */
function drawTrailSample(g: Phaser.GameObjects.Graphics, kind: string) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 16; i++) { const x = 14 + i * 8.25; pts.push([x, 52 + Math.sin(i * 0.55) * 24]); }
  const base = COLORS.pink;
  g.lineStyle(26, INK);
  for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  g.fillStyle(INK); for (const [x, y] of pts) g.fillCircle(x, y, 13);
  for (let i = 1; i < pts.length; i++) {
    const c = kind === 'rainbow' ? RAINBOW[i % RAINBOW.length] : base;
    g.lineStyle(17, c); g.lineBetween(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    g.fillStyle(c); g.fillCircle(pts[i][0], pts[i][1], 8.5);
  }
  g.fillStyle(base); g.fillCircle(pts[0][0], pts[0][1], 8.5);
  if (kind === 'stars') for (let i = 1; i < pts.length; i += 3) starShape(g, pts[i][0], pts[i][1], 8, 0xfff27a);
  if (kind === 'chalk') { g.lineStyle(5, 0xffffff, 0.9); for (let i = 1; i < pts.length; i += 2) g.lineBetween(pts[i - 1][0], pts[i - 1][1] - 2, pts[i][0], pts[i][1] - 2); }
}

export function starShape(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45, a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
  }
  g.fillStyle(color); g.fillPoints(pts, true);
}

/** Todas las texturas de pintores, caras, estelas de muestra e iconos propios del juego. */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [k, c] of Object.entries(COLORS)) tex(scene, `pb-${k}`, 96, 96, (g) => drawBody(g, c, ''));
  for (const [id, s] of Object.entries(SKINS)) tex(scene, `skin-${id}`, 96, 96, (g) => drawBody(g, COLORS[s.color], s.acc));
  for (const m of ['happy', 'wow', 'sad'] as const) tex(scene, `face-${m}`, 64, 40, (g) => drawFace(g, m));
  for (const k of ['plain', 'stars', 'chalk', 'rainbow']) tex(scene, `tr-${k}`, 160, 100, (g) => drawTrailSample(g, k));
  tex(scene, 'pshadow', 64, 24, (g) => { g.fillStyle(0x000000, 0.28); g.fillEllipse(32, 12, 60, 20); });
  // gota de pintura (la moneda del juego)
  tex(scene, 'ic-drop', 128, 128, (g) => {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      // gota: círculo abajo que se estira en punta arriba
      const r = 40, x = Math.sin(t) * r * (1 - 0.55 * Math.max(0, Math.cos(t)) ** 2), y = -Math.cos(t) * r * (Math.cos(t) > 0 ? 1.45 : 1);
      pts.push(new Phaser.Math.Vector2(64 + x, 74 + y));
    }
    g.fillStyle(0xd93a85); g.fillPoints(pts.map((p) => new Phaser.Math.Vector2(p.x, p.y + 5)), true);
    g.fillStyle(0xff5fa8); g.fillPoints(pts, true);
    g.lineStyle(7, INK); g.strokePoints(pts, true, true);
    g.fillStyle(0xffffff, 0.75); g.fillEllipse(48, 78, 14, 22);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(52, 98, 4);
  });
  // medalla del puesto (sin número: el número va encima)
  tex(scene, 'ic-medal', 128, 128, (g) => {
    g.fillStyle(0x4aa8ff); g.fillTriangle(34, 6, 58, 6, 70, 58); g.fillStyle(0xff4f5e); g.fillTriangle(94, 6, 70, 6, 58, 58);
    g.lineStyle(5, INK); g.strokeTriangle(34, 6, 58, 6, 70, 58); g.strokeTriangle(94, 6, 70, 6, 58, 58);
    g.fillStyle(0xc98a00); g.fillCircle(64, 82, 40); g.fillStyle(0xffd23f); g.fillCircle(64, 79, 37);
    g.lineStyle(6, INK); g.strokeCircle(64, 81, 40);
    g.fillStyle(0xffffff, 0.5); g.fillEllipse(48, 62, 16, 9);
  });
  // reloj de la ronda
  tex(scene, 'ic-clock', 128, 128, (g) => {
    g.fillStyle(0xffffff); g.fillCircle(64, 66, 50); g.lineStyle(9, INK); g.strokeCircle(64, 66, 50);
    g.fillStyle(0xff4f5e); g.fillRoundedRect(50, 4, 28, 14, 5); g.lineStyle(5, INK); g.strokeRoundedRect(50, 4, 28, 14, 5);
    g.lineStyle(9, INK); g.lineBetween(64, 66, 64, 34); g.lineBetween(64, 66, 86, 76);
    g.fillStyle(INK); g.fillCircle(64, 66, 8);
  });
  // banderín de ronda
  tex(scene, 'ic-flag', 128, 128, (g) => {
    g.fillStyle(INK); g.fillRoundedRect(22, 8, 12, 114, 5);
    g.fillStyle(0x3ddc84); g.fillTriangle(34, 14, 112, 40, 34, 70);
    g.lineStyle(6, INK); g.strokeTriangle(34, 14, 112, 40, 34, 70);
    g.fillStyle(0xffffff, 0.5); g.fillTriangle(40, 24, 70, 34, 40, 42);
  });
  // mancha de pintura (eliminación)
  tex(scene, 'splat', 128, 128, (g) => {
    g.fillStyle(0xffffff);
    g.fillCircle(64, 64, 34);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 34 + (i % 3) * 8;
      g.fillCircle(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 8 + (i % 2) * 5);
      g.lineStyle(10, 0xffffff); g.lineBetween(64, 64, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d);
    }
  });
  tex(scene, 'trstar', 32, 32, (g) => starShape(g, 16, 17, 15, 0xfff27a));
  tex(scene, 'bush', 64, 48, (g) => {
    g.fillStyle(0x4fae47); g.fillCircle(18, 28, 15); g.fillCircle(34, 20, 18); g.fillCircle(48, 30, 13);
    g.fillStyle(0x6fd063); g.fillCircle(30, 16, 9); g.fillCircle(16, 24, 7);
  });
  // marcador del Hud y joystick flotante (horneados: nada de Graphics redibujados cada fotograma)
  tex(scene, 'board', 100, 112, (g) => { g.fillStyle(0x2b2340, 0.35); g.fillRoundedRect(0, 0, 100, 112, 14); });
  tex(scene, 'stick-ring', 132, 132, (g) => {
    g.fillStyle(0xffffff, 0.16); g.fillCircle(66, 66, 64); g.lineStyle(4, 0xffffff, 0.5); g.strokeCircle(66, 66, 63);
  });
  tex(scene, 'stick-knob', 48, 48, (g) => { g.fillStyle(0xffffff, 0.6); g.fillCircle(24, 24, 22); });
  tex(scene, 'dot', 16, 16, (g) => { g.fillStyle(0xffffff); g.fillCircle(8, 8, 8); });
}

/** Clave de textura del pintor del jugador. */
export const playerSkinKey = () => `skin-${skinId()}`;
