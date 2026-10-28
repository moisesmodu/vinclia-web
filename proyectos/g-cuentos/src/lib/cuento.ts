import { plantilla } from "./plantillas";
import { articuloCa, rellenar, type DatosNino } from "./rellenar";

export interface Cuento {
  titulo: string;
  dedicatoria: string;
  paginas: string[]; // 18 (2–4 años) o 22 (5–8 años) textos
  contraportada: string;
  fuente: "ia" | "plantilla" | "manual";
}

export function dedicatoriaPorDefecto(d: DatosNino): string {
  const de = d.deParteDe?.trim();
  if (d.idioma === "ca")
    return `Per a ${articuloCa(d.nombre, d.genero)}, perquè cada pàgina et recordi com n'ets d'especial.${de ? `\nAmb tot l'amor, ${de}.` : ""}`;
  return `Para ${d.nombre.trim()}, para que cada página te recuerde lo especial que eres.${de ? `\nCon todo el cariño, ${de}.` : ""}`;
}

/** Cuento determinista a partir de la plantilla revisada (sin IA). Siempre disponible. */
export function cuentoDePlantilla(d: DatosNino): Cuento {
  const p = plantilla(d.coleccion, d.edad);
  return {
    titulo: rellenar(p.titulo[d.idioma], d),
    dedicatoria: d.dedicatoria?.trim() || dedicatoriaPorDefecto(d),
    paginas: p.paginas.map((pg) => rellenar(pg.texto[d.idioma], d)),
    contraportada: p.contraportada[d.idioma],
    fuente: "plantilla",
  };
}
