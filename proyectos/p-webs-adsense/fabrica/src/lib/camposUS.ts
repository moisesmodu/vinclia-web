// Campos y utilidades comunes a las calculadoras de EE. UU. (sitio de un solo idioma: es-US).
import type { Campo, T } from './def';
import { params, anios } from './params';
import paisUS from '../../params/us/pais.json';

/** Texto solo en español (el sitio de EE. UU. no tiene catalán; se repite para cumplir el tipo T). */
export const es = (s: string): T => ({ es: s, ca: s });

const ESTADOS = paisUS.estados as Record<string, { nombre: string; slug: string }>;
export const nombreEstado = (c: string) => ESTADOS[c]?.nombre ?? c;
export const slugEstado = (c: string) => ESTADOS[c]?.slug ?? c.toLowerCase();

/** Parámetros fiscales del último año de EE. UU., o null si se compila otro país (las opciones quedan vacías). */
function ultimoUS(): any {
  try { const a = anios('us'); return a.length ? params('us', a[a.length - 1]) : null; } catch { return null; }
}
const ULT = ultimoUS();
const ordenar = (cs: string[]) => cs.sort((a, b) => nombreEstado(a).localeCompare(nombreEstado(b), 'es'));
/** Estados con datos de impuesto estatal en los parámetros. */
export const ESTADOS_FISCAL: string[] = ULT ? ordenar(Object.keys(ULT.fiscal.estados)) : [];
/** Estados con salario mínimo en los parámetros. */
export const ESTADOS_MINIMO: string[] = ULT ? ordenar(Object.keys(ULT.laboral.salario_minimo.estados)) : [];

export const campoEstado = (def = 'TX', lista = ESTADOS_FISCAL): Campo => ({
  id: 'estado', tipo: 'select', def, etiqueta: es('Estado donde trabajas'),
  opciones: lista.map((c) => ({ v: c, t: es(`${nombreEstado(c)}${ULT?.fiscal.estados[c]?.tipo === 'ninguno' ? ' (sin impuesto estatal)' : ''}`) })),
  ayuda: es('Si vives en un estado y trabajas en otro, normalmente pagas en el estado donde trabajas y pides un crédito en el tuyo.'),
});

export const ETIQUETA_EC: Record<string, string> = {
  single: 'Soltero/a', mfj: 'Casado/a, declaración conjunta', hoh: 'Cabeza de familia', mfs: 'Casado/a, declaración separada',
};
export const campoEstadoCivil = (w4 = false): Campo => ({
  id: 'ec', tipo: 'select', def: 'single', etiqueta: es(w4 ? 'Estado civil en tu W-4 (paso 1c)' : 'Estado civil para la declaración (filing status)'),
  opciones: (w4 ? ['single', 'mfj', 'hoh'] : ['single', 'mfj', 'hoh', 'mfs']).map((v) => ({ v, t: es(v === 'single' && w4 ? 'Soltero/a o casado/a que declara por separado' : ETIQUETA_EC[v]) })),
});

export const FRECUENCIAS: Record<string, string> = { semanal: 'Semanal (52 cheques)', quincenal: 'Cada dos semanas (26 cheques)', bimensual: 'Dos veces al mes (24 cheques)', mensual: 'Mensual (12 cheques)' };
export const campoFrecuencia: Campo = { id: 'frecuencia', tipo: 'select', def: 'quincenal', etiqueta: es('¿Cada cuánto te pagan?'), opciones: Object.entries(FRECUENCIAS).map(([v, t]) => ({ v, t: es(t) })) };

export const campoHijos: Campo = { id: 'ninos', tipo: 'numero', def: 0, min: 0, max: 10, paso: 1, etiqueta: es('Hijos menores de 17 años'), ayuda: es('Con número de Seguro Social (SSN). Cuentan para el crédito tributario por hijos.') };
export const campoOtrosDep: Campo = { id: 'otros', tipo: 'numero', def: 0, min: 0, max: 10, paso: 1, etiqueta: es('Otros dependientes'), ayuda: es('Hijos de 17 años o más, padres u otros familiares a tu cargo, o hijos con ITIN.') };

export const usd = (n: number, dec = 0) => new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
export const num = (n: number, dec = 0) => new Intl.NumberFormat('es-US', { maximumFractionDigits: dec }).format(n);
export const pct = (n: number) => `${new Intl.NumberFormat('es-US', { maximumFractionDigits: 2 }).format(n)}%`;
