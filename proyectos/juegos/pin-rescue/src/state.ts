import { Save } from '@comun/save';
import { LEVELS } from './levels';

/** Everything Pin Rescue saves (CrazyGames account or localStorage). */
export const save = new Save('pin-rescue.v1', {
  unlocked: 1,                 // highest unlocked level (1..40)
  stars: [] as number[],       // best stars per level (index 0 = level 1), 0..3
  done: [] as number[],        // 1 = level finished at least once
  runs: 0,
  fails: 0,
  tutorialDone: false,
  muted: false,
  coins: 0,                                    // shop coins (comun/tienda.ts)
  owned: [] as string[],
  equipped: {} as Record<string, string>,
  dailyDate: '',                               // comun/diario.ts
  dailyStreak: 0,
});

export const levelStars = (lv: number) => save.get('stars')[lv - 1] || 0;
export const levelDone = (lv: number) => !!save.get('done')[lv - 1];
export const totalStars = () => save.get('stars').reduce((a, b) => a + (b || 0), 0);

/** Saves a finished level (stars only improve) and unlocks the next one. */
export function saveResult(lv: number, stars: number) {
  const s = [...save.get('stars')], d = [...save.get('done')];
  s[lv - 1] = Math.max(s[lv - 1] || 0, stars);
  d[lv - 1] = 1;
  save.set('stars', s);
  save.set('done', d);
  unlock(lv + 1);
}

export function unlock(lv: number) {
  if (lv <= LEVELS.length && lv > save.get('unlocked')) save.set('unlocked', lv);
}

/** Level for the big play button: the first unlocked one not finished yet, or the last unlocked one. */
export function nextLevel() {
  const u = save.get('unlocked');
  for (let i = 1; i <= u; i++) if (!levelDone(i)) return i;
  return Math.min(u, LEVELS.length);
}

/**
 * One theme per box of 10 levels: sky stone, mossy stone, sandstone, amethyst.
 * base/light/dark: UI and background; wall/wallDark/wallLight: the tower stones; inside: the hollow behind the materials.
 */
export const THEMES = [
  { base: 0x4aa8ff, light: 0xbfe3ff, dark: 0x2f78d9, wall: 0x9aa7c2, wallDark: 0x6f7c99, wallLight: 0xc4cde0, inside: 0x3a3f5c },
  { base: 0x3ddc97, light: 0xc4f5df, dark: 0x1f9e6c, wall: 0x8fb39a, wallDark: 0x63876e, wallLight: 0xbad6c2, inside: 0x32483f },
  { base: 0xffb627, light: 0xffe7b0, dark: 0xd98a00, wall: 0xd6b07a, wallDark: 0xa98152, wallLight: 0xf0d3a4, inside: 0x4f3d32 },
  { base: 0xa77bff, light: 0xe2d4ff, dark: 0x7148d6, wall: 0xa99ac6, wallDark: 0x7b6c9b, wallLight: 0xd0c5e6, inside: 0x3b3150 },
];
export const themeOf = (lv: number) => Math.min(THEMES.length - 1, Math.floor((lv - 1) / 10));
