import type { Bi, ColeccionId } from "../catalogo";

/** Franja de edad: cada colección tiene un cuento distinto para peques y para mayores. */
export type Banda = "peques" | "mayores";

export const BANDAS: Record<Banda, { edades: [number, number]; paginas: number; maxCaracteres: number; etiqueta: Bi }> = {
  // 2–4 años: frases cortas, repetición, onomatopeyas, una idea por página.
  peques: { edades: [2, 4], paginas: 18, maxCaracteres: 300, etiqueta: { es: "2 a 4 años", ca: "2 a 4 anys" } },
  // 5–8 años: más trama, diálogos, un pequeño giro y una decisión del protagonista.
  mayores: { edades: [5, 8], paginas: 22, maxCaracteres: 480, etiqueta: { es: "5 a 8 años", ca: "5 a 8 anys" } },
};

export const bandaDe = (edad: number): Banda => (edad <= 4 ? "peques" : "mayores");

export interface PaginaPlantilla {
  /** Texto con marcadores: {nombre}, {Elnom}, {compa}, {ciudad}, {tema.problema}, {a|b}... */
  texto: Bi;
  /**
   * Escena para la ilustración, en inglés. Marcadores: {NINO}, {COMPA}, {AFICION}, {CIUDAD},
   * {LUGAR}, {BEBE}, {LUNILLA}, {COLOR}, {TEMA.clave}. La ropa la fija `ropa`.
   */
  escena: string;
  ropa: "dia" | "pijama";
  /** Página (1..12) del cuento de muestra antiguo cuya ilustración reutiliza esta página, si la hay. */
  base?: number;
}

export interface Plantilla {
  coleccion: ColeccionId;
  banda: Banda;
  titulo: Bi;
  portada: string; // escena de la cubierta
  paginas: PaginaPlantilla[]; // BANDAS[banda].paginas exactas
  /** Escenas que dependen del tema: {TEMA.clave} en `escena`. */
  escenasTema?: Record<string, Record<string, string>>;
  // Frase final de contraportada
  contraportada: Bi;
}

export type PlantillaId = `${ColeccionId}-${Banda}`;
