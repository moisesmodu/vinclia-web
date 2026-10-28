// Crea un juego nuevo a partir de la plantilla:
//   npm run nuevo -- <slug> "<Título>" "<descripción en inglés para la etiqueta meta>"
// Copia plantilla/ en <slug>/, sustituye los marcadores y lo añade a juegos.json.
import { cpSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [slug, titulo, descripcion = ''] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug) || !titulo) {
  console.error('Uso: npm run nuevo -- <slug-en-minusculas> "<Título>" "<descripción>"');
  process.exit(1);
}
const dest = resolve(root, slug);
if (existsSync(dest)) { console.error(`Ya existe ${slug}/`); process.exit(1); }
cpSync(resolve(root, 'plantilla'), dest, { recursive: true, filter: (p) => !p.includes('node_modules') && !p.endsWith('/dist') });
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const f of walk(dest).filter((p) => /\.(ts|html|json|md)$/.test(p))) {
  const s = readFileSync(f, 'utf8')
    .replaceAll('__SLUG__', slug).replaceAll('__TITULO_LOGO__', titulo.toUpperCase())
    .replaceAll('__TITULO__', titulo).replaceAll('__DESCRIPCION__', descripcion);
  writeFileSync(f, s);
}
const list = JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8'));
list.push({ slug, titulo, genero: '', estado: 'en desarrollo', color: '#6cc8ff' });
writeFileSync(resolve(root, 'juegos.json'), JSON.stringify(list, null, 2) + '\n');
console.log(`✔ ${slug}/ creado desde la plantilla y añadido a juegos.json`);
console.log(`  Siguiente: escribe la mecánica en ${slug}/src/scenes/Play.ts y prueba con: GAME=${slug} npm run dev`);
