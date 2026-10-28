import es from "@/config/paises/es.json";

export type ConfigPais = typeof es;

// Un archivo por país en config/paises. Para abrir otro país: añadir su JSON y su carpeta content/<pais>.
const PAISES: Record<string, ConfigPais> = { es };

export const PAIS = process.env.PAIS ?? "es";
export const config: ConfigPais = PAISES[PAIS] ?? es;

export const IDIOMAS = config.idiomas as readonly string[];
export type Idioma = string;
export const IDIOMAS_RTL = new Set(["ar"]);

export function esIdioma(x: string): boolean {
  return IDIOMAS.includes(x);
}

export function urlBase(): string {
  return (process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

// Orden recomendado de guías según la situación (selector «¿Por dónde empiezo?»).
export const SITUACIONES: Record<string, string[]> = {
  recienLlegado: ["empadronamiento", "tarjeta-sanitaria", "cuenta-bancaria", "numero-seguridad-social", "carnet-conducir", "homologacion-titulos"],
  regularizado: ["numero-seguridad-social", "empadronamiento", "tarjeta-sanitaria", "cuenta-bancaria", "renovacion-residencia", "carnet-conducir"],
  renovar: ["renovacion-residencia", "empadronamiento", "numero-seguridad-social"],
  nacionalidad: ["nacionalidad", "renovacion-residencia", "empadronamiento"]
};
