import es from "../config/paises/es-ES.json";

export type ConfigPais = typeof es;
const PAISES: Record<string, ConfigPais> = { ES: es };

export function configPais(pais = process.env.PAIS ?? "ES"): ConfigPais {
  const c = PAISES[pais];
  if (!c) throw new Error(`País sin configurar: ${pais}`);
  // Datos del titular desde los secretos del entorno (DESPLIEGUES.md §1), si existen.
  const e = process.env;
  return {
    ...c,
    legal: {
      ...c.legal,
      titular: e.LEGAL_NOM || c.legal.titular,
      nif: e.LEGAL_NIF || c.legal.nif,
      domicilio: e.LEGAL_ADRECA || c.legal.domicilio,
      email: e.LEGAL_EMAIL || c.legal.email,
    },
  };
}

export type Formato = "pdf" | "tapaDura";
export const FORMATOS: Formato[] = ["pdf", "tapaDura"];

export function precioCents(formato: Formato, pais?: string): number {
  return configPais(pais).precios[formato];
}

export function euros(cents: number, idioma: "es" | "ca" = "es"): string {
  return new Intl.NumberFormat(idioma === "ca" ? "ca-ES" : "es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/** Margen estimado por venta (sin afiliado / con afiliado), en céntimos. */
export function margenEstimado(formato: Formato, conAfiliado: boolean, pais?: string) {
  const c = configPais(pais);
  const precio = c.precios[formato];
  const sinIva = precio / (1 + c.iva.libros / 100);
  const k = c.costesEstimados;
  const stripe = (precio * k.stripePorcentaje) / 100 + k.stripeFijo;
  const produccion = k.ilustracionesPorCuento + k.textoPorCuento + (formato === "tapaDura" ? k.impresionTapaDura + k.envioTapaDura : 0);
  const comision = conAfiliado ? (precio * c.afiliados.comisionPorcentaje) / 100 : 0;
  return Math.round(sinIva - stripe - produccion - comision);
}

export const URL_BASE = () => (process.env.URL_BASE ?? "http://localhost:3000").replace(/\/$/, "");
