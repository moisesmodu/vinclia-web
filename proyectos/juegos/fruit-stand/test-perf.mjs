// Prueba de rendimiento de Fruit Stand en "móvil de gama media" emulado (adaptada de lane-dash/test-perf.mjs):
// 800×360 apaisado, táctil, DPR 2, CPU 4 veces más lenta (CDP), piloto automático andando por el puesto.
// Antes de medir (sin frenar la CPU) se avanza la partida hasta el tercer puesto con muchos clientes y ayudantes.
// Uso (desde proyectos/juegos): GAME=fruit-stand node scripts/build.mjs web && node fruit-stand/test-perf.mjs
// Variables: SECS (45), CPU (4), PORT (5708), W/H (800/360). Escribe fruit-stand/rendimiento.json.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadavg } from 'node:os';
const { chromium } = createRequire(import.meta.url)('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5708);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist', p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +(process.env.W || 800), height: +(process.env.H || 360) }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
const t0 = Date.now();
await page.goto(`http://localhost:${port}/fruit-stand/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 60000 });
const loadMs = Date.now() - t0;

// preparar: partida avanzada (tercer puesto) sin frenar la CPU
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await page.evaluate(() => window.__game.scene.getScene('Menu').go());
const ready = () => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.sim && !p.paused && !p.leaving; };
await page.waitForFunction(ready, null, { timeout: 30000 });
for (let i = 0; i < 200; i++) {
  const st = await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); return p.sim && !p.paused && !p.leaving ? p.sim.stand : -1; });
  if (st === 2) break;
  if (st >= 0) await page.evaluate(() => window.__game.scene.getScene('Play').fastForward(120));
  await page.waitForTimeout(st >= 0 ? 30 : 300);
}
await page.waitForFunction(ready, null, { timeout: 30000 });
await page.evaluate(() => window.__game.scene.getScene('Play').fastForward(2200));
await page.evaluate(() => { window.__game.scene.getScene('Play').autopilot = true; });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
await page.waitForTimeout(1500);

await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], frames: 0, maxC: 0, maxH: 0 };
  let a = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => {
    window.__perf.js.push(performance.now() - a); window.__perf.frames++;
    const s = g.scene.getScene('Play').sim;
    window.__perf.maxC = Math.max(window.__perf.maxC, s.customers.length); window.__perf.maxH = Math.max(window.__perf.maxH, s.helpers.length);
  });
});
const before = await page.evaluate(() => { const s = window.__game.scene.getScene('Play').sim; return { stand: s.stand + 1, bought: s.bought.size, served: s.served }; });
await page.waitForTimeout(secs * 1000);
const r = await page.evaluate(() => window.__perf);
const after = await page.evaluate(() => { const s = window.__game.scene.getScene('Play').sim; return { served: s.served, stand: s.stand + 1 }; });
await browser.close();
server.close();

const js = r.js.slice(30).sort((a, b) => a - b);
const pct = (q) => js[Math.min(js.length - 1, Math.floor(js.length * q))];
const avg = js.reduce((a, b) => a + b, 0) / js.length;
const out = {
  juego: 'fruit-stand',
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `${process.env.W || 800}x${process.env.H || 360} táctil, DPR 2, CPU x${throttle}`,
  cargaHastaMenuMs: loadMs,
  cargaMaquina: loadavg().map((x) => +x.toFixed(2)),
  escena: { puesto: before.stand, comprasEnElPuesto: before.bought, clientesMax: r.maxC, ayudantes: r.maxH, ventasDuranteLaPrueba: after.served - before.served },
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { media: +avg.toFixed(2), p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), p99: +pct(0.99).toFixed(2) },
  fpsMaximoPorCpu: +(1000 / pct(0.95)).toFixed(0),
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
if (!process.env.NOSAVE) await writeFile(resolve(here, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
