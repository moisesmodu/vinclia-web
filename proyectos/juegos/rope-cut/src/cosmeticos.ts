import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;

/** Candy skins: swirl colours [base, stripe] (the peppermint is the free one). */
const CANDIES: Record<string, { base: number; stripe: number; dots?: boolean }> = {
  mint: { base: 0xffffff, stripe: 0xff3b4f },
  lemon: { base: 0xfff3b0, stripe: 0xffb800 },
  berry: { base: 0xe9dcff, stripe: 0x8d4dff },
  sky: { base: 0xe2f4ff, stripe: 0x1f8fff },
  choco: { base: 0xa8693f, stripe: 0x6b3a1e, dots: true },
  rainbow: { base: 0xffffff, stripe: 0x000000 },
};
const HATS = ['party', 'cap', 'bow', 'chef', 'crown'] as const;

/** Rope Cut shop: candy skins and hats for the jelly monster. Paid with coins (earned by feeding the monster). */
export const ITEMS: ShopItem[] = [
  { id: 'mint', slot: 'candy', price: 0, icon: 'candy-pv-mint' },
  { id: 'lemon', slot: 'candy', price: 15, icon: 'candy-pv-lemon' },
  { id: 'berry', slot: 'candy', price: 30, icon: 'candy-pv-berry' },
  { id: 'sky', slot: 'candy', price: 45, icon: 'candy-pv-sky' },
  { id: 'choco', slot: 'candy', price: 70, icon: 'candy-pv-choco' },
  { id: 'rainbow', slot: 'candy', price: 100, icon: 'candy-pv-rainbow' },
  { id: 'party', slot: 'hat', price: 20, icon: 'hat-pv-party', bg: 0xe9fbe0 },
  { id: 'cap', slot: 'hat', price: 35, icon: 'hat-pv-cap', bg: 0xe9fbe0 },
  { id: 'bow', slot: 'hat', price: 50, icon: 'hat-pv-bow', bg: 0xe9fbe0 },
  { id: 'chef', slot: 'hat', price: 80, icon: 'hat-pv-chef', bg: 0xe9fbe0 },
  { id: 'crown', slot: 'hat', price: 120, icon: 'hat-pv-crown', bg: 0xe9fbe0 },
];
export const DEFAULTS = { candy: 'mint', hat: '' };
/** Daily reward (coins), day 1 to 7. */
export const DAILY = [3, 5, 8, 10, 12, 15, 25];
/** Coins for feeding the monster: 1 plus 2 per star (1..7). */
export const coinsFor = (stars: number) => 1 + stars * 2;

/** Texture of the equipped hat ('' = none). */
export const hatKey = () => { const h = equippedId(save, 'hat', DEFAULTS.hat, ITEMS); return h ? `hat-${h}` : ''; };
/** Crumb colours of the equipped candy (for the splash when it breaks or is eaten). */
export const candyTint = () => {
  const c = CANDIES[equippedId(save, 'candy', DEFAULTS.candy, ITEMS)] ?? CANDIES.mint;
  return c.stripe ? [c.base, c.stripe, 0xffffff] : [0xff3b4f, 0xffd23f, 0x3ddc97, 0x4aa8ff];
};

/* ------------------------------------------------------------------ textures (baked once) */

export const CANDY = 64;   // candy texture size (radius 22 in the world + outline + margin)
export const MON = { w: 180, h: 176, mx: 90, my: 108 };   // monster texture and where its mouth is

/** Shop previews and hats (once, in Boot). */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const id of Object.keys(CANDIES)) {
    const key = `candy-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, CANDY, CANDY, (g) => drawCandy(g, id));
  }
  for (const id of HATS) {
    if (!scene.textures.exists(`hat-${id}`)) redrawTexture(scene, `hat-${id}`, 100, 80, (g) => drawHat(g, id, 50, 74));
    const key = `hat-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, MON.w, MON.h + 30, (g) => { g.translateCanvas(0, 30); drawMonster(g, 'idle'); drawHat(g, id, MON.w / 2, 40); });
  }
}

/** Redraws the in-game candy with the equipped skin. */
export function applyCandy(scene: Phaser.Scene) {
  redrawTexture(scene, 'candy', CANDY, CANDY, (g) => drawCandy(g, equippedId(save, 'candy', DEFAULTS.candy, ITEMS)));
}

