import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;

type Jelly = { feet: number; arms: number; body: number; light: number };
/** Jelly colours of the hero: feet, arms, body edge and body (lighter). Not pink/peach: those are castle colours. */
const COLORS: Record<string, Jelly> = {
  mint: { feet: 0x1f9e76, arms: 0x4fd6a8, body: 0x2fbf8f, light: 0x6ee7bd },
  sky: { feet: 0x2f78d9, arms: 0x4aa8ff, body: 0x3a92ee, light: 0x8ccbff },
  lemon: { feet: 0xc98a00, arms: 0xffc93f, body: 0xf2b316, light: 0xffe27a },
  milk: { feet: 0xb9b3dd, arms: 0xe6e3f5, body: 0xd6d2ee, light: 0xffffff },
  cherry: { feet: 0xb8233a, arms: 0xff4f5e, body: 0xe83a4f, light: 0xff8a95 },
  cola: { feet: 0x2f2a3d, arms: 0x5a5470, body: 0x4a4560, light: 0x6d6688 },
};
const FACES = ['shades', 'stache', 'cat'] as const;

/** Trick Floor shop: jelly colour of the hero and a face style. Paid with coins (earned by finishing levels). */
export const ITEMS: ShopItem[] = [
  { id: 'mint', slot: 'color', price: 0, icon: 'jh-pv-mint' },
  { id: 'sky', slot: 'color', price: 10, icon: 'jh-pv-sky' },
  { id: 'lemon', slot: 'color', price: 20, icon: 'jh-pv-lemon' },
  { id: 'milk', slot: 'color', price: 35, icon: 'jh-pv-milk' },
  { id: 'cherry', slot: 'color', price: 55, icon: 'jh-pv-cherry' },
  { id: 'cola', slot: 'color', price: 80, icon: 'jh-pv-cola' },
  { id: 'shades', slot: 'face', price: 15, icon: 'jf-pv-shades' },
  { id: 'stache', slot: 'face', price: 30, icon: 'jf-pv-stache' },
  { id: 'cat', slot: 'face', price: 60, icon: 'jf-pv-cat' },
];
export const DEFAULTS = { color: 'mint', face: '' };
/** Daily reward (coins), day 1 to 7. */
export const DAILY = [3, 5, 8, 10, 12, 15, 25];
/** Coins for finishing a level: 2 per star (2..6). */
export const coinsFor = (stars: number) => stars * 2;

const jelly = () => COLORS[equippedId(save, 'color', DEFAULTS.color, ITEMS)] ?? COLORS.mint;
/** Particle colours of the hero (death splash) with the equipped jelly. */
export const heroTint = () => { const c = jelly(); return [c.light, c.arms, c.body, 0xffffff]; };
/** Texture of the equipped face style ('' = none). */
export const accKey = () => { const f = equippedId(save, 'face', DEFAULTS.face, ITEMS); return f ? `jacc-${f}` : ''; };

/** Shop previews (once, in Boot). 68×68 with a margin: a 64×64 texture wraps its edges when scaled up. */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, c] of Object.entries(COLORS)) {
    const key = `jh-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 68, 68, (g) => { g.translateCanvas(2, 2); drawHero(g, c); faceN(g); });
  }
  for (const id of FACES) {
    // 66 wide (not a power of two) so the texture never wraps its edges; centred like the 64×64 hero
    if (!scene.textures.exists(`jacc-${id}`)) redrawTexture(scene, `jacc-${id}`, 66, 64, (g) => { g.translateCanvas(1, 0); drawAcc(g, id); });
    const key = `jf-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 68, 68, (g) => { g.translateCanvas(2, 2); drawHero(g, COLORS.mint); faceN(g); drawAcc(g, id); });
  }
}

/** Redraws the hero body with the equipped colour (Play adds the face and the face style on top). */
export function applyHero(scene: Phaser.Scene) {
  redrawTexture(scene, 'hero', 64, 64, (g) => drawHero(g, jelly()));
}

