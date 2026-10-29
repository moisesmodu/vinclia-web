// Prueba de rendimiento de Hook Hop en "móvil de gama media" emulado (adaptada de scripts/perf.mjs, que asume
// las piezas internas de Egg Truck): 800×360 apaisado, táctil, DPR 2, CPU 4 veces más lenta (CDP), piloto automático.
// Uso (desde proyectos/juegos): GAME=hook-hop node scripts/build.mjs web && node hook-hop/test-perf.mjs
// Variables: SECS (45), CPU (4), PORT (5452). Escribe hook-hop/rendimiento.json.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5452);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist', p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
const t0 = Date.now();
await page.goto(`http://localhost:${port}/hook-hop/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
const loadMs = Date.now() - t0;

// Instrumentación: CPU de cada fotograma y piloto automático sencillo: colgado, suelta en la subida hacia delante;
// en el aire, mantiene en cuanto cae y hay un nudo al alcance (anillo blanco).
await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], frames: 0, runs: [], secs: [] };
  let a = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => { window.__perf.js.push(performance.now() - a); window.__perf.frames++; });
  setInterval(() => {
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || !s.started) return;
    if (!s.__t0 && s.alive) s.__t0 = performance.now();
    let hold = false;
    if (s.anchor) {
      const dx = s.p.x - s.anchor.x;
      hold = !(dx > 60 && s.v.y < -80 && s.v.x > 250);
    } else hold = !!s.target && s.v.y > -150;
    g.registry.set('hold', s.alive && hold);
    if (!s.alive && s.__t0 && !s.__counted) { s.__counted = true; window.__perf.runs.push(s.score); window.__perf.secs.push(Math.round((performance.now() - s.__t0) / 1000)); }
  }, 30);
});
await page.evaluate(() => window.__game.scene.getScene('Menu').go());

const end = Date.now() + secs * 1000;
while (Date.now() < end) {
  await page.waitForTimeout(1000);
  // si la partida terminó, reinicio en un clic (lo que haría el jugador)
  await page.evaluate(() => {
    const g = window.__game, s = g.scene.getScene('Play');
    if (g.scene.isActive('Play') && s.__counted && !s.__restarting) { s.__restarting = true; setTimeout(() => { g.scene.getScene('Hud').restart(); s.__counted = s.__restarting = false; s.__t0 = 0; }, 600); }
  });
}
const r = await page.evaluate(() => window.__perf);
const last = await page.evaluate(() => { const s = window.__game.scene.getScene('Play'); return s?.alive ? s.score : null; });
if (last !== null) r.runs.push(`${last} (sin terminar)`);
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
await browser.close();
server.close();

const js = r.js.slice(30).sort((a, b) => a - b);
const pct = (q) => js[Math.min(js.length - 1, Math.floor(js.length * q))];
const avg = js.reduce((a, b) => a + b, 0) / js.length;
const out = {
  juego: 'hook-hop',
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `800x360 táctil, DPR 2, CPU x${throttle}`,
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { media: +avg.toFixed(2), p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), p99: +pct(0.99).toFixed(2) },
  fpsMaximoPorCpu: +(1000 / pct(0.95)).toFixed(0),
  metrosPorPartidaPilotoAutomatico: r.runs,
  segundosPorPartida: r.secs,
  cargaDelSistema: (await import('node:os')).loadavg().map((x) => +x.toFixed(2)),
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
await writeFile(resolve(here, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
