/** Datos públicos del banco oficial (sin explicaciones). Se pueden usar en cliente y servidor. */
import data from '@/content/preguntas.json';
import { PAIS } from './config';

export type Pregunta = { id: number; tarea: number; texto: string; opciones: string[]; respuesta: number; pagina: number | null };
export const FUENTE = data.fuente;
export const PREGUNTAS: Pregunta[] = data.preguntas as Pregunta[];
export const TAREAS = [1, 2, 3, 4, 5] as const;
export const POR_ID = new Map(PREGUNTAS.map((p) => [p.id, p]));

export function deTarea(t: number) {
  return PREGUNTAS.filter((p) => p.tarea === t);
}

/** 25 preguntas gratis con el mismo reparto que el examen (10/3/2/3/7), repartidas por todo el banco. */
export const IDS_GRATIS: number[] = (() => {
  const reparto = PAIS.simulacro.reparto as Record<string, number>;
  const ids: number[] = [];
  for (const t of TAREAS) {
    const lista = deTarea(t);
    const k = reparto[String(t)];
    for (let i = 0; i < k; i++) ids.push(lista[Math.floor((i * lista.length) / k)].id);
  }
  return ids;
})();
export const ES_GRATIS = new Set(IDS_GRATIS);

/** Simulacro con el reparto oficial por tareas. */
export function generarSimulacro(rand: () => number = Math.random): number[] {
  const reparto = PAIS.simulacro.reparto as Record<string, number>;
  const ids: number[] = [];
  for (const t of TAREAS) {
    const lista = deTarea(t).map((p) => p.id);
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    ids.push(...lista.slice(0, reparto[String(t)]));
  }
  return ids;
}