/** Round wrapped-less candy with a swirl: 64×64, radius 24. */
function drawCandy(g: G, id: string) {
  const c = CANDIES[id] ?? CANDIES.mint, cx = CANDY / 2, cy = CANDY / 2, r = 25;
  g.fillStyle(0x000000, 0.18); g.fillCircle(cx, cy + 3, r);
  g.fillStyle(c.base); g.fillCircle(cx, cy, r);
  const rainbow = [0xff3b4f, 0xffb800, 0x3ddc84, 0x1f8fff, 0x8d4dff, 0xff6fae];
  // six curved wedges (a pinwheel swirl)
  for (let i = 0; i < 6; i++) {
    if (id === 'choco') break;
    const a0 = (i / 6) * Math.PI * 2;
    g.fillStyle(id === 'rainbow' ? rainbow[i] : c.stripe);
    const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(cx, cy)];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8, a = a0 + u * 0.55 + u * u * 0.5, rr = r * (0.15 + 0.85 * u);
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr));
    }
    for (let k = 8; k >= 0; k--) {
      const u = k / 8, a = a0 + 0.42 + u * 0.55 + u * u * 0.5, rr = r * (0.15 + 0.85 * u);
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr));
    }
    g.fillPoints(pts, true);
  }
  if (c.dots) {
    g.fillStyle(c.stripe); g.fillCircle(cx, cy, r * 0.62);
    g.fillStyle(0xff8fc8); for (let i = 0; i < 7; i++) { const a = i * 0.9; g.fillRoundedRect(cx + Math.cos(a) * r * 0.75 - 3, cy + Math.sin(a) * r * 0.75 - 1.5, 6, 3, 1.5); }
    g.fillStyle(0xffd23f); for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4; g.fillCircle(cx + Math.cos(a) * r * 0.32, cy + Math.sin(a) * r * 0.32, 2); }
  }
  g.fillStyle(0xffffff, 0.75); g.fillEllipse(cx - 9, cy - 11, 12, 7);
  g.lineStyle(4, INK); g.strokeCircle(cx, cy, r);
}

/** Hats sit on the monster's head: (x, y) is the middle of the brim. */
function drawHat(g: G, id: string, x: number, y: number) {
  g.lineStyle(3.5, INK);
  if (id === 'party') {
    g.fillStyle(0xff6fae); g.fillTriangle(x - 26, y, x + 26, y, x, y - 58); g.strokeTriangle(x - 26, y, x + 26, y, x, y - 58);
    g.fillStyle(0xffd23f); g.fillCircle(x - 6, y - 18, 5); g.fillCircle(x + 8, y - 34, 4); g.fillCircle(x + 10, y - 10, 4);
    g.fillStyle(0x4aa8ff); g.fillCircle(x, y - 60, 8); g.strokeCircle(x, y - 60, 8);
  } else if (id === 'cap') {
    // propeller cap
    g.fillStyle(0x4aa8ff); g.slice(x, y, 30, Math.PI, 0, false); g.fillPath();
    g.fillStyle(0xff5d5d); g.slice(x, y, 30, Math.PI * 1.33, Math.PI * 1.67, false); g.fillPath();
    g.beginPath(); g.arc(x, y, 30, Math.PI, 0); g.closePath(); g.strokePath();
    g.fillStyle(0xffd23f); g.fillRect(x - 2, y - 44, 4, 14);
    g.fillEllipse(x - 14, y - 46, 26, 9); g.fillEllipse(x + 14, y - 46, 26, 9);
    g.strokeEllipse(x - 14, y - 46, 26, 9); g.strokeEllipse(x + 14, y - 46, 26, 9);
  } else if (id === 'bow') {
    g.fillStyle(0xff4f7a);
    g.fillTriangle(x, y - 14, x - 30, y - 32, x - 30, y + 4); g.strokeTriangle(x, y - 14, x - 30, y - 32, x - 30, y + 4);
    g.fillTriangle(x, y - 14, x + 30, y - 32, x + 30, y + 4); g.strokeTriangle(x, y - 14, x + 30, y - 32, x + 30, y + 4);
    g.fillCircle(x, y - 14, 9); g.strokeCircle(x, y - 14, 9);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(x - 18, y - 20, 3); g.fillCircle(x + 18, y - 20, 3);
  } else if (id === 'chef') {
    g.fillStyle(0xffffff);
    g.fillRect(x - 22, y - 22, 44, 22); g.strokeRect(x - 22, y - 22, 44, 22);
    g.fillCircle(x - 16, y - 34, 15); g.fillCircle(x + 16, y - 34, 15); g.fillCircle(x, y - 44, 18);
    g.strokeCircle(x - 16, y - 34, 15); g.strokeCircle(x + 16, y - 34, 15); g.strokeCircle(x, y - 44, 18);
    g.fillCircle(x - 16, y - 34, 13); g.fillCircle(x + 16, y - 34, 13); g.fillCircle(x, y - 44, 16); g.fillRect(x - 20, y - 30, 40, 10);
  } else {
    // crown
    const pts = [[-30, 0], [-30, -30], [-16, -16], [0, -40], [16, -16], [30, -30], [30, 0]].map(([a, b]) => new Phaser.Math.Vector2(x + a, y + b));
    g.fillStyle(0xffd23f); g.fillPoints(pts, true); g.strokePoints(pts, true, true);
    g.fillStyle(0xff4f7a); g.fillCircle(x, y - 12, 6); g.fillStyle(0x4aa8ff); g.fillCircle(x - 18, y - 9, 4); g.fillCircle(x + 18, y - 9, 4);
    g.fillStyle(0xffffff, 0.6); g.fillRect(x - 26, y - 6, 52, 3);
  }
}

