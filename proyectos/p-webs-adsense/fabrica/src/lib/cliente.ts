// Código de navegador común a todas las calculadoras: lee el formulario, recalcula al escribir,
// guarda el estado en la URL (enlace para compartir) y permite imprimir o guardar en PDF.
import { renderResultado, fmt } from './render';
import { params } from './params';
import type { DefCalc, Lang } from './def';

// Calculadoras del país del sitio: las de EE. UU. empiezan por «us-». Con PAIS constante (astro.config.mjs) el
// empaquetador no genera trozos de JavaScript para las calculadoras del otro país.
const ES = import.meta.glob(['../calculadoras/*.ts', '!../calculadoras/us-*.ts']);
const US = import.meta.glob('../calculadoras/us-*.ts');
const PAIS = import.meta.env.PAIS as string | undefined;
const defs = PAIS === 'us' ? US : PAIS === 'es' ? ES : { ...ES, ...US };

function leer(form: HTMLFormElement, d: DefCalc): Record<string, any> {
  const v: Record<string, any> = {};
  for (const c of d.campos) {
    const el = form.elements.namedItem(c.id) as HTMLInputElement | HTMLSelectElement | null;
    if (!el) { v[c.id] = c.def; continue; }
    if (c.tipo === 'numero') {
      const n = parseFloat(String(el.value).replace(/\s/g, '').replace(',', '.'));
      v[c.id] = Number.isFinite(n) ? n : 0;
    } else if (c.tipo === 'casilla') v[c.id] = (el as HTMLInputElement).checked;
    else v[c.id] = el.value;
  }
  const a = form.elements.namedItem('anio') as HTMLSelectElement | null;
  if (a) v.anio = Number(a.value);
  return v;
}

function visibilidad(form: HTMLFormElement, d: DefCalc, v: Record<string, any>) {
  for (const c of d.campos) {
    if (!c.si) continue;
    const w = form.querySelector<HTMLElement>(`[data-campo="${c.id}"]`);
    if (w) w.hidden = !c.si(v);
  }
}

