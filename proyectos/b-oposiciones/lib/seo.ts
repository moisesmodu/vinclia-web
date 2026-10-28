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
