import { Save } from '@comun/save';

/** Todo lo que se guarda de Tow Truck (en la cuenta de CrazyGames o en localStorage). */
export const save = new Save('tow-truck.v1', {
  best: 0,           // récord de puntos en una partida (carga entregada × metros del depósito)
  coins: 0,          // monedas (1 por carga entregada): se gastan en la tienda
  delivered: 0,      // cargas entregadas en total
  bestDist: 0,       // mejor distancia en metros
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
/** Un depósito (granero) cada 200 m. */
export const DEPOT_EVERY_M = 200;
