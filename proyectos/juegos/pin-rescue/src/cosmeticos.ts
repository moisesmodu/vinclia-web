import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;
const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

/** Jelly hero skins: body colours. */
const SKINS: Record<string, { base: number; light: number; dark: number; leaf?: number }> = {
  coral: { base: 0xff7d8c, light: 0xffb8c1, dark: 0xe0566a },
  mint: { base: 0x4fe0a8, light: 0xa8f5d6, dark: 0x22b07c },
  sky: { base: 0x5ab8ff, light: 0xb4e0ff, dark: 0x2f86d9 },
  lemon: { base: 0xffd84a, light: 0xfff0a8, dark: 0xe0a800 },
  grape: { base: 0xb07cff, light: 0xdcc6ff, dark: 0x7d4bd6 },
  golden: { base: 0xffc62b, light: 0xfff3b0, dark: 0xc98a00, leaf: 0xff5d8a },
};
/** Pin styles: bar colours (stripe = candy stripes). */
const PINS: Record<string, { base: number; light: number; dark: number; stripe?: number; rainbow?: boolean }> = {
  gold: { base: 0xffc62b, light: 0xfff0a0, dark: 0xc98a00 },
  silver: { base: 0xd3dceb, light: 0xffffff, dark: 0x8796ad },
  candy: { base: 0xffffff, light: 0xffffff, dark: 0xd9d9e8, stripe: 0xff3b5c },
  wood: { base: 0xc98a4b, light: 0xe8b47a, dark: 0x8f5a2a },
  crystal: { base: 0x7fe3ff, light: 0xdaf8ff, dark: 0x2fa8d9 },
  rainbow: { base: 0xffffff, light: 0xffffff, dark: 0xd9d9e8, rainbow: true },
};

/** Pin Rescue shop: skins for the jelly hero and styles for the pins. Paid with coins (earned by finishing levels). */
export const ITEMS: ShopItem[] = [
  { id: 'coral', slot: 'skin', price: 0, icon: 'hero-pv-coral' },
  { id: 'mint', slot: 'skin', price: 15, icon: 'hero-pv-mint' },
  { id: 'sky', slot: 'skin', price: 30, icon: 'hero-pv-sky' },
  { id: 'lemon', slot: 'skin', price: 45, icon: 'hero-pv-lemon' },
  { id: 'grape', slot: 'skin', price: 70, icon: 'hero-pv-grape' },
  { id: 'golden', slot: 'skin', price: 120, icon: 'hero-pv-golden' },
  { id: 'gold', slot: 'pin', price: 0, icon: 'pin-pv-gold', bg: 0x3a3f5c },
  { id: 'silver', slot: 'pin', price: 20, icon: 'pin-pv-silver', bg: 0x3a3f5c },
  { id: 'candy', slot: 'pin', price: 35, icon: 'pin-pv-candy', bg: 0x3a3f5c },
  { id: 'wood', slot: 'pin', price: 50, icon: 'pin-pv-wood', bg: 0x3a3f5c },
  { id: 'crystal', slot: 'pin', price: 80, icon: 'pin-pv-crystal', bg: 0x3a3f5c },
  { id: 'rainbow', slot: 'pin', price: 110, icon: 'pin-pv-rainbow', bg: 0x3a3f5c },
];
export const DEFAULTS = { skin: 'coral', pin: 'gold' };
/** Daily reward (coins), day 1 to 7. */
export const DAILY = [3, 5, 8, 10, 12, 15, 25];
/** Coins for a finished level: 1 plus 2 per star (3..7). */
export const coinsFor = (stars: number) => 1 + stars * 2;

/* ------------------------------------------------------------------ textures */

/** Hero texture: 84 × 84, the 60 × 60 world box sits at (12, 20)-(72, 80) (feet on y = 80). */
export const HERO = { w: 84, h: 84, bx: 12, by: 20 };
export const SLIME = { w: 76, h: 56, bx: 8, by: 12 };   // 60 × 40 box
export const PIN_T = 20;                               // pin thickness (world px)
export type HeroFace = 'idle' | 'happy' | 'scared' | 'sad' | 'blink';
export const HERO_FACES: HeroFace[] = ['idle', 'happy', 'scared', 'sad', 'blink'];

/** Shop previews (once, in Boot). */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const id of Object.keys(SKINS)) {
    const key = `hero-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, HERO.w, HERO.h, (g) => drawHero(g, id, 'happy'));
  }
  for (const id of Object.keys(PINS)) {
    const key = `pin-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 160, 64, (g) => drawPinPreview(g, id));
  }
}

/** Redraws the in-game hero faces and pin parts with what is equipped. */
export function applyCosmetics(scene: Phaser.Scene) {
  const skin = equippedId(save, 'skin', DEFAULTS.skin, ITEMS);
  for (const f of HERO_FACES) redrawTexture(scene, `hero-${f}`, HERO.w, HERO.h, (g) => drawHero(g, skin, f));
  const pin = equippedId(save, 'pin', DEFAULTS.pin, ITEMS);
  redrawTexture(scene, 'pinbar', 40, PIN_T + 4, (g) => drawPinBar(g, pin, 40));
  redrawTexture(scene, 'pinring', 56, 56, (g) => drawPinRing(g, pin));
}

