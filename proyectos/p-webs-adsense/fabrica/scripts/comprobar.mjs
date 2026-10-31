// Comprobaciones de calidad antes de publicar: contenido completo en los dos idiomas, longitudes SEO,
// enlaces internos rotos, páginas duplicadas y datos pendientes en las páginas legales.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

let errores = 0, avisos = 0;
const err = (m) => { errores++; console.error('ERROR ' + m); };
const av = (m) => { avisos++; console.warn('AVISO ' + m); };
let totalCalc = 0;
for (const sitio of readdirSync('sitios')) {
  const cfg = JSON.parse(readFileSync(`sitios/${sitio}/sitio.json`, 'utf8'));
  totalCalc += cfg.calculadoras.length;
  if (cfg.titular.nif.startsWith('PENDIENTE') && !process.env.LEGAL_NIF) av(`${sitio}: falta el NIF del titular en sitio.json (aviso legal): se toma de LEGAL_NIF en el despliegue`);
  if (!cfg.adsense.cliente) av(`${sitio}: AdSense sin cuenta (anuncios y banner de consentimiento desactivados)`);
  const slugs = {};
  for (const id of cfg.calculadoras) {
    if (!existsSync(`src/calculadoras/${id}.ts`)) err(`${sitio}/${id}: falta src/calculadoras/${id}.ts`);
    for (const l of cfg.idiomas) {
      const f = `sitios/${sitio}/contenido/${id}.${l}.md`;
      if (!existsSync(f)) { err(`falta ${f}`); continue; }
      const m = readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      const fm = YAML.parse(m[1]);
      for (const k of ['slug', 'titulo', 'h1', 'descripcion', 'resumen', 'actualizado']) if (!fm[k]) err(`${f}: falta ${k}`);
      if (fm.titulo?.length > 65) av(`${f}: título de ${fm.titulo.length} caracteres`);
      if (fm.descripcion?.length > 165 || fm.descripcion?.length < 110) av(`${f}: descripción de ${fm.descripcion.length} caracteres`);
      if (!(fm.fuentes?.length >= 2)) err(`${f}: menos de 2 fuentes`);
      if (!/##\s+(Cómo se calcula|Com es calcula)/.test(m[2])) err(`${f}: sin sección de método`);
      const k = `${l}:${fm.slug}`; if (slugs[k]) err(`${f}: slug duplicado ${fm.slug}`); slugs[k] = 1;
    }
  }
  const dist = `dist/${sitio}`;
  if (!existsSync(dist)) { av(`${sitio}: sin compilar`); continue; }
  const paginas = [];
  const recorrer = (d) => { for (const x of readdirSync(d)) { const p = join(d, x); if (statSync(p).isDirectory()) recorrer(p); else if (x === 'index.html') paginas.push(p); } };
  recorrer(dist);
  const rutas = new Set(paginas.map((p) => p.slice(dist.length).replace(/index\.html$/, '')));
  const titulos = {};
  for (const p of paginas) {
    const h = readFileSync(p, 'utf8');
    const t = h.match(/<title>([^<]*)<\/title>/)?.[1];
    if (t) { if (titulos[t]) err(`${sitio}: título repetido «${t}»`); titulos[t] = 1; }
    if (/NaN|undefined|\[object Object\]/.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) err(`${p}: contiene NaN/undefined`);
    for (const [, href] of h.matchAll(/href="(\/[^"#?]*)/g)) {
      if (/\.(csv|xml|txt|svg|woff2|js|css)$/.test(href)) { if (!existsSync(dist + href)) err(`${p}: recurso inexistente ${href}`); continue; }
      if (!rutas.has(href)) err(`${p}: enlace interno roto ${href}`);
    }
  }
  console.log(`${sitio}: ${paginas.length} páginas, ${cfg.calculadoras.length} calculadoras`);
}
console.log(`Total calculadoras: ${totalCalc} · errores: ${errores} · avisos: ${avisos}`);
process.exit(errores ? 1 : 0);
