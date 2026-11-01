import type { Idioma } from './tipos';
import { urlBase } from './datos';

/** URLs canónicas y alternativas por idioma (hreflang). `ruta` sin idioma, empezando por "/" o vacía. */
export function alternates(idioma: Idioma, ruta: string) {
  const b = urlBase();
  return {
    canonical: `${b}/${idioma}${ruta}`,
    languages: { ca: `${b}/ca${ruta}`, es: `${b}/es${ruta}`, 'x-default': `${b}/ca${ruta}` },
  };
}

export function jsonLd(obj: unknown) {
  return { __html: JSON.stringify(obj).replace(/</g, '\\u003c') };
}

/** Imagen de Open Graph de la marca (app/[lang]/opengraph-image.tsx). Hay que repetirla cuando una página define su propio openGraph. */
export const imagenOg = (idioma: Idioma) => [{ url: `/${idioma}/opengraph-image`, width: 1200, height: 630, alt: 'Oposita' }];
