/**
 * Atribución de marketing sin cookies de terceros: guarda en el almacenamiento local del navegador el `gclid`
 * (Google Ads) y los `utm_*` de la URL de llegada durante 30 días y los lleva a los metadatos del pago de Stripe,
 * para importar conversiones en Google Ads y saber de qué pieza vino cada venta (marketing/ads/google-ads-diciembre-2026.md).
 * Funciones puras: valen en el cliente y en el servidor.
 */
export const CLAVE_ATRIBUCION = 'ccse.atribucion.v1';
export const DIAS_ATRIBUCION = 30;
export const CLAVES_ATRIBUCION = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign'] as const;
export type Atribucion = Partial<Record<(typeof CLAVES_ATRIBUCION)[number], string>>;

/** Solo las claves conocidas, cadenas de hasta 200 caracteres y sin saltos de línea. */
export function limpiarAtribucion(x: unknown): Atribucion {
  const out: Atribucion = {};
  if (!x || typeof x !== 'object') return out;
  for (const k of CLAVES_ATRIBUCION) {
    const v = (x as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.length > 0 && v.length <= 200 && !/[\r\n]/.test(v)) out[k] = v;
  }
  return out;
}

/** Lee la atribución guardada (cliente). Devuelve `undefined` si no hay nada o ha caducado. */
export function leerAtribucion(): Atribucion | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(CLAVE_ATRIBUCION);
    if (!raw) return undefined;
    const j = JSON.parse(raw) as { t?: number } & Atribucion;
    if (!j.t || Date.now() - j.t > DIAS_ATRIBUCION * 86400_000) return undefined;
    const a = limpiarAtribucion(j);
    return Object.keys(a).length ? a : undefined;
  } catch {
    return undefined;
  }
}

/** Guarda lo que venga en la URL (cliente). Un `gclid` nuevo sustituye al anterior; los utm_* se actualizan si llegan. */
export function guardarAtribucionDesdeUrl(search: string): void {
  if (typeof window === 'undefined') return;
  try {
    const p = new URLSearchParams(search);
    const nuevo: Record<string, string> = {};
    for (const k of CLAVES_ATRIBUCION) { const v = p.get(k); if (v) nuevo[k] = v; }
    if (!Object.keys(nuevo).length) return;
    const previo = nuevo.gclid ? {} : (leerAtribucion() ?? {});
    const a = limpiarAtribucion({ ...previo, ...nuevo });
    window.localStorage.setItem(CLAVE_ATRIBUCION, JSON.stringify({ ...a, t: Date.now() }));
  } catch {}
}
