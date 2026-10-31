import type { MetadataRoute } from 'next';
import { oposiciones, banco, urlBase } from '@/lib/datos';
import { DOCS } from '@/lib/legal';
import conv from '@/contenido/convocatorias.json';
import { articulos } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const b = urlBase();
  const entrada = (ruta: string, prioridad: number, fecha?: string): MetadataRoute.Sitemap[number] => ({
    url: `${b}/ca${ruta}`,
    lastModified: fecha ? new Date(fecha) : new Date(),
    priority: prioridad,
    alternates: { languages: { ca: `${b}/ca${ruta}`, es: `${b}/es${ruta}` } },
  });
  const out: MetadataRoute.Sitemap = [entrada('', 1), entrada('/convocatorias', 0.9, conv.actualizado), entrada('/precios', 0.6), entrada('/contacto', 0.2)];
  for (const o of oposiciones()) {
    const f = banco(o.slug)?.actualizado;
    out.push(entrada(`/${o.slug}`, 0.9, f));
    for (const t of o.temas) out.push(entrada(`/${o.slug}/${t.slug}`, 0.7, f));
  }
  for (const d of DOCS) out.push(entrada(`/legal/${d}`, 0.1));
  out.push(entrada('/blog', 0.6));
  for (const a of articulos()) out.push(entrada(`/blog/${a.slug}`, 0.8, a.actualizado));
  // Cada URL en castellano también como entrada propia (Google recomienda listar todas las variantes).
  return out.flatMap((e) => [e, { ...e, url: e.url.replace(`${b}/ca`, `${b}/es`) }]);
}
