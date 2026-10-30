import Phaser from 'phaser';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';
import { kitIcon, ballTex, badge, type KitDef, type BallDef } from './art';

/** Kits (shirt + shorts colours of the player's club) and ball skins. Prices in coins, cheapest first. */
export const KITS: KitDef[] = [
  { id: 'orange', c1: 0xff8a3d, c2: 0xffffff },
  { id: 'sky', c1: 0x4aa8ff, c2: 0xffffff },
  { id: 'mint', c1: 0x3ddc84, c2: 0x2b2340 },
  { id: 'grape', c1: 0x9b6bff, c2: 0xffd23f },
  { id: 'cherry', c1: 0xff4f6a, c2: 0xffffff },
  { id: 'night', c1: 0x2b2340, c2: 0xffd23f },
];
export const BALLS: BallDef[] = [
  { id: 'classic', base: 0xffffff, mark: 0x2f6fd9, style: 'classic' },
  { id: 'beach', base: 0xffffff, mark: 0xffffff, style: 'beach' },
  { id: 'melon', base: 0x5fd35a, mark: 0x2e8b3a, style: 'melon' },
  { id: 'tennis', base: 0xd8f25a, mark: 0xffffff, style: 'tennis' },
  { id: 'star', base: 0x6b4fd8, mark: 0xffd23f, style: 'star' },
  { id: 'gold', base: 0xffd23f, mark: 0xc98a00, style: 'gold' },
];
const KIT_PRICES = [0, 60, 120, 200, 300, 450];
const BALL_PRICES = [0, 80, 150, 220, 350, 600];

export const ITEMS: ShopItem[] = [
  ...KITS.map((k, i) => ({ id: k.id, slot: 'kit', price: KIT_PRICES[i], icon: `kit-${k.id}` })),
  ...BALLS.map((b, i) => ({ id: `ball-${b.id}`, slot: 'ball', price: BALL_PRICES[i], icon: `ball-${b.id}` })),
];
export const DEFAULTS = { kit: 'orange', ball: 'ball-classic' };
/** Daily reward (coins), day 1 to 7. */
export const DAILY = [15, 20, 25, 35, 45, 60, 90];

export const kit = (): KitDef => KITS.find((k) => k.id === equippedId(save, 'kit', DEFAULTS.kit, ITEMS)) ?? KITS[0];
export const ballKey = () => equippedId(save, 'ball', DEFAULTS.ball, ITEMS);

/** Shop previews and the player's club badge in the current kit colours. */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const k of KITS) kitIcon(scene, k);
  for (const b of BALLS) ballTex(scene, b);
  refreshClub(scene);
}
export function refreshClub(scene: Phaser.Scene) {
  const k = kit();
  badge(scene, 'bd-0', 'fox', k.c1, k.c2, true);
}
