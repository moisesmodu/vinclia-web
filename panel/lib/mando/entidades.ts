import type { ClaveProyecto } from '@/lib/control/comun';
import { EQUIPO_VERCEL } from '@/lib/control/comun';

// Las webs en producción. El color de serie es fijo por web (paleta validada para el fondo oscuro,
// dataviz: orden adyacente que pasa CVD y visión normal) y nunca cambia al filtrar.
export type Web = {
  slug: string;            // ruta /proyectos/<slug>/
  nombre: string;
  dominio: string;
  web: string;
  vercel: string;          // nombre del proyecto en Vercel
  repo: string;            // clave en proyectos.json y en marcas/tokens.json
  control: ClaveProyecto | null; // base de datos y metadata.proyecto de Stripe
  stripe: string | null;   // metadata.proyecto
  serie: string;           // color de la serie en los gráficos
  modelo: string;
  otros?: { dominio: string; web: string; vercel: string }[]; // más webs del mismo proyecto (semáforo, visitas, errores)
  visitasEn?: string;      // sin Web Analytics propio: sus visitas se cuentan en la web con este slug
  nota?: string;           // de dónde salen los datos, si no es lo habitual
  stripeUrl?: string;      // enlace a Stripe cuando no hay metadata.proyecto que buscar
  dominioSc?: string;      // propiedad de Search Console, si no es el dominio de la web
  plan?: boolean;          // false: no tiene plan en /p/<repo>/
};

const NOTA_NUMI =
  'Numi Mates (app, pro y ment.numimates.com) y Numitech (tech.numimates.com) son la misma app (proyecto mates-numi) con una sola base de datos y la misma cuenta de Stripe. '
  + 'Pagos y suscripciones: el producto «Numi Mates Premium» no lleva metadata.proyecto; se separan por la descripción de la suscripción («Numi Tech Premium» frente a «Numi Mates/Pro/Ment Premium») y por la URL de vuelta del Checkout (tech.numimates.com). '
  + 'Usuarios: tabla mates.alumnes, separados por state.variant = tech (solo lectura, variable DB_RO_NUMI). '
  + 'Visitas: Web Analytics no distingue subdominios, así que las de tech.numimates.com se cuentan en Numi Mates junto a app, pro, ment y numimates.com.';

