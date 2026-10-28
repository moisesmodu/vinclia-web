// Convierte dist/<sitio> en una vista previa autocontenida con enlaces relativos (vista/<sitio>), para
// alojarla en una ruta cualquiera (URL temporal, artefacto, subcarpeta) mientras no hay dominio propio.
//   node scripts/vista-previa.mjs nomina
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';

const sitio = process.argv[2] || 'nomina';
const src = `dist/${sitio}`, out = `vista/${sitio}`;
rmSync(out, { recursive: true, force: true });
const archivos = [];
const recorrer = (d) => { for (const x of readdirSync(d)) { const p = join(d, x); statSync(p).isDirectory() ? recorrer(p) : archivos.push(relative(src, p)); } };
recorrer(src);

const relativo = (desde, destino) => {
  // desde: ruta del archivo HTML (p. ej. ca/calculadora-sou-net/index.html); destino: «/x/y/?q#h»
  const m = destino.match(/^([^?#]*)(.*)$/);
  let ruta = m[1].replace(/^\//, '');
  if (ruta === '' || ruta.endsWith('/')) ruta += 'index.html';
  let r = posix.relative(posix.dirname(desde), ruta) || 'index.html';
  return r + m[2];
};

for (const f of archivos) {
  const d = join(out, f);
  mkdirSync(dirname(d), { recursive: true });
  if (f.endsWith('.html')) {
    let h = readFileSync(join(src, f), 'utf8');
    h = h.replace(/(href|src|action)="(\/(?!\/)[^"]*)"/g, (_, a, v) => `${a}="${relativo(f.split('\\').join('/'), v)}"`);
    writeFileSync(d, h);
  } else if (f.endsWith('.js')) {
    let j = readFileSync(join(src, f), 'utf8');
    j = j.replace(/return"\/"\+(\w)\}/g, 'return new URL("../"+$1,import.meta.url).href}');
    writeFileSync(d, j);
  } else copyFileSync(join(src, f), d);
}
console.log(`${out}: ${archivos.length} archivos`);
