// Performance test for Penalty Season on an emulated mid-range phone (adapted from scripts/perf.mjs):
//   800×360 landscape, touch, DPR 2, CPU 4× slower (CDP), 45 s.
// Autopilot through the real input paths: swipes go through Hud.simSwipe (trail drawing + swipe → shot), dives
// through Play.onTap with screen coordinates (reads the tell, sometimes wrong). When a match ends it plays the next
// one in one click; at the end of a season it collects the reward in the season screen and carries on. Measures CPU
// time per frame (update + render submission, what decides FPS on a phone with a GPU) and notes the machine load
// (uptime): other jobs on this container inflate the numbers.
// Usage (from proyectos/juegos, after GAME=penalty-season node scripts/build.mjs web): PORT=5745 node penalty-season/test-perf.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = 'penalty-season';
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5745);
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
  const P = window.__perf = { js: [], upd: [], frames: 0, matches: [], kicks: 0, goals: 0, saves: 0, dives: 0 };
  let a = 0, aimAt = 0, overAt = 0, lastPhase = '';
  let b = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('prerender', () => { b = performance.now(); });
  g.events.on('postrender', () => {
    P.js.push(performance.now() - a); P.upd.push(b - a); P.frames++;
    const now = performance.now();
    const hub = g.scene.getScene('Hub');
    if (g.scene.isActive('Hub') && !hub.going) { hub.claimSeason(); hub.go(); return; }
    if (!g.scene.isActive('Play')) return;
    const s = g.scene.getScene('Play'), h = g.scene.getScene('Hud');
    if (s.phase !== lastPhase) {
      if (s.phase === 'aim') aimAt = now + 300 + Math.random() * 500;
      if (s.phase === 'after') { P.kicks++; }
      lastPhase = s.phase;
    }
    if (s.phase === 'aim' && now > aimAt) {
      // a real-looking swipe: from the bottom centre up toward a random corner, with a random bow
      const w = g.scale.width, hh = g.scale.height, t = now / 1000;
      const dx = (Math.random() - 0.5) * w * 0.35, bow = (Math.random() - 0.5) * 60, dur = 0.12 + Math.random() * 0.14;
      const pts = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ x: w / 2 + dx * f + bow * 4 * f * (1 - f), y: hh * 0.9 - hh * 0.5 * f, t: t + dur * f }));
      h.simSwipe(pts);
      aimAt = Infinity;
    }
    if (!s.meShooting && s.divedAt === null && s.phase === 'runup' && s.tellSide !== 0 && Math.random() < 0.08) {
      const cam = s.cameras.main, side = Math.random() < 0.8 ? s.tellSide : -s.tellSide;
      if (s.onTap((side * 200 - cam.worldView.x) * cam.zoom, (-90 - cam.worldView.y) * cam.zoom)) P.dives++;
    }
    if (h.over && !overAt) overAt = now + 700;
    if (overAt && now > overAt) {
      overAt = 0;
      P.matches.push(`${s.mine.filter(Boolean).length}-${s.theirs.filter(Boolean).length}`);
      h.restart();
    }
  });
});
await page.evaluate(() => window.__game.scene.getScene('Menu').go());

await page.waitForTimeout(secs * 1000);
const r = await page.evaluate(() => window.__perf);
const state = await page.evaluate(() => JSON.parse(localStorage.getItem('penalty-season.v1') || '{}'));
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
  logicaPorFotogramaMs: (() => { const u = r.upd.slice(30).sort((x, y) => x - y); const q = (k) => +u[Math.min(u.length - 1, Math.floor(u.length * k))].toFixed(2); return { p50: q(0.5), p95: q(0.95), p99: q(0.99) }; })(),
  fpsMaximoPorCpu: Math.round(1000 / pct(0.95)),
  partidosPilotoAutomatico: r.matches,
  lanzamientos: r.kicks,
  estiradasDelPortero: r.dives,
  temporada: state.season ? { division: state.season.div + 1, jornada: state.season.round } : null,
  uptimeAntes: uptimeBefore,
  uptimeDespues: uptimeAfter,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
await writeFile(resolve(root, game, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
