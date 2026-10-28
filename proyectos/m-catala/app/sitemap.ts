import type { MetadataRoute } from 'next';
import { BANC, urlBase } from '@/lib/datos';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlBase(); const ara = new Date();
  const fixes = ['', '/comencar', '/preus', '/convocatories', '/guia', '/simulacre', '/escriure', '/oral', '/practica'];
  const out: MetadataRoute.Sitemap = [];
  for (const l of ['ca', 'es']) {
    for (const r of fixes) out.push({ url: `${base}/${l}${r}`, lastModified: ara, changeFrequency: 'weekly', priority: r === '' ? 1 : 0.7, alternates: { languages: { ca: `${base}/ca${r}`, es: `${base}/es${r}` } } });
    for (const p of BANC.seo) out.push({ url: `${base}/${l}/guia/${p.slug}`, lastModified: ara, changeFrequency: 'weekly', priority: 0.8, alternates: { languages: { ca: `${base}/ca/guia/${p.slug}`, es: `${base}/es/guia/${p.slug}` } } });
  }
  return out;
}
