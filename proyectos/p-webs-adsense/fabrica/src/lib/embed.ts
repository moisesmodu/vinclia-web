// Lógica pura del widget embebible (sin DOM ni Node): la usan la página /embed/… en el navegador y las pruebas.
// Opciones por URL: ?color=<hex> (acento), ?tema=oscuro|claro, ?pro=<clave> (marca blanca) y los campos de la
// calculadora con su id (?bruto=30000), que lee cliente.ts igual que en la página completa.

export interface OpcionesEmbed { color: string | null; tema: 'claro' | 'oscuro'; pro: string | null }
/** Datos de marca blanca que se hornean en cada página embed: clave → dominios permitidos, color y logo. */
export interface ClientePro { d: string[]; c?: string; l?: string; n?: string }
export type MapaPro = Record<string, ClientePro>;

/** Color en hexadecimal de 3 o 6 cifras, con o sin «#». Devuelve «#rrggbb» en minúsculas o null. */
export function colorValido(x: string | null | undefined): string | null {
  const s = String(x ?? '').trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-f]{3}$/.test(s)) return `#${s.split('').map((c) => c + c).join('')}`;
  return null;
}

export function leerOpciones(search: string): OpcionesEmbed {
  const q = new URLSearchParams(search);
  const pro = (q.get('pro') ?? '').trim();
  return {
    color: colorValido(q.get('color')),
    tema: q.get('tema') === 'oscuro' ? 'oscuro' : 'claro',
    pro: /^[0-9a-f]{16,64}$/i.test(pro) ? pro.toLowerCase() : null,
  };
}

/** Nombre de host de un origen o URL («https://www.gestoria.es:443/x» → «gestoria.es»). */
export function hostDe(origen: string | null | undefined): string {
  if (!origen) return '';
  try { return new URL(origen).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

/** El host coincide con el dominio contratado o es un subdominio suyo (no vale «gestoria.es.evil.com» ni «xgestoria.es»). */
export function dominioPermitido(host: string, dominio: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, ''), d = dominio.toLowerCase().replace(/^www\./, '');
  return !!h && !!d && (h === d || h.endsWith('.' + d));
}

/**
 * Marca blanca: la clave existe y la web que incrusta el iframe está en un dominio del cliente.
 * `origenPadre` sale de location.ancestorOrigins (Chrome, Safari) o de document.referrer (Firefox). Si no se
 * conoce el origen, se falla cerrado: se muestra el enlace.
 */
export function resolverPro(mapa: MapaPro, clave: string | null, origenPadre: string): ClientePro | null {
  if (!clave) return null;
  const c = mapa[clave];
  if (!c) return null;
  const host = hostDe(origenPadre);
  return c.d.some((d) => dominioPermitido(host, d)) ? c : null;
}

/** Logo admitido: https:// o una imagen en data: (nunca javascript: ni http:). */
export const logoValido = (x: string | undefined): boolean => !!x && (/^https:\/\/[^\s"'<>]+$/.test(x) || /^data:image\/(svg\+xml|png|webp|jpeg)[;,][^"'<>\s]+$/.test(x));
