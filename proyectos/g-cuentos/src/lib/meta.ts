import type { Metadata } from "next";
import type { Idioma } from "./catalogo";

const IMAGEN_OG = "/muestras/leo-y-la-luz-de-la-luna/00.webp";

/**
 * Metadatos de una página con canonical propio, hreflang es/ca (con autorreferencia) y Open Graph en su idioma.
 * `es` y `ca` son las rutas equivalentes; si falta la del otro idioma, solo se emite la propia.
 * `xDefault` marca la portada castellana como versión por defecto (solo en la pareja de portadas).
 */
export function meta(o: {
  idioma: Idioma;
  es?: string;
  ca?: string;
  title: string;
  description: string;
  absoluto?: boolean;
  imagen?: string;
  xDefault?: boolean;
  noindex?: boolean;
}): Metadata {
  const propia = (o.idioma === "ca" ? o.ca : o.es) ?? "/";
  const languages: Record<string, string> = {};
  if (o.es) languages.es = o.es;
  if (o.ca) languages.ca = o.ca;
  if (o.xDefault && o.es) languages["x-default"] = o.es;
  return {
    title: o.absoluto ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: propia, languages: Object.keys(languages).length > 1 ? languages : undefined },
    openGraph: {
      siteName: "Lunilla", type: "website", locale: o.idioma === "ca" ? "ca_ES" : "es_ES",
      alternateLocale: o.idioma === "ca" ? ["es_ES"] : ["ca_ES"],
      url: propia, title: o.title, description: o.description, images: [o.imagen ?? IMAGEN_OG],
    },
    ...(o.noindex ? { robots: { index: false } } : {}),
  };
}
