import { Save } from '@comun/save';
import { LEVELS } from './levels';

/** Everything Trick Floor saves (CrazyGames account or localStorage). */
export const save = new Save('trick-floor.v1', {
  unlocked: 1,                 // highest unlocked level (1..25)
  stars: [] as number[],       // stars per level (index 0 = level 1), 0..3
  best: [] as number[],        // fewest deaths per level + 1 (0 = not finished yet)
  totalDeaths: 0,
  runs: 0,
  tutorialDone: false,
  muted: false,
});

export const levelStars = (lv: number) => save.get('stars')[lv - 1] || 0;
export const levelDone = (lv: number) => (save.get('best')[lv - 1] || 0) > 0;
export const levelBest = (lv: number) => (save.get('best')[lv - 1] || 0) - 1;
export const totalStars = () => save.get('stars').reduce((a, b) => a + (b || 0), 0);

/** Stars by deaths: 3 if you died at most `par` times (about once per trap), 2 up to par·2+2, 1 for finishing. */
export function starsFor(lv: number, deaths: number) {
  const par = LEVELS[lv - 1].par;
  return deaths <= par ? 3 : deaths <= par * 2 + 2 ? 2 : 1;
}

/** Saves a finished level (only improves) and unlocks the next one. Returns true if it is a new best. */
export function saveResult(lv: number, deaths: number, stars: number) {
  const s = [...save.get('stars')], b = [...save.get('best')];
  const better = !b[lv - 1] || deaths + 1 < b[lv - 1];
  s[lv - 1] = Math.max(s[lv - 1] || 0, stars);
  if (better) b[lv - 1] = deaths + 1;
  save.set('stars', s);
  save.set('best', b);
  unlock(lv + 1);
  return better;
}

export function unlock(lv: number) {
  if (lv <= LEVELS.length && lv > save.get('unlocked')) save.set('unlocked', lv);
}

/** Level for the big play button: the first unlocked one not finished yet, or the last one. */
export function nextLevel() {
  const u = save.get('unlocked');
  for (let i = 1; i <= u; i++) if (!levelDone(i)) return i;
  return Math.min(u, LEVELS.length);
}

/** Castle colours: one jelly palette every 5 levels. */
export const PALETTES = [
  { base: 0xff7eb6, light: 0xffc2dc, dark: 0xd94a8c, wall: 0xf3e3ff, brick: 0xe6d0fb },   // strawberry
  { base: 0x4fd6a8, light: 0xaef5da, dark: 0x1f9e76, wall: 0xe2f6ff, brick: 0xcfe9fb },   // mint
  { base: 0xffc93f, light: 0xfff0a6, dark: 0xd99a00, wall: 0xfff0e6, brick: 0xf8dcca },   // lemon
  { base: 0x9b6bff, light: 0xd3bfff, dark: 0x6a3fd6, wall: 0xffe6f2, brick: 0xf6d0e4 },   // grape
  { base: 0xff8f5c, light: 0xffcfae, dark: 0xd8602b, wall: 0xe9e4ff, brick: 0xd8d0fb },   // peach
];
export const paletteOf = (lv: number) => Math.floor((lv - 1) / 5) % PALETTES.length;
