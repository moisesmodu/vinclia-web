import { Save } from '@comun/save';
import { LEVELS } from './levels';

/** Todo lo que se guarda de Bike Flip (en la cuenta de CrazyGames o en localStorage). */
export const save = new Save('bike-flip.v1', {
  unlocked: 1,                                 // nivel más alto desbloqueado (1..20)
  stars: [] as number[],                       // estrellas por nivel (índice 0 = nivel 1), 0..3
  times: [] as number[],                       // mejor tiempo por nivel en ms (0 = sin terminar)
  runs: 0,                                     // partidas empezadas (telemetría local)
  flips: 0,                                    // volteretas totales
  tutorialDone: false,
  muted: false,
  coins: 0,                                    // monedas para la tienda: estrellas + volteretas de cada meta
  owned: [] as string[],                       // cosméticos comprados (comun/tienda.ts)
  equipped: {} as Record<string, string>,      // cosmético puesto por hueco
  dailyDate: '',                               // último día con recompensa diaria cobrada (comun/diario.ts)
  dailyStreak: 0,                              // días seguidos
});

/** 1 metro de juego = 50 píxeles de mundo. */
export const PX_PER_M = 50;

export const levelStars = (lv: number) => save.get('stars')[lv - 1] || 0;
export const levelTime = (lv: number) => save.get('times')[lv - 1] || 0;
export const totalStars = () => save.get('stars').reduce((a, b) => a + (b || 0), 0);

/** Estrellas por tiempo: 3 si baja de t3, 2 si baja de t2, 1 por llegar a la meta. */
export function starsFor(lv: number, ms: number) {
  const L = LEVELS[lv - 1];
  return ms <= L.t3 * 1000 ? 3 : ms <= L.t2 * 1000 ? 2 : 1;
}

/** Guarda el resultado de un nivel (solo mejora) y desbloquea el siguiente. Devuelve si es mejor tiempo. */
export function saveResult(lv: number, ms: number, stars: number) {
  const s = [...save.get('stars')], t = [...save.get('times')];
  const better = !t[lv - 1] || ms < t[lv - 1];
  s[lv - 1] = Math.max(s[lv - 1] || 0, stars);
  if (better) t[lv - 1] = ms;
  save.set('stars', s);
  save.set('times', t);
  unlock(lv + 1);
  return better;
}

export function unlock(lv: number) {
  if (lv <= LEVELS.length && lv > save.get('unlocked')) save.set('unlocked', lv);
}

/** Nivel con el que arranca el botón grande del menú: el primero desbloqueado sin terminar, o el último. */
export function nextLevel() {
  const u = save.get('unlocked');
  for (let i = 1; i <= u; i++) if (!levelTime(i)) return i;
  return Math.min(u, LEVELS.length);
}
