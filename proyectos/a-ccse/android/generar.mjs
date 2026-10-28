// Regenera el proyecto Android (TWA) desde twa-manifest.json con @bubblewrap/core.
// Uso: node android/generar.mjs <ruta a node_modules con @bubblewrap/core>   (los iconos se descargan de iconUrl)
import { createRequire } from 'node:module';
import path from 'node:path';
const req = createRequire(path.resolve(process.argv[2] || '.', 'x.js'));
const { TwaGenerator, TwaManifest, ConsoleLog } = req('@bubblewrap/core');
const dir = path.dirname(new URL(import.meta.url).pathname);
const manifest = await TwaManifest.fromFile(path.join(dir, 'twa-manifest.json'));
const errores = manifest.validate();
if (errores) { console.error(errores); process.exit(1); }
await new TwaGenerator().createTwaProject(path.join(dir, 'proyecto'), manifest, new ConsoleLog('twa'));
console.log('Proyecto TWA generado en android/proyecto');