/** The hero: a jelly cube with little arms and feet (64×64, feet on the bottom). */
function drawHero(g: Phaser.GameObjects.Graphics, c: Jelly) {
  g.fillStyle(c.feet); g.fillEllipse(19, 58, 16, 10); g.fillEllipse(45, 58, 16, 10);       // feet
  g.lineStyle(3, INK); g.strokeEllipse(19, 58, 16, 10); g.strokeEllipse(45, 58, 16, 10);
  g.fillStyle(c.arms); g.fillCircle(6, 36, 6); g.fillCircle(58, 36, 6);                    // arms
  g.strokeCircle(6, 36, 6); g.strokeCircle(58, 36, 6);
  g.fillStyle(c.body); g.fillRoundedRect(8, 10, 48, 47, 15);
  g.fillStyle(c.light); g.fillRoundedRect(10, 10, 44, 41, 14);
  g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(15, 14, 13, 6, 3); g.fillCircle(33, 16, 2.5);
  g.lineStyle(3.5, INK); g.strokeRoundedRect(8, 10, 48, 47, 15);
}

/** Normal face (same as 'face-n' in Boot), only for the previews. */
function faceN(g: Phaser.GameObjects.Graphics) {
  for (const x of [24, 40]) {
    g.fillStyle(INK); g.fillEllipse(x, 30, 8, 10);
    g.fillStyle(0xffffff); g.fillCircle(x + 1.25, 26.25, 1.9);
  }
  g.fillStyle(0xff7eb6, 0.55); g.fillEllipse(17, 40, 7, 4); g.fillEllipse(47, 40, 7, 4);
  g.lineStyle(2.5, INK); g.beginPath(); g.arc(32, 39, 4, 0.3, Math.PI - 0.3); g.strokePath();
}

/** Face styles, drawn over the face (same 64×64 frame as the hero). */
function drawAcc(g: Phaser.GameObjects.Graphics, id: string) {
  if (id === 'shades') {
    // sunglasses
    g.fillStyle(INK); g.fillRoundedRect(14, 24, 15, 11, 4); g.fillRoundedRect(35, 24, 15, 11, 4); g.fillRect(28, 26, 8, 3);
    g.lineStyle(2.5, INK); g.lineBetween(14, 27, 9, 25); g.lineBetween(50, 27, 55, 25);
    g.fillStyle(0xffffff, 0.75); g.fillRect(17, 26, 5, 2.5); g.fillRect(38, 26, 5, 2.5);
  } else if (id === 'stache') {
    // curly moustache under the nose
    g.fillStyle(0x5a3a22); g.lineStyle(2, INK);
    g.fillEllipse(26, 37, 13, 6); g.fillEllipse(38, 37, 13, 6);
    g.strokeEllipse(26, 37, 13, 6); g.strokeEllipse(38, 37, 13, 6);
    g.fillCircle(19, 34, 3); g.fillCircle(45, 34, 3); g.strokeCircle(19, 34, 3); g.strokeCircle(45, 34, 3);
    g.fillStyle(0x5a3a22); g.fillRect(25, 35, 14, 4);
  } else {
    // cat ears on top and whiskers
    g.lineStyle(3, INK);
    for (const [a, b, c] of [[[11, 15], [16, 1], [26, 11]], [[53, 15], [48, 1], [38, 11]]] as const) {
      g.fillStyle(0xffffff); g.fillTriangle(a[0], a[1], b[0], b[1], c[0], c[1]);
      g.strokeTriangle(a[0], a[1], b[0], b[1], c[0], c[1]);
    }
    g.fillStyle(0xff9ec7); g.fillTriangle(15, 12, 17, 5, 22, 11); g.fillTriangle(49, 12, 47, 5, 42, 11);
    g.lineStyle(2, INK);
    g.lineBetween(4, 36, 15, 38); g.lineBetween(4, 42, 15, 41); g.lineBetween(60, 36, 49, 38); g.lineBetween(60, 42, 49, 41);
    g.fillStyle(0xff7eb6); g.fillTriangle(29, 34, 35, 34, 32, 37);
  }
}
