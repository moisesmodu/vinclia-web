// Prueba de rendimiento de Paint Grab en "móvil de gama media" emulado (adaptada de lane-dash/test-perf.mjs):
// 800×360 apaisado, táctil, DPR 2, CPU 4 veces más lenta (CDP), piloto automático (la IA "glotona" de los bots
// juega por el jugador) con reinicio en un clic al perder y paso a la ronda siguiente al acabar una.
// Además fuerza cada 5 s una captura enorme (medio patio de golpe) para medir el peor caso del relleno y del
// redibujado de los mosaicos del territorio.
// Uso (desde proyectos/juegos): GAME=paint-grab node scripts/build.mjs web && node paint-grab/test-perf.mjs
// Variables: SECS (45), CPU (4), PORT (5724), W/H (800/360), NOSAVE=1. Escribe paint-grab/rendimiento.json.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uptime, loadavg, cpus } from 'node:os';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5724);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist', p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const load0 = loadavg()[0];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +(process.env.W || 800), height: +(process.env.H || 360) }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { window.__autopilot = true; });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
const t0 = Date.now();
await page.goto(`http://localhost:${port}/paint-grab/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 60000 });
const loadMs = Date.now() - t0;

await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], big: [], frames: 0, runs: [], bigFills: 0 };
  let a = 0, bigFrame = false;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => {
    const d = performance.now() - a;
    window.__perf.js.push(d); window.__perf.frames++;
    if (bigFrame) { window.__perf.big.push(d); bigFrame = false; }
  });
  // captura enorme forzada: un lazo del jugador alrededor de medio patio, cerrado en un solo paso de simulación
  window.__bigFill = () => {
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || !s.alive) return;
    const sim = s.sim, y = sim.yard, me = sim.player, n = y.w;
    const i0 = y.nearestOwn(0, me.x, me.y);
    if (i0 < 0) return;
    const x0 = i0 % n, y0 = Math.floor(i0 / n);
    const path = [];
    const add = (x, yy) => { const i = y.idx(x, yy); if (y.owner[i] !== 1) path.push(i); };
    const X1 = x0 < n / 2 ? n - 2 : 1, Y1 = y0 < n / 2 ? n - 2 : 1, sx = Math.sign(X1 - x0), sy = Math.sign(Y1 - y0);
    for (let x = x0; x !== X1; x += sx) add(x, y0);
    for (let yy = y0; yy !== Y1; yy += sy) add(X1, yy);
    for (let x = X1; x !== x0; x -= sx) add(x, Y1);
    for (let yy = Y1; yy !== y0; yy -= sy) add(x0, yy);
    for (const i of path) { y.trail[i] = 1; }
    me.trail.push(...path);
    // el próximo paso de la simulación vuelve a casa y cierra el lazo: medimos ese fotograma
    bigFrame = true;
    const r = y.capture(0, me.trail); me.trail = []; me.pts = [];
    for (const w of r.wiped) sim.kill(sim.painters[w], me, 'wiped');
    sim.events.push({ t: 'capture', id: 0, gained: r.gained });
    window.__perf.bigFills++;
  };
  setInterval(() => {
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || !s.sim) return;
    if (!s.alive && !s.paused && !s.__counted) {
      s.__counted = true;
      window.__perf.runs.push({ ronda: s.round, pct: +s.sim.yard.pct(0).toFixed(1), puesto: s.sim.rank(0), quedan: Math.ceil(s.timeLeft) });
    }
  }, 50);
});
await page.evaluate(() => window.__game.scene.getScene('Menu').go());

const end = Date.now() + secs * 1000;
let nextBig = Date.now() + 5000;
while (Date.now() < end) {
  await page.waitForTimeout(500);
  if (Date.now() > nextBig) { nextBig += 5000; await page.evaluate(() => window.__bigFill()); }
  await page.evaluate(() => {
    const g = window.__game, s = g.scene.getScene('Play'), h = g.scene.getScene('Hud');
    if (g.scene.isActive('Play') && s.__counted && !s.__restarting && h?.over) {
      s.__restarting = true;
      setTimeout(() => (s.timeLeft <= 0 ? h.next() : h.restart()), 600);
    }
    // en el contenedor la ronda va lenta: se acorta para pasar también por el cambio de ronda
    if (g.scene.isActive('Play') && s.alive && s.timeLeft > 40 && !s.__cut) { s.__cut = true; s.timeLeft = 40; }
  });
}
const r = await page.evaluate(() => window.__perf);
await browser.close();
server.close();

const js = r.js.slice(30).sort((a, b) => a - b);
const pct = (q) => js[Math.min(js.length - 1, Math.floor(js.length * q))];
const avg = js.reduce((a, b) => a + b, 0) / js.length;
const out = {
  juego: 'paint-grab',
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `${process.env.W || 800}x${process.env.H || 360} táctil, DPR 2, CPU x${throttle}`,
  maquina: { uptimeS: Math.round(uptime()), cargaMedia1min: +load0.toFixed(2), nucleos: cpus().length },
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { media: +avg.toFixed(2), p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), p99: +pct(0.99).toFixed(2), max: +js[js.length - 1].toFixed(2) },
  fpsMaximoPorCpu: +(1000 / pct(0.95)).toFixed(0),
  capturasEnormes: { forzadas: r.bigFills, msFotograma: r.big.map((v) => +v.toFixed(2)) },
  partidasPilotoAutomatico: r.runs,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
if (!process.env.NOSAVE) await writeFile(resolve(here, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
