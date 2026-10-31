import type { Idioma, Texto } from './tipos';
import examenMossos2027 from '@/contenido/blog/examen-mossos-2027.json';

/** Artículos del blog: contenido/blog/<slug>.json, bilingües, sin lógica de pago. */
export type Articulo = {
  slug: string;
  publicado: string;
  actualizado: string;
  palabraClave: Texto;
  titulo: Texto;
  descripcion: Texto;
  h1: Texto;
  intro: Texto;
  secciones: Record<Idioma, { h2: string; parrafos: string[]; lista?: string[] }[]>;
  faq: Record<Idioma, { q: string; a: string }[]>;
  /** Oposición relacionada (slug) para el botón de test gratis. */
  oposicion?: string;
  nota?: Texto;
};

const LISTA: Articulo[] = [examenMossos2027 as unknown as Articulo];

export const articulos = (): Articulo[] => [...LISTA].sort((a, b) => (a.publicado < b.publicado ? 1 : -1));
export const articulo = (slug: string): Articulo | undefined => LISTA.find((a) => a.slug === slug);
