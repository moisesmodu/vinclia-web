// Performance test for Trick Floor on an emulated mid-range phone (adapted from scripts/perf.mjs):
//   800×360 landscape, touch (on-screen buttons shown), DPR 2, CPU 4× slower (CDP), 45 s.
// Autopilot through the real touch path (Play.touch, as the Hud sets it): runs right, jumps every ~0.6 s, so it
// triggers traps, dies and respawns a lot (the worst case for particles and rebuilding traps); every 9 s it finishes
// the level and goes to the next one. Measures CPU time per frame (update + render submission, what decides FPS on a
// phone with a GPU). Notes the machine load (uptime): other jobs on this container inflate the numbers.
// Usage (from proyectos/juegos, after GAME=trick-floor node scripts/build.mjs web): PORT=5475 node trick-floor/test-perf.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = 'trick-floor';
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5475);
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
  window.__perf = { js: [], frames: 0, deaths: 0, levels: [] };
  let a = 0, jumpT = 0, levelT = performance.now();
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => {
    const P = window.__perf;
    P.js.push(performance.now() - a); P.frames++;
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || !s.started) return;
    const now = performance.now();
    // autopilot through the touch input
    s.auto = { l: false, r: true, j: (now - jumpT) % 600 < 160 };
    if (now - levelT > 9000 && s.alive) { levelT = now; P.levels.push({ level: s.level, deaths: s.deaths }); s.complete(); }
  });
  setInterval(() => {
    const s = g.scene.getScene('Play'), h = g.scene.getScene('Hud');
    if (g.scene.isActive('Hud') && h.over && !h.__next) { h.__next = true; setTimeout(() => h.next(), 300); }
  }, 200);
});
await page.evaluate(() => window.__game.scene.getScene('Menu').go(1));

const end = Date.now() + secs * 1000;
let deaths = 0, lastLv = 0, lastD = 0;
while (Date.now() < end) {
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); return { lv: p.level, d: p.deaths }; });
  if (s.lv !== lastLv) { lastLv = s.lv; lastD = 0; }
  if (s.d > lastD) { deaths += s.d - lastD; lastD = s.d; }
}
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
  muertesPilotoAutomatico: deaths,
  uptimeAntes: uptimeBefore,
  uptimeDespues: uptimeAfter,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
await writeFile(resolve(root, game, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
