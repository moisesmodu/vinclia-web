import { Save } from '@comun/save';
import { newSquad, newSeason, type Season, type Squad, type SeasonEnd } from './logic';

/** Everything Penalty Season saves (CrazyGames account or localStorage). */
export const save = new Save('penalty-season.v1', {
  best: 0,            // league titles won (shown with the trophy)
  coins: 0,
  runs: 0,            // matches played
  tutorialDone: false,     // shooting hint seen
  tutorialSave: false,     // saving hint seen
  muted: false,
  owned: [] as string[],                   // cosmetics bought (comun/tienda.ts)
  equipped: {} as Record<string, string>,  // cosmetic per slot
  dailyDate: '',                           // comun/diario.ts
  dailyStreak: 0,
  season: null as Season | null,
  squad: null as Squad | null,
  morale: 60,
  seasonEnd: null as SeasonEnd | null,     // shown once in the season screen, then the next season starts
});

export function season(): Season {
  let se = save.get('season');
  if (!se || !Array.isArray(se.results)) { se = newSeason(0, 1, (Math.random() * 1e9) | 0); save.set('season', se); }
  return se;
}
export function squad(): Squad {
  let sq = save.get('squad');
  if (!sq || !Array.isArray(sq.pow)) { sq = newSquad(); save.set('squad', sq); }
  return sq;
}
