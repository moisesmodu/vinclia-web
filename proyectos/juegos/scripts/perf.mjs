// Prueba de rendimiento y de dificultad en "móvil de gama media" emulado:
//   pantalla 800×360 apaisada, táctil, DPR 2, CPU 4 veces más lenta (CDP), piloto automático.
// Uso: npm run build && GAME=egg-truck SECS=60 node scripts/perf.mjs
// Mide: tiempo de CPU por fotograma (lo que decide los FPS en un móvil con GPU), FPS reales en este
// contenedor (sin GPU: el pintado va por software y es mucho más lento que en un teléfono), distancia por
// partida del piloto automático (sirve para calibrar la dificultad: partidas de 1 a 3 minutos).
import { createRequire } from 'node:module';
// Playwright: el del sistema si existe (NODE_PATH), si no 'npm i -D playwright'.
const { chromium } = createRequire(import.meta.url)('playwright');
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = process.env.GAME || 'egg-truck';
const secs = +(process.env.SECS || 60);
const throttle = +(process.env.CPU || 4);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist', p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(5077);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
const t0 = Date.now();
await page.goto(`http://localhost:5077/${game}/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
const loadMs = Date.now() - t0;

// Instrumentación: tiempo de CPU de cada fotograma y piloto automático sencillo.
await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], frames: 0, runs: [] };
  let a = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => { window.__perf.js.push(performance.now() - a); window.__perf.frames++; });
  setInterval(() => {
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || !s.truck) return;
    const a = s.truck.chassis.angle % (Math.PI * 2);
    // mantener salvo si el camión se encabrita hacia atrás (en el aire o haciendo caballito)
    g.registry.set('hold', !(a < -0.45 || (s.groundedNow === 0 && a < -0.15)));
    if (!s.alive && !s.__counted) { s.__counted = true; window.__perf.runs.push(s.dist); }
  }, 50);
});
await page.keyboard.press('Space');

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
const last = await page.evaluate(() => { const s = window.__game.scene.getScene('Play'); return s?.alive ? s.dist : null; });
if (last !== null) r.runs.push(`${last} (sin terminar)`);
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
await browser.close();
server.close();

const js = r.js.slice(30).sort((a, b) => a - b);
const pct = (q) => js[Math.min(js.length - 1, Math.floor(js.length * q))];
const avg = js.reduce((a, b) => a + b, 0) / js.length;
const out = {
  juego: game,
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `800x360 táctil, DPR 2, CPU x${throttle}`,
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { media: +avg.toFixed(2), p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), p99: +pct(0.99).toFixed(2) },
  fpsMaximoPorCpu: +(1000 / pct(0.95)).toFixed(0),
  partidasPilotoAutomatico: r.runs,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
await writeFile(resolve(root, game, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
