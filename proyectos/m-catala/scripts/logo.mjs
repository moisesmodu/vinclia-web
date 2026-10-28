#!/usr/bin/env node
// Regenera el logotip d'Aprova (MARCA.md) a partir d'Archivo Expanded ExtraBold convertit a traçat: public/marca/logo*.svg, icono.svg,
// app/icon.svg i components/Logo.tsx. Ús: node scripts/logo.mjs <ruta a ArchivoExpanded-ExtraBold.ttf>
// (el TTF estàtic es baixa de Google Fonts: css2?family=Archivo:wdth,wght@125,800 amb un User-Agent antic). No es toca a mà.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const ot = createRequire(import.meta.url)('opentype.js');
const ttf = process.argv[2]; if (!ttf) { console.error('Falta el TTF'); process.exit(1); }
const f = ot.loadSync(ttf); const p = f.getPath('Aprova', 0, 0, 100);
p.commands.forEach((c) => { for (const k of ['x', 'y', 'x1', 'y1', 'x2', 'y2']) if (c[k] !== undefined) c[k] = Math.round(c[k] * 100) / 100; });
const d = p.toPathData(2);
// La «v» ocupa x 293.5–363.6, y −52.8–0 (línia base 0). En Volat: r=15 al centre de la copa de la v. Llenç 450×100 (desplaçament +4, +78).
const cx = 328.5 + 4, cy = -59 + 78, r = 15;
const cara = (to, ulls) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${to}"/><ellipse cx="${cx - 5}" cy="${cy - 1}" rx="2" ry="2.8" fill="${ulls}"/><ellipse cx="${cx + 5}" cy="${cy - 1}" rx="2" ry="2.8" fill="${ulls}"/><circle cx="${cx - 4.3}" cy="${cy - 2}" r=".8" fill="${to}"/><circle cx="${cx + 5.7}" cy="${cy - 2}" r=".8" fill="${to}"/><path d="M${cx - 3} ${cy + 4.5}q3 2.6 6 0" stroke="${ulls}" stroke-width="1.7" stroke-linecap="round" fill="none"/>`;
const svg = (text, to, ulls) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 100" role="img" aria-label="Aprova"><g transform="translate(4 78)"><path d="${d}" fill="${text}"/></g>${cara(to, ulls)}</svg>`;
fs.writeFileSync('public/marca/logo.svg', svg('#141C3A', '#2140D6', '#FFFFFF'));
fs.writeFileSync('public/marca/logo-boli.svg', svg('#2140D6', '#2140D6', '#FFFFFF'));
fs.writeFileSync('public/marca/logo-blanc.svg', svg('#FFFFFF', '#FFFFFF', '#2140D6'));
const tsx = fs.readFileSync('components/Logo.tsx', 'utf8').replace(/const CAMI = '[^']*';/, `const CAMI = '${d}';`);
fs.writeFileSync('components/Logo.tsx', tsx);
console.log('logotip regenerat');
