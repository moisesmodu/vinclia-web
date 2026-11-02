import type { MetadataRoute } from "next";
import { IDIOMAS, urlBase } from "@/lib/config";
import { LOCALE_BCP47 } from "@/lib/i18n";
import { preguntas, resumen, slugsGuias } from "@/lib/contenido";

export default function sitemap(): MetadataRoute.Sitemap {
  const b = urlBase();
  const alt = (ruta: string, idiomas: readonly string[] = IDIOMAS) => ({
    languages: { ...Object.fromEntries(idiomas.map((i) => [LOCALE_BCP47[i], `${b}/${i}${ruta}`])), "x-default": `${b}/es${ruta}` }
  });
  // Guías: solo los idiomas con traducción propia (en catalán se muestra el castellano y su canonical es /es/...).
  const propios = (s: string) => IDIOMAS.filter((i) => resumen(s, i)?.idiomaContenido === i);
  const out: MetadataRoute.Sitemap = [];
  for (const i of IDIOMAS) {
    out.push({ url: `${b}/${i}`, changeFrequency: "weekly", priority: 1, alternates: alt("") });
    out.push({ url: `${b}/${i}/precios`, changeFrequency: "monthly", priority: 0.5, alternates: alt("/precios") });
    out.push({ url: `${b}/${i}/preguntas`, changeFrequency: "weekly", priority: 0.6, alternates: alt("/preguntas") });
    for (const s of slugsGuias()) {
      if (!propios(s).includes(i)) continue;
      out.push({ url: `${b}/${i}/guias/${s}`, lastModified: resumen(s, i)?.actualizado, changeFrequency: "weekly", priority: 0.9, alternates: alt(`/guias/${s}`, propios(s)) });
    }
  }
  for (const p of preguntas()) out.push({ url: `${b}/${p.idioma}/preguntas/${p.slug}`, lastModified: p.actualizado, changeFrequency: "monthly", priority: 0.8 });
  return out;
}