/**
 * The jelly monster: a lime-green blob with big eyes (180×176, mouth centre at MON.mx, MON.my).
 * face: idle (smile), open (wide open mouth, the candy is close), chew (cheeks full), sad (frown), blink.
 */
export function drawMonster(g: G, face: 'idle' | 'open' | 'chew' | 'sad' | 'blink') {
  const x = MON.w / 2;
  // feet and arms
  g.fillStyle(0x58b81e); g.fillEllipse(x - 42, 166, 42, 18); g.fillEllipse(x + 42, 166, 42, 18);
  g.lineStyle(4, INK); g.strokeEllipse(x - 42, 166, 42, 18); g.strokeEllipse(x + 42, 166, 42, 18);
  // body
  g.fillStyle(0x58b81e); g.fillEllipse(x, 112, 168, 120); g.fillCircle(x, 72, 62);
  g.fillStyle(0x8be03a); g.fillEllipse(x, 106, 156, 106); g.fillCircle(x, 70, 56);
  g.fillStyle(0xc6f57a, 0.8); g.fillEllipse(x - 32, 44, 30, 14); g.fillCircle(x - 50, 70, 6);
  g.lineStyle(5, INK);
  g.beginPath();
  // outline: circle top + ellipse bottom drawn as two strokes (overlap hidden by the fill)
  g.strokePath();
  g.strokeEllipse(x, 112, 168, 120);
  g.fillStyle(0x8be03a); g.fillEllipse(x, 104, 150, 96); g.fillCircle(x, 70, 54);
  g.lineStyle(5, INK); g.beginPath(); g.arc(x, 72, 62, Math.PI * 1.13, Math.PI * 1.87); g.strokePath();
  g.fillStyle(0xc6f57a, 0.85); g.fillEllipse(x - 30, 40, 30, 12);
  // little arms
  g.fillStyle(0x6fcf2a); g.fillEllipse(x - 82, 118, 22, 34); g.fillEllipse(x + 82, 118, 22, 34);
  g.lineStyle(4, INK); g.strokeEllipse(x - 82, 118, 22, 34); g.strokeEllipse(x + 82, 118, 22, 34);
  // eyes
  const ey = 62;
  for (const ex of [x - 32, x + 32]) {
    if (face === 'blink' || face === 'chew') {
      g.lineStyle(5, INK); g.beginPath(); g.arc(ex, ey + 4, 13, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
      continue;
    }
    g.fillStyle(0xffffff); g.fillCircle(ex, ey, 21); g.lineStyle(4, INK); g.strokeCircle(ex, ey, 21);
    const py = face === 'sad' ? ey + 5 : face === 'open' ? ey - 3 : ey + 2;
    g.fillStyle(0x1f6b1a); g.fillCircle(ex + 2, py, 13);
    g.fillStyle(INK); g.fillCircle(ex + 2, py, 8);
    g.fillStyle(0xffffff); g.fillCircle(ex + 6, py - 5, 4.5); g.fillCircle(ex - 2, py + 4, 2);
    if (face === 'sad') { g.lineStyle(4, INK); g.lineBetween(ex - 16, ey - 26 + (ex < x ? 6 : 0), ex + 16, ey - 26 + (ex < x ? 0 : 6)); }
  }
  // cheeks
  g.fillStyle(0xff7eb6, 0.55); g.fillEllipse(x - 56, 96, 20, 11); g.fillEllipse(x + 56, 96, 20, 11);
  // mouth (centre at MON.mx, MON.my)
  const my = MON.my;
  if (face === 'open') {
    g.fillStyle(0x7a1630); g.fillEllipse(x, my, 78, 58); g.lineStyle(5, INK); g.strokeEllipse(x, my, 78, 58);
    g.fillStyle(0xff6f8f); g.fillEllipse(x, my + 16, 44, 20);
    g.fillStyle(0xffffff); g.fillTriangle(x - 24, my - 26, x - 14, my - 26, x - 19, my - 15); g.fillTriangle(x + 24, my - 26, x + 14, my - 26, x + 19, my - 15);
  } else if (face === 'chew') {
    g.fillStyle(0x8be03a); g.fillEllipse(x - 40, my, 40, 30); g.fillEllipse(x + 40, my, 40, 30);
    g.lineStyle(5, INK); g.beginPath(); g.moveTo(x - 22, my); g.lineTo(x - 8, my + 6); g.lineTo(x + 8, my - 2); g.lineTo(x + 22, my + 4); g.strokePath();
  } else if (face === 'sad') {
    g.lineStyle(5, INK); g.beginPath(); g.arc(x, my + 18, 18, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
  } else {
    g.fillStyle(0x7a1630); g.slice(x, my - 6, 22, 0, Math.PI, false); g.fillPath();
    g.fillStyle(0xff6f8f); g.fillEllipse(x, my + 8, 20, 9);
    g.lineStyle(5, INK); g.beginPath(); g.arc(x, my - 6, 22, 0, Math.PI); g.closePath(); g.strokePath();
  }
}
