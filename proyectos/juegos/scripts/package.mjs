// Empaqueta los builds de portal en zips listos para subir: paquetes/<slug>/<slug>-<portal>.zip
// (index.html en la raíz del zip, como piden CrazyGames, Poki e itch.io). Requiere haber ejecutado build all.
// Además paquetes/<slug>/<slug>-crazygames-plano/ (carpeta): el subidor de CrazyGames aplana las carpetas, así que
// ahí van todos los archivos en la raíz y las rutas "./assets/" y "assets/" de index.html y los .js, sin la carpeta.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const games = JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8')).filter((g) => !process.env.GAME || g.slug === process.env.GAME);
for (const g of games) {
  for (const p of ['crazygames', 'poki', 'gamedistribution', 'gamemonetize', 'itch']) {
    const src = resolve(root, 'dist-portales', g.slug, p);
    if (!existsSync(src)) continue;
    const outDir = resolve(root, 'paquetes', g.slug);
    mkdirSync(outDir, { recursive: true });
    const zip = resolve(outDir, `${g.slug}-${p}.zip`);
    rmSync(zip, { force: true });
    // python3 viene en Linux y macOS; evita depender de 'zip'
    execFileSync('python3', ['-c', `import shutil,sys; shutil.make_archive(sys.argv[1][:-4], 'zip', sys.argv[2])`, zip, src]);
    console.log(`✔ ${zip.replace(root + '/', '')} (${(statSync(zip).size / 1024 / 1024).toFixed(2)} MB)`);
  }
  flatCrazy(g.slug);
}

function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesIn(resolve(dir, e.name)) : [resolve(dir, e.name)]));
}
function flatCrazy(slug) {
  const src = resolve(root, 'dist-portales', slug, 'crazygames');
  if (!existsSync(src)) return;
  const out = resolve(root, 'paquetes', slug, `${slug}-crazygames-plano`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const seen = new Set();
  for (const f of filesIn(src)) {
    const name = basename(f);
    if (seen.has(name)) throw new Error(`${slug}: nombre repetido al aplanar (${name})`);
    seen.add(name);
    if (/\.(html|js)$/.test(name)) writeFileSync(resolve(out, name), readFileSync(f, 'utf8').replace(/(?<![\w-])(\.\/)?assets\//g, ''));
    else copyFileSync(f, resolve(out, name));
  }
  console.log(`✔ paquetes/${slug}/${slug}-crazygames-plano/ (${seen.size} archivos en la raíz)`);
}
