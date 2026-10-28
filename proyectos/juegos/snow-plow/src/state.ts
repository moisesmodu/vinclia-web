import { Save } from '@comun/save';

/** Todo lo que se guarda de Snow Plow (en la cuenta de CrazyGames o en localStorage). */
export const save = new Save('snow-plow.v1', {
  best: 0,           // récord de regalos entregados en una partida
  gifts: 0,          // regalos entregados en total
  bestDist: 0,       // mejor distancia en metros
  runs: 0,           // partidas jugadas (telemetría local de embudo)
  tutorialDone: false,
  muted: false,
});

/** 1 metro de juego = 50 píxeles de mundo. */
export const PX_PER_M = 50;
/** Un trineo de Papá Noel cada 150 m. */
export const SLEIGH_EVERY_M = 150;
