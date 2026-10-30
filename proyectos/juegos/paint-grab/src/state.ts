import { Save } from '@comun/save';

/** Todo lo que se guarda de Paint Grab (en la cuenta de CrazyGames o en localStorage). */
export const save = new Save('paint-grab.v1', {
  best: 0,           // mejor porcentaje del patio en una ronda (con un decimal)
  drops: 0,          // gotas de pintura acumuladas (moneda de la tienda)
  runs: 0,           // partidas jugadas
  bestRound: 0,      // ronda más alta alcanzada
  tutorialDone: false,
  muted: false,
  owned: [] as string[],                       // cosméticos comprados (comun/tienda.ts)
  equipped: {} as Record<string, string>,      // cosmético puesto por hueco (skin, trail)
  dailyDate: '',                               // recompensa diaria (comun/diario.ts)
  dailyStreak: 0,
});

/** Lado de una celda del patio en píxeles de mundo. */
export const CELL = 16;
/** Duración de una ronda (s). */
export const ROUND_SECS = 120;
