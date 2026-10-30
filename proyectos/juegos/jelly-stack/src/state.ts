import { Save } from '@comun/save';

/** Guardado del juego. Cambia la clave al copiar la plantilla (scripts/new-game.mjs lo hace solo). */
export const save = new Save('jelly-stack.v1', {
  best: 0,
  coins: 0, // stars: one per perfect drop
  runs: 0,
  tutorialDone: false,
  muted: false,
  owned: [] as string[],                       // cosméticos comprados (comun/tienda.ts)
  equipped: {} as Record<string, string>,      // cosmético puesto por hueco
  dailyDate: '',                               // último día con recompensa diaria cobrada (comun/diario.ts)
  dailyStreak: 0,                              // días seguidos
});
