import { existsSync } from "node:fs";
import path from "node:path";
import type { ColeccionId, Genero } from "./catalogo";
import { promptsDelCuento, protagonistaDe } from "./ilustracion-prompts";
import type { DatosNino } from "./rellenar";

// ── Biblioteca (vistas previas) ─────────────────────────────────────────────
// Ilustraciones ya generadas por colección y protagonista. Se usan en la vista previa gratuita
// (3 páginas) sin gastar créditos. Hoy existen las de los 2 cuentos de muestra; la tarea
// programada completa las otras 6 combinaciones (ver TAREA-PROGRAMADA.md).
const BIBLIOTECA: Partial<Record<`${ColeccionId}-${"nino" | "nina"}`, string>> = {
  "dormir-nino": "/muestras/leo-y-la-luz-de-la-luna",
  "ciudad-nina": "/muestras/la-martina-i-els-secrets-de-lleida",
};

export function carpetaBiblioteca(c: ColeccionId, g: Genero): string | null {
  const clave = `${c}-${g === "m" ? "nino" : "nina"}` as const;
  const fija = BIBLIOTECA[clave];
  if (fija) return fija;
  const dinamica = `/biblioteca/${clave}`;
  return existsSync(path.join(process.cwd(), "public", dinamica, "01.webp")) ? dinamica : null;
}

/** URL de la ilustración de biblioteca para la página `i` (0 = portada) o el retrato del protagonista. */
export function imagenVistaPrevia(c: ColeccionId, g: Genero, i: number): { url: string; deBiblioteca: boolean } {
  const dir = carpetaBiblioteca(c, g);
  if (dir) return { url: `${dir}/${String(i).padStart(2, "0")}.webp`, deBiblioteca: true };
  return { url: `/personajes/${protagonistaDe(g).id}-retrato.webp`, deBiblioteca: false };
}

// ── Encargo de ilustración (por pedido) ─────────────────────────────────────
// Cada pedido pagado guarda su encargo: 13 prompts + referencias de la hoja de personaje.
// Lo ejecuta el «taller» (tarea programada con el conector de Higgsfield, 26 créditos por cuento)
// y devuelve las URL por POST /api/admin/pedidos/[id]/ilustraciones.
export interface Encargo {
  modelo: string;
  resolucion: string;
  proporcion: string;
  referencias: string[]; // ids de trabajos de Higgsfield (hoja de personaje)
  prompts: { indice: number; prompt: string }[];
}

export function encargoIlustracion(d: DatosNino): Encargo {
  return {
    modelo: "nano_banana_pro",
    resolucion: "2k",
    proporcion: "1:1",
    referencias: [protagonistaDe(d.genero).hojaJobId],
    prompts: promptsDelCuento(d),
  };
}

export function ilustracionesCompletas(x: unknown): x is Record<string, string> {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return Array.from({ length: 13 }, (_, i) => o[String(i)]).every((u) => typeof u === "string" && u.length > 0);
}
