import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';
import { JELLY, RADII, TEX, TIERS } from './config';

const INK = PALETTE.ink;

/** Lighten (t > 0) or darken (t < 0) a 0xRRGGBB colour. */
export function shade(c: number, t: number) {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const f = (v: number) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t));
  return (f(r) << 16) | (f(g) << 8) | f(b);
}

/** Jelly palettes (one colour per tier, 9 tiers). */
const PALETTES: Record<string, number[]> = {
  candy: JELLY,
  pastel: [0xffb3d1, 0xffd0a8, 0xfff1a8, 0xc8f0a8, 0xa8f0e4, 0xb3d9ff, 0xd4c2ff, 0xffb3b3, 0xf0d0ff],
  ocean: [0x90e0ef, 0x48cae4, 0x00b4d8, 0x3fd8c4, 0x2ec4b6, 0x0096c7, 0x5e60ce, 0x0077b6, 0x7400b8],
  sunset: [0xffd166, 0xffb347, 0xff8c42, 0xff5e5b, 0xef476f, 0xf15bb5, 0xc06c84, 0x9b5de5, 0x6a4c93],
  neon: [0xff2e88, 0xff7a00, 0xfff200, 0x39ff14, 0x00f5d4, 0x00b3ff, 0xb026ff, 0xff3355, 0xff66ff],
};

/** Sky themes behind the jar: gradient top/bottom, hills, far hills, stars. */
export type Theme = { top: number; bottom: number; hill: number; far: number; stars: boolean; jar: number };
const THEMES: Record<string, Theme> = {
  'sky-day': { top: 0x6cc8ff, bottom: 0xd4f3ff, hill: 0x7fdc6a, far: 0xb6ecff, stars: false, jar: 0xeaf7ff },
  'sky-sunset': { top: 0xff8f6b, bottom: 0xffe0a8, hill: 0xf28fb0, far: 0xffc2a8, stars: false, jar: 0xfff1e6 },
  'sky-candy': { top: 0xff9fd8, bottom: 0xfff0fa, hill: 0xb08cff, far: 0xffd1ec, stars: false, jar: 0xfff4fb },
  'sky-night': { top: 0x1d1b5e, bottom: 0x5b4bb0, hill: 0x3b3a8a, far: 0x4a3f9e, stars: true, jar: 0xd8d4ff },
};

/** Shop of Jelly Merge: jelly palettes and sky themes, paid with coins. */
export const ITEMS: ShopItem[] = [
  { id: 'candy', slot: 'palette', price: 0, icon: 'pal-candy' },
  { id: 'pastel', slot: 'palette', price: 40, icon: 'pal-pastel' },
  { id: 'ocean', slot: 'palette', price: 80, icon: 'pal-ocean' },
  { id: 'sunset', slot: 'palette', price: 120, icon: 'pal-sunset' },
  { id: 'neon', slot: 'palette', price: 180, icon: 'pal-neon' },
  { id: 'sky-day', slot: 'sky', price: 0, icon: 'pv-sky-day' },
  { id: 'sky-sunset', slot: 'sky', price: 50, icon: 'pv-sky-sunset' },
  { id: 'sky-candy', slot: 'sky', price: 100, icon: 'pv-sky-candy' },
  { id: 'sky-night', slot: 'sky', price: 150, icon: 'pv-sky-night' },
];
export const DEFAULTS = { palette: 'candy', sky: 'sky-day' };
/** Daily gift (coins) for day 1..7. */
export const DAILY = [5, 8, 12, 15, 20, 25, 40];

export const palette = () => PALETTES[equippedId(save, 'palette', DEFAULTS.palette, ITEMS)] ?? JELLY;
export const theme = () => THEMES[equippedId(save, 'sky', DEFAULTS.sky, ITEMS)] ?? THEMES['sky-day'];

export type Mood = 'n' | 'b' | 'w';
export const MOODS: Mood[] = ['n', 'b', 'w'];
/** Texture key of a jelly. */
export const jellyKey = (tier: number, mood: Mood = 'n') => `j${tier}${mood}`;
/** Size of a jelly texture in pixels (drawn TEX times bigger than the world radius). */
export const texSize = (r: number) => Math.ceil(2 * (r + 6) * TEX);

