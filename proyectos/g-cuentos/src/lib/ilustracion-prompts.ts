import { aficion, companero, lugaresDe, type Genero } from "./catalogo";
import { plantilla } from "./plantillas";
import type { DatosNino } from "./rellenar";

// Estilo común a todas las ilustraciones (no cambiar sin regenerar la biblioteca).
export const ESTILO =
  "Children's picture book illustration, warm gouache and watercolor on textured cream paper, soft visible brush strokes, delicate colored-pencil outlines, muted warm palette of ochre, terracotta, sage green, dusty blue and cream, gentle storybook lighting, classic European picture book look, clear simple composition with one focal point, square format";

export const NEGATIVO =
  "no text, no letters, no words, no captions, no watermark, no signature, no frame, no border, no photo realism, no extra limbs, consistent character design";

export interface Protagonista {
  id: "nino" | "nina";
  genero: Genero;
  hoja: string; // ruta pública de la hoja de personaje
  hojaJobId: string; // job de Higgsfield que sirve de referencia
  descripcion: string;
  ropa: { dia: string; pijama: string };
}

export const PROTAGONISTAS: Record<"nino" | "nina", Protagonista> = {
  nino: {
    id: "nino",
    genero: "m",
    hoja: "/personajes/nino-hoja.png",
    hojaJobId: "b942fe56-e85b-445f-8d28-0517ad5ba957",
    descripcion:
      "the boy from the reference character sheet: a 5-year-old boy with light olive skin, round face with rosy cheeks, a few freckles across the nose, big dark-brown eyes and short tousled chestnut-brown curly hair",
    ropa: {
      dia: "wearing his mustard-yellow chunky knitted sweater, dark teal corduroy trousers rolled at the ankle and red sneakers",
      pijama: "wearing his sky-blue pajamas with small white stars",
    },
  },
  nina: {
    id: "nina",
    genero: "f",
    hoja: "/personajes/nina-hoja.png",
    hojaJobId: "b0d8da4c-2092-4e62-9371-97c9f0b7f21a",
    descripcion:
      "the girl from the reference character sheet: a 5-year-old girl with warm medium-brown skin, round soft cheeks, big bright dark-brown eyes and black curly hair in two round puffs tied with coral-red hair ties",
    ropa: {
      dia: "wearing her coral-red hooded jacket open over a cream and dusty-blue striped t-shirt, ochre-yellow pinafore skirt, white socks and dark green ankle boots",
      pijama: "wearing her lavender pajamas with small white moons",
    },
  },
};

export const protagonistaDe = (g: Genero) => (g === "m" ? PROTAGONISTAS.nino : PROTAGONISTAS.nina);

function companeroIngles(d: DatosNino): string {
  const c = companero(d.companero);
  const desc = d.mascotaDescripcion?.trim();
  return desc ? `${c.ingles} (${desc})` : c.ingles;
}

export interface PromptIlustracion {
  indice: number; // 0 = portada, 1..12 = páginas
  prompt: string;
}

/** Prompts de portada + 12 páginas para un cuento concreto. */
export function promptsDelCuento(d: DatosNino): PromptIlustracion[] {
  const p = plantilla(d.coleccion);
  const prot = protagonistaDe(d.genero);
  const lug = lugaresDe(d.ciudad);
  const sustituir = (escena: string, ropa: "dia" | "pijama") => {
    let s = escena;
    const temaEsc = p.escenasTema?.[d.tema] ?? {};
    s = s.replace(/\{TEMA\.([a-z]+)\}/g, (_, k: string) => temaEsc[k] ?? "");
    const nino = `${prot.descripcion}, ${prot.ropa[ropa]},`;
    // La descripción completa solo la primera vez; después, «the same child».
    let primera = true;
    s = s.replace(/\{NINO\}/g, () => {
      if (primera) {
        primera = false;
        return nino;
      }
      return "the same child";
    });
    s = s
      .replace(/\{COMPA\}/g, companeroIngles(d))
      .replace(/\{AFICION\}/g, aficion(d.aficion).ingles)
      .replace(/\{CIUDAD\}/g, d.ciudad)
      .replace(/\{LUGAR\}/g, lug.ingles)
      .replace(/\{BEBE\}/g, "a tiny baby in a cream knitted onesie");
    return s;
  };
  const montar = (escena: string, ropa: "dia" | "pijama") =>
    `${ESTILO}. Scene: ${sustituir(escena, ropa).replace(/,\s*,/g, ",")}. Keep the child exactly as in the reference character sheet (same face, hair, skin tone and outfit). ${NEGATIVO}.`;

  return [
    { indice: 0, prompt: montar(p.portada, p.coleccion === "dormir" ? "pijama" : "dia") + " Leave calm empty space in the upper third for the book title." },
    ...p.paginas.map((pg, i) => ({ indice: i + 1, prompt: montar(pg.escena, pg.ropa) })),
  ];
}
