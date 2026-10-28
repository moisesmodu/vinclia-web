import type { MetadataRoute } from "next";
import { URL_BASE } from "@/lib/config";
import { rutaSeo, seo } from "@/lib/contenido";
import { MUESTRAS } from "@/lib/muestras";

export default function sitemap(): MetadataRoute.Sitemap {
  const b = URL_BASE();
  const fijas = ["", "/crear", "/cuentos", "/afiliados", "/ca", "/ca/crear", "/ca/contes", "/ca/afiliades"];
  return [
    ...fijas.map((r) => ({ url: `${b}${r}`, changeFrequency: "weekly" as const, priority: r === "" || r === "/ca" ? 1 : 0.7 })),
    ...MUESTRAS.flatMap((m) => [`${b}/muestras/${m.slug}`, `${b}/ca/muestras/${m.slug}`].map((url) => ({ url, priority: 0.6 }))),
    ...(["es", "ca"] as const).flatMap((i) => seo(i).map((p) => ({ url: `${b}${rutaSeo(i)}/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.8 }))),
  ];
}
