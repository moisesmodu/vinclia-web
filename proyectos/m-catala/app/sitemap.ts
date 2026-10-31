import type { MetadataRoute } from 'next';
import { BANC, urlBase } from '@/lib/datos';
import { DOCS } from '@/lib/legal';

/** Sitemap: només rutes públiques indexables; lastModified és la data de compilació del banc, no «ara». */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlBase(); const data = new Date(`${BANC.actualitzat}T00:00:00Z`);
  const alt = (r: string) => ({ languages: { ca: `${base}/ca${r}`, es: `${base}/es${r}`, 'x-default': `${base}/ca${r}` } });
  const fixes: [string, number, 'weekly' | 'monthly'][] = [['', 1, 'weekly'], ['/comencar', 0.8, 'monthly'], ['/preus', 0.7, 'monthly'], ['/convocatories', 0.9, 'weekly'], ['/guia', 0.8, 'weekly'], ['/simulacre', 0.6, 'monthly'], ['/escriure', 0.6, 'monthly'], ['/oral', 0.5, 'monthly'], ['/practica', 0.5, 'monthly'], ['/contacte', 0.3, 'monthly'], ['/validesa', 0.3, 'monthly']];
  const rutes: [string, number, 'weekly' | 'monthly'][] = [
    ...fixes,
    ...BANC.seo.map((p): [string, number, 'weekly' | 'monthly'] => [`/guia/${p.slug}`, 0.8, 'weekly']),
    ...Object.keys(BANC.tasques).map((id): [string, number, 'weekly' | 'monthly'] => [`/escriure/${id}`, 0.4, 'monthly']),
    ...DOCS.map((d): [string, number, 'weekly' | 'monthly'] => [`/legal/${d}`, 0.2, 'monthly']),
  ];
  const out: MetadataRoute.Sitemap = [];
  for (const l of ['ca', 'es']) for (const [r, priority, changeFrequency] of rutes) out.push({ url: `${base}/${l}${r}`, lastModified: data, changeFrequency, priority, alternates: alt(r) });
  return out;
}
