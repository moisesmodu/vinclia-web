// Gráficos SVG generados en el servidor, sin librerías ni JavaScript.
// Truco de diseño: el SVG no tiene viewBox; las X van en porcentaje y las Y en píxeles, así el gráfico ocupa
// todo el ancho en cualquier pantalla sin encoger el texto. Las líneas se dibujan en un SVG interior con
// preserveAspectRatio="none" y trazo que no escala. Colores por clase (s1…s4) para que el modo oscuro funcione.
// Accesibles: role="img" con <title> y <desc>; la tabla con todos los valores va siempre debajo.
import { fmt } from './render';
import { t, type Formato, type Lang, type Tabla } from './def';

const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const r1 = (n: number) => Math.round(n * 10) / 10;
let contador = 0;
const nuevoId = (p: string) => `${p}${++contador}`;

/** Marcas «redondas» para el eje: 0, 250, 500… con 3-5 líneas. */
function marcas(min: number, max: number, n = 4): number[] {
  const rango = max - min || Math.abs(max) || 1;
  const bruto = rango / n;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => rango / p <= n) ?? 10 * mag;
  const ini = Math.floor(min / paso) * paso;
  const out: number[] = [];
  for (let v = ini; v <= max + paso * 0.999; v += paso) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

export interface Serie { nombre: string; valores: number[] }
export interface OpLinea {
  titulo: string;
  desc: string;
  etiquetas: string[]; // una por punto (eje X)
  xs?: number[]; // posiciones numéricas (si los puntos no están equiespaciados)
  series: Serie[];
  formato: Formato;
  lang: Lang;
  alto?: number;
  desdeCero?: boolean;
}

/** Línea (una o varias series) con área suave, rejilla discreta, etiqueta final y cruz al pasar el ratón. */
export function linea(o: OpLinea): string {
  const id = nuevoId('gl');
  const H = o.alto ?? 260, padT = 26, padB = 30, ph = H - padT - padB;
  const todos = o.series.flatMap((s) => s.valores);
  let lo = Math.min(...todos), hi = Math.max(...todos);
  if (o.desdeCero !== false && (lo >= 0 && lo / (hi || 1) < 0.55)) lo = 0;
  const ticks = marcas(lo > 0 ? Math.max(0, lo - (hi - lo) * 0.12) : lo, hi, 4);
  lo = ticks[0]; hi = ticks[ticks.length - 1];
  const n = o.etiquetas.length;
  const xs = o.xs ?? o.etiquetas.map((_, i) => i);
  const x0 = xs[0], x1 = xs[n - 1];
  const px = (i: number) => (n === 1 ? 50 : ((xs[i] - x0) / (x1 - x0 || 1)) * 100); // %
  const py = (v: number) => padT + ph - ((v - lo) / (hi - lo || 1)) * ph; // px
  const F = (v: number) => fmt(v, o.formato, o.lang);
  const FE = (v: number) => fmt(v, o.formato === 'eur' ? 'eur0' : o.formato, o.lang);
  let s = `<svg class="graf-svg" width="100%" height="${H}" role="img" aria-labelledby="${id}t ${id}d"><title id="${id}t">${esc(o.titulo)}</title><desc id="${id}d">${esc(o.desc)}</desc>`;
  // Rejilla con el valor encima de cada línea, a la izquierda
  for (const tk of ticks) s += `<line class="g-rej${tk === lo ? ' g-base' : ''}" x1="0" x2="100%" y1="${r1(py(tk))}" y2="${r1(py(tk))}"/><text class="g-eje" x="0" y="${r1(py(tk) - 6)}">${esc(FE(tk))}</text>`;
  // Trazos: SVG interior que se estira a lo ancho (las Y siguen en píxeles)
  s += `<svg x="0" y="0" width="100%" height="${H}" viewBox="0 0 1000 ${H}" preserveAspectRatio="none" overflow="visible" aria-hidden="true">`;
  o.series.forEach((se, k) => {
    const pts = se.valores.map((v, i) => `${r1(px(i) * 10)},${r1(py(v))}`);
    if (o.series.length === 1) s += `<path class="g-area s${k + 1}" d="M${pts[0].split(',')[0]},${padT + ph}L${pts.join('L')}L${pts[n - 1].split(',')[0]},${padT + ph}Z"/>`;
    s += `<path class="g-linea s${k + 1}" d="M${pts.join('L')}" vector-effect="non-scaling-stroke"/>`;
  });
  s += '</svg>';
  // Eje X: etiquetas separadas al menos un 13 % del ancho (la primera y la última siempre); en el móvil, una de cada dos
  const elegidas = [0];
  for (let i = 1; i < n - 1; i++) if (px(i) - px(elegidas[elegidas.length - 1]) >= 13 && px(n - 1) - px(i) >= 13) elegidas.push(i);
  if (n > 1) elegidas.push(n - 1);
  elegidas.forEach((i, k) => {
    const anc = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    const opc = k % 2 === 1 && i !== n - 1;
    s += `<text class="g-x${opc ? ' opc' : ''}" x="${r1(px(i))}%" y="${H - 8}" text-anchor="${anc}">${esc(o.etiquetas[i])}</text>`;
  });
  // Capa de lectura: una franja por punto con la cruz, los puntos y un title con todas las series
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? 0 : i === 0 ? 0 : (px(i - 1) + px(i)) / 2;
    const b = n === 1 ? 100 : i === n - 1 ? 100 : (px(i) + px(i + 1)) / 2;
    const tit = `${o.etiquetas[i]} · ${o.series.map((se) => (o.series.length > 1 ? `${se.nombre}: ` : '') + F(se.valores[i])).join(' · ')}`;
    s += `<g class="g-pt"><title>${esc(tit)}</title><rect x="${r1(a)}%" y="${padT}" width="${r1(b - a)}%" height="${ph}"/><line x1="${r1(px(i))}%" x2="${r1(px(i))}%" y1="${padT}" y2="${padT + ph}"/>${o.series.map((se, k) => `<circle class="s${k + 1}" cx="${r1(px(i))}%" cy="${r1(py(se.valores[i]))}" r="4.5"/>`).join('')}</g>`;
  }
  // Punto y valor final (solo con una serie: con varias, la leyenda y la tabla)
  if (o.series.length === 1) {
    const v = o.series[0].valores[n - 1];
    s += `<circle class="g-fin s1" cx="${r1(px(n - 1))}%" cy="${r1(py(v))}" r="5"/><text class="g-val" x="${r1(px(n - 1))}%" y="${r1(py(v) - 12)}" text-anchor="end">${esc(F(v))}</text>`;
  }
  s += '</svg>';
  const ley = o.series.length > 1 ? `<ul class="graf-ley">${o.series.map((se, k) => `<li><i class="s${k + 1}"></i>${esc(se.nombre)}</li>`).join('')}</ul>` : '';
  return `<figure class="graf"><figcaption><strong>${esc(o.titulo)}</strong>${ley}</figcaption><div class="graf-lienzo">${s}</div></figure>`;
}

