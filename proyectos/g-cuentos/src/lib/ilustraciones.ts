import { existsSync } from "node:fs";
import path from "node:path";
import type { ColeccionId, Genero } from "./catalogo";
import { aspectoPropio, LUNILLA_HOJA_JOB, promptHoja, promptsDelCuento, protagonistaDe } from "./ilustracion-prompts";
import { BANDAS, bandaDe, idPlantilla, type PlantillaId } from "./plantillas";
import type { DatosNino } from "./rellenar";

// ── Biblioteca (vistas previas) ─────────────────────────────────────────────
// Ilustraciones ya generadas por plantilla (colección + edad) y protagonista. Se usan en la vista
// previa gratuita (3 páginas) sin gastar créditos. Hoy existen las de los 2 cuentos de muestra;
// la tarea programada completa las demás combinaciones (ver TAREA-PROGRAMADA.md).
// Los ficheros siguen la numeración de la plantilla: 00 = portada, 01..N = páginas.
const BIBLIOTECA: Partial<Record<`${PlantillaId}-${"nino" | "nina"}`, string>> = {
  "dormir-peques-nino": "/muestras/leo-y-la-luz-de-la-luna",
  "ciudad-mayores-nina": "/muestras/la-martina-i-els-secrets-de-lleida",
};

export function carpetaBiblioteca(c: ColeccionId, edad: number, g: Genero): string | null {
  const clave = `${idPlantilla(c, edad)}-${g === "m" ? "nino" : "nina"}` as const;
  const fija = BIBLIOTECA[clave];
  if (fija) return fija;
  const dinamica = `/biblioteca/${clave}`;
  return existsSync(path.join(process.cwd(), "public", dinamica, "01.webp")) ? dinamica : null;
}

/** URL de la ilustración de biblioteca para la página `i` (0 = portada) o el retrato del protagonista. */
export function imagenVistaPrevia(c: ColeccionId, edad: number, g: Genero, i: number): { url: string; deBiblioteca: boolean } {
  const dir = carpetaBiblioteca(c, edad, g);
  const n = String(i).padStart(2, "0");
  if (dir && existsSync(path.join(process.cwd(), "public", dir, `${n}.webp`))) return { url: `${dir}/${n}.webp`, deBiblioteca: true };
  return { url: `/personajes/${protagonistaDe(g).id}-retrato.webp`, deBiblioteca: false };
}

// ── Encargo de ilustración (por pedido) ─────────────────────────────────────
// Cada pedido pagado guarda su encargo: portada + 18 o 22 páginas + referencias de la hoja de personaje.
// Si la familia ha elegido un aspecto o un color propio, primero se genera la hoja del pedido
// («hoja») y sus páginas la usan como referencia en lugar de la hoja de serie (HOJA_DEL_PEDIDO).
// Lo ejecuta el «taller» (tarea programada con el conector de Higgsfield, 2 créditos por imagen)
// y devuelve las URL por POST /api/admin/pedidos/[id]/ilustraciones.
export interface Encargo {
  modelo: string;
  resolucion: string;
  paginas: number;
  hoja?: { prompt: string; proporcion: "1:1"; referencias: string[] };
  referencias: string[]; // ids de trabajos de Higgsfield (hoja de personaje + Lunilla)
  prompts: { indice: number; prompt: string; proporcion: "1:1" | "3:2" }[];
}

export const totalIlustraciones = (d: DatosNino) => BANDAS[bandaDe(d.edad)].paginas + 1;

export function encargoIlustracion(d: DatosNino): Encargo {
  const propio = aspectoPropio(d) || !!d.color;
  const serie = protagonistaDe(d.genero).hojaJobId;
  return {
    modelo: "nano_banana_pro",
    resolucion: "2k",
    paginas: BANDAS[bandaDe(d.edad)].paginas,
    ...(propio ? { hoja: { prompt: promptHoja(d), proporcion: "1:1" as const, referencias: [serie] } } : {}),
    referencias: [propio ? "HOJA_DEL_PEDIDO" : serie, LUNILLA_HOJA_JOB], // niño/niña + Lunilla
    prompts: promptsDelCuento(d),
  };
}

export function ilustracionesCompletas(x: unknown, total: number): x is Record<string, string> {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return Array.from({ length: total }, (_, i) => o[String(i)]).every((u) => typeof u === "string" && u.length > 0);
}
