// Screenshots for the portal listings (1920×1080, JPG q85) and a portrait phone check (390×844, touch, real swipes).
// Usage (from proyectos/juegos, after GAME=rope-cut node scripts/build.mjs web): PORT=5803 node rope-cut/test-capturas.mjs
// Writes fichas/rope-cut/capturas/*.jpg.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'fichas/rope-cut/capturas');
const tmp = process.env.TMPDIR || '/tmp';
await mkdir(out, { recursive: true });
const port = +(process.env.PORT || 5803);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const errors = [];
const shot = async (page, name) => {
  const png = join(tmp, `rc-${name}.png`);
  await page.screenshot({ path: png });
  execFileSync('convert', [png, '-quality', '85', join(out, `${name}.jpg`)]);
  console.log('captura', name);
};
const G = 'window.__game';
const PLAY = `${G}.scene.getScene('Play')`;
const KEY = 'rope-cut.v1';
// dailyDate 'today' = the player's local day (no daily reward window)
const setSave = (page, d) => page.evaluate(([k, d]) => { const t = new Date(), p = (n) => `${n}`.padStart(2, '0');
  if (d.dailyDate === 'today') d = { ...d, dailyDate: `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}` };
  localStorage.setItem(k, JSON.stringify(d)); }, [KEY, d]);
const startLevel = async (page, n, auto = true) => {
  await page.evaluate(`(() => { const g = ${G}; for (const k of ['Menu', 'Levels', 'Play', 'Hud']) if (g.scene.isActive(k)) g.scene.stop(k); g.scene.start('Play', { level: ${n}, transition: false }); })()`);
  await page.waitForFunction(`${G}.scene.isActive('Play') && ${PLAY}.started && ${PLAY}.alive`, null, { timeout: 20000 });
  if (auto) await page.evaluate(`${PLAY}.autoplay()`);
};
/** Plays the designer's line and freezes the simulation (drawing goes on) when cond becomes true. */
const until = async (page, cond, timeout = 40000) => {
  await page.evaluate(`(() => { const p = ${PLAY}; p.__frozen = false;
    const f = () => { if (!p.paused && (${cond})) { p.paused = true; p.__frozen = true; p.events.off('postupdate', f); } };
    p.events.on('postupdate', f); })()`);
  await page.waitForFunction(`${PLAY}.__frozen`, null, { timeout });
  await page.waitForTimeout(250);
};
const progress = { unlocked: 17, stars: [3, 3, 2, 3, 3, 1, 3, 2, 3, 3, 2, 3, 3, 1, 2, 3], done: Array(16).fill(1), coins: 64, tutorialDone: true, dailyDate: 'today', dailyStreak: 3 };

// ---------------------------------------------------------------- desktop 1920×1080
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/rope-cut/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await setSave(page, progress);
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(900);
  await shot(page, '01-menu');
  await page.evaluate(`${G}.scene.getScene('Menu').scene.start('Levels')`);
  await page.waitForTimeout(700);
  await shot(page, '02-niveles');

  // tutorial: level 1 on a fresh save
  await setSave(page, { ...progress, tutorialDone: false });
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await startLevel(page, 1, false);
  await page.waitForTimeout(500);
  await shot(page, '03-tutorial');

  // gameplay: a swing with stars (level 7), a bubble (level 13), puffers (level 16), pegs + wind (level 36)
  await startLevel(page, 7);
  await until(page, `${PLAY}.s.t > 1.0`);
  await shot(page, '04-columpio');
  await startLevel(page, 13);
  await until(page, `${PLAY}.s.bubble >= 0 && ${PLAY}.s.t > (${PLAY}.__bt ??= ${PLAY}.s.t) + 0.6`);
  await shot(page, '05-burbuja');
  await startLevel(page, 16);
  await until(page, `${PLAY}.s.t > 1.18`);
  await shot(page, '06-soplador');
  await startLevel(page, 36);
  await until(page, `${PLAY}.s.hooks[0] === 1 && ${PLAY}.s.t > 1.2`);
  await shot(page, '07-ganchos-viento');

  // level complete
  await startLevel(page, 12);
  await page.waitForFunction(`${G}.scene.getScene('Hud').over`, null, { timeout: 30000 });
  await page.waitForTimeout(1400);
  await shot(page, '08-nivel-superado');

  // shop and daily reward (menu)
  await setSave(page, { ...progress, coins: 140, owned: ['lemon', 'party'], equipped: { candy: 'lemon', hat: 'party' } });
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.evaluate(`(() => { const m = ${G}.scene.getScene('Menu'); const b = m.children.list.find((o) => o.refresh); b.emit('pointerup'); })()`);
  await page.waitForTimeout(700);
  await shot(page, '09-tienda');
  await setSave(page, { ...progress, dailyDate: '', dailyStreak: 0 });
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(900);
  await shot(page, '10-diario');
  await page.close();
}

// ---------------------------------------------------------------- portrait phone 390×844 (touch): a real swipe cuts the rope
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/rope-cut/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await setSave(page, progress);
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(700);
  await shot(page, '11-movil-menu');
  await startLevel(page, 2, false);
  await page.waitForTimeout(400);
  // swipe across the left rope with real touch events (CDP)
  const pts = await page.evaluate(`(() => { const p = ${PLAY}, v = p.view, r = p.s.ropes[0], k = Math.floor(r.n / 2);
    const x = v.x + r.x[k] * v.k, y = v.y + r.y[k] * v.k; return { x0: x - 60, y0: y - 30, x1: x + 60, y1: y + 30 }; })()`);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts.x0, y: pts.y0, id: 1 }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pts.x0 + ((pts.x1 - pts.x0) * i) / 8, y: pts.y0 + ((pts.y1 - pts.y0) * i) / 8, id: 1 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  const cut = await page.evaluate(`({ on: ${PLAY}.s.ropes.map((r) => r.on), view: ${PLAY}.view })`);
  await shot(page, '12-movil-juego');
  console.log('portrait swipe: ropes attached after the swipe', JSON.stringify(cut.on), 'world scale', cut.view.k.toFixed(3));
  if (cut.on[0]) errors.push('portrait swipe did not cut the rope');
  await ctx.close();
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
if (errors.length) process.exitCode = 1;
