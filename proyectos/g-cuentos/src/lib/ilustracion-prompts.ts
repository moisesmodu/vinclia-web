import { aficion, colorFav, companero, lugaresDe, type Genero } from "./catalogo";
import { plantilla } from "./plantillas";
import type { Aspecto, DatosNino } from "./rellenar";

// Estilo común a todas las ilustraciones (no cambiar sin regenerar la biblioteca).
export const ESTILO =
  "Children's picture book illustration, warm gouache and watercolor on textured cream paper, soft visible brush strokes, delicate colored-pencil outlines, muted warm palette of ochre, terracotta, sage green, dusty blue and cream, gentle storybook lighting, classic European picture book look, clear simple composition with one focal point";
// Portada cuadrada (tapa 200×200); páginas apaisadas 3:2 (ilustración encima del texto).
export const FORMATO = { portada: "square format", pagina: "wide landscape 3:2 format, important elements kept away from the edges" };

export const NEGATIVO =
  "no text, no letters, no words, no captions, no watermark, no signature, no frame, no border, no photo realism, no extra limbs, consistent character design";

// Personaje de marca (MARCAS.md, familia Lunilla): aparece como secundario en portadas y en la última página.
export const LUNILLA =
  "Lunilla (exactly as in the mascot reference sheet), a small friendly sunflower-yellow crescent moon character with two small dark navy eyes, rosy pink cheeks, a calm closed-mouth smile and a cozy golden-ochre knitted scarf with fringe, softly glowing,";
export const LUNILLA_HOJA_JOB = "a0ebeb4a-fe55-4a52-be3b-e174cde42720";

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
    hoja: "/personajes/nino-hoja.webp",
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
    hoja: "/personajes/nina-hoja.webp",
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

// ── Aspecto elegido por la familia ──────────────────────────────────────────
// El aspecto por defecto coincide con las hojas de personaje ya generadas. Si la familia cambia
// algo, el taller genera primero una hoja de personaje propia del pedido (2 créditos) y la usa de referencia.
export const ASPECTO_POR_DEFECTO: Record<Genero, Aspecto> = {
  m: { piel: "media", pelo: "castano", peinado: "rizado", gafas: false, pecas: true },
  f: { piel: "morena", pelo: "negro", peinado: "coletas", gafas: false, pecas: false },
};

export function aspectoDe(d: DatosNino): Aspecto {
  return d.aspecto ?? ASPECTO_POR_DEFECTO[d.genero];
}

export function aspectoPropio(d: DatosNino): boolean {
  if (!d.aspecto) return false;
  const a = d.aspecto, b = ASPECTO_POR_DEFECTO[d.genero];
  return a.piel !== b.piel || a.pelo !== b.pelo || a.peinado !== b.peinado || a.gafas !== b.gafas || a.pecas !== b.pecas;
}

const PIEL = { clara: "fair light skin", media: "light olive skin", morena: "warm medium-brown skin", oscura: "deep dark-brown skin" };
const PELO = { rubio: "golden blond", castano: "chestnut-brown", pelirrojo: "copper-red", negro: "black" };

function peinadoIngles(a: Aspecto, g: Genero): string {
  const c = PELO[a.pelo];
  switch (a.peinado) {
    case "corto": return `short straight ${c} hair`;
    case "rizado": return `short tousled ${c} curly hair`;
    case "largo": return `long ${c} hair down to the shoulders`;
    case "coletas": return g === "f" ? `${c} hair in two pigtails tied with coral-red hair ties` : `${c} hair tied in a small top knot`;
  }
}

/** Protagonista con el aspecto y el color favorito que ha elegido la familia. */
export function protagonistaPropio(d: DatosNino): Protagonista {
  const a = aspectoDe(d);
  const color = colorFav(d.color).ingles!;
  const base = protagonistaDe(d.genero);
  const nino = d.genero === "m" ? "boy" : "girl";
  return {
    ...base,
    hojaJobId: "HOJA_DEL_PEDIDO",
    descripcion: `the ${nino} from the order's own reference character sheet: a ${d.edad}-year-old ${nino} with ${PIEL[a.piel]}, round face with rosy cheeks, big bright dark-brown eyes${a.pecas ? ", a few freckles across the nose" : ""}${a.gafas ? ", small round glasses" : ""} and ${peinadoIngles(a, d.genero)}`,
    ropa: {
      dia: `wearing a cozy ${color} knitted sweater, dark teal corduroy trousers and red sneakers`,
      pijama: `wearing ${color} pajamas with small white stars`,
    },
  };
}

/** Prompt de la hoja de personaje propia del pedido (solo si el aspecto no es el de serie). */
export function promptHoja(d: DatosNino): string {
  const p = protagonistaPropio(d);
  return `Character reference sheet for a children's picture book, ${ESTILO}. ${p.descripcion.replace("the order's own reference character sheet", "this sheet")}, ${p.ropa.dia}. Show the same child three times on a plain cream background: front view standing, three-quarter view, and a smiling close-up portrait; same face, hair, skin tone and outfit in all three. Match the drawing style of the reference sheet exactly. ${NEGATIVO}.`;
}

function companeroIngles(d: DatosNino): string {
  const c = companero(d.companero);
  const desc = d.mascotaDescripcion?.trim();
  return desc ? `${c.ingles} (${desc})` : c.ingles;
}

export interface PromptIlustracion {
  indice: number; // 0 = portada, 1..N = páginas
  prompt: string;
  proporcion: "1:1" | "3:2";
}

/** Prompts de portada + N páginas (18 o 22) para un cuento concreto. */
export function promptsDelCuento(d: DatosNino): PromptIlustracion[] {
  const p = plantilla(d.coleccion, d.edad);
  const propio = aspectoPropio(d) || !!d.color;
  const prot = propio ? protagonistaPropio(d) : protagonistaDe(d.genero);
  const lug = lugaresDe(d.ciudad);
  const color = colorFav(d.color).ingles!;
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
      .replace(/\{COLOR\}/g, color)
      .replace(/\{BEBE\}/g, "a tiny baby in a cream knitted onesie");
    // Lunilla: descripción completa la primera vez, nombre después.
    let primeraLunilla = true;
    s = s.replace(/\{LUNILLA\}/g, () => (primeraLunilla ? ((primeraLunilla = false), LUNILLA) : "Lunilla"));
    return s;
  };
  const montar = (escena: string, ropa: "dia" | "pijama", formato: string) =>
    `${ESTILO}, ${formato}. Scene: ${sustituir(escena, ropa).replace(/,\s*,/g, ",")}. Keep the child exactly as in the reference character sheet (same face, hair, skin tone and outfit). ${NEGATIVO}.`;

  return [
    { indice: 0, proporcion: "1:1", prompt: montar(p.portada, p.coleccion === "dormir" ? "pijama" : "dia", FORMATO.portada) + " Leave calm empty space in the upper left two thirds of the top for the book title; Lunilla stays in the upper right corner." },
    ...p.paginas.map((pg, i) => ({ indice: i + 1, proporcion: "3:2" as const, prompt: montar(pg.escena, pg.ropa, FORMATO.pagina) })),
  ];
}