export interface OpBarras {
  titulo: string;
  desc: string;
  filas: { e: string; v: number; act?: boolean }[];
  formato: Formato;
  lang: Lang;
  compacto?: boolean;
  nota?: string;
}

/** Barras horizontales: etiqueta y valor en una línea, la barra debajo. Se lee igual a 390 px que a 1440 px. */
export function barras(o: OpBarras): string {
  const id = nuevoId('gb');
  const fila = o.compacto ? 30 : 36, grosor = o.compacto ? 8 : 10;
  const max = Math.max(...o.filas.map((f) => f.v)) || 1;
  const H = o.filas.length * fila + 4;
  const resaltar = o.filas.some((f) => f.act);
  let s = `<svg class="graf-svg" width="100%" height="${H}" role="img" aria-labelledby="${id}t ${id}d"><title id="${id}t">${esc(o.titulo)}</title><desc id="${id}d">${esc(o.desc)}</desc>`;
  o.filas.forEach((f, i) => {
    const y = i * fila;
    const w = Math.max(0.6, (f.v / max) * 100);
    const cls = resaltar ? (f.act ? 's1' : 'g-apagada') : 's1';
    const yb = y + fila - grosor - 6;
    s += `<g class="g-fila${f.act ? ' act' : ''}"><title>${esc(`${f.e}: ${fmt(f.v, o.formato, o.lang)}`)}</title><rect class="g-hit" x="0" y="${y}" width="100%" height="${fila}"/>`
      + `<text class="g-et" x="0" y="${y + 13}">${esc(f.e)}</text><text class="g-num" x="100%" y="${y + 13}" text-anchor="end">${esc(fmt(f.v, o.formato, o.lang))}</text>`
      + `<rect class="g-pista" x="0" y="${yb}" width="100%" height="${grosor}" rx="${grosor / 2}"/>`
      + `<rect class="g-barra ${cls}" x="0" y="${yb}" width="${r1(w)}%" height="${grosor}" rx="4"/>${w > 2 ? `<rect class="g-barra ${cls}" x="0" y="${yb}" width="5" height="${grosor}"/>` : ''}</g>`;
  });
  s += '</svg>';
  return `<figure class="graf"><figcaption><strong>${esc(o.titulo)}</strong>${o.nota ? `<span>${esc(o.nota)}</span>` : ''}</figcaption><div class="graf-lienzo">${s}</div></figure>`;
}

