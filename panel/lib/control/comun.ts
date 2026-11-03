// Centro de control: utilidades comunes. Solo se importa desde componentes de servidor y rutas.

export type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

export type ClaveProyecto = 'A' | 'N' | 'B' | 'G' | 'M' | 'NM' | 'NT';

/** `db`: sufijo de la variable DB_RO_<db> (por defecto, la clave). Numi Mates y Numitech comparten la base DB_RO_NUMI. */
export const PROYECTOS_CONTROL: { clave: ClaveProyecto; slug: string; nombre: string; vercel: string; web: string; db?: string }[] = [
  { clave: 'A', slug: 'a-ccse', nombre: 'CCSE Fácil', vercel: 'ccse-en-tu-idioma', web: 'https://ccsefacil.com' },
  { clave: 'N', slug: 'n-nuevo-en-espana', nombre: 'Tus Papeles', vercel: 'nuevo-en-espana', web: 'https://tuspapeles.app' },
  { clave: 'B', slug: 'b-oposiciones', nombre: 'Oposita', vercel: 'placa-oposicions', web: 'https://oposita.digital' },
  { clave: 'G', slug: 'g-cuentos', nombre: 'Lunilla', vercel: 'lunilla', web: 'https://lunilla.cat' },
  { clave: 'M', slug: 'm-catala', nombre: 'Aprova', vercel: 'aprova-catala', web: 'https://aprova-catala.vercel.app' },
  { clave: 'NM', slug: 'numi-mates', nombre: 'Numi Mates', vercel: 'mates-numi', web: 'https://app.numimates.com', db: 'NUMI' },
  { clave: 'NT', slug: 'numitech', nombre: 'Numitech', vercel: 'mates-numi', web: 'https://tech.numimates.com', db: 'NUMI' },
];

export const variableBase = (clave: ClaveProyecto) => `DB_RO_${PROYECTOS_CONTROL.find((p) => p.clave === clave)?.db ?? clave}`;

export const nombreProyecto = (slug: string | null) =>
  slug ? PROYECTOS_CONTROL.find((p) => p.slug === slug)?.nombre ?? slug : 'Fuera de la cartera';

/** Mensaje de error sin cadenas de conexión ni claves. */
export function limpiarError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  return m
    .replace(/postgres(ql)?:\/\/\S+/gi, '[conexión]')
    .replace(/\b(sk|rk|pk)_(live|test)_\w+/g, '[clave]')
    .replace(/Bearer\s+\S+/g, 'Bearer […]')
    .slice(0, 240);
}

export async function intentar<T>(fn: () => Promise<T>): Promise<Resultado<T>> {
  try {
    return { ok: true, datos: await fn() };
  } catch (e) {
    console.error('[control]', limpiarError(e));
    return { ok: false, error: limpiarError(e) };
  }
}

/** Memoria corta (60 s) por instancia, para no repetir llamadas al paginar. */
const memo = ((globalThis as any).__controlMemo ??= new Map<string, { hasta: number; valor: Promise<unknown> }>());
export function memorizar<T>(clave: string, fn: () => Promise<T>, ms = 60_000): Promise<T> {
  const ahora = Date.now();
  const v = memo.get(clave);
  if (v && v.hasta > ahora) return v.valor as Promise<T>;
  const valor = fn();
  memo.set(clave, { hasta: ahora + ms, valor });
  valor.catch(() => memo.delete(clave));
  return valor;
}

const TZ = 'Europe/Madrid';

/** Medianoche de hoy en Madrid, menos `dias` días, como Date (UTC). */
export function inicioDiaMadrid(dias = 0, base = new Date()): Date {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(base);
  const [y, m, d] = partes.split('-').map(Number);
  return madridAUtc(y, m - 1, d - dias);
}

export function inicioMesMadrid(base = new Date()): Date {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).format(base);
  const [y, m] = partes.split('-').map(Number);
  return madridAUtc(y, m - 1, 1);
}

function madridAUtc(y: number, mes: number, d: number): Date {
  // Prueba con el desfase de ese día (CET/CEST).
  const aprox = new Date(Date.UTC(y, mes, d, 0, 0, 0));
  const enMadrid = new Date(aprox.toLocaleString('en-US', { timeZone: TZ }));
  const enUtc = new Date(aprox.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(aprox.getTime() - (enMadrid.getTime() - enUtc.getTime()));
}

export const dinero = (centimos: number, moneda = 'eur') =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: moneda.toUpperCase(), minimumFractionDigits: 2 }).format(centimos / 100);

export const fechaHora = (d: Date | string | number | null | undefined) =>
  d == null ? '—' : new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

export const fechaCorta = (d: Date | string | number | null | undefined) =>
  d == null ? '—' : new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

export const EQUIPO_VERCEL = 'moisesmodu-3705s-projects';
