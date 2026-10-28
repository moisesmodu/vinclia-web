// Progreso del opositor: vive en el navegador (localStorage) y, con cuenta, se sincroniza con el servidor.
import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs';

export type TarjetaJson = Omit<Card, 'due' | 'last_review'> & { due: string; last_review?: string };
export type Respuesta = { a: number; f: number; ult: number; ok: boolean };
export type ResultadoSimulacro = { fecha: number; nota: number; aciertos: number; fallos: number; blancos: number; segundos: number; n: number };
export type Progreso = {
  v: 1;
  tarjetas: Record<string, TarjetaJson>;
  respuestas: Record<string, Respuesta>;
  dias: string[];
  simulacros: ResultadoSimulacro[];
  actualizado: number;
};

export const vacio = (): Progreso => ({ v: 1, tarjetas: {}, respuestas: {}, dias: [], simulacros: [], actualizado: 0 });

const planificador = fsrs({ request_retention: 0.9, maximum_interval: 365, enable_fuzz: true });

const aCard = (t: TarjetaJson): Card => ({ ...t, due: new Date(t.due), last_review: t.last_review ? new Date(t.last_review) : undefined }) as Card;
const aJson = (c: Card): TarjetaJson => ({ ...c, due: c.due.toISOString(), last_review: c.last_review ? new Date(c.last_review).toISOString() : undefined }) as TarjetaJson;

export const hoy = (d = new Date()) => d.toISOString().slice(0, 10);

/** Registra una respuesta: estadística y tarjeta de repaso (FSRS). Fallo = Again; acierto = Good (Easy si ya la sabía bien). */
export function registrar(p: Progreso, id: string, ok: boolean, ahora = new Date()): Progreso {
  const r = p.respuestas[id] ?? { a: 0, f: 0, ult: 0, ok: false };
  const previa = p.tarjetas[id] ? aCard(p.tarjetas[id]) : createEmptyCard(ahora);
  const nota = ok ? (r.a >= 2 && r.f === 0 ? Rating.Easy : Rating.Good) : Rating.Again;
  const sig = planificador.next(previa, ahora, nota).card;
  const d = hoy(ahora);
  return {
    ...p,
    respuestas: { ...p.respuestas, [id]: { a: r.a + (ok ? 1 : 0), f: r.f + (ok ? 0 : 1), ult: ahora.getTime(), ok } },
    tarjetas: { ...p.tarjetas, [id]: aJson(sig) },
    dias: p.dias.includes(d) ? p.dias : [...p.dias, d].slice(-400),
    actualizado: ahora.getTime(),
  };
}

export function pendientes(p: Progreso, idsDisponibles: Set<string>, ahora = new Date()): string[] {
  return Object.entries(p.tarjetas)
    .filter(([id, t]) => idsDisponibles.has(id) && new Date(t.due) <= ahora)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}

export function falladas(p: Progreso, idsDisponibles: Set<string>): string[] {
  return Object.entries(p.respuestas).filter(([id, r]) => idsDisponibles.has(id) && !r.ok).map(([id]) => id);
}

export function racha(p: Progreso, ahora = new Date()): number {
  const s = new Set(p.dias);
  let n = 0;
  const d = new Date(ahora);
  if (!s.has(hoy(d))) d.setDate(d.getDate() - 1);
  while (s.has(hoy(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** Fusión de dos progresos (navegador y servidor): por pregunta gana la respuesta más reciente. */
export function fusionar(a: Progreso, b: Progreso): Progreso {
  const respuestas = { ...a.respuestas };
  const tarjetas = { ...a.tarjetas };
  for (const [id, r] of Object.entries(b.respuestas)) {
    if (!respuestas[id] || r.ult > respuestas[id].ult) {
      respuestas[id] = r;
      if (b.tarjetas[id]) tarjetas[id] = b.tarjetas[id];
    }
  }
  for (const [id, t] of Object.entries(b.tarjetas)) if (!tarjetas[id]) tarjetas[id] = t;
  const sims = new Map<number, ResultadoSimulacro>();
  for (const s of [...a.simulacros, ...b.simulacros]) sims.set(s.fecha, s);
  return {
    v: 1,
    respuestas,
    tarjetas,
    dias: [...new Set([...a.dias, ...b.dias])].sort().slice(-400),
    simulacros: [...sims.values()].sort((x, y) => x.fecha - y.fecha).slice(-200),
    actualizado: Math.max(a.actualizado, b.actualizado),
  };
}

export function notaSimulacro(aciertos: number, fallos: number, n: number, penalizacion: number, notaMaxima = 10): number {
  if (!n) return 0;
  return Math.max(0, Math.round(((aciertos - fallos * penalizacion) / n) * notaMaxima * 100) / 100);
}

export function barajar<T>(arr: T[], rnd = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Reparte n preguntas entre temas según su peso; si un tema se queda corto, el resto se completa con los demás. */
export function elegirSimulacro<T extends { id: string; tema: number }>(preguntas: T[], temas: { n: number; peso?: number }[], n: number): T[] {
  const porTema = new Map<number, T[]>();
  for (const p of barajar(preguntas)) porTema.set(p.tema, [...(porTema.get(p.tema) ?? []), p]);
  const conPreg = temas.filter((t) => porTema.get(t.n)?.length);
  const pesoTotal = conPreg.reduce((s, t) => s + (t.peso ?? 1), 0) || 1;
  const elegidas: T[] = [];
  for (const t of conPreg) {
    const cuota = Math.round((n * (t.peso ?? 1)) / pesoTotal);
    elegidas.push(...(porTema.get(t.n) ?? []).slice(0, cuota));
  }
  const usadas = new Set(elegidas.map((p) => p.id));
  for (const p of barajar(preguntas)) {
    if (elegidas.length >= n) break;
    if (!usadas.has(p.id)) { elegidas.push(p); usadas.add(p.id); }
  }
  return barajar(elegidas.slice(0, n));
}
