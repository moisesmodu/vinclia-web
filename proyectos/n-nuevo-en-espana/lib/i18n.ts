import fs from "node:fs";
import path from "node:path";
import es from "@/content/ui/es.json";
import { config } from "./config";

export type Dicc = typeof es;

const cache = new Map<string, Dicc>();

export function dicc(idioma: string): Dicc {
  if (cache.has(idioma)) return cache.get(idioma)!;
  const ruta = path.join(process.cwd(), "content", "ui", `${idioma}.json`);
  let d: Dicc = es;
  if (fs.existsSync(ruta)) {
    const otro = JSON.parse(fs.readFileSync(ruta, "utf8"));
    d = fusion(es, otro) as Dicc;
  }
  cache.set(idioma, d);
  return d;
}

// Si falta una clave en un idioma, se usa la del castellano.
function fusion(base: unknown, otro: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(otro) ? otro : base;
  if (base && typeof base === "object") {
    const r: Record<string, unknown> = {};
    for (const k of Object.keys(base as object)) {
      r[k] = fusion((base as Record<string, unknown>)[k], otro && typeof otro === "object" ? (otro as Record<string, unknown>)[k] : undefined);
    }
    return r;
  }
  return typeof otro === typeof base ? otro : base;
}

export { t } from "./texto";

export const NOMBRES_IDIOMA: Record<string, string> = {
  es: "Castellano", ar: "العربية", fr: "Français", en: "English", ro: "Română", zh: "中文", uk: "Українська", ca: "Català"
};

// Etiqueta BCP 47 para <html lang>, hreflang y fechas.
export const LOCALE_BCP47: Record<string, string> = {
  es: "es-ES", ar: "ar", fr: "fr", en: "en", ro: "ro", zh: "zh-Hans", uk: "uk", ca: "ca"
};

export function fechaLarga(iso: string, idioma: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00Z" : ""));
  return d.toLocaleDateString(LOCALE_BCP47[idioma] ?? "es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });
}

export const idiomasConGuia = config.idiomasConGuiaPropia as readonly string[];
