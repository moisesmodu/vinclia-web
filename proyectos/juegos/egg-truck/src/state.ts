import { Save } from '@comun/save';

/** Todo lo que se guarda de Egg Truck (en la cuenta de CrazyGames o en localStorage). */
export const save = new Save('eggtruck.v1', {
  best: 0,           // mejor distancia en metros
  stars: 0,          // estrellas acumuladas
  runs: 0,           // partidas jugadas (telemetría local de embudo)
  tutorialDone: false,
  muted: false,
  owned: [] as string[],                       // cosméticos comprados (comun/tienda.ts)
  equipped: {} as Record<string, string>,      // cosmético puesto por hueco
  dailyDate: '',                               // último día con recompensa diaria cobrada (comun/diario.ts)
  dailyStreak: 0,                              // días seguidos
});

/** 1 metro de juego = 50 píxeles de mundo. */
export const PX_PER_M = 50;
