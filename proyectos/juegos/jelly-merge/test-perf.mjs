// Performance test for Jelly Merge on an emulated mid-range phone (adapted from scripts/perf.mjs):
//   800×360 landscape, touch, DPR 2, CPU 4× slower (CDP), SECS seconds (45 by default).
// Full board on purpose: the autopilot (Play.autoplay(), random spots) fills the jar sped up until it holds FULL
// jellies, then plays on in real time at a human pace with game over switched off (Play.immortal, test only), so the
// jar stays crowded to the top line while new jellies keep landing and merging for the whole measurement.
// Measures CPU time per frame (fixed-step Matter physics + game rules + render submission: what decides FPS on a
// phone with a GPU), overall and only in frames with FULL or more jellies in the jar. Notes the machine load (uptime).
// Usage (from proyectos/juegos, after GAME=jelly-merge node scripts/build.mjs web): PORT=5964 node jelly-merge/test-perf.mjs
//   DIST=<folder> serves the build from another folder (default: dist/, or dist-portales/ for the SDK test).
//   env: SECS=45 CPU=4 FULL=30
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = 'jelly-merge';
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const full = +(process.env.FULL || 30);
const port = +(process.env.PORT || 5964);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(process.env.DIST || join(root, 'dist'), p))); }
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

await page.touchscreen.tap(240, 200);
await page.evaluate(() => window.__game.scene.getScene('Menu').go());
await page.waitForFunction(() => { const s = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && s.alive && s.started; }, null, { timeout: 60000 });
// fill the jar (not measured): sped up, random spots, no game over
await page.evaluate(() => { const s = window.__game.scene.getScene('Play'); s.immortal = true; s.autoSloppy = 1; s.turbo = 6; s.autoplay(); });
await page.waitForFunction((n) => window.__game.scene.getScene('Play').jellies.length >= n, full, { timeout: 180000, polling: 250 });
await page.evaluate((full) => {
  const g = window.__game, s = g.scene.getScene('Play');
  s.turbo = 1;
  window.__perf = { js: [], full: [], frames: 0, maxJellies: 0, minJellies: 999, merges: 0 };
  s.events.on('merge', () => window.__perf.merges++);
  let a = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => {
    const ms = performance.now() - a, P = window.__perf, n = s.jellies.length;
    P.js.push(ms); P.frames++;
    P.maxJellies = Math.max(P.maxJellies, n); P.minJellies = Math.min(P.minJellies, n);
    if (n >= full) P.full.push(ms);
  });
}, full);
const end = Date.now() + secs * 1000;
while (Date.now() < end) await page.waitForTimeout(500);
const r = await page.evaluate(() => window.__perf);
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
await browser.close();
server.close();
const uptimeAfter = execSync('uptime').toString().trim();

const stats = (arr) => {
  const js = arr.slice().sort((a, b) => a - b);
  if (!js.length) return null;
  const pct = (q) => +js[Math.min(js.length - 1, Math.floor(js.length * q))].toFixed(2);
  return { frames: js.length, media: +(js.reduce((a, b) => a + b, 0) / js.length).toFixed(2), p50: pct(0.5), p95: pct(0.95), p99: pct(0.99) };
};
const all = stats(r.js.slice(30));
const out = {
  juego: game,
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `800x360 táctil, DPR 2, CPU x${throttle}, ${secs} s con el tarro lleno hasta la línea (piloto automático, sin fin de partida)`,
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: all,
  [`cpuPorFotogramaCon${full}oMasGelatinas`]: stats(r.full),
  gelatinasEnElTarro: { min: r.minJellies, max: r.maxJellies },
  fusionesDuranteLaMedida: r.merges,
  fpsMaximoPorCpu: all ? Math.round(1000 / all.p95) : null,
  uptimeAntes: uptimeBefore,
  uptimeDespues: uptimeAfter,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
await writeFile(resolve(root, game, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
if (errors.length || !all || all.p95 >= 12) process.exitCode = 1;
