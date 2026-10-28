// Genera los iconos PNG de la PWA y de Google Play a partir del icono oficial de la marca (public/marca/icono.svg,
// copia de marcas/logos/b-oposiciones-icono.svg), con el Chromium de Playwright. No se redibuja: se escala.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');

const icono = fs.readFileSync(new URL('../public/marca/icono.svg', import.meta.url), 'utf8').replace(/<\?xml[^>]*>/, '');
const interior = icono.replace(/<svg[^>]*>/, '').replace('</svg>', '');
const svg = (s, conMargen) =>
  conMargen
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="-8 -8 72 72"><rect x="-8" y="-8" width="72" height="72" fill="#F6F6FB"/>${interior}</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 56 56">${interior}</svg>`;

const b = await chromium.launch();
const p = await b.newPage();
fs.mkdirSync(new URL('../public/icons/', import.meta.url), { recursive: true });
for (const [nombre, s, margen] of [['icon-192', 192, false], ['icon-512', 512, false], ['maskable-512', 512, true], ['play-512', 512, false]]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<html><body style="margin:0">${svg(s, margen)}</body></html>`);
  await p.screenshot({ path: new URL(`../public/icons/${nombre}.png`, import.meta.url).pathname, omitBackground: true });
}
await b.close();
console.log('iconos ok');
