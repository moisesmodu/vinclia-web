import type { Metadata } from 'next';
import type { Idioma } from './tipos';
import { marca, urlBase } from './datos';

/** Metadades per pàgina: títol i descripció propis, canònica, hreflang ca/es amb x-default i Open Graph. `noIndex` per a les pantalles d'app. */
export function meta(idioma: Idioma, cami: string, titol: string, descripcio: string, opcions: { noIndex?: boolean } = {}): Metadata {
  const base = urlBase();
  const url = `${base}/${idioma}${cami}`;
  return {
    title: titol,
    description: descripcio,
    alternates: { canonical: url, languages: { ca: `${base}/ca${cami}`, es: `${base}/es${cami}`, 'x-default': `${base}/ca${cami}` } },
    openGraph: { title: `${titol} · ${marca.nombre}`, description: descripcio, url, siteName: marca.nombre, locale: idioma === 'ca' ? 'ca_ES' : 'es_ES', type: 'website', images: [{ url: `${base}/og/aprova-${idioma}.png`, width: 1200, height: 630, alt: `${marca.nombre} · ${marca.lema[idioma]}` }] },
    twitter: { card: 'summary_large_image', title: `${titol} · ${marca.nombre}`, description: descripcio, images: [`${base}/og/aprova-${idioma}.png`] },
    robots: opcions.noIndex ? { index: false, follow: true } : undefined,
  };
}
