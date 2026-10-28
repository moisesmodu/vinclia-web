// Fábrica de sitios: un mismo código genera cada sitio del catálogo según la variable SITIO.
//   SITIO=nomina npm run build    → dist/nomina
//   SITIO=impuestos npm run build → dist/impuestos
// Variables opcionales (Cloudflare Pages o Vercel → Environment variables):
//   SITE_URL            URL pública (por defecto, el dominio de sitios/<SITIO>/sitio.json)
//   ADSENSE_CLIENT      ca-pub-XXXXXXXXXXXXXXXX (vacío = sin anuncios ni banner de consentimiento)
//   ADSENSE_SLOT_RESULTADO, ADSENSE_SLOT_FINAL   identificadores de bloque de anuncio
//   UMAMI_ID, UMAMI_SRC  analítica sin cookies
//   GSC_VERIFICACION     contenido de la metaetiqueta google-site-verification
//   BASE_PATH           subcarpeta (solo para vistas previas alojadas en una ruta)
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

const SITIO = process.env.SITIO || 'nomina';
const cfg = JSON.parse(readFileSync(new URL(`./sitios/${SITIO}/sitio.json`, import.meta.url), 'utf8'));
const site = process.env.SITE_URL || cfg.dominio;
// País del sitio: moneda y formato de números (es-ES y EUR en España, es-US y USD en EE. UU.)
const pais = JSON.parse(readFileSync(new URL(`./params/${cfg.pais}/pais.json`, import.meta.url), 'utf8'));

// Quita de los parámetros las notas y fuentes (documentación para personas) antes de empaquetarlos:
// el navegador solo necesita las cifras.
const NOTA = /^(nota|notas_generales|nota_general|fuente|verificado|formula|estado_nota)$|_nota$|_fuente$/;
const limpiar = (o) => Array.isArray(o) ? o.map(limpiar) : o && typeof o === 'object'
  ? Object.fromEntries(Object.entries(o).filter(([k]) => !NOTA.test(k)).map(([k, v]) => [k, limpiar(v)])) : o;
const paramsLigeros = {
  name: 'params-ligeros',
  enforce: 'pre',
  transform(code, id) {
    if (!/[\\/]params[\\/][^?]+\.json$/.test(id)) return null;
    return { code: JSON.stringify(limpiar(JSON.parse(code))), map: null };
  },
};

export default defineConfig({
  site,
  base: process.env.BASE_PATH || '/',
  output: 'static',
  outDir: `./dist/${SITIO}`,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always', assets: '_a' },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: {
    plugins: [paramsLigeros],
    define: {
      'import.meta.env.SITIO': JSON.stringify(SITIO),
      'import.meta.env.PAIS': JSON.stringify(cfg.pais),
      'import.meta.env.MONEDA': JSON.stringify(pais.moneda),
      'import.meta.env.LOCALES': JSON.stringify(pais.locales),
    },
  },
});
