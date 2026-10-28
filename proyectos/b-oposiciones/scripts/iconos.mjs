// Genera los iconos PNG de la PWA y la ficha de Google Play a partir de un SVG, con el Chromium de Playwright.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const req = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium } = req('playwright');
const color = JSON.parse(fs.readFileSync(new URL('../config/marca.json', import.meta.url))).color;
const svg = (s, pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100"><rect width="100" height="100" rx="${pad ? 0 : 22}" fill="${color}"/><g transform="translate(50 50) scale(${pad ? 0.62 : 0.8}) translate(-50 -50)"><path d="M50 14 L82 86 H68 L61 69 H39 L32 86 H18 Z M44 57 H56 L50 41 Z" fill="#fff"/><circle cx="76" cy="24" r="9" fill="#5eead4"/></g></svg>`;
const b = await chromium.launch();
const p = await b.newPage();
for (const [nombre, s, pad] of [['icon-192', 192, false], ['icon-512', 512, false], ['maskable-512', 512, true], ['play-512', 512, false]]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<html><body style="margin:0">${svg(s, pad)}</body></html>`);
  fs.mkdirSync(new URL('../public/icons/', import.meta.url), { recursive: true });
  await p.screenshot({ path: new URL(`../public/icons/${nombre}.png`, import.meta.url).pathname, omitBackground: true });
}
await b.close();
console.log('iconos ok');
