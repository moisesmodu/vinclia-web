import type { MetadataRoute } from 'next';
import { oposiciones, banco, urlBase } from '@/lib/datos';
import { DOCS } from '@/lib/legal';
import conv from '@/contenido/convocatorias.json';
import { articulos } from '@/lib/blog';
import { convocatorias, indexable, ciudadesAuxiliar, RUTA_AUX_AJUNTAMENT } from '@/lib/convocatorias';

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
  // Una URL por convocatoria, solo las que tienen datos verificados (las demás llevan noindex).
  for (const c of convocatorias()) if (indexable(c)) out.push(entrada(`/convocatorias/${c.id}`, 0.8, c.comprobado?.fecha ?? conv.actualizado));
  for (const x of ciudadesAuxiliar()) out.push(entrada(`${RUTA_AUX_AJUNTAMENT}/${x.slug}`, 0.8, conv.actualizado));
  for (const d of DOCS) out.push(entrada(`/legal/${d}`, 0.1));
  out.push(entrada('/blog', 0.6));
  for (const a of articulos()) out.push(entrada(`/blog/${a.slug}`, 0.8, a.actualizado));
  // Cada URL en castellano también como entrada propia (Google recomienda listar todas las variantes).
  return out.flatMap((e) => [e, { ...e, url: e.url.replace(`${b}/ca`, `${b}/es`) }]);
}
