// Utilidades compartidas por las plantillas de páginas por combinación (nomina.ts, impuestos.ts y us.ts).
import type { Lang } from '../lib/def';
import paisES from '../../params/es/pais.json';

export const COM = Object.keys(paisES.comunidades);
export const nom = (c: string, l: Lang) => (paisES.comunidades as any)[c][l] as string;
const loc = (l: Lang) => (l === 'es' ? 'es-ES' : 'ca-ES');
export const eur = (n: number, l: Lang, dec = 0) => new Intl.NumberFormat(loc(l), { style: 'currency', currency: 'EUR', maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
export const num = (n: number, l: Lang, dec = 0) => new Intl.NumberFormat(loc(l), { maximumFractionDigits: dec }).format(n);
export const pc = (n: number, l: Lang) => `${num(n, l, 2)} %`;
export const L = (l: Lang, es: string, ca: string) => (l === 'es' ? es : ca);
/** «de Madrid» / «d’Aragó»: preposición con apóstrofo en catalán delante de vocal. */
export const de = (x: string, l: Lang) => (l === 'ca' && /^[aeiouàèéíòóúAEIOUÀÈÉÍÒÓÚH]/.test(x) ? `d’${x}` : `de ${x}`);
/** «a Madrid» / «en Madrid». */
export const en = (x: string, l: Lang) => (l === 'es' ? `en ${x}` : `a ${x}`);
export const vecinos = <F>(filas: F[], fila: F, k = 2) => {
  const i = filas.indexOf(fila);
  return [...filas.slice(Math.max(0, i - k), i), ...filas.slice(i + 1, i + 1 + k)];
};
export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
/** Ordinal corto: 1.º / 1r, 2.º / 2n… */
export const ord = (n: number, l: Lang) => (l === 'es' ? `${n}.ª` : `${n}a`);
