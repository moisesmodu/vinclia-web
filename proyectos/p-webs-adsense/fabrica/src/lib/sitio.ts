// Configuración del sitio que se está construyendo (SITIO) con los valores que se pueden pasar por entorno.
import type { Lang } from './def';
const sitios = import.meta.glob('../../sitios/*/sitio.json', { eager: true, import: 'default' }) as Record<string, any>;
export const SITIO_ID: string = (import.meta.env.SITIO as string) || 'nomina';
const base = sitios[`../../sitios/${SITIO_ID}/sitio.json`];
if (!base) throw new Error(`No existe sitios/${SITIO_ID}/sitio.json`);

const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) || '';

export const sitio = {
  ...base,
  adsense: {
    cliente: env('ADSENSE_CLIENT') || base.adsense.cliente,
    slots: {
      bajoResultado: env('ADSENSE_SLOT_RESULTADO') || base.adsense.slots.bajoResultado,
      finContenido: env('ADSENSE_SLOT_FINAL') || base.adsense.slots.finContenido,
    },
  },
  // Datos del titular desde los secretos del entorno (DESPLIEGUES.md §1) si existen
  titular: {
    nombre: env('LEGAL_NOM') || base.titular.nombre,
    nif: env('LEGAL_NIF') || base.titular.nif,
    domicilio: env('LEGAL_ADRECA') || base.titular.domicilio,
    email: env('LEGAL_EMAIL_SITIO') || env('LEGAL_EMAIL') || base.titular.email,
  },
  umami: { src: env('UMAMI_SRC') || base.umami.src, id: env('UMAMI_ID') || base.umami.id },
  searchConsole: { verificacion: env('GSC_VERIFICACION') || base.searchConsole.verificacion },
};

export const LANGS: Lang[] = base.idiomas;
export const anunciosActivos = () => /^ca-pub-\d{10,}$/.test(sitio.adsense.cliente);
export const pubId = () => sitio.adsense.cliente.replace(/^ca-/, '');
