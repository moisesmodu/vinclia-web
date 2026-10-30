// Prueba de rendimiento de Hoop Bounce en "móvil de gama media" emulado (adaptada de lane-dash/test-perf.mjs):
// 800×360 apaisado, táctil, DPR 2, CPU 4 veces más lenta (CDP), piloto automático que simula cada toque y solo
// toca cuando la parábola entra limpia en el aro (o cuando la pelota va a caer). Anota la carga de la máquina
// (uptime): otros trabajos en este contenedor inflan las cifras.
// Uso (desde proyectos/juegos): GAME=hoop-bounce node scripts/build.mjs web && node hoop-bounce/test-perf.mjs
// Variables: SECS (45), CPU (4), PORT (5827), W/H (800/360). Escribe hoop-bounce/rendimiento.json.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const secs = +(process.env.SECS || 45);
const throttle = +(process.env.CPU || 4);
const port = +(process.env.PORT || 5827);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

/** Piloto: simula la trayectoria sin tocar y tocando ahora (misma física que Play.ts). s = escena Play. */
const PILOT = () => {
  window.__pilot = (s) => {
    if (!s.alive || s.paused) return;
    if (s.waiting) { s.tap(); return; }
    if (s.vy < 0) return;
    const R = 46, G = 2500, half = s.hw / 2;
    const sim = (tap) => {
      const dx0 = s.hx - s.bx;
      const vx = !tap ? s.vx : Math.abs(dx0) < 6 ? 0 : Math.sign(dx0) * Math.min(250, Math.max(60, Math.abs(dx0) * 1.1));
      let x = s.bx, y = s.by, vy = tap ? -1150 : s.vy, above = y + R < s.hy - 2;
      for (let i = 0; i < 180; i++) {
        const py = y; vy += G / 120; x += vx / 120; y += vy / 120;
        if (y < R + 8) { y = R + 8; vy = Math.abs(vy) * 0.3; }
        for (const e of [-1, 1]) { const ddx = x - (s.hx + e * half), ddy = y - s.hy; if (ddx * ddx + ddy * ddy < (R + 10) ** 2) return -1; }
        if (vy < 0 && Math.abs(x - s.hx) < half && py - R >= s.hy + 80 && y - R < s.hy + 80) return -1;
        if (y + R < s.hy - 2) above = true;
        if (above && vy > 0 && py < s.hy && y >= s.hy) return Math.abs(x - s.hx) < half - R - 10 ? 2 : -1;
        if (y > s.hy + 200) return 0;
      }
      return 0;
    };
    if (sim(false) === 2) return;
    if (s.by > Math.min(880, s.hy + 240) || sim(true) === 2) s.tap();
  };
};

const uptimeBefore = execSync('uptime').toString().trim();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +(process.env.W || 800), height: +(process.env.H || 360) }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
await page.addInitScript(PILOT);
const t0 = Date.now();
await page.goto(`http://localhost:${port}/hoop-bounce/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
const loadMs = Date.now() - t0;

await page.evaluate(() => {
  const g = window.__game;
  window.__perf = { js: [], frames: 0, runs: [] };
  let a = 0;
  g.events.on('prestep', () => { a = performance.now(); });
  g.events.on('postrender', () => { window.__perf.js.push(performance.now() - a); window.__perf.frames++; });
  setInterval(() => {
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || s.score === undefined) return;
    if (s.alive && !s.paused) { s.__counted = false; window.__pilot(s); }
    if (!s.alive && !s.__counted) {
      s.__counted = true;
      window.__perf.runs.push({ puntos: s.score, canastas: s.baskets, s: +s.time0.toFixed(1), toques: s.taps, monedas: s.coins });
    }
  }, 40);
});
// la recompensa diaria del primer día se cobra (espacio) antes de jugar
await page.keyboard.press('Space');
await page.waitForTimeout(300);
await page.evaluate(() => window.__game.scene.getScene('Menu').go());

const end = Date.now() + secs * 1000;
while (Date.now() < end) {
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const g = window.__game, s = g.scene.getScene('Play');
    if (g.scene.isActive('Play') && s.__counted && !s.__restarting) {
      s.__restarting = true;
      setTimeout(() => { s.__restarting = false; g.scene.getScene('Hud').restart(); }, 600);
    }
  });
}
const r = await page.evaluate(() => window.__perf);
const last = await page.evaluate(() => { const s = window.__game.scene.getScene('Play'); return s?.alive ? { puntos: s.score, canastas: s.baskets, s: +s.time0.toFixed(1), sinTerminar: true } : null; });
if (last) r.runs.push(last);
await browser.close();
server.close();
const uptimeAfter = execSync('uptime').toString().trim();

const js = r.js.slice(30).sort((a, b) => a - b);
const pct = (q) => js[Math.min(js.length - 1, Math.floor(js.length * q))];
const avg = js.reduce((a, b) => a + b, 0) / js.length;
const out = {
  juego: 'hoop-bounce',
  fecha: new Date().toISOString().slice(0, 10),
  emulacion: `${process.env.W || 800}x${process.env.H || 360} táctil, DPR 2, CPU x${throttle}`,
  cargaHastaMenuMs: loadMs,
  fpsEnEsteContenedor: +(r.frames / secs).toFixed(1),
  cpuPorFotogramaMs: { media: +avg.toFixed(2), p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), p99: +pct(0.99).toFixed(2) },
  fpsMaximoPorCpu: +(1000 / pct(0.95)).toFixed(0),
  partidasPilotoAutomatico: r.runs,
  uptimeAntes: uptimeBefore,
  uptimeDespues: uptimeAfter,
  errores: errors,
};
console.log(JSON.stringify(out, null, 2));
if (!process.env.NOSAVE) await writeFile(resolve(here, 'rendimiento.json'), JSON.stringify(out, null, 2) + '\n');
