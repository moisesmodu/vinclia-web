// Línea B2B de la familia Claro: calculadoras embebibles para gestorías, asesorías, inmobiliarias y blogs.
// Rutas de las páginas /embed/<slug>/ y «Para profesionales», planes y precios, clientes de marca blanca
// (widget-clientes.json) y enlaces de pago de Stripe (variables PAGO_WIDGET_*). Solo se usa al compilar.
import { createHash } from 'node:crypto';
import type { Lang } from './def';
import { sitio, LANGS, SITIO_ID } from './sitio';
import { slugCalc } from './rutas';
import { texto } from './contenido';
import { logoValido, type MapaPro } from './embed';
import clientesJson from '../../widget-clientes.json';

export const RUTA_PRO: Record<Lang, string> = { es: 'para-profesionales', ca: 'ca/per-a-professionals' };
export const rutaPro = (lang: Lang) => RUTA_PRO[lang];
export const alternasPro = (): Partial<Record<Lang, string>> => Object.fromEntries(LANGS.map((l) => [l, RUTA_PRO[l]]));

export interface RutaEmbed { id: string; lang: Lang; slug: string; ruta: string; completa: string; h1: string }
/** Una página embebible por calculadora e idioma del sitio: /embed/<slug>/ y /ca/embed/<slug>/. */
export function rutasEmbed(lang: Lang): RutaEmbed[] {
  if (!LANGS.includes(lang)) return [];
  return sitio.calculadoras.map((id: string) => {
    const slug = slugCalc(id, lang);
    return { id, lang, slug, ruta: `${lang === 'es' ? '' : `${lang}/`}embed/${slug}`, completa: `${lang === 'es' ? '' : `${lang}/`}${slug}`, h1: texto(SITIO_ID, id, lang).h1 };
  });
}

// ——— Planes (precios finales, IVA incluido: MARCAS.md §3) ———
export const IVA = 0.21;
export const PLANES = {
  gratis: { mes: 0 },
  profesional: { mes: 9, anio: 90, dominios: 1 },
  agencia: { mes: 29, dominios: 10 },
} as const;
export const sinIva = (x: number) => Math.round((x / (1 + IVA)) * 100) / 100;

/** Payment Links de Stripe (scripts/stripe-widget.mjs). Sin ellos, la página muestra «Pedir acceso» por correo. */
export function pagosWidget() {
  const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) || '';
  const ok = (u: string) => (/^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//.test(u) ? u : '');
  return { proMes: ok(env('PAGO_WIDGET_PRO_MES_URL')), proAnio: ok(env('PAGO_WIDGET_PRO_ANIO_URL')), agencia: ok(env('PAGO_WIDGET_AGENCIA_URL')) };
}

// ——— Marca blanca sin backend (versión 1) ———
export interface Cliente { cliente: string; dominio: string; clave: string; plan: string; color?: string; logo?: string; alta?: string; activo?: boolean; notas?: string }

/** Clave de un cliente: SHA-256 de «cliente:dominio», 24 cifras hexadecimales. */
export const claveCliente = (cliente: string, dominio: string) =>
  createHash('sha256').update(`${cliente.trim().toLowerCase()}:${dominio.trim().toLowerCase().replace(/^www\./, '')}`).digest('hex').slice(0, 24);

/** Errores de widget-clientes.json (vacío = correcto). Lo usan las pruebas y la compilación. */
export function erroresClientes(lista: Cliente[]): string[] {
  const e: string[] = [];
  const vistas = new Set<string>();
  for (const c of lista) {
    const k = `${c.cliente}:${c.dominio}`;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(c.cliente)) e.push(`${k}: «cliente» solo admite minúsculas, cifras y guiones`);
    if (!/^(localhost|([a-z0-9-]+\.)+[a-z]{2,})$/.test(c.dominio)) e.push(`${k}: dominio no válido`);
    if (c.clave !== claveCliente(c.cliente, c.dominio)) e.push(`${k}: la clave no es el hash de cliente:dominio (debería ser ${claveCliente(c.cliente, c.dominio)})`);
    if (vistas.has(c.clave)) e.push(`${k}: clave repetida`);
    vistas.add(c.clave);
    if (c.color && !/^#[0-9a-fA-F]{6}$/.test(c.color)) e.push(`${k}: color no válido (formato #rrggbb)`);
    if (c.logo && !logoValido(c.logo)) e.push(`${k}: el logo debe ser una URL https:// o una imagen data:`);
    if (!['profesional', 'agencia', 'prueba'].includes(c.plan)) e.push(`${k}: plan desconocido «${c.plan}»`);
  }
  // Agencia: hasta 10 dominios por cliente; Profesional: 1
  const porCliente = new Map<string, Cliente[]>();
  for (const c of lista) porCliente.set(c.cliente, [...(porCliente.get(c.cliente) ?? []), c]);
  for (const [n, cs] of porCliente) {
    const activos = cs.filter((c) => c.activo !== false);
    const max = activos.some((c) => c.plan === 'agencia') ? PLANES.agencia.dominios : activos.some((c) => c.plan === 'profesional') ? PLANES.profesional.dominios : Infinity;
    if (activos.length > max) e.push(`${n}: ${activos.length} dominios activos, su plan admite ${max}`);
  }
  return e;
}

export const CLIENTES: Cliente[] = (clientesJson as { clientes: Cliente[] }).clientes;

/** Lo que se hornea en cada página embed: solo clientes activos, sin nombres comerciales ni notas. */
export function mapaPro(lista: Cliente[] = CLIENTES): MapaPro {
  const e = erroresClientes(lista);
  if (e.length) throw new Error(`widget-clientes.json:\n${e.join('\n')}`);
  const m: MapaPro = {};
  for (const c of lista) {
    if (c.activo === false) continue;
    const x = (m[c.clave] ??= { d: [] });
    x.d.push(c.dominio);
    if (c.color) x.c = c.color;
    if (c.logo) x.l = c.logo;
  }
  return m;
}