// La cifra principal cuenta desde el valor anterior hasta el nuevo (solo si el usuario no pide menos movimiento)
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
function animar(out: HTMLElement, antes: number | null, lang: Lang) {
  const o = out.querySelector<HTMLElement>('.res-val[data-n]');
  if (!o) return;
  const fin = Number(o.dataset.n), f = o.dataset.f as any;
  o.classList.remove('pulso'); void o.offsetWidth; o.classList.add('pulso');
  if (quieto || antes == null || antes === fin || !Number.isFinite(antes)) return;
  const t0 = performance.now(), dur = 450, final = o.textContent;
  const paso = (t: number) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    o.textContent = k < 1 ? fmt(antes + (fin - antes) * e, f, lang) : final;
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

// Barra fija en el móvil con la cifra principal: visible mientras la calculadora está en pantalla pero el resultado no
function barraMovil(el: HTMLElement, out: HTMLElement) {
  const b = el.querySelector<HTMLElement>('.calc-fija');
  if (!b || !('IntersectionObserver' in window)) return () => {};
  let enCalc = false, enRes = true;
  const ver = () => { b.hidden = !enCalc || enRes; };
  const io = new IntersectionObserver((es) => { for (const e of es) { if (e.target === out) enRes = e.isIntersecting; else enCalc = e.isIntersecting; } ver(); });
  io.observe(out); io.observe(el.querySelector('form')!);
  b.addEventListener('click', () => out.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' }));
  const pintar = () => {
    const et = out.querySelector('.res-et')?.textContent ?? '', val = out.querySelector<HTMLElement>('.res-val');
    b.querySelector('.cf-et')!.textContent = et;
    b.querySelector('.cf-val')!.textContent = val?.dataset.n ? fmt(Number(val.dataset.n), val.dataset.f as any, el.dataset.lang as Lang) : val?.textContent ?? '';
    b.querySelector('.cf-barra')!.innerHTML = out.querySelector('.reparto-barra')?.innerHTML ?? '';
  };
  pintar();
  return pintar;
}

// Deslizador del importe principal: refleja el número (y al revés) y pinta el tramo recorrido con --p
function deslizar(form: HTMLFormElement, objetivo: EventTarget | null, lang: Lang) {
  const t = objetivo as HTMLInputElement | null;
  const r = t?.classList?.contains('rango') ? t : t?.name ? form.querySelector<HTMLInputElement>(`[data-rango="${t.name}"]`) : null;
  if (!r) return;
  const n = form.elements.namedItem(r.dataset.rango!) as HTMLInputElement;
  if (t === r) n.value = r.value; else r.value = String(parseFloat(n.value.replace(',', '.')) || 0);
  const min = +r.min, max = +r.max, x = Math.min(max, Math.max(min, +r.value));
  r.parentElement!.style.setProperty('--p', `${((x - min) / (max - min)) * 100}%`);
  r.setAttribute('aria-valuetext', fmt(parseFloat(n.value.replace(',', '.')) || 0, 'eur0', lang));
}

async function iniciar(el: HTMLElement) {
  const id = el.dataset.calc!;
  const lang = el.dataset.lang as Lang;
  const pais = el.dataset.pais!;
  const anioDef = Number(el.dataset.anio);
  const carga = defs[`../calculadoras/${id}.ts`];
  if (!carga) return;
  const d: DefCalc = ((await carga()) as any).default;
  const form = el.querySelector('form')!;
  const out = el.querySelector<HTMLElement>('.res')!;
  const defaults: Record<string, string> = {};
  for (const c of d.campos) defaults[c.id] = String(c.def);
  defaults.anio = String(anioDef);

  const qs = new URLSearchParams(el.classList.contains('mini') ? '' : location.search);
  let desdeUrl = false;
  qs.forEach((val, k) => {
    const inp = form.elements.namedItem(k) as HTMLInputElement | null;
    if (!inp) return;
    desdeUrl = true;
    if (inp.type === 'checkbox') inp.checked = val === '1';
    else inp.value = val;
    deslizar(form, inp, lang);
  });

  let contado = false;
  const fija = barraMovil(el, out);
  const mini = el.classList.contains('mini');
  const enlace = el.querySelector<HTMLAnchorElement>('[data-completa]');
  const calcular = () => {
    const antes = Number(out.querySelector<HTMLElement>('.res-val[data-n]')?.dataset.n ?? NaN);
    const v = leer(form, d);
    visibilidad(form, d, v);
    try {
      const r = d.calcular(v, { P: params(pais, v.anio ?? anioDef), lang, pais });
      // Los tramos de la barra parten de su tamaño anterior para que la transición se vea al recalcular
      const viejos = [...out.querySelectorAll<HTMLElement>('.reparto-barra .rp')].map((s) => s.style.flexGrow);
      out.innerHTML = renderResultado(r, lang);
      const nuevos = out.querySelectorAll<HTMLElement>('.reparto-barra .rp');
      if (!quieto && viejos.length === nuevos.length) nuevos.forEach((s, i) => { const f = s.style.flexGrow; s.style.flexGrow = viejos[i]; requestAnimationFrame(() => requestAnimationFrame(() => { s.style.flexGrow = f; })); });
      out.classList.remove('error');
      animar(out, Number.isFinite(antes) ? antes : null, lang);
      fija();
    } catch {
      out.classList.add('error');
    }
    const q = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) {
      const s = typeof val === 'boolean' ? (val ? '1' : '0') : String(val);
      const def = defaults[k] === 'true' ? '1' : defaults[k] === 'false' ? '0' : defaults[k];
      if (s !== def) q.set(k, s);
    }
    if (mini) { if (enlace) enlace.search = q.toString(); }
    // En el widget (/embed/…) la URL lleva ?color, ?tema y ?pro: no se reescribe
    else if (!document.documentElement.hasAttribute('data-embed')) history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    if (!contado) {
      contado = true;
      try { (window as any).umami?.track('calculo', { calc: id }); } catch {}
    }
  };
  let tmr: number | undefined;
  form.addEventListener('input', (e) => { deslizar(form, e.target, lang); clearTimeout(tmr); tmr = window.setTimeout(calcular, 120); });
  form.addEventListener('change', calcular);
  form.addEventListener('submit', (e) => { e.preventDefault(); calcular(); });
  el.querySelector('[data-accion="compartir"]')?.addEventListener('click', async (ev) => {
    const b = ev.currentTarget as HTMLButtonElement;
    try {
      if (navigator.share) await navigator.share({ url: location.href, title: document.title });
      else { await navigator.clipboard.writeText(location.href); b.dataset.ok = '1'; setTimeout(() => delete b.dataset.ok, 2000); }
    } catch {}
  });
  el.querySelector('[data-accion="imprimir"]')?.addEventListener('click', () => window.print());
  if (desdeUrl) calcular();
  else visibilidad(form, d, leer(form, d));
}

document.querySelectorAll<HTMLElement>('[data-calc]').forEach((el) => { iniciar(el); });
