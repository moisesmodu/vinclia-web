import type { ColeccionId, Genero } from "./catalogo";
import { bandaDe } from "./plantillas/tipos";

// Portada de biblioteca de cada combinación colección × edad × protagonista, sin acceso a disco (sirve en el
// navegador). Las 16 existen: 2 en public/muestras (cuentos de muestra) y 14 en public/biblioteca.
// Mantener en línea con BIBLIOTECA en ilustraciones.ts.
const FIJAS: Record<string, string> = {
  "dormir-peques-nino": "/muestras/leo-y-la-luz-de-la-luna",
  "ciudad-mayores-nina": "/muestras/la-martina-i-els-secrets-de-lleida",
};

export function carpetaPortada(c: ColeccionId, edad: number, g: Genero): string {
  const clave = `${c}-${bandaDe(edad)}-${g === "m" ? "nino" : "nina"}`;
  return FIJAS[clave] ?? `/biblioteca/${clave}`;
}

export const portada = (c: ColeccionId, edad: number, g: Genero) => `${carpetaPortada(c, edad, g)}/00.webp`;
