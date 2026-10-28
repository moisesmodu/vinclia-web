// Prueba de los 20 niveles con un piloto automático, en simulación acelerada (sin esperar al reloj real):
// ¿se puede terminar cada nivel? ¿en cuánto tiempo? Sirve para calibrar t3/t2 de src/levels.ts.
// Uso (desde proyectos/juegos): GAME=bike-flip node scripts/build.mjs web && PORT=5173 node bike-flip/test-niveles.mjs [nivel]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5173);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${port}/bike-flip/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 20000 });

const only = process.argv[2] ? [+process.argv[2]] : Array.from({ length: 20 }, (_, i) => i + 1);
const tries = +(process.env.TRIES || 3);
for (const lv of only) {
  const results = [];
  for (let t = 0; t < tries; t++) {
    const r = await page.evaluate(async ({ lv, t }) => {
      const g = window.__game;
      for (const k of ['Menu', 'Levels', 'Play', 'Hud']) if (g.scene.isActive(k)) g.scene.stop(k);
      g.scene.start('Play', { level: lv });
      await new Promise((r) => setTimeout(r, 300));
      const s = g.scene.getScene('Play');
      g.scene.pause('Play'); // el bucle lo llevamos nosotros
      let frames = 0, crashes = 0, flips = 0, lastFlips = 0;
      const jitter = t * 0.05;
      g.loop.rawDelta = 1000 / 15; // 4 pasos de física por llamada
      while (frames < 60 * 90 / 4) {
        const c = s.truck.chassis, a = c.angle - Math.round(c.angle / (Math.PI * 2)) * Math.PI * 2;
        const air = s.groundedNow === 0;
      const tr = s.terrain, X = c.position.x, look = air ? 120 : 0;
      const slope = Math.atan2(tr.heightAt(X + look + 30) - tr.heightAt(X + look - 30), 60);
      const rel = a - slope;
      let hold = true;
      if (air) hold = rel > -0.1 + (typeof jitter === 'number' ? jitter : 0);
      else if (rel < -0.7) hold = false;
        g.registry.set('hold', hold);
        s.update(0, 16.7);
        frames++;
        if (s.flipsRun !== lastFlips) { flips = s.flipsRun; lastFlips = flips; }
        if (s.finished) return { ok: true, ms: Math.round(s.elapsed), crashes, flips };
        if (!s.alive) {
          crashes++;
          if (crashes > 3) return { ok: false, dist: s.dist, crashes, at: Math.round(c.position.x / 50) };
          s.revive();
          s.revived = false;
        }
        if (frames % 200 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      return { ok: false, dist: s.dist, timeout: true, crashes };
    }, { lv, t });
    results.push(r);
  }
  console.log(`nivel ${String(lv).padStart(2)}:`, results.map((r) => r.ok ? `${(r.ms / 1000).toFixed(1)}s choques ${r.crashes} vueltas ${r.flips}` : `NO (${r.timeout ? 'tiempo' : 'choques'} en ${r.at ?? r.dist} m)`).join(' | '));
}
console.log('errores:', errors.length ? errors : 'ninguno');
await browser.close();
server.close();
