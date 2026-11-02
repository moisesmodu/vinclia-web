import type { ClaveProyecto } from '@/lib/control/comun';
import { EQUIPO_VERCEL } from '@/lib/control/comun';

// Las ocho webs en producción. El color de serie es fijo por web (paleta validada para el fondo oscuro,
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
};

export const WEBS: Web[] = [
  { slug: 'a-ccse', nombre: 'CCSE Fácil', dominio: 'ccsefacil.com', web: 'https://ccsefacil.com', vercel: 'ccse-en-tu-idioma', repo: 'a-ccse', control: 'A', stripe: 'a-ccse', serie: '#3987e5', modelo: 'Pago único' },
  { slug: 'n-nuevo-en-espana', nombre: 'Tus Papeles', dominio: 'tuspapeles.app', web: 'https://tuspapeles.app', vercel: 'nuevo-en-espana', repo: 'n-nuevo-en-espana', control: 'N', stripe: 'n-nuevo-en-espana', serie: '#d95926', modelo: 'Suscripción o pack' },
  { slug: 'b-oposiciones', nombre: 'Oposita', dominio: 'oposita.digital', web: 'https://oposita.digital', vercel: 'placa-oposicions', repo: 'b-oposiciones', control: 'B', stripe: 'b-oposiciones', serie: '#199e70', modelo: 'Suscripción' },
  { slug: 'g-cuentos', nombre: 'Lunilla', dominio: 'lunilla.cat', web: 'https://lunilla.cat', vercel: 'lunilla', repo: 'g-cuentos', control: 'G', stripe: 'g-cuentos', serie: '#c98500', modelo: 'Pedido' },
  { slug: 'm-catala', nombre: 'Aprova', dominio: 'aprova-catala.vercel.app', web: 'https://aprova-catala.vercel.app', vercel: 'aprova-catala', repo: 'm-catala', control: 'M', stripe: 'm-catala', serie: '#d55181', modelo: 'Suscripción o pase' },
  { slug: 'juegos', nombre: 'Nuvolet Games', dominio: 'juegos-casuales.vercel.app', web: 'https://juegos-casuales.vercel.app', vercel: 'juegos-casuales', repo: 'juegos', control: null, stripe: null, serie: '#008300', modelo: 'Publicidad en portales' },
  { slug: 'netoclaro', nombre: 'NetoClaro', dominio: 'netoclaro.app', web: 'https://netoclaro.app', vercel: 'netoclaro', repo: 'p-webs-adsense', control: null, stripe: null, serie: '#9085e9', modelo: 'AdSense y afiliados' },
  { slug: 'impuestoclaro', nombre: 'ImpuestoClaro', dominio: 'impuestoclaro.es', web: 'https://impuestoclaro.es', vercel: 'impuestoclaro', repo: 'p-webs-adsense', control: null, stripe: null, serie: '#e66767', modelo: 'AdSense y afiliados' },
];

export const webPorSlug = (s: string) => WEBS.find((w) => w.slug === s);
export const webPorStripe = (s: string | null) => (s ? WEBS.find((w) => w.stripe === s) : undefined);
export const WEBS_PAGO = WEBS.filter((w) => w.stripe);

export const enlaces = (w: Web) => ({
  web: w.web,
  vercel: `https://vercel.com/${EQUIPO_VERCEL}/${w.vercel}`,
  analytics: `https://vercel.com/${EQUIPO_VERCEL}/${w.vercel}/analytics`,
  logs: `https://vercel.com/${EQUIPO_VERCEL}/${w.vercel}/logs?levels=error`,
  searchConsole: `https://search.google.com/search-console?resource_id=${encodeURIComponent(w.dominio.endsWith('.vercel.app') ? w.web + '/' : 'sc-domain:' + w.dominio)}`,
  stripe: w.stripe ? `https://dashboard.stripe.com/search?query=${encodeURIComponent(w.stripe)}` : null,
});
