import { chromium } from 'playwright';
import fs from 'node:fs';
const S = '/tmp/claude-0/-home-user-vinclia-web/6dd18869-54da-58c4-88d3-40431186014a/scratchpad';
const P = '/home/user/vinclia-web/proyectos/m-catala/public';
const b = await chromium.launch(); const p = await b.newPage();
async function png(svgPath, size, out) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await p.screenshot({ path: out, omitBackground: true });
}
await png(`${P}/marca/icono.svg`, 192, `${P}/icons/icon-192.png`);
await png(`${P}/marca/icono.svg`, 512, `${P}/icons/icon-512.png`);
await png(`${S}/icona-maskable.svg`, 512, `${P}/icons/maskable-512.png`);
await png(`${S}/icona-maskable.svg`, 512, `${P}/icons/play-512.png`);
await b.close(); console.log('icones fetes');
