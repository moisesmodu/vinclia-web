import { Save } from '@comun/save';

/** Saved data of Jelly Merge (through the portal: CrazyGames SDK.data, localStorage elsewhere). */
export const save = new Save('jelly-merge.v1', {
  best: 0,
  coins: 0,
  runs: 0,
  clouds: 0,                                   // clouds floated away in total
  bestTier: 0,                                 // biggest jelly ever made (tier index)
  tutorialDone: false,
  muted: false,
  owned: [] as string[],                       // cosmetics bought (comun/tienda.ts)
  equipped: {} as Record<string, string>,      // equipped cosmetic per slot
  dailyDate: '',                               // last day with the daily gift claimed (comun/diario.ts)
  dailyStreak: 0,
});