export const WEBS: Web[] = [
  { slug: 'a-ccse', nombre: 'CCSE Fácil', dominio: 'ccsefacil.com', web: 'https://ccsefacil.com', vercel: 'ccse-en-tu-idioma', repo: 'a-ccse', control: 'A', stripe: 'a-ccse', serie: '#3987e5', modelo: 'Pago único' },
  { slug: 'n-nuevo-en-espana', nombre: 'Tus Papeles', dominio: 'tuspapeles.app', web: 'https://tuspapeles.app', vercel: 'nuevo-en-espana', repo: 'n-nuevo-en-espana', control: 'N', stripe: 'n-nuevo-en-espana', serie: '#d95926', modelo: 'Suscripción o pack' },
  { slug: 'b-oposiciones', nombre: 'Oposita', dominio: 'oposita.digital', web: 'https://oposita.digital', vercel: 'placa-oposicions', repo: 'b-oposiciones', control: 'B', stripe: 'b-oposiciones', serie: '#199e70', modelo: 'Suscripción' },
  { slug: 'g-cuentos', nombre: 'Lunilla', dominio: 'lunilla.cat', web: 'https://lunilla.cat', vercel: 'lunilla', repo: 'g-cuentos', control: 'G', stripe: 'g-cuentos', serie: '#c98500', modelo: 'Pedido' },
  { slug: 'm-catala', nombre: 'Aprova', dominio: 'aprova-catala.vercel.app', web: 'https://aprova-catala.vercel.app', vercel: 'aprova-catala', repo: 'm-catala', control: 'M', stripe: 'm-catala', serie: '#d55181', modelo: 'Suscripción o pase' },
  { slug: 'juegos', nombre: 'Nuvolet Games', dominio: 'juegos-casuales.vercel.app', web: 'https://juegos-casuales.vercel.app', vercel: 'juegos-casuales', repo: 'juegos', control: null, stripe: null, serie: '#008300', modelo: 'Publicidad en portales' },
  { slug: 'netoclaro', nombre: 'NetoClaro', dominio: 'netoclaro.app', web: 'https://netoclaro.app', vercel: 'netoclaro', repo: 'p-webs-adsense', control: null, stripe: null, serie: '#9085e9', modelo: 'AdSense y afiliados' },
  { slug: 'impuestoclaro', nombre: 'ImpuestoClaro', dominio: 'impuestoclaro.es', web: 'https://impuestoclaro.es', vercel: 'impuestoclaro', repo: 'p-webs-adsense', control: null, stripe: null, serie: '#e66767', modelo: 'AdSense y afiliados' },
  // Numitech va antes que Numi Mates solo por el orden de las series: así el violeta de Numi Mates nunca queda junto al
  // rosa de Aprova (paleta validada: ingresos A·N·B·G·M·Numitech·Numi Mates y visitas …·ImpuestoClaro·Numi Mates).
  { slug: 'numitech', nombre: 'Numitech', dominio: 'tech.numimates.com', web: 'https://tech.numimates.com', vercel: 'mates-numi', repo: 'numitech', control: 'NT', stripe: 'numitech', serie: '#1aa7b8', modelo: 'Suscripción Premium', visitasEn: 'numi-mates', nota: NOTA_NUMI, stripeUrl: 'https://dashboard.stripe.com/products/prod_VLgAQ0Jx1ACLhX', dominioSc: 'numimates.com', plan: false },
  { slug: 'numi-mates', nombre: 'Numi Mates', dominio: 'app.numimates.com', web: 'https://app.numimates.com', vercel: 'mates-numi', repo: 'numi-mates', control: 'NM', stripe: 'numi-mates', serie: '#a35bc9', modelo: 'Suscripción Premium', otros: [{ dominio: 'numimates.com', web: 'https://numimates.com', vercel: 'numimates-web' }], nota: NOTA_NUMI, stripeUrl: 'https://dashboard.stripe.com/products/prod_VLgAQ0Jx1ACLhX', dominioSc: 'numimates.com', plan: false },
];

/** Orden para mostrar (tarjetas, semáforo): Numi Mates antes que Numitech. */
export const WEBS_VISTA = [...WEBS].sort((a, b) => (a.slug === 'numi-mates' && b.slug === 'numitech' ? -1 : a.slug === 'numitech' && b.slug === 'numi-mates' ? 1 : 0));
/** Proyectos de Vercel con Web Analytics propio (sin repetir). */
export const PROYECTOS_VERCEL = [...new Set(WEBS.flatMap((w) => [w.vercel, ...(w.otros ?? []).map((o) => o.vercel)]))];
export const vercelDe = (w: Web) => [w.vercel, ...(w.otros ?? []).map((o) => o.vercel)];

export const webPorSlug = (s: string) => WEBS.find((w) => w.slug === s);
export const webPorStripe = (s: string | null) => (s ? WEBS.find((w) => w.stripe === s) : undefined);
export const WEBS_PAGO = WEBS.filter((w) => w.stripe);

export const enlaces = (w: Web) => ({
  web: w.web,
  vercel: `https://vercel.com/${EQUIPO_VERCEL}/${w.vercel}`,
  analytics: `https://vercel.com/${EQUIPO_VERCEL}/${w.vercel}/analytics`,
  logs: `https://vercel.com/${EQUIPO_VERCEL}/${w.vercel}/logs?levels=error`,
  searchConsole: `https://search.google.com/search-console?resource_id=${encodeURIComponent(w.dominio.endsWith('.vercel.app') ? w.web + '/' : 'sc-domain:' + (w.dominioSc ?? w.dominio))}`,
  stripe: w.stripeUrl ?? (w.stripe ? `https://dashboard.stripe.com/search?query=${encodeURIComponent(w.stripe)}` : null),
});
