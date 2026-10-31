// Formato declarativo de una calculadora: campos del formulario y función de cálculo pura.
// La misma definición se usa en el servidor (resultado de ejemplo prerenderizado, visible para Google)
// y en el navegador (recalcula al escribir). Textos siempre en castellano y catalán.
import type { Bloques } from './params';

export type Lang = 'es' | 'ca';
export type T = { es: string; ca: string };
export type Txt = T | string;
export type Formato = 'eur' | 'eur0' | 'pct' | 'num' | 'num0' | 'dias' | 'meses' | 'txt' | 'fecha' | 'horas';

interface CampoBase { id: string; etiqueta: T; ayuda?: T; si?: (v: Record<string, any>) => boolean }
export type Campo =
  | (CampoBase & { tipo: 'numero'; def: number; min?: number; max?: number; paso?: number; sufijo?: string })
  | (CampoBase & { tipo: 'select'; def: string; opciones: { v: string; t: Txt }[] })
  | (CampoBase & { tipo: 'fecha'; def: string })
  | (CampoBase & { tipo: 'casilla'; def: boolean });

export interface Fila { e: Txt; v: number | string; f?: Formato; fuerte?: boolean; sub?: boolean; signo?: '-' | '+' }
export interface Tabla { titulo?: Txt; cab: Txt[]; filas: (number | string | T)[][]; formatos?: Formato[] }
export interface Resultado {
  destacado: { e: Txt; v: number | string; f?: Formato; nota?: Txt };
  secundarios?: { e: Txt; v: number | string; f?: Formato }[];
  filas?: Fila[];
  tablas?: Tabla[];
  /** Reparto de un total en partes (neto, impuestos, cotizaciones…) para la barra de colores. Si falta, se deduce de las filas. */
  reparto?: { e: Txt; v: number }[];
  avisos?: Txt[];
}
export interface Ctx { P: Bloques; lang: Lang; pais: string }
export interface DefCalc {
  id: string;
  /** Muestra el selector de año (usa los años con parámetros publicados). */
  anual?: boolean;
  campos: Campo[];
  calcular: (v: Record<string, any>, ctx: Ctx) => Resultado;
}

export const t = (x: Txt | undefined, lang: Lang): string => (x == null ? '' : typeof x === 'string' ? x : x[lang]);
export const tt = (es: string, ca: string): T => ({ es, ca });
export const def = (d: DefCalc) => d;

/** Valores por defecto de una definición, con el año indicado. */
export function valoresPorDefecto(d: DefCalc, anio: number): Record<string, any> {
  const v: Record<string, any> = {};
  for (const c of d.campos) v[c.id] = c.def;
  if (d.anual) v.anio = anio;
  return v;
}

export const SI_NO = (es = true) => [{ v: 'si', t: tt('Sí', 'Sí') }, { v: 'no', t: tt('No', 'No') }].slice(es ? 0 : 0);
