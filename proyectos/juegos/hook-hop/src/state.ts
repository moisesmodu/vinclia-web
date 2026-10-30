import { Save } from '@comun/save';

/** Todo lo que se guarda de Hook Hop (en la cuenta de CrazyGames o en localStorage). */
export const save = new Save('hook-hop.v1', {
  best: 0,           // mejor distancia (m)
  coins: 0,          // plátanos acumulados (la moneda del menú)
  runs: 0,
  tutorialDone: false,
  muted: false,
  owned: [] as string[],                       // cosméticos comprados (comun/tienda.ts)
  equipped: {} as Record<string, string>,      // cosmético puesto por hueco
  dailyDate: '',                               // último día con recompensa diaria cobrada (comun/diario.ts)
  dailyStreak: 0,                              // días seguidos
});
