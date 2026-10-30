// Screenshots for the portal listings (1920×1080, JPG q85) and a portrait phone check (390×844, touch, a real tap pulls a pin).
// Usage (from proyectos/juegos, after GAME=pin-rescue node scripts/build.mjs web): PORT=5903 node pin-rescue/test-capturas.mjs
// Writes fichas/pin-rescue/capturas/*.jpg.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'fichas/pin-rescue/capturas');
const tmp = process.env.TMPDIR || '/tmp';
await mkdir(out, { recursive: true });
const port = +(process.env.PORT || 5903);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const errors = [];
const shot = async (page, name) => {
  const png = join(tmp, `pr-${name}.png`);
  await page.screenshot({ path: png });
  execFileSync('convert', [png, '-quality', '85', join(out, `${name}.jpg`)]);
  console.log('captura', name);
};
const G = 'window.__game';
const PLAY = `${G}.scene.getScene('Play')`;
const KEY = 'pin-rescue.v1';
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
  await page.goto(`http://localhost:${port}/pin-rescue/`);
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

  // gameplay: water on lava turns to stone (3), water drowns a slime (11), a bomb blast (24), gold pouring onto the hero (20)
  await startLevel(page, 3);
  await until(page, `${PLAY}.s.t > 0.95`);
  await shot(page, '04-agua-lava-piedra');
  await startLevel(page, 11);
  await until(page, `${PLAY}.s.t > 0.9`);
  await shot(page, '05-babosa-agua');
  await startLevel(page, 24);
  await until(page, `${PLAY}.s.t > 0.78`);
  await shot(page, '06-bomba');
  await startLevel(page, 20);
  await until(page, `${PLAY}.s.t > 8.9`);
  await shot(page, '07-oro');

  // level complete
  await startLevel(page, 12);
  await page.waitForFunction(`${G}.scene.getScene('Hud').over`, null, { timeout: 30000 });
  await page.waitForTimeout(1400);
  await shot(page, '08-nivel-superado');

  // shop and daily reward (menu)
  await setSave(page, { ...progress, coins: 140, owned: ['mint', 'candy'], equipped: { skin: 'mint', pin: 'candy' } });
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

// ---------------------------------------------------------------- portrait phone 390×844 (touch): a real tap pulls a pin
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/pin-rescue/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await setSave(page, progress);
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(700);
  await shot(page, '11-movil-menu');
  await startLevel(page, 3, false);
  await page.waitForTimeout(400);
  // tap the water pin's ring with a real touch (CDP), then let the water fall on the lava
  const pt = await page.evaluate(`${PLAY}.pinScreen(0)`);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y, id: 1 }] });
  await page.waitForTimeout(60);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(1300);
  const st = await page.evaluate(`({ pulled: ${PLAY}.s.pins.map((p) => p.pulled), k: ${PLAY}.view.k })`);
  await shot(page, '12-movil-juego');
  console.log('portrait tap: pins pulled', JSON.stringify(st.pulled), 'world scale', st.k.toFixed(3));
  if (!st.pulled[0]) errors.push('portrait tap did not pull the pin');
  await ctx.close();
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
if (errors.length) process.exitCode = 1;
