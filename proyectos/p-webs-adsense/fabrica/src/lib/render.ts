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

// Los porcentajes que llegan dentro de textos («IRPF (16.41 %)») se escriben con coma decimal
const tx = (x: Txt, lang: Lang) => (LOC[lang].endsWith('-US') ? esc(t(x, lang)) : esc(t(x, lang).replace(/(\d)\.(\d+)(?= ?%)/g, '$1,$2')));

export function renderResultado(r: Resultado, lang: Lang, moneda = MONEDA, locale?: string): string {
  const F = (v: any, f?: Formato) => (v && typeof v === 'object' ? tx(v, lang) : esc(fmt(v, f, lang, moneda, locale)));
  const fd = r.destacado.f ?? 'eur';
  const num = typeof r.destacado.v === 'number' ? ` data-n="${r.destacado.v}" data-f="${fd}"` : '';
  let h = `<div class="res-dest"><span class="res-et">${tx(r.destacado.e, lang)}</span><output class="res-val"${num}>${F(r.destacado.v, fd)}</output>`;
  if (r.destacado.nota) h += `<span class="res-nota">${tx(r.destacado.nota, lang)}</span>`;
  const partes = repartoDe(r);
  if (partes) {
    const total = partes.reduce((a, p) => a + p.v, 0);
    h += '<div class="reparto"><div class="reparto-barra" role="img" aria-label="' + partes.map((p) => `${tx(p.e, lang)}: ${fmt(Math.round((p.v / total) * 1000) / 10, 'pct', lang)}`).join(', ') + '">';
    partes.forEach((p, i) => { h += `<span class="rp rp${i}" style="flex-grow:${Math.max(p.v, total * 0.004).toFixed(2)}"></span>`; });
    h += '</div><ul class="reparto-ley">';
    partes.forEach((p, i) => { h += `<li><i class="rp${i}"></i>${tx(p.e, lang)} <b>${fmt(Math.round((p.v / total) * 1000) / 10, 'pct', lang)}</b></li>`; });
    h += '</ul></div>';
  }
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

/** Partes de la barra de reparto: las declaradas o, si las filas son «total − deducciones = neto», esas mismas. */
export function repartoDe(r: Resultado): { e: Txt; v: number }[] | null {
  if (r.reparto?.length) return r.reparto.filter((p) => p.v > 0).length > 1 ? r.reparto.filter((p) => p.v > 0) : null;
  const filas = (r.filas ?? []).filter((f) => !f.sub && typeof f.v === 'number' && (!f.f || f.f === 'eur' || f.f === 'eur0'));
  const neto = filas.find((f) => f.fuerte);
  const menos = filas.filter((f) => f.signo === '-' && (f.v as number) > 0);
  const total = filas[0];
  if (!neto || !menos.length || !total || total === neto || total.signo) return null;
  const suma = (neto.v as number) + menos.reduce((a, f) => a + (f.v as number), 0);
  if ((neto.v as number) <= 0 || Math.abs(suma - (total.v as number)) > Math.max(1, (total.v as number) * 0.01)) return null;
  return [{ e: neto.e, v: neto.v as number }, ...menos.slice(0, 4).map((f) => ({ e: f.e, v: f.v as number }))];
}

export function renderTablas(tablas: Resultado['tablas'], lang: Lang, moneda = MONEDA, locale?: string): string {
  const h = renderResultado({ destacado: { e: '', v: '' }, tablas }, lang, moneda, locale);
  return h.replace(/^<div class="res-dest">[\s\S]*?<\/div>/, '');
}
