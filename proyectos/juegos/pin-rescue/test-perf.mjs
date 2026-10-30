// Performance test for Pin Rescue on an emulated mid-range phone (adapted from scripts/perf.mjs):
//   800×360 landscape, touch (on-screen buttons shown), DPR 2, CPU 4× slower (CDP), 45 s.
// Autopilot: each level plays the designer's line (Play.autoplay(), exact simulation times), then the level-complete
// panel's "next"; every odd level is first failed on purpose (breakEgg → instant rebuild of the level).
// Starts at level 7 (two water tanks on a big lava basin) so large amounts of water, lava, stone and gold move at once,
// then slimes and sand. Measures CPU time per frame (simulation steps + grid texture + render submission, what decides
// FPS on a phone with a GPU). Notes the machine load (uptime): other jobs on this container inflate the numbers.
// Usage (from proyectos/juegos, after GAME=pin-rescue node scripts/build.mjs web): PORT=5904 node pin-rescue/test-perf.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = 'pin-rescue';
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5904);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist', p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const uptimeBefore = execSync('uptime').toString().trim();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
const t0 = Date.now();
await page.goto(`http://localhost:${port}/${game}/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 60000 });
const loadMs = Date.now() - t0;

await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], frames: 0, fails: 0, levels: [] };
  let a = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => { const P = window.__perf; P.js.push(performance.now() - a); P.frames++; });
  let lastRun = null, broke = false;
  setInterval(() => {
    const p = g.scene.getScene('Play'), h = g.scene.getScene('Hud');
    if (!g.scene.isActive('Play') || !p.started) return;
    if (h && h.over && !h.over.__next) { h.over.__next = true; window.__perf.levels.push({ level: p.level, fails: p.fails }); setTimeout(() => h.next(), 400); return; }
    if (p.s !== lastRun && p.alive && !p.finished) {
      lastRun = p.s;
      // odd levels: fail once first (sad face, rebuild), then play the line
      if (p.level % 2 && !broke) { broke = true; setTimeout(() => { p.breakEgg(); window.__perf.fails++; }, 700); return; }
      broke = false;
      p.autoplay();
      lastRun = p.s;
    }
  }, 150);
});
await page.evaluate(() => window.__game.scene.getScene('Menu').go(7));

const end = Date.now() + secs * 1000;
while (Date.now() < end) await page.waitForTimeout(500);
const r = await page.evaluate(() => window.__perf);
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
await browser.close();
server.close();
const uptimeAfter = execSync('uptime').toString().trim();

const js = r.js.slice(30).sort((a, b) => a - b);
const pct = (q) => +js[Math.min(js.length - 1, Math.floor(js.length * q))].toFixed(2);
const out = {
  juego: game,
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `800x360 táctil, DPR 2, CPU x${throttle}, ${secs} s`,
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { frames: js.length, media: +(js.reduce((a, b) => a + b, 0) / js.length).toFixed(2), p50: pct(0.5), p95: pct(0.95), p99: pct(0.99) },
  fpsMaximoPorCpu: Math.round(1000 / pct(0.95)),
  nivelesPilotoAutomatico: r.levels,
  fallosAPropósito: r.fails,
  uptimeAntes: uptimeBefore,
  uptimeDespues: uptimeAfter,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
await writeFile(resolve(root, game, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