/** Draws every jelly (9 tiers × 3 moods) with the equipped palette. */
export function applyJelly(scene: Phaser.Scene) {
  const cols = palette();
  for (let t = 0; t < TIERS; t++) {
    const r = RADII[t], S = texSize(r);
    for (const m of MOODS) redrawTexture(scene, jellyKey(t, m), S, S, (g) => drawJelly(g, S / 2, r * TEX, cols[t], t, m));
  }
}

/** Shop previews: five jellies of each palette, and a little landscape for each sky. */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, cols] of Object.entries(PALETTES)) {
    redrawTexture(scene, `pal-${id}`, 170, 120, (g) => {
      const xs = [22, 52, 86, 128], rs = [14, 18, 22, 30];
      // a little pile: three small on the left, a big one on the right
      for (let i = 0; i < 4; i++) drawJelly(g, xs[i], rs[i], cols[i * 2], i * 2, 'n', 120 - 8 - rs[i]);
      drawJelly(g, 70, 18, cols[7], 7, 'n', 46);
    });
  }
  for (const [id, th] of Object.entries(THEMES)) {
    redrawTexture(scene, `pv-${id}`, 170, 120, (g) => {
      g.fillGradientStyle(th.top, th.top, th.bottom, th.bottom, 1); g.fillRoundedRect(0, 0, 170, 120, 14);
      if (th.stars) { g.fillStyle(0xffffff, 0.9); for (let i = 0; i < 12; i++) g.fillCircle((i * 53) % 160 + 5, (i * 29) % 60 + 6, 1.8); }
      g.fillStyle(th.far); g.fillCircle(30, 140, 60); g.fillCircle(140, 150, 70);
      g.fillStyle(th.hill); g.fillCircle(85, 190, 100);
      // a tiny jar
      g.fillStyle(th.jar, 0.7); g.fillRoundedRect(62, 40, 46, 56, 10);
      g.lineStyle(4, INK); g.strokeRoundedRect(62, 40, 46, 56, 10);
      drawJelly(g, 77, 10, 0xff6fae, 0, 'n', 84); drawJelly(g, 95, 9, 0x4aa8ff, 1, 'n', 86); drawJelly(g, 85, 9, 0xffd23f, 2, 'n', 68);
      g.lineStyle(5, INK); g.strokeRoundedRect(2, 2, 166, 116, 14);
    });
  }
}

/**
 * One jelly blob: thick ink outline, darker belly, glossy highlight and a face that changes with the tier
 * (dots, sparkly eyes, cat mouth, tongue, star eyes, heart cheeks, crown...). mood: n normal, b blink, w worried.
 * cx/cy: centre; R: radius in texture pixels.
 */
export function drawJelly(g: Phaser.GameObjects.Graphics, cx: number, R: number, c: number, tier: number, mood: Mood, cy = cx) {
  const lw = Math.max(2.5, R * 0.1);
  g.fillStyle(INK); g.fillCircle(cx, cy, R);
  const r = R - lw;
  g.fillStyle(shade(c, -0.24)); g.fillCircle(cx, cy, r);
  g.fillStyle(c); g.fillEllipse(cx, cy - r * 0.09, r * 1.92, r * 1.8);
  g.fillStyle(shade(c, 0.3)); g.fillEllipse(cx - r * 0.1, cy - r * 0.42, r * 1.3, r * 0.75);
  g.fillStyle(c); g.fillEllipse(cx, cy - r * 0.2, r * 1.5, r * 0.9);
  g.fillStyle(0xffffff, 0.9); g.fillEllipse(cx - r * 0.42, cy - r * 0.5, r * 0.46, r * 0.24);
  g.fillStyle(0xffffff, 0.95); g.fillCircle(cx - r * 0.12, cy - r * 0.64, Math.max(1.2, r * 0.07));
  g.fillStyle(0xffffff, 0.35); g.fillCircle(cx + r * 0.58, cy + r * 0.4, Math.max(1, r * 0.08));
  drawFace(g, cx, cy, r, tier, mood);
}

