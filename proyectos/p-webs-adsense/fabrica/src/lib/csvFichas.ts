// Genera el CSV descargable de cada ficha de datos.
import type { Lang } from './def';
import { t } from './def';
import { fichasSitio } from './rutas';
import { sitio, SITIO_ID, LANGS } from './sitio';
import { params } from './params';
import { aCSV } from './csv';

export function rutasCsv(lang: Lang) {
  if (!LANGS.includes(lang)) return []; // sitio de un solo idioma: sin /ca/dades/*.csv
  return fichasSitio().map((f) => ({ params: { slug: f.slug[lang] }, props: { id: f.id, lang } }));
}
export function csvFicha(id: string, lang: Lang): string {
  const f = fichasSitio().find((x) => x.id === id)!;
  const anio = sitio.anioPorDefecto;
  const tablas = f.tablas({ P: params(sitio.pais, anio), lang, anio, sitio: SITIO_ID });
  return tablas.map((tb) => (tb.titulo ? `# ${t(tb.titulo, lang)}\n` : '') + aCSV(tb.cab.map((c) => t(c, lang)), tb.filas.map((r) => r.map((c) => (typeof c === 'object' ? t(c as any, lang) : c))))).join('\n');
}
