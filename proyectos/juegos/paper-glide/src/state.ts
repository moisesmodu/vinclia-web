import { Save } from '@comun/save';
import { zeroLevels, type Levels } from './vuelo';

/** Guardado del juego (comun/save.ts: en CrazyGames va a la cuenta del jugador). */
export const save = new Save('paper-glide.v1', {
  best: 0,
  coins: 0,
  runs: 0,
  tutorialDone: false,
  muted: false,
  /** Niveles de las mejoras del avión (alas, cola, peso, lanzador, imán), 0..10. */
  levels: zeroLevels() as Levels,
  owned: [] as string[],                       // cosméticos comprados (comun/tienda.ts)
  equipped: {} as Record<string, string>,      // cosmético puesto por hueco
  dailyDate: '',                               // último día con recompensa diaria cobrada (comun/diario.ts)
  dailyStreak: 0,                              // días seguidos
});

/** Niveles guardados (con valores por defecto si el guardado es de una versión anterior). */
export function levels(): Levels {
  return { ...zeroLevels(), ...(save.get('levels') || {}) };
}