function drawFace(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, tier: number, mood: Mood) {
  const ex = r * (tier < 2 ? 0.3 : 0.34), ey = cy - r * 0.02, e = Math.max(2, r * (tier === 0 ? 0.11 : 0.14));
  const lw = Math.max(1.6, r * 0.07);
  // cheeks
  g.fillStyle(tier === 7 ? 0xff2d6f : 0xff3d7f, tier === 7 ? 0.8 : 0.4);
  if (tier === 7) for (const s of [-1, 1]) heart(g, cx + s * r * 0.55, cy + r * 0.2, r * 0.16);
  else { g.fillEllipse(cx - r * 0.56, cy + r * 0.2, r * 0.3, r * 0.17); g.fillEllipse(cx + r * 0.56, cy + r * 0.2, r * 0.3, r * 0.17); }

  // eyes
  if (mood === 'b' || (tier === 3 && mood === 'n')) {
    // closed: happy arcs (tier 3 always smiles with its eyes)
    g.lineStyle(lw, INK);
    for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * ex, ey + e * 0.4, e * 0.8, Math.PI + 0.3, -0.3, false); g.strokePath(); }
  } else if (mood === 'w') {
    g.fillStyle(INK);
    for (const s of [-1, 1]) {
      g.fillCircle(cx + s * ex, ey, e * 0.8);
      g.lineStyle(lw * 0.9, INK); g.lineBetween(cx + s * ex - e, ey - e * 1.6 + (s < 0 ? e * 0.5 : 0), cx + s * ex + e, ey - e * 1.6 + (s > 0 ? e * 0.5 : 0));
    }
    g.fillStyle(0x7fd6ff, 0.9); g.fillEllipse(cx + ex + e * 1.4, ey - e * 0.6, e * 0.6, e); // sweat drop
  } else if (tier === 5) {
    // star eyes
    for (const s of [-1, 1]) { g.fillStyle(INK); star(g, cx + s * ex, ey, e * 1.35); g.fillStyle(0xffe066); star(g, cx + s * ex, ey, e * 0.8); }
  } else {
    for (const s of [-1, 1]) {
      g.fillStyle(INK); g.fillCircle(cx + s * ex, ey, e);
      if (tier > 0) { g.fillStyle(0xffffff); g.fillCircle(cx + s * ex + e * 0.35, ey - e * 0.35, e * 0.4); g.fillCircle(cx + s * ex - e * 0.3, ey + e * 0.38, e * 0.18); }
      if (tier === 7) { g.lineStyle(lw * 0.8, INK); g.lineBetween(cx + s * (ex + e * 0.7), ey - e * 0.7, cx + s * (ex + e * 1.4), ey - e * 1.2); }
    }
  }

  // mouth
  const my = cy + r * 0.24;
  g.lineStyle(lw, INK);
  if (mood === 'w') { g.fillStyle(INK); g.fillEllipse(cx, my + r * 0.04, r * 0.16, r * 0.2); }
  else if (tier === 0 || tier === 1) { g.beginPath(); g.arc(cx, my - r * 0.06, r * 0.13, 0.3, Math.PI - 0.3, false); g.strokePath(); }
  else if (tier === 4) {
    // cat mouth
    g.beginPath(); g.arc(cx - r * 0.08, my - r * 0.04, r * 0.08, 0.2, Math.PI, false); g.strokePath();
    g.beginPath(); g.arc(cx + r * 0.08, my - r * 0.04, r * 0.08, 0, Math.PI - 0.2, false); g.strokePath();
  } else if (tier === 3) {
    // tongue out
    g.fillStyle(INK); g.slice(cx, my - r * 0.06, r * 0.16, 0, Math.PI, false); g.fillPath();
    g.fillStyle(0xff6f8f); g.fillEllipse(cx + r * 0.03, my + r * 0.07, r * 0.14, r * 0.14);
  } else if (tier === 6) {
    // toothy grin
    g.fillStyle(INK); g.slice(cx, my - r * 0.08, r * 0.2, 0, Math.PI, false); g.fillPath();
    g.fillStyle(0xffffff); g.fillRect(cx - r * 0.12, my - r * 0.08, r * 0.24, r * 0.06);
  } else {
    g.fillStyle(INK); g.slice(cx, my - r * 0.07, r * 0.17, 0, Math.PI, false); g.fillPath();
    g.fillStyle(0xff6f8f); g.fillCircle(cx, my + r * 0.03, r * 0.07);
  }

  // crown on the biggest jelly
  if (tier === 8) {
    const w = r * 0.7, h = r * 0.34, by = cy - r * 0.72, x0 = cx - w / 2;
    const pts = [x0, by, x0, by - h, x0 + w * 0.25, by - h * 0.45, x0 + w * 0.5, by - h * 1.15, x0 + w * 0.75, by - h * 0.45, x0 + w, by - h, x0 + w, by];
    const v = [] as Phaser.Math.Vector2[];
    for (let i = 0; i < pts.length; i += 2) v.push(new Phaser.Math.Vector2(pts[i], pts[i + 1]));
    g.fillStyle(0xffd23f); g.fillPoints(v, true); g.lineStyle(lw * 0.9, INK); g.strokePoints(v, true, true);
    g.fillStyle(0xff4f7a); g.fillCircle(cx, by - h * 0.55, r * 0.05);
  }
}

