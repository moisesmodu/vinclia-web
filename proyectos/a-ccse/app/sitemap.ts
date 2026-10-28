import type { MetadataRoute } from 'next';
import { LOCALES, SITE_URL } from '@/lib/config';
import { guias } from '@/lib/contenido';
import { PREGUNTAS, TAREAS } from '@/lib/preguntas';

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  const alt = (ruta: string) => ({ languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${ruta}`])) });
  const urls: MetadataRoute.Sitemap = [];
  for (const l of LOCALES) {
    urls.push({ url: `${SITE_URL}/${l}`, lastModified: ahora, priority: 1, alternates: alt('') });
    urls.push({ url: `${SITE_URL}/${l}/examen`, lastModified: ahora, priority: 0.9, alternates: alt('/examen') });
    urls.push({ url: `${SITE_URL}/${l}/simulacro`, lastModified: ahora, priority: 0.8, alternates: alt('/simulacro') });
    urls.push({ url: `${SITE_URL}/${l}/temas`, lastModified: ahora, priority: 0.8, alternates: alt('/temas') });
    for (const n of TAREAS) urls.push({ url: `${SITE_URL}/${l}/temas/${n}`, lastModified: ahora, priority: 0.7 });
    for (const g of guias(l)) urls.push({ url: `${SITE_URL}/${l}/guia/${g.slug}`, lastModified: ahora, priority: 0.7 });
  }
  urls.push({ url: `${SITE_URL}/es/preguntas`, lastModified: ahora, priority: 0.8 });
  for (const p of PREGUNTAS) urls.push({ url: `${SITE_URL}/es/preguntas/${p.id}`, lastModified: ahora, priority: 0.5 });
  return urls;
}
