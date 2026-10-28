import { createEmptyCard, fsrs, Rating, type Card, type CardInput } from 'ts-fsrs';
import type { CartaFSRS, Progreso, RegistroPregunta } from './progreso';

const planificador = fsrs({ enable_fuzz: true, request_retention: 0.9 });

function aCarta(c: Card): CartaFSRS {
  return {
    due: c.due.toISOString(), stability: c.stability, difficulty: c.difficulty, elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days, learning_steps: c.learning_steps, reps: c.reps, lapses: c.lapses, state: c.state,
    last_review: c.last_review ? c.last_review.toISOString() : undefined,
  };
}

/** Registra una respuesta. Solo entran en el repaso las preguntas falladas alguna vez. */
export function registrarRespuesta(p: Progreso, id: number, acierto: boolean, ahora = new Date()): Progreso {
  const prev: RegistroPregunta = p.preguntas[id] ?? { a: 0, f: 0, u: 0 };
  const r: RegistroPregunta = { ...prev, a: prev.a + (acierto ? 1 : 0), f: prev.f + (acierto ? 0 : 1), u: ahora.getTime(), ultimaOk: acierto };
  if (!acierto || prev.carta) {
    const base: CardInput | Card = prev.carta ? { ...prev.carta } : createEmptyCard<Card>(ahora);
    r.carta = aCarta(planificador.next(base, ahora, acierto ? Rating.Good : Rating.Again).card);
  }
  return { ...p, actualizado: ahora.getTime(), preguntas: { ...p.preguntas, [id]: r } };
}

export function pendientes(p: Progreso, ahora = Date.now()): number[] {
  return Object.entries(p.preguntas)
    .filter(([, r]) => r.carta && new Date(r.carta.due).getTime() <= ahora)
    .sort((a, b) => new Date(a[1].carta!.due).getTime() - new Date(b[1].carta!.due).getTime())
    .map(([id]) => Number(id));
}
export function proximoRepaso(p: Progreso): Date | null {
  const fechas = Object.values(p.preguntas).filter((r) => r.carta).map((r) => new Date(r.carta!.due).getTime());
  return fechas.length ? new Date(Math.min(...fechas)) : null;
}
