import type { MetadataRoute } from 'next';
import { LOCALES, SITE_URL, type Locale } from '@/lib/config';
import { guias } from '@/lib/contenido';
import { PREGUNTAS, TAREAS } from '@/lib/preguntas';
import { HREFLANG, equivalentesGuia } from '@/lib/seo';

/** Sitemap con hreflang (incluido x-default) en cada URL que existe en varios idiomas. */
export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  const idiomas = (rutas: Partial<Record<Locale, string>>) => {
    const languages: Record<string, string> = {};
    for (const [l, r] of Object.entries(rutas) as [Locale, string][]) languages[HREFLANG[l]] = `${SITE_URL}/${l}${r}`;
    const xdef = rutas.es !== undefined ? 'es' : (Object.keys(rutas)[0] as Locale);
    languages['x-default'] = `${SITE_URL}/${xdef}${rutas[xdef]}`;
    return { languages };
  };
  const todas = (ruta: string) => idiomas(Object.fromEntries(LOCALES.map((l) => [l, ruta])));
  const urls: MetadataRoute.Sitemap = [];
  const rutas: [string, number][] = [['', 1], ['/examen', 0.9], ['/simulacro', 0.8], ['/temas', 0.8], ['/precio', 0.6], ['/guia', 0.6]];
  for (const l of LOCALES) {
    for (const [r, priority] of rutas) urls.push({ url: `${SITE_URL}/${l}${r}`, lastModified: ahora, priority, alternates: todas(r) });
    for (const n of TAREAS) urls.push({ url: `${SITE_URL}/${l}/temas/${n}`, lastModified: ahora, priority: 0.7, alternates: todas(`/temas/${n}`) });
    for (const g of guias(l)) {
      const eq = equivalentesGuia(l, g.slug);
      urls.push({ url: `${SITE_URL}/${l}/guia/${g.slug}`, lastModified: ahora, priority: 0.7, ...(Object.keys(eq).length > 1 ? { alternates: idiomas(eq) } : {}) });
    }
  }
  urls.push({ url: `${SITE_URL}/es/preguntas`, lastModified: ahora, priority: 0.8 });
  for (const p of PREGUNTAS) urls.push({ url: `${SITE_URL}/es/preguntas/${p.id}`, lastModified: ahora, priority: 0.5 });
  return urls;
}