/** Minigráfico de tendencia para las cifras clave (tamaño fijo, sin ejes). */
export function minilinea(valores: number[], titulo: string): string {
  const W = 132, H = 40, n = valores.length;
  const lo = Math.min(...valores), hi = Math.max(...valores);
  const x = (i: number) => r1(3 + (i / (n - 1 || 1)) * (W - 6));
  const y = (v: number) => r1(H - 4 - ((v - lo) / (hi - lo || 1)) * (H - 8));
  const pts = valores.map((v, i) => `${x(i)},${y(v)}`);
  return `<svg class="minig" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(titulo)}"><path class="minig-area" d="M${x(0)},${H}L${pts.join('L')}L${x(n - 1)},${H}Z"/><path class="minig-linea" d="M${pts.join('L')}"/><circle class="minig-fin" cx="${x(n - 1)}" cy="${y(valores[n - 1])}" r="3.5"/></svg>`;
}

/** Barra de reparto de un total (neto, cotizaciones, impuestos…) con leyenda y porcentajes. */
export function reparto(o: { titulo: string; partes: { e: string; v: number }[]; formato: Formato; lang: Lang }): string {
  const id = nuevoId('gr');
  const total = o.partes.reduce((a, p) => a + p.v, 0) || 1;
  let x = 0;
  const pct = (v: number) => fmt(Math.round((v / total) * 1000) / 10, 'pct', o.lang);
  const desc = o.partes.map((p) => `${p.e}: ${fmt(p.v, o.formato, o.lang)} (${pct(p.v)})`).join('; ');
  let s = `<svg class="graf-svg reparto-svg" width="100%" height="18" role="img" aria-labelledby="${id}t ${id}d"><title id="${id}t">${esc(o.titulo)}</title><desc id="${id}d">${esc(desc)}</desc>`;
  o.partes.forEach((p, k) => {
    const w = (p.v / total) * 100;
    s += `<rect class="g-seg s${k + 1}" x="${r1(x)}%" y="0" width="${r1(w)}%" height="18"><title>${esc(`${p.e}: ${pct(p.v)}`)}</title></rect>`;
    x += w;
  });
  s += '</svg>';
  const ley = `<ul class="rep-ley">${o.partes.map((p, k) => `<li><i class="s${k + 1}"></i><span>${esc(p.e)}</span><b>${esc(fmt(p.v, o.formato, o.lang))}</b><small>${esc(pct(p.v))}</small></li>`).join('')}</ul>`;
  return `<figure class="graf graf-rep"><figcaption><strong>${esc(o.titulo)}</strong></figcaption>${s}${ley}</figure>`;
}

// ——— Gráfico de cada ficha de datos, a partir de sus propias tablas ———
type Celda = number | string | { es: string; ca: string };
const txt = (c: Celda, lang: Lang) => (typeof c === 'object' ? t(c, lang) : String(c));
const num = (c: Celda) => (typeof c === 'number' ? c : NaN);

