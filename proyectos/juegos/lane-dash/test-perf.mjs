// Prueba de rendimiento de Lane Dash en "móvil de gama media" emulado (adaptada de rocket-hop/test-perf.mjs):
// 800×360 apaisado, táctil, DPR 2, CPU 4 veces más lenta (CDP), piloto automático que esquiva, salta y se agacha.
// Uso (desde proyectos/juegos): GAME=lane-dash node scripts/build.mjs web && node lane-dash/test-perf.mjs
// Variables: SECS (45), CPU (4), PORT (5492), W/H (800/360). Escribe lane-dash/rendimiento.json.
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
const port = +(process.env.PORT || 5492);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
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
await page.goto(`http://localhost:${port}/lane-dash/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
const loadMs = Date.now() - t0;

await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], frames: 0, runs: [] };
  let a = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => { window.__perf.js.push(performance.now() - a); window.__perf.frames++; });
  const HARD = ['cart', 'wet'], OBST = ['box', 'sign', 'cart', 'wet'];
  // piloto automático: mira el obstáculo más cercano de cada carril
  window.__autopilot = (s) => {
    const near = (lane, range) => s.objs.filter((o) => o.on && !o.knocked && OBST.includes(o.kind) && Math.abs(o.x - lane) < 0.3
      && o.wz - s.dist > -0.6 && o.wz - s.dist < range).sort((p, q) => p.wz - q.wz)[0];
    const range = s.speed * 0.8 + 2;
    const o = near(s.lane, range);
    if (!o) return;
    const dz = o.wz - s.dist;
    if (!HARD.includes(o.kind)) {
      if (dz < s.speed * 0.2 + 0.6 && dz > 0) s.act(o.kind === 'box' ? 'up' : 'down');
      return;
    }
    const score = (l) => { const q = near(l, range + 4); return !q ? 99 : HARD.includes(q.kind) ? q.wz - s.dist : 50; };
    const opts = [s.lane - 1, s.lane + 1].filter((l) => l >= -1 && l <= 1).sort((p, q) => score(q) - score(p));
    if (score(opts[0]) > dz) s.act(opts[0] < s.lane ? 'left' : 'right');
  };
  setInterval(() => {
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || !s.objs) return;
    if (s.alive && !s.paused && !window.__noPilot) window.__autopilot(s);
    if (!s.alive && !s.__counted) { s.__counted = true; window.__perf.runs.push({ m: Math.floor(s.dist), s: +s.time0.toFixed(1), coins: s.coins }); }
  }, 40);
});
await page.evaluate(() => window.__game.scene.getScene('Menu').go());

const end = Date.now() + secs * 1000;
while (Date.now() < end) {
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const g = window.__game, s = g.scene.getScene('Play');
    if (g.scene.isActive('Play') && s.__counted && !s.__restarting) { s.__restarting = true; setTimeout(() => g.scene.getScene('Hud').restart(), 600); }
  });
}
const r = await page.evaluate(() => window.__perf);
const last = await page.evaluate(() => { const s = window.__game.scene.getScene('Play'); return s?.alive ? { m: Math.floor(s.dist), s: +s.time0.toFixed(1), sinTerminar: true } : null; });
if (last) r.runs.push(last);
await browser.close();
server.close();

const js = r.js.slice(30).sort((a, b) => a - b);
const pct = (q) => js[Math.min(js.length - 1, Math.floor(js.length * q))];
const avg = js.reduce((a, b) => a + b, 0) / js.length;
const out = {
  juego: 'lane-dash',
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `${process.env.W || 800}x${process.env.H || 360} táctil, DPR 2, CPU x${throttle}`,
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { media: +avg.toFixed(2), p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), p99: +pct(0.99).toFixed(2) },
  fpsMaximoPorCpu: +(1000 / pct(0.95)).toFixed(0),
  partidasPilotoAutomatico: r.runs,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
if (!process.env.NOSAVE) await writeFile(resolve(here, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
