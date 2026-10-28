import type { Bi, ColeccionId } from "../catalogo";

export interface PaginaPlantilla {
  /** Texto con marcadores: {nombre}, {Elnom}, {compa}, {ciudad}, {tema.problema}, {a|b}... */
  texto: Bi;
  /**
   * Escena para la ilustración, en inglés. Marcadores: {NINO}, {COMPA}, {AFICION}, {CIUDAD},
   * {LUGAR}, {BEBE}. La ropa la fija `ropa`.
   */
  escena: string;
  ropa: "dia" | "pijama";
}

export interface Plantilla {
  coleccion: ColeccionId;
  titulo: Bi;
  portada: string; // escena de la cubierta
  paginas: PaginaPlantilla[]; // exactamente 12
  /** Escenas que dependen del tema: {TEMA.clave} en `escena`. */
  escenasTema?: Record<string, Record<string, string>>;
  // Frase final de contraportada
  contraportada: Bi;
}
