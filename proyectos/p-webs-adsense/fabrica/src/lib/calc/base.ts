// Utilidades numéricas comunes a todos los motores.
export type Tramo = { hasta: number | null; tipo: number };

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
export const pos = (n: number) => (n > 0 ? n : 0);

/** Cuota de una escala progresiva por tramos (tipos en %). */
export function cuotaEscala(base: number, escala: Tramo[]): number {
  let cuota = 0;
  let desde = 0;
  for (const t of escala) {
    const techo = t.hasta ?? Infinity;
    if (base > desde) cuota += (Math.min(base, techo) - desde) * (t.tipo / 100);
    if (base <= techo) break;
    desde = techo;
  }
  return cuota;
}

/** Tipo marginal (%) aplicable a la última unidad de base. */
export function tipoMarginal(base: number, escala: Tramo[]): number {
  for (const t of escala) if (t.hasta === null || base <= t.hasta) return t.tipo;
  return escala[escala.length - 1].tipo;
}

/** Suma dos escalas tramo a tramo (estatal + autonómica). */
export function sumarEscalas(a: Tramo[], b: Tramo[]): Tramo[] {
  const cortes = new Set<number>();
  for (const t of [...a, ...b]) if (t.hasta !== null) cortes.add(t.hasta);
  const lista = [...cortes].sort((x, y) => x - y);
  const res: Tramo[] = [];
  for (const c of lista) res.push({ hasta: c, tipo: r2(tipoMarginal(c - 0.001, a) + tipoMarginal(c - 0.001, b)) });
  const ult = (lista[lista.length - 1] ?? 0) + 1;
  res.push({ hasta: null, tipo: r2(tipoMarginal(ult, a) + tipoMarginal(ult, b)) });
  return res;
}

/** Días entre dos fechas ISO, ambos incluidos. */
export function diasEntre(desde: string, hasta: string): number {
  const a = Date.UTC(+desde.slice(0, 4), +desde.slice(5, 7) - 1, +desde.slice(8, 10));
  const b = Date.UTC(+hasta.slice(0, 4), +hasta.slice(5, 7) - 1, +hasta.slice(8, 10));
  return Math.floor((b - a) / 86400000) + 1;
}

export function fechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function sumarDias(iso: string, dias: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return fechaISO(d);
}

export function sumarMeses(iso: string, meses: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const total = y * 12 + (m - 1) + meses;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const ultimo = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${String(nm + 1).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
}

/** Meses completos e iniciados entre dos fechas, ambas incluidas (una fracción de mes cuenta como mes entero). */
export function mesesIniciados(desde: string, hasta: string): number {
  if (hasta < desde) return 0;
  let m = 0;
  while (m < 1200 && sumarDias(sumarMeses(desde, m + 1), -1) <= hasta) m++;
  return sumarDias(sumarMeses(desde, m), -1) < hasta ? m + 1 : m;
}

/** Meses completos (sin contar la fracción). */
export function mesesCompletos(desde: string, hasta: string): number {
  if (hasta < desde) return 0;
  let m = 0;
  while (m < 1200 && sumarDias(sumarMeses(desde, m + 1), -1) <= hasta) m++;
  return m;
}

export function esFecha(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
