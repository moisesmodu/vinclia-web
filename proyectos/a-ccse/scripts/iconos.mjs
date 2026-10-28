// Genera los PNG de los iconos (PWA, Play y TWA) a partir de los SVG con el Chromium de Playwright.
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch { pw = req('/opt/node-tools/node_modules/playwright'); }
const { chromium } = pw;
import { readFileSync } from 'node:fs';
import path from 'node:path';
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const svg = (f) => readFileSync(path.join(raiz, 'public/icons', f), 'utf8');
const salida = [
  ['icon.svg', 192, 'icon-192.png'], ['icon.svg', 512, 'icon-512.png'], ['maskable.svg', 512, 'maskable-512.png'],
  ['maskable.svg', 192, 'maskable-192.png'], ['icon.svg', 180, 'apple-touch-icon.png'],
];
const b = await chromium.launch();
const p = await b.newPage();
for (const [f, n, out] of salida) {
  await p.setViewportSize({ width: n, height: n });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg(f).replace('<svg ', `<svg width="${n}" height="${n}" `)}</body></html>`);
  await p.screenshot({ path: path.join(raiz, 'public/icons', out), omitBackground: true, clip: { x: 0, y: 0, width: n, height: n } });
}
await b.close();
console.log('iconos ok');
