import type { T, Tabla, Lang } from '../lib/def';
import type { Bloques } from '../lib/params';
export interface Ficha {
  id: string;
  slug: T;
  titulo: T; // <title>
  h1: T;
  descripcion: T;
  intro: T; // HTML corto: qué es el dato y para qué sirve
  fuentes: { nombre: T | string; url: string }[];
  calc?: string; // calculadora relacionada
  /** Tablas de la ficha. anio = año de parámetros por defecto. */
  tablas: (ctx: { P: Bloques; lang: Lang; anio: number; sitio: string }) => Tabla[];
}
