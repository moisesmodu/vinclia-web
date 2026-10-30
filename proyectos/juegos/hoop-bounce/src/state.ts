import { Save } from '@comun/save';

/** Guardado de Hoop Bounce. */
export const save = new Save('hoop-bounce.v1', {
  best: 0,
  coins: 0,
  runs: 0,
  tutorialDone: false,
  muted: false,
  owned: [] as string[],                       // cosméticos comprados (comun/tienda.ts)
  equipped: {} as Record<string, string>,      // cosmético puesto por hueco (ball, net, floor)
  dailyDate: '',                               // último día con recompensa diaria cobrada (comun/diario.ts)
  dailyStreak: 0,                              // días seguidos
});
