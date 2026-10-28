// Render HTML del resultado de una calculadora. Se usa igual en el servidor y en el navegador.
import { t, type Formato, type Lang, type Resultado, type Txt } from './def';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
// Moneda y locale del país del sitio (astro.config.mjs los toma de params/<pais>/pais.json). Sin ellos (pruebas), España.
// Los formatos 'eur' y 'eur0' significan «importe en la moneda del sitio».
const LOC: Record<Lang, string> = (import.meta.env.LOCALES as Record<Lang, string> | undefined) ?? { es: 'es-ES', ca: 'ca-ES' };
export const MONEDA: string = (import.meta.env.MONEDA as string | undefined) ?? 'EUR';

export function fmt(v: number | string, f: Formato | undefined, lang: Lang, moneda = MONEDA, locale?: string): string {
  if (typeof v === 'string' && f !== 'fecha') return v;
  const loc = locale ?? LOC[lang];
  const pct = loc.endsWith('-US') ? '%' : ' %';
  switch (f) {
    case 'eur': return new Intl.NumberFormat(loc, { style: 'currency', currency: moneda, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(+v);
    case 'eur0': return new Intl.NumberFormat(loc, { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(+v);
    case 'pct': return new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(+v) + pct;
    case 'num0': return new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(+v);
    case 'dias': return new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(+v) + (lang === 'es' ? ' días' : ' dies');
    case 'meses': return new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(+v) + (lang === 'es' ? ' meses' : ' mesos');
    case 'horas': return new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(+v) + ' h';
    case 'fecha': {
      const s = String(v);
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s;
    }
    case 'txt': return String(v);
    default: return new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(+v);
  }
}

const tx = (x: Txt, lang: Lang) => esc(t(x, lang));

export function renderResultado(r: Resultado, lang: Lang, moneda = MONEDA, locale?: string): string {
  const F = (v: any, f?: Formato) => (v && typeof v === 'object' ? tx(v, lang) : esc(fmt(v, f, lang, moneda, locale)));
  let h = `<div class="res-dest"><span class="res-et">${tx(r.destacado.e, lang)}</span><output class="res-val">${F(r.destacado.v, r.destacado.f ?? 'eur')}</output>`;
  if (r.destacado.nota) h += `<span class="res-nota">${tx(r.destacado.nota, lang)}</span>`;
  h += '</div>';
  if (r.secundarios?.length) {
    h += '<dl class="res-sec">';
    for (const s of r.secundarios) h += `<div><dt>${tx(s.e, lang)}</dt><dd>${F(s.v, s.f ?? 'eur')}</dd></div>`;
    h += '</dl>';
  }
  if (r.filas?.length) {
    h += '<table class="res-filas"><tbody>';
    for (const f of r.filas) {
      const cls = [f.fuerte ? 'fuerte' : '', f.sub ? 'sub' : ''].filter(Boolean).join(' ');
      const val = (f.signo === '-' && typeof f.v === 'number' && f.v !== 0 ? '− ' : f.signo === '+' ? '+ ' : '') + F(f.v, f.f ?? 'eur');
      h += `<tr${cls ? ` class="${cls}"` : ''}><th scope="row">${tx(f.e, lang)}</th><td>${val}</td></tr>`;
    }
    h += '</tbody></table>';
  }
  for (const tb of r.tablas ?? []) {
    h += '<div class="res-tabla">';
    if (tb.titulo) h += `<p class="res-tabla-t">${tx(tb.titulo, lang)}</p>`;
    h += '<div class="scroll"><table><thead><tr>' + tb.cab.map((c) => `<th scope="col">${tx(c, lang)}</th>`).join('') + '</tr></thead><tbody>';
    for (const fila of tb.filas) h += '<tr>' + fila.map((c, i) => `<td>${typeof c === 'object' ? tx(c, lang) : F(c, tb.formatos?.[i])}</td>`).join('') + '</tr>';
    h += '</tbody></table></div></div>';
  }
  if (r.avisos?.length) h += '<ul class="res-avisos">' + r.avisos.map((a) => `<li>${tx(a, lang)}</li>`).join('') + '</ul>';
  return h;
}

export function renderTablas(tablas: Resultado['tablas'], lang: Lang, moneda = MONEDA, locale?: string): string {
  const h = renderResultado({ destacado: { e: '', v: '' }, tablas }, lang, moneda, locale);
  return h.replace(/^<div class="res-dest">[\s\S]*?<\/div>/, '');
}