interface ConfFicha {
  tipo: 'linea' | 'barras';
  tabla?: number;
  y: number[]; // columnas con los valores
  x?: number; // columna de la etiqueta (0 por defecto)
  xNumerico?: boolean; // la X es un importe o un año: puntos a su distancia real
  ordenar?: boolean; // barras de mayor a menor
  invertir?: boolean; // la tabla viene de más reciente a más antiguo
  puntos?: boolean; // tipos de interés o índices: la variación de la portada va en puntos, no en %
  titulo: (lang: Lang, cab: string[]) => string;
}
const L = (lang: Lang, es: string, ca: string) => (lang === 'ca' ? ca : es);
const FICHAS: Record<string, ConfFicha> = {
  'smi-historico': { tipo: 'linea', y: [1], invertir: true, titulo: (l) => L(l, 'Salario mínimo mensual (14 pagas) por año', 'Salari mínim mensual (14 pagues) per any') },
  'iprem-historico': { tipo: 'linea', y: [1], invertir: true, titulo: (l) => L(l, 'IPREM mensual por año', 'IPREM mensual per any') },
  'tabla-sueldo-neto': { tipo: 'linea', y: [1], xNumerico: true, titulo: (l) => L(l, 'Neto al mes en 14 pagas según el bruto anual', 'Net al mes en 14 pagues segons el brut anual') },
  'tabla-retencion-irpf': { tipo: 'linea', y: [1, 2, 3, 4], xNumerico: true, titulo: (l) => L(l, 'Retención de IRPF según el bruto y los hijos', 'Retenció d’IRPF segons el brut i els fills') },
  'indemnizacion-por-anos': { tipo: 'linea', y: [2, 4, 5], xNumerico: true, titulo: (l) => L(l, 'Indemnización según los años trabajados (25.000 € brutos)', 'Indemnització segons els anys treballats (25.000 € bruts)') },
  'bases-cotizacion': { tipo: 'barras', y: [1], titulo: (l) => L(l, 'Base mínima mensual por grupo de cotización', 'Base mínima mensual per grup de cotització') },
  'tramos-autonomos': { tipo: 'barras', y: [4], x: 1, titulo: (l) => L(l, 'Cuota mínima al mes según el rendimiento neto', 'Quota mínima al mes segons el rendiment net') },
  'intereses-historico': { tipo: 'linea', y: [1, 2], invertir: true, titulo: (l) => L(l, 'Interés legal del dinero y de demora por año', 'Interès legal dels diners i de demora per any') },
  'escalas-irpf-comunidades': { tipo: 'barras', y: [3], ordenar: true, titulo: (l) => L(l, 'Tipo máximo autonómico del IRPF', 'Tipus màxim autonòmic de l’IRPF') },
  'irpf-por-salario-comunidad': { tipo: 'barras', y: [2], ordenar: true, titulo: (l, c) => L(l, `IRPF anual con ${c[2]} brutos`, `IRPF anual amb ${c[2]} bruts`) },
  'tipo-marginal-comunidades': { tipo: 'barras', y: [5], ordenar: true, titulo: (l) => L(l, 'Tipo marginal máximo (estatal + autonómico)', 'Tipus marginal màxim (estatal + autonòmic)') },
  'minimos-personales': { tipo: 'barras', tabla: 1, y: [1], ordenar: true, titulo: (l) => L(l, 'Mínimo personal autonómico', 'Mínim personal autonòmic') },
  // PisoClaro (src/fichas/vivienda.ts)
  'euribor-historico': { tipo: 'linea', y: [1], invertir: true, puntos: true, titulo: (l) => L(l, 'Euríbor a 12 meses, media mensual', 'Euríbor a 12 mesos, mitjana mensual') },
  'itp-por-comunidad': { tipo: 'barras', y: [2], ordenar: true, titulo: (l) => L(l, 'ITP de una vivienda usada de 200.000 €', 'ITP d’un habitatge usat de 200.000 €') },
  'ajd-por-comunidad': { tipo: 'barras', y: [2], ordenar: true, titulo: (l) => L(l, 'AJD de una vivienda nueva de 250.000 €', 'AJD d’un habitatge nou de 250.000 €') },
  'gastos-compraventa-por-comunidad': { tipo: 'barras', y: [3], ordenar: true, titulo: (l) => L(l, 'Impuestos y gastos de comprar una vivienda de 200.000 €', 'Impostos i despeses de comprar un habitatge de 200.000 €') },
  'coeficientes-plusvalia': { tipo: 'linea', y: [1], xNumerico: true, titulo: (l) => L(l, 'Coeficiente máximo vigente según los años de tenencia', 'Coeficient màxim vigent segons els anys de tinença') },
  'cuota-hipoteca-por-importe': { tipo: 'linea', y: [3, 4], xNumerico: true, titulo: (l) => L(l, 'Cuota mensual según el importe, a 25 y 30 años', 'Quota mensual segons l’import, a 25 i 30 anys') },
  'irav-mensual': { tipo: 'linea', y: [1], invertir: true, puntos: true, titulo: (l) => L(l, 'IRAV mensual', 'IRAV mensual') },
  'aranceles-notaria-registro': { tipo: 'linea', y: [1, 2], xNumerico: true, titulo: (l) => L(l, 'Notaría y registro según el precio (sin IVA)', 'Notaria i registre segons el preu (sense IVA)') },
  'hipotecas-ine': { tipo: 'barras', y: [1], titulo: (l) => L(l, 'Interés medio de las hipotecas sobre vivienda (INE)', 'Interès mitjà de les hipoteques sobre habitatge (INE)') },
  'esfuerzo-hipotecario-por-sueldo': { tipo: 'linea', y: [1, 2, 3], xNumerico: true, titulo: (l) => L(l, 'Hipoteca máxima según el sueldo neto y el esfuerzo', 'Hipoteca màxima segons el sou net i l’esforç') },
  'salario-minimo-estados': { tipo: 'barras', y: [1], ordenar: true, titulo: () => 'Salario mínimo por hora en cada estado' },
  'impuesto-estatal-estados': { tipo: 'barras', y: [3], ordenar: true, titulo: () => 'Impuesto estatal anual con $60,000 (soltero/a)' },
};