function star(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
  const v: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + (i * Math.PI) / 5;
    v.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
  }
  g.fillPoints(v, true);
}

function heart(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number) {
  g.fillCircle(x - s * 0.5, y - s * 0.2, s * 0.55); g.fillCircle(x + s * 0.5, y - s * 0.2, s * 0.55);
  g.fillTriangle(x - s * 1.02, y - s * 0.05, x + s * 1.02, y - s * 0.05, x, y + s * 1.05);
}

/** The studio's cloud with a face (holder of the next jelly, and the big cloud that floats away). */
export function drawCloud(g: Phaser.GameObjects.Graphics, w: number, h: number, happy = true) {
  const lw = Math.max(3, h * 0.07);
  const blobs = [[0.26, 0.62, 0.22], [0.5, 0.45, 0.3], [0.74, 0.6, 0.22], [0.38, 0.7, 0.2], [0.62, 0.7, 0.2]];
  g.fillStyle(INK);
  for (const [x, y, r] of blobs) g.fillCircle(x * w, y * h, r * w + lw);
  g.fillRoundedRect(0.08 * w - lw, 0.55 * h - lw, 0.84 * w + 2 * lw, 0.36 * h + 2 * lw, 0.18 * h + lw);
  g.fillStyle(0xdcecff);
  for (const [x, y, r] of blobs) g.fillCircle(x * w, y * h, r * w);
  g.fillRoundedRect(0.08 * w, 0.55 * h, 0.84 * w, 0.36 * h, 0.18 * h);
  g.fillStyle(0xffffff);
  for (const [x, y, r] of blobs) g.fillCircle(x * w, y * h - r * w * 0.12, r * w * 0.88);
  const e = h * 0.06;
  g.fillStyle(INK); g.fillCircle(w * 0.42, h * 0.58, e); g.fillCircle(w * 0.58, h * 0.58, e);
  g.fillStyle(0xffffff); g.fillCircle(w * 0.42 + e * 0.35, h * 0.58 - e * 0.35, e * 0.4); g.fillCircle(w * 0.58 + e * 0.35, h * 0.58 - e * 0.35, e * 0.4);
  g.fillStyle(0xff7fa8, 0.5); g.fillEllipse(w * 0.33, h * 0.68, h * 0.14, h * 0.08); g.fillEllipse(w * 0.67, h * 0.68, h * 0.14, h * 0.08);
  g.lineStyle(lw * 0.8, INK); g.beginPath();
  if (happy) g.arc(w * 0.5, h * 0.64, h * 0.08, 0.3, Math.PI - 0.3, false); else g.arc(w * 0.5, h * 0.74, h * 0.06, Math.PI + 0.4, -0.4, false);
  g.strokePath();
}
