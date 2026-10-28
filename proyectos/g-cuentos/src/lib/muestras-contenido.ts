import leo from "../../content/muestras/leo-y-la-luz-de-la-luna.json";
import martina from "../../content/muestras/la-martina-i-els-secrets-de-lleida.json";

export interface CuentoMuestra { slug: string; idioma: "es" | "ca"; titulo: string; dedicatoria: string; paginas: string[]; contraportada: string }
export const CUENTOS_MUESTRA: Record<string, CuentoMuestra> = {
  [leo.slug]: leo as CuentoMuestra,
  [martina.slug]: martina as CuentoMuestra,
};