/** HTML del gráfico de una ficha o cadena vacía si la ficha no tiene. */
export function graficoFicha(id: string, tablas: Tabla[], lang: Lang): string {
  const c = FICHAS[id];
  if (!c) return '';
  const tb = tablas[c.tabla ?? 0];
  if (!tb) return '';
  let filas = tb.filas.filter((f) => c.y.every((k) => Number.isFinite(num(f[k] as Celda))));
  if (c.invertir) filas = [...filas].reverse();
  if (filas.length < 2) return '';
  const cab = tb.cab.map((x) => t(x, lang));
  const formato = (tb.formatos?.[c.y[0]] ?? 'num') as Formato;
  const xc = c.x ?? 0;
  const titulo = c.titulo(lang, cab);
  if (c.tipo === 'barras') {
    let fs = filas.map((f) => ({ e: txt(f[xc] as Celda, lang), v: num(f[c.y[0]] as Celda) }));
    if (c.ordenar) fs = fs.sort((a, b) => b.v - a.v);
    const hi = fs.reduce((a, b) => (b.v > a.v ? b : a)), lo = fs.reduce((a, b) => (b.v < a.v ? b : a));
    const desc = L(lang, `Gráfico de barras con ${fs.length} valores. Máximo: ${hi.e}, ${fmt(hi.v, formato, lang)}. Mínimo: ${lo.e}, ${fmt(lo.v, formato, lang)}. Todos los valores están en la tabla de abajo.`, `Gràfic de barres amb ${fs.length} valors. Màxim: ${hi.e}, ${fmt(hi.v, formato, lang)}. Mínim: ${lo.e}, ${fmt(lo.v, formato, lang)}. Tots els valors són a la taula de sota.`);
    return barras({ titulo, desc, filas: fs, formato, lang });
  }
  const etiquetas = filas.map((f) => (c.xNumerico && typeof f[xc] === 'number' ? fmt(f[xc] as number, (tb.formatos?.[xc] === 'eur0' ? 'eur0' : 'num0') as Formato, lang) : txt(f[xc] as Celda, lang)));
  const xs = filas.map((f) => (typeof f[xc] === 'number' ? (f[xc] as number) : parseFloat(txt(f[xc] as Celda, lang))));
  const series = c.y.map((k) => ({ nombre: cab[k], valores: filas.map((f) => num(f[k] as Celda)) }));
  const ini = series[0].valores[0], fin = series[0].valores[filas.length - 1];
  const desc = L(lang,
    `Gráfico de líneas de ${etiquetas[0]} a ${etiquetas[etiquetas.length - 1]}. ${series[0].nombre}: de ${fmt(ini, formato, lang)} a ${fmt(fin, formato, lang)}. Todos los valores están en la tabla de abajo.`,
    `Gràfic de línies de ${etiquetas[0]} a ${etiquetas[etiquetas.length - 1]}. ${series[0].nombre}: de ${fmt(ini, formato, lang)} a ${fmt(fin, formato, lang)}. Tots els valors són a la taula de sota.`);
  return linea({ titulo, desc, etiquetas, xs: xs.every(Number.isFinite) ? xs : undefined, series, formato, lang });
}

/** Serie histórica de una ficha (para el minigráfico de las cifras de la portada). */
export function serieFicha(id: string, tablas: Tabla[], lang: Lang): { desde: string; valores: number[]; puntos?: boolean } | null {
  const c = FICHAS[id];
  if (!c || c.tipo !== 'linea' || !c.invertir) return null;
  const k = c.y[c.y.length - 1];
  const filas = tablas[c.tabla ?? 0].filas.filter((f) => Number.isFinite(num(f[k] as Celda))).reverse();
  if (filas.length < 4) return null;
  return { desde: txt(filas[0][c.x ?? 0] as Celda, lang), valores: filas.map((f) => num(f[k] as Celda)), ...(c.puntos ? { puntos: true } : {}) };
}
