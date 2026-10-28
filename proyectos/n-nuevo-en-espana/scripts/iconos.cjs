// Genera los PNG de la PWA y de Google Play a partir de los SVG. Uso: node scripts/iconos.cjs
(async () => {
const { chromium } = require("playwright");
const fs = require("node:fs");
const b = await chromium.launch();
const p = await b.newPage();
for (const [svg, tam, salida] of [
  ["icono.svg", 192, "icono-192.png"], ["icono.svg", 512, "icono-512.png"],
  ["maskable.svg", 512, "maskable-512.png"], ["icono.svg", 32, "favicon-32.png"]
]) {
  await p.setViewportSize({ width: tam, height: tam });
  const s = fs.readFileSync(`public/iconos/${svg}`, "utf8");
  await p.setContent(`<html><body style="margin:0;background:transparent">${s.replace("<svg ", `<svg width="${tam}" height="${tam}" `)}</body></html>`);
  await p.screenshot({ path: `public/iconos/${salida}`, omitBackground: true });
}
await b.close();
console.log("iconos generados");
})();
