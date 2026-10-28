// Empaqueta los builds de portal en zips listos para subir: paquetes/<slug>/<slug>-<portal>.zip
// (index.html en la raíz del zip, como piden CrazyGames, Poki e itch.io). Requiere haber ejecutado build all.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const games = JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8')).filter((g) => !process.env.GAME || g.slug === process.env.GAME);
for (const g of games) {
  for (const p of ['crazygames', 'poki', 'itch']) {
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
}
