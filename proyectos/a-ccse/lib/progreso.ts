/** Estado de progreso compartido entre navegador (localStorage) y servidor (columna JSON). */
export type CartaFSRS = {
  due: string; stability: number; difficulty: number; elapsed_days: number; scheduled_days: number;
  learning_steps: number; reps: number; lapses: number; state: number; last_review?: string;
};
export type RegistroPregunta = { a: number; f: number; u: number; ultimaOk?: boolean; carta?: CartaFSRS };
export type Simulacro = { fecha: number; aciertos: number; total: number; segundos: number; ids?: number[]; fallos?: number[] };
export type Progreso = {
  v: 1;
  actualizado: number;
  preguntas: Record<string, RegistroPregunta>;
  simulacros: Simulacro[];
  convocatoria?: string;
};

export function progresoVacio(): Progreso {
  return { v: 1, actualizado: 0, preguntas: {}, simulacros: [] };
}

export function esProgreso(x: unknown): x is Progreso {
  return !!x && typeof x === 'object' && (x as Progreso).v === 1 && typeof (x as Progreso).preguntas === 'object';
}

/** Fusión sin pérdidas: por pregunta gana el registro más reciente; los simulacros se unen por fecha. */
export function fusionar(a: Progreso, b: Progreso): Progreso {
  const preguntas: Record<string, RegistroPregunta> = { ...a.preguntas };
  for (const [id, r] of Object.entries(b.preguntas)) {
    const x = preguntas[id];
    if (!x || r.u > x.u) preguntas[id] = r;
  }
  const porFecha = new Map<number, Simulacro>();
  for (const s of [...a.simulacros, ...b.simulacros]) porFecha.set(s.fecha, s);
  const simulacros = [...porFecha.values()].sort((x, y) => x.fecha - y.fecha).slice(-100);
  const masReciente = a.actualizado >= b.actualizado ? a : b;
  return {
    v: 1,
    actualizado: Math.max(a.actualizado, b.actualizado),
    preguntas,
    simulacros,
    convocatoria: masReciente.convocatoria ?? a.convocatoria ?? b.convocatoria,
  };
}

/** Indicador "listo para el examen": mezcla la nota de los 3 últimos simulacros y el dominio del banco. */
export function preparacion(p: Progreso, totalPreguntas = 300) {
  const dominadas = Object.values(p.preguntas).filter((r) => r.a >= 2 && r.ultimaOk).length;
  const ult = p.simulacros.slice(-3);
  const notaSim = ult.length ? ult.reduce((s, x) => s + x.aciertos / x.total, 0) / ult.length : 0;
  const cobertura = dominadas / totalPreguntas;
  const indice = Math.round(100 * (ult.length ? 0.7 * notaSim + 0.3 * cobertura : 0.5 * cobertura));
  return { dominadas, notaSim, cobertura, indice: Math.min(100, indice) };
}
