// Revisión visual de la venta: página de producto, bloque bajo el resultado y página de descarga a 390 y 1280 px.
//   node scripts/productos/capturas-web.mjs <sitio> <salida> [rutas...]
// Sirve dist/<sitio> en local y guarda capturas de página completa en <salida>/<sitio>-<ruta>-<ancho>.png
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [sitio, salida, ...rutas] = process.argv.slice(2);
const dir = `dist/${sitio}`;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const srv = createServer(async (req, res) => {
  let p = join(dir, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'Content-Type': TIPOS[extname(p)] || 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(4391);
await mkdir(salida, { recursive: true });
const nav = await chromium.launch();
try {
  for (const ancho of [390, 1280]) {
    const pag = await nav.newPage({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: ancho === 390 ? 2 : 1 });
    for (const r of rutas) {
      const [ruta, sel] = r.split('#');
      await pag.goto(`http://localhost:4391${ruta}`, { waitUntil: 'networkidle' });
      const nombre = `${sitio}${ruta.replace(/\/$/, '').replace(/\//g, '-') || '-inicio'}${sel ? '-' + sel : ''}-${ancho}.png`;
      const desborda = await pag.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (desborda) console.warn(`AVISO desbordamiento horizontal en ${ruta} a ${ancho}px`);
      if (sel) {
        const el = pag.locator(`.${sel}`).first();
        await el.scrollIntoViewIfNeeded();
        await pag.screenshot({ path: join(salida, nombre), clip: await el.boundingBox().then((b) => ({ x: 0, y: Math.max(0, b.y - 140), width: ancho, height: Math.min(b.height + 280, 1600) })) });
      } else await pag.screenshot({ path: join(salida, nombre), fullPage: true });
      console.log(nombre);
    }
    await pag.close();
  }
} finally { await nav.close(); srv.close(); }
