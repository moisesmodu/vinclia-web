import { Save } from '@comun/save';
import { LEVELS } from './levels';

/** Everything Rope Cut saves (CrazyGames account or localStorage). */
export const save = new Save('rope-cut.v1', {
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

/** Saves a finished level (stars only improve) and unlocks the next one. Returns true if the stars improved. */
export function saveResult(lv: number, stars: number) {
  const s = [...save.get('stars')], d = [...save.get('done')];
  const better = stars > (s[lv - 1] || 0) || !d[lv - 1];
  s[lv - 1] = Math.max(s[lv - 1] || 0, stars);
  d[lv - 1] = 1;
  save.set('stars', s);
  save.set('done', d);
  unlock(lv + 1);
  return better;
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

/** One colour theme per box of 10 levels: sky, mint, lemon, grape. */
export const THEMES = [
  { base: 0x4aa8ff, light: 0xbfe3ff, dark: 0x2f78d9, board: 0xdff1ff, line: 0xb5dbff },
  { base: 0x3ddc97, light: 0xc4f5df, dark: 0x1f9e6c, board: 0xe2fbef, line: 0xb4ecd3 },
  { base: 0xffb627, light: 0xffe7b0, dark: 0xd98a00, board: 0xfff4dc, line: 0xffe0a3 },
  { base: 0xa77bff, light: 0xe2d4ff, dark: 0x7148d6, board: 0xf1eaff, line: 0xdccbff },
];
export const themeOf = (lv: number) => Math.min(THEMES.length - 1, Math.floor((lv - 1) / 10));
