// Tiny Harbor performance on an emulated mid-range phone (adapted from fruit-stand/test-perf.mjs): 800×360 landscape,
// touch, DPR 2, CPU 4× slower (CDP), autoplay dragging boats around. Before measuring (without CPU throttling) the game
// is advanced to the third port with every crane, tugs and a full anchorage.
// Usage (from proyectos/juegos): GAME=tiny-harbor node scripts/build.mjs web && PORT=5943 node tiny-harbor/test-perf.mjs
// Variables: SECS (45), CPU (4), PORT (5943), W/H (800/360). Writes tiny-harbor/rendimiento.json (NOSAVE=1 to skip).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadavg } from 'node:os';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5943);
const W = +(process.env.W || 800), H = +(process.env.H || 360);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
const t0 = Date.now();
await page.goto(`http://localhost:${port}/tiny-harbor/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 60000 });
const loadMs = Date.now() - t0;

// preparar sin frenar la CPU: tercer puerto, casi todo comprado
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await page.evaluate(() => window.__game.scene.getScene('Menu').go());
const ready = () => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.sim && !p.paused && !p.leaving; };
await page.waitForFunction(ready, null, { timeout: 30000 });
for (let i = 0; i < 300; i++) {
  const st = await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); window.__game.scene.getScene('Hud')?.portPanel?.close?.(); return p.sim && !p.paused && !p.leaving ? p.sim.port : -1; });
  if (st === 2) break;
  if (st >= 0) await page.evaluate(() => window.__game.scene.getScene('Play').fastForward(120));
  await page.waitForTimeout(st >= 0 ? 30 : 300);
}
await page.waitForFunction(ready, null, { timeout: 30000 });
await page.evaluate(() => window.__game.scene.getScene('Play').fastForward(800));
await page.evaluate(() => window.__game.scene.getScene('Play').autoplay(true));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
await page.waitForTimeout(1500);

await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], frames: 0, maxB: 0 };
  let a = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => {
    window.__perf.js.push(performance.now() - a); window.__perf.frames++;
    window.__perf.maxB = Math.max(window.__perf.maxB, g.scene.getScene('Play').sim.boats.length);
  });
});
const before = await page.evaluate(() => { const s = window.__game.scene.getScene('Play').sim; return { port: s.port + 1, bought: s.bought.size, berths: s.owned, tugs: s.tugs.length, sailed: s.sailed }; });
await page.waitForTimeout(secs * 1000);
const r = await page.evaluate(() => window.__perf);
const after = await page.evaluate(() => window.__game.scene.getScene('Play').sim.sailed);
await browser.close();
server.close();

const js = r.js.slice(30).sort((a, b) => a - b);
const pct = (q) => js[Math.min(js.length - 1, Math.floor(js.length * q))];
const avg = js.reduce((a, b) => a + b, 0) / js.length;
const out = {
  juego: 'tiny-harbor',
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `${W}x${H} táctil, DPR 2, CPU x${throttle}`,
  cargaHastaMenuMs: loadMs,
  cargaMaquina: loadavg().map((x) => +x.toFixed(2)),
  escena: { puerto: before.port, mejoras: before.bought, gruas: before.berths, remolcadores: before.tugs, barcosMax: r.maxB, barcosZarpadosEnLaPrueba: after - before.sailed },
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { media: +avg.toFixed(2), p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), p99: +pct(0.99).toFixed(2) },
  fpsMaximoPorCpu: +(1000 / pct(0.95)).toFixed(0),
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
if (!process.env.NOSAVE) await writeFile(resolve(here, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
if (pct(0.95) >= 12 || errors.length) process.exitCode = 1;
