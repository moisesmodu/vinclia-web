// Mapa del sitio con alternativas de idioma (hreflang) para cada página.
import type { APIRoute } from 'astro';
import { paginas, absoluta, alterna } from '../lib/rutas';
import { LANGS } from '../lib/sitio';

export const GET: APIRoute = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const prio = (t: string) => (t === 'inicio' ? '1.0' : t === 'calc' ? '0.9' : t === 'ficha' ? '0.7' : t === 'prog' ? '0.6' : '0.3');
  const urls = paginas().map((p) => {
    const alt = LANGS.map((l) => alterna(p, l)).filter(Boolean).map((a) => `<xhtml:link rel="alternate" hreflang="${a!.lang}" href="${absoluta(a!.ruta)}"/>`).join('');
    return `<url><loc>${absoluta(p.ruta)}</loc><lastmod>${hoy}</lastmod><priority>${prio(p.tipo)}</priority>${alt}</url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
