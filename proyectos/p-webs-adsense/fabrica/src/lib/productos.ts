// Productos digitales propios (productos.json): página de venta, bloque «Producto propio» bajo el resultado y página
// de descarga tras el pago. Se cobra con un Payment Link de Stripe que llega por la variable «variablePago»
// (scripts/stripe-productos.mjs la imprime). Sin enlace, la página dice «Disponible muy pronto» y el bloque no sale.
import datos from '../../productos.json';
import { SITIO_ID } from './sitio';
import { fmt } from './render';
import type { Lang } from './def';

type Txt = { es: string; ca?: string };
export interface Archivo { archivo: string; tipo: 'xlsx' | 'pdf'; nombre: Txt }
export interface Producto {
  id: string; sitio: string; nombre: Txt; ruta: Txt; precio: number; moneda: 'eur' | 'usd'; token: string; variablePago: string;
  calculadoras: string[]; archivos: Archivo[]; frase: Txt; cta: Txt; descripcion: Txt; titular: Txt;
  incluye: { t: Txt; d: Txt }[]; faq: { p: Txt; r: Txt }[]; capturas: { hoja?: string; pdf?: number; alt: Txt }[];
}
export interface Captura { n: number; alt: Txt; tipo: string; ancho: number; alto: number; webp: Record<'640' | '1280', string> }

const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) || '';
const indices = import.meta.glob('../../public/productos/*/indice.json', { eager: true, import: 'default' }) as Record<string, Captura[]>;

export const tx = (x: Txt, lang: Lang) => x[lang] ?? x.es;
export const productosSitio = (): Producto[] => (datos.productos as unknown as Producto[]).filter((p) => p.sitio === SITIO_ID);
export const producto = (id: string) => productosSitio().find((p) => p.id === id);

/** Payment Link de Stripe del producto (solo buy.stripe.com o checkout.stripe.com por https). */
export function enlacePago(p: Producto): string {
  const u = env(p.variablePago).trim();
  return /^https:\/\/(buy|checkout)\.stripe\.com\/[\w/-]+$/.test(u) ? u : '';
}

/** Producto que se ofrece bajo el resultado de una calculadora: solo si se puede comprar ya. */
export function productoPara(calc: string): Producto | null {
  return productosSitio().find((p) => p.calculadoras.includes(calc) && enlacePago(p)) ?? null;
}

export const precio = (p: Producto, lang: Lang) => fmt(p.precio, 'eur', lang, p.moneda.toUpperCase(), p.moneda === 'usd' ? 'es-US' : undefined);
export const capturas = (p: Producto): Captura[] => indices[`../../public/productos/${p.id}/indice.json`] ?? [];
