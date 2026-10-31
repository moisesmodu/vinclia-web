// Mapa del sitio con alternativas de idioma (hreflang) para cada página.
import type { APIRoute } from 'astro';
import { paginas, absoluta, alterna } from '../lib/rutas';
import { LANGS } from '../lib/sitio';
import { RUTA_PRO } from '../lib/widget';

export const GET: APIRoute = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const prio = (t: string) => (t === 'inicio' ? '1.0' : t === 'calc' ? '0.9' : t === 'producto' ? '0.8' : t === 'ficha' ? '0.7' : t === 'prog' ? '0.6' : t === 'indice' ? '0.5' : '0.3');
  const urls = paginas().filter((p) => p.tipo !== 'descarga').map((p) => {
    const alt = LANGS.map((l) => alterna(p, l)).filter(Boolean).map((a) => `<xhtml:link rel="alternate" hreflang="${a!.lang}" href="${absoluta(a!.ruta)}"/>`).join('');
    return `<url><loc>${absoluta(p.ruta)}</loc><lastmod>${hoy}</lastmod><priority>${prio(p.tipo)}</priority>${alt}</url>`;
  });
  // «Para profesionales» (widget). Las páginas /embed/ no entran: son noindex
  const altPro = LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${absoluta(RUTA_PRO[l])}"/>`).join('');
  for (const l of LANGS) urls.push(`<url><loc>${absoluta(RUTA_PRO[l])}</loc><lastmod>${hoy}</lastmod><priority>0.5</priority>${altPro}</url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