export function drawHero(g: G, id: string, face: HeroFace) {
  const c = SKINS[id] ?? SKINS.coral;
  const x = HERO.w / 2, bot = HERO.by + 60;
  // shadow, body (a soft dome with a flat bottom)
  g.fillStyle(0x000000, 0.2); g.fillEllipse(x, bot - 1, 66, 12);
  const body = (dx: number, dy: number, sw: number, sh: number) => {
    g.fillRoundedRect(x - sw / 2 + dx, bot - sh + dy, sw, sh, { tl: sw / 2, tr: sw / 2, bl: 14, br: 14 });
  };
  g.fillStyle(INK); body(0, 3, 70, 62);
  g.fillStyle(c.dark); body(0, 0, 64, 56);
  g.fillStyle(c.base); body(0, -4, 60, 50);
  g.fillStyle(c.light, 0.9); g.fillEllipse(x - 14, bot - 44, 18, 10); g.fillCircle(x - 22, bot - 34, 3);
  // leaf sprout
  const leaf = c.leaf ?? 0x58c23a;
  g.lineStyle(3, INK); g.lineBetween(x, bot - 56, x + 2, bot - 64);
  g.fillStyle(leaf); g.fillEllipse(x - 8, bot - 66, 16, 9); g.fillEllipse(x + 9, bot - 68, 16, 9);
  g.lineStyle(2.5, INK); g.strokeEllipse(x - 8, bot - 66, 16, 9); g.strokeEllipse(x + 9, bot - 68, 16, 9);
  // eyes
  const ey = bot - 30;
  for (const ex of [x - 12, x + 12]) {
    if (face === 'blink' || face === 'happy') {
      g.lineStyle(4, INK); g.beginPath(); g.arc(ex, ey + 3, 7, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
      continue;
    }
    const r = face === 'scared' ? 10 : 9;
    g.fillStyle(0xffffff); g.fillCircle(ex, ey, r); g.lineStyle(3, INK); g.strokeCircle(ex, ey, r);
    const py = face === 'sad' ? ey + 3 : ey;
    g.fillStyle(INK); g.fillCircle(ex + 1, py, face === 'scared' ? 4 : 6);
    g.fillStyle(0xffffff); g.fillCircle(ex + 3, py - 3, 2.2);
  }
  // cheeks and mouth
  g.fillStyle(0xff4f7a, 0.45); g.fillEllipse(x - 22, ey + 10, 10, 6); g.fillEllipse(x + 22, ey + 10, 10, 6);
  const my = bot - 16;
  g.lineStyle(3.5, INK);
  if (face === 'happy') {
    g.fillStyle(0x7a1630); g.slice(x, my - 3, 9, 0, Math.PI, false); g.fillPath();
    g.beginPath(); g.arc(x, my - 3, 9, 0, Math.PI); g.closePath(); g.strokePath();
  } else if (face === 'scared') {
    g.fillStyle(0x7a1630); g.fillEllipse(x, my, 10, 12); g.strokeEllipse(x, my, 10, 12);
  } else if (face === 'sad') {
    g.beginPath(); g.arc(x, my + 6, 8, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
  } else {
    g.beginPath(); g.arc(x, my - 4, 7, 0.2, Math.PI - 0.2); g.strokePath();
  }
}

/** Grumpy slime (76 × 56 texture, 60 × 40 box at (8, 12)). face: grr | scared. */
export function drawSlime(g: G, face: 'grr' | 'scared') {
  const x = SLIME.w / 2, bot = SLIME.by + 40;
  g.fillStyle(0x000000, 0.2); g.fillEllipse(x, bot, 68, 10);
  const shape = (inset: number, dy: number) => {
    g.fillRoundedRect(x - 32 + inset, bot - 42 + inset + dy, 64 - inset * 2, 42 - inset, { tl: 28, tr: 28, bl: 10, br: 10 });
  };
  g.fillStyle(INK); shape(-3, 2);
  g.fillStyle(0x7d3fd6); shape(0, 0);
  g.fillStyle(0x9b5cf0); shape(3, -2);
  g.fillStyle(0xd2b3ff, 0.8); g.fillEllipse(x - 14, bot - 32, 14, 7);
  g.fillStyle(0x6a2fc2); g.fillCircle(x + 18, bot - 12, 3); g.fillCircle(x - 20, bot - 8, 2.5);
  const ey = bot - 20;
  for (const s of [-1, 1]) {
    const ex = x + s * 11;
    g.fillStyle(0xffffff); g.fillCircle(ex, ey, face === 'scared' ? 8 : 7); g.lineStyle(3, INK); g.strokeCircle(ex, ey, face === 'scared' ? 8 : 7);
    g.fillStyle(INK); g.fillCircle(ex - s, ey + 1, face === 'scared' ? 3 : 4);
    if (face === 'grr') { g.lineStyle(4, INK); g.lineBetween(ex - 9 * s, ey - 12, ex + 7 * s, ey - 7); }
  }
  g.lineStyle(3, INK);
  if (face === 'grr') {
    g.beginPath(); g.arc(x, bot - 2, 8, Math.PI * 1.2, Math.PI * 1.8); g.strokePath();
    g.fillStyle(0xffffff); g.fillTriangle(x - 5, bot - 8, x - 1, bot - 8, x - 3, bot - 5);
  } else {
    g.beginPath(); g.moveTo(x - 9, bot - 6); g.lineTo(x - 4, bot - 9); g.lineTo(x + 1, bot - 6); g.lineTo(x + 6, bot - 9); g.lineTo(x + 10, bot - 6); g.strokePath();
  }
}

/** Round bomb with a fuse (48 × 48, the 40 × 40 box at (4, 8)). */
export function drawBomb(g: G) {
  g.fillStyle(0x000000, 0.2); g.fillEllipse(24, 46, 36, 6);
  g.fillStyle(INK); g.fillCircle(24, 29, 19);
  g.fillStyle(0x3d3a5c); g.fillCircle(24, 29, 16);
  g.fillStyle(0x7d7aa6, 0.9); g.fillEllipse(18, 22, 10, 6);
  g.fillStyle(0x8a8296); g.fillRect(20, 7, 8, 6); g.lineStyle(2.5, INK); g.strokeRect(20, 7, 8, 6);
  g.lineStyle(3, 0xc9a26b); g.beginPath(); g.moveTo(24, 7); g.lineTo(28, 2); g.lineTo(33, 3); g.strokePath();
  g.fillStyle(0xff5d3b); g.fillCircle(34, 3, 3); g.fillStyle(0xffd23f); g.fillCircle(34, 3, 1.6);
}

/** Faceted gem (44 × 44, the 40 × 40 box at (2, 2)). */
export function drawGem(g: G) {
  const pts = [V(22, 6), V(38, 18), V(22, 40), V(6, 18)];
  g.fillStyle(INK); g.fillPoints([V(22, 2), V(42, 18), V(22, 44), V(2, 18)], true);
  g.fillStyle(0xff4fa3); g.fillPoints(pts, true);
  g.fillStyle(0xff9ad0); g.fillTriangle(22, 6, 38, 18, 22, 18); g.fillTriangle(22, 6, 6, 18, 14, 18);
  g.fillStyle(0xc2187a); g.fillTriangle(22, 40, 38, 18, 22, 18);
  g.fillStyle(0xffffff, 0.85); g.fillTriangle(14, 14, 20, 9, 18, 17);
}

function pinColour(id: string) { return PINS[id] ?? PINS.gold; }

/** Bar tile (tiled along the pin): w × (PIN_T + 4). */
function drawPinBar(g: G, id: string, w: number) {
  const c = pinColour(id), h = PIN_T, y0 = 2;
  g.fillStyle(INK); g.fillRect(0, y0, w, h);
  g.fillStyle(c.dark); g.fillRect(0, y0 + 3, w, h - 6);
  g.fillStyle(c.base); g.fillRect(0, y0 + 3, w, h - 10);
  if (c.stripe) { g.fillStyle(c.stripe); for (let x = -10; x < w; x += 20) g.fillTriangle(x, y0 + h - 3, x + 8, y0 + h - 3, x + 18, y0 + 3), g.fillTriangle(x, y0 + h - 3, x + 10, y0 + 3, x + 18, y0 + 3); }
  if (c.rainbow) { const rb = [0xff3b4f, 0xffb800, 0x3ddc84, 0x1f8fff, 0x8d4dff]; rb.forEach((col, i) => { g.fillStyle(col); g.fillRect((i * w) / 5, y0 + 3, w / 5 + 1, h - 6); }); }
  g.fillStyle(c.light, 0.9); g.fillRect(0, y0 + 5, w, 3);
}

/** Ring handle (56 × 56). */
function drawPinRing(g: G, id: string) {
  const c = pinColour(id);
  g.lineStyle(16, INK); g.strokeCircle(28, 28, 19);
  g.lineStyle(10, c.rainbow ? 0xff5d8a : c.stripe ?? c.base); g.strokeCircle(28, 28, 19);
  g.lineStyle(3, c.light, 0.9); g.beginPath(); g.arc(28, 28, 21, Math.PI * 1.1, Math.PI * 1.6); g.strokePath();
}

/** Shop preview: a short pin with its ring (160 × 64). */
function drawPinPreview(g: G, id: string) {
  const c = pinColour(id);
  g.save();
  g.translateCanvas(48, 20);
  drawPinBar(g, id, 108);
  g.restore();
  g.lineStyle(16, INK); g.strokeCircle(30, 32, 19);
  g.lineStyle(10, c.rainbow ? 0xff5d8a : c.stripe ?? c.base); g.strokeCircle(30, 32, 19);
  g.lineStyle(3, c.light, 0.9); g.beginPath(); g.arc(30, 32, 21, Math.PI * 1.1, Math.PI * 1.6); g.strokePath();
}
