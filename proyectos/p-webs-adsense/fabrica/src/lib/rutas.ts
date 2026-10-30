// Todas las páginas del sitio en un solo lugar: las usan la ruta dinámica, el sitemap y los enlaces hreflang.
// Castellano en la raíz (/calculadora-sueldo-neto/) y catalán bajo /ca/ (/ca/calculadora-sou-net/).
import type { Lang } from './def';
import { sitio, SITIO_ID, LANGS } from './sitio';
import { texto, existeTexto } from './contenido';
import { leerCSV } from './csv';
import { FICHAS as FN } from '../fichas/nomina';
import { FICHAS as FI } from '../fichas/impuestos';
import { FICHAS as FU } from '../fichas/eeuu';
import { FICHAS as FV } from '../fichas/vivienda';
import type { Ficha } from '../fichas/tipos';

export type Tipo = 'inicio' | 'calc' | 'fichas' | 'ficha' | 'prog' | 'indice' | 'legal';
export interface Pagina {
  clave: string; // igual en los dos idiomas
  ruta: string; // sin barras ('' = inicio)
  lang: Lang;
  tipo: Tipo;
  id: string;
  fila?: Record<string, string>;
  coleccion?: any;
}

export const FICHAS: Record<string, Ficha[]> = { nomina: FN, impuestos: FI, eeuu: FU, vivienda: FV };
export const fichasSitio = (): Ficha[] => FICHAS[SITIO_ID] ?? [];

const pref = (lang: Lang) => (lang === 'es' ? '' : `${lang}/`);
export const LEGAL: Record<string, Record<Lang, string>> = {
  aviso: { es: 'aviso-legal', ca: 'avis-legal' },
  privacidad: { es: 'privacidad', ca: 'privacitat' },
  cookies: { es: 'cookies', ca: 'galetes' },
  sobre: { es: 'sobre-nosotros', ca: 'qui-som' },
};

export function slugCalc(id: string, lang: Lang): string {
  return existeTexto(SITIO_ID, id, lang) ? texto(SITIO_ID, id, lang).slug : `calculadora-${id}`;
}

export function rellenar(patron: string, fila: Record<string, string>): string {
  return patron.replace(/\{(\w+)\}/g, (_, k) => fila[k] ?? '');
}

let cache: Pagina[] | null = null;
export function paginas(): Pagina[] {
  if (cache) return cache;
  const out: Pagina[] = [];
  for (const lang of LANGS) {
    const p = pref(lang);
    out.push({ clave: 'inicio', ruta: p.replace(/\/$/, ''), lang, tipo: 'inicio', id: 'inicio' });
    for (const id of sitio.calculadoras) out.push({ clave: `calc:${id}`, ruta: `${p}${slugCalc(id, lang)}`, lang, tipo: 'calc', id });
    const dat = sitio.rutasDatos[lang];
    out.push({ clave: 'fichas', ruta: `${p}${dat}`, lang, tipo: 'fichas', id: 'fichas' });
    for (const f of fichasSitio()) out.push({ clave: `ficha:${f.id}`, ruta: `${p}${dat}/${f.slug[lang]}`, lang, tipo: 'ficha', id: f.id });
    for (const col of sitio.programaticas ?? []) {
      // Página índice de la colección: todas sus páginas con su cifra, para no llenar la portada de enlaces
      if (col.indice?.[lang]) out.push({ clave: `indice:${col.id}`, ruta: `${p}${col.indice[lang]}`, lang, tipo: 'indice', id: col.id, coleccion: col });
      for (const fila of leerCSV(SITIO_ID, 'programaticas', col.csv)) {
        const k = rellenar(col.slug.es, fila);
        out.push({ clave: `prog:${col.id}:${k}`, ruta: `${p}${rellenar(col.slug[lang], fila)}`, lang, tipo: 'prog', id: col.id, fila, coleccion: col });
      }
    }
    for (const [k, v] of Object.entries(LEGAL)) out.push({ clave: `legal:${k}`, ruta: `${p}${v[lang]}`, lang, tipo: 'legal', id: k });
  }
  // Dos páginas con la misma ruta romperían la compilación en silencio (la segunda pisa a la primera)
  const vistas = new Map<string, string>();
  for (const x of out) {
    if (vistas.has(x.ruta)) throw new Error(`Ruta duplicada «${x.ruta}»: ${vistas.get(x.ruta)} y ${x.clave}`);
    vistas.set(x.ruta, x.clave);
  }
  cache = out;
  return out;
}

export const url = (ruta: string) => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}/${ruta ? ruta + '/' : ''}`;
};
export const absoluta = (ruta: string) => new URL(url(ruta), import.meta.env.SITE).href;

export function alterna(p: Pagina, lang: Lang): Pagina | undefined {
  return paginas().find((x) => x.clave === p.clave && x.lang === lang);
}
export function buscar(clave: string, lang: Lang): Pagina | undefined {
  return paginas().find((x) => x.clave === clave && x.lang === lang);
}
