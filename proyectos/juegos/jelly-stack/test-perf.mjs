// Performance test for Jelly Stack on an emulated mid-range phone (adapted from scripts/perf.mjs):
//   800×360 landscape, touch, DPR 2, CPU 4× slower (CDP), autopilot that taps when the slider is aligned.
// Usage (from proyectos/juegos, after the build): node jelly-stack/test-perf.mjs   (env: SECS=45 CPU=4 PORT=5202 PREBUILD=30)
// Measures CPU time per frame (update + render submission, what decides FPS on a phone with a GPU), split by
// tower height so the 40+ blocks case is visible. Writes jelly-stack/rendimiento.json.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = 'jelly-stack';
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5202);
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
await page.goto(`http://localhost:${port}/${game}/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 60000 });
const loadMs = Date.now() - t0;

await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], tall: [], frames: 0, runs: [], maxBlocks: 0 };
  let a = 0, prev = null, prevSlider = null, aim = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => {
    const ms = performance.now() - a, P = window.__perf, s = g.scene.getScene('Play');
    P.js.push(ms); P.frames++;
    if (g.scene.isActive('Play') && s.score >= 40) P.tall.push(ms);
    if (!g.scene.isActive('Play')) return;
    P.maxBlocks = Math.max(P.maxBlocks, s.tower.length + s.pieces?.length || 0);
    if (!s.alive && !s.__counted && !s.slider) { s.__counted = true; P.runs.push(s.score); }
    // autopilot: tap when the slider crosses the target (mostly perfect, sometimes 30 units off)
    if (!s.alive || s.paused || !s.slider) { prev = null; return; }
    const top = s.tower[s.tower.length - 1];
    const d = s.slider.x - (top.x + aim);
    if (prevSlider === s.slider && prev !== null && (prev <= 0) !== (d <= 0) && Math.abs(d) < 150) {
      s.slider.x = top.x + aim; prev = null; prevSlider = null;
      aim = Math.random() < 0.12 ? (Math.random() < 0.5 ? -30 : 30) : 0;
      s.drop();
      return;
    }
    prev = d; prevSlider = s.slider;
  });
});
await page.touchscreen.tap(240, 230); // the play button (or anywhere: Space also works)
await page.evaluate(() => window.__game.scene.getScene('Menu').go());
// This container renders on the CPU (≈13 FPS), so the autopilot alone climbs slowly: the first run starts with
// PREBUILD perfect drops placed instantly, to measure the tall-tower case (40+ blocks, culling) inside SECS.
const prebuild = +(process.env.PREBUILD ?? 30);
await page.waitForFunction(() => { const s = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && s.alive && s.slider; }, null, { timeout: 60000 });
await page.evaluate(async (n) => {
  const s = window.__game.scene.getScene('Play');
  for (let i = 0; i < n && s.alive; i++) { s.slider.x = s.tower[s.tower.length - 1].x; s.drop(); await new Promise((r) => setTimeout(r, 30)); }
}, prebuild);

const end = Date.now() + secs * 1000;
while (Date.now() < end) {
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const g = window.__game, s = g.scene.getScene('Play');
    if (g.scene.isActive('Play') && s.__counted && !s.__restarting && g.scene.getScene('Hud').over) { s.__restarting = true; setTimeout(() => g.scene.getScene('Hud').restart(), 600); }
  });
}
const r = await page.evaluate(() => window.__perf);
const last = await page.evaluate(() => { const s = window.__game.scene.getScene('Play'); return s?.alive ? s.score : null; });
if (last !== null) r.runs.push(`${last} (unfinished)`);
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
await browser.close();
server.close();

const stats = (arr) => {
  const js = arr.slice().sort((a, b) => a - b);
  if (!js.length) return null;
  const pct = (q) => +js[Math.min(js.length - 1, Math.floor(js.length * q))].toFixed(2);
  return { frames: js.length, media: +(js.reduce((a, b) => a + b, 0) / js.length).toFixed(2), p50: pct(0.5), p95: pct(0.95), p99: pct(0.99) };
};
const out = {
  juego: game,
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `800x360 táctil, DPR 2, CPU x${throttle}`,
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: stats(r.js.slice(30)),
  cpuPorFotogramaConTorreDe40oMas: stats(r.tall),
  maxObjetosDeBloque: r.maxBlocks,
  partidasPilotoAutomatico: r.runs,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
await writeFile(resolve(root, game, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
