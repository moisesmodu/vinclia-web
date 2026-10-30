// Prueba de rendimiento de Rocket Hop en "móvil de gama media" emulado (adaptada de scripts/perf.mjs, que asume
// las piezas internas de Egg Truck): 800×360 apaisado, táctil, DPR 2, CPU 4 veces más lenta (CDP), piloto automático.
// Uso (desde proyectos/juegos): GAME=rocket-hop node scripts/build.mjs web && node rocket-hop/test-perf.mjs
// Variables: SECS (45), CPU (4), PORT (5192). Escribe rocket-hop/rendimiento.json.
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
const port = +(process.env.PORT || 5192);
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
await page.goto(`http://localhost:${port}/rocket-hop/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
const loadMs = Date.now() - t0;

// Instrumentación: CPU de cada fotograma y piloto automático sencillo: mantener mientras el cohete esté por debajo
// de la plataforma siguiente (para subir y avanzar) y, ya encima, para frenar la caída.
await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], phys: [], steps: [], frames: 0, runs: [] };
  let a = 0, ph = 0, st = 0;
  g.events.on('prestep', () => { a = performance.now(); ph = 0; st = 0; });
  g.events.on('postrender', () => {
    window.__perf.js.push(performance.now() - a); window.__perf.phys.push(ph); window.__perf.steps.push(st); window.__perf.frames++;
  });
  // tiempo de física por fotograma (a 8 FPS en este contenedor se hacen hasta 4 pasos por fotograma; en un móvil a 60 FPS, 1)
  setInterval(() => {
    const s = g.scene.getScene('Play');
    const w = s?.matter?.world;
    if (!w || w.__wrapped) return;
    const orig = w.step.bind(w);
    w.step = (d) => { const t = performance.now(); orig(d); ph += performance.now() - t; st++; };
    w.__wrapped = true;
  }, 100);
  setInterval(() => {
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || !s.rocket) return;
    const r = s.rocket, n = s.plats.find((q) => q.i > s.cur);
    if (n) {
      const dy = r.position.y - (n.body.position.y - 55), dx = n.body.position.x - r.position.x;
      const hold = Math.abs(dx) > 40 ? dy > -140 || r.velocity.y > 2.5 : r.velocity.y > Math.max(1.5, Math.sqrt(Math.max(0, -dy)) * 0.35);
      g.registry.set('hold', s.alive && hold);
    }
    if (!s.alive && !s.__counted) { s.__counted = true; window.__perf.runs.push(s.score); }
  }, 30);
});
await page.evaluate(() => window.__game.scene.getScene('Menu').go());

const end = Date.now() + secs * 1000;
while (Date.now() < end) {
  await page.waitForTimeout(1000);
  // si la partida terminó, reinicio en un clic (lo que haría el jugador)
  await page.evaluate(() => {
    const g = window.__game, s = g.scene.getScene('Play');
    if (g.scene.isActive('Play') && s.__counted && !s.__restarting) { s.__restarting = true; setTimeout(() => g.scene.getScene('Hud').restart(), 600); }
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
// CPU por fotograma normalizada a 1 paso de física (lo que pasa en un móvil que va a 60 FPS)
const one = r.js.slice(30).map((t, i) => t - r.phys[i + 30] + (r.steps[i + 30] ? r.phys[i + 30] / r.steps[i + 30] : 0)).sort((a, b) => a - b);
const pct1 = (q) => one[Math.min(one.length - 1, Math.floor(one.length * q))];
const steps = r.steps.slice(30), stepAvg = steps.reduce((a, b) => a + b, 0) / steps.length;
const avg = js.reduce((a, b) => a + b, 0) / js.length;
const out = {
  juego: 'rocket-hop',
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `800x360 táctil, DPR 2, CPU x${throttle}`,
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { media: +avg.toFixed(2), p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), p99: +pct(0.99).toFixed(2) },
  pasosDeFisicaPorFotograma: +stepAvg.toFixed(2),
  cpuPorFotogramaA1PasoMs: { p50: +pct1(0.5).toFixed(2), p95: +pct1(0.95).toFixed(2), p99: +pct1(0.99).toFixed(2) },
  fpsMaximoPorCpu: +(1000 / pct(0.95)).toFixed(0),
  puntosPorPartidaPilotoAutomatico: r.runs,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
await writeFile(resolve(here, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
