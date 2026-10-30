// Screenshots for the portal listings (1920×1080, JPG q85) and a portrait phone check (390×844, touch: a real finger
// drag + release aims and drops a jelly).
// Usage (from proyectos/juegos, after GAME=jelly-merge node scripts/build.mjs web): PORT=5966 node jelly-merge/test-capturas.mjs
//   DIST=<folder> serves the build from another folder (default: dist/, or dist-portales/ for the SDK test).
// Writes fichas/jelly-merge/capturas/*.jpg.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'fichas/jelly-merge/capturas');
const tmp = process.env.TMPDIR || '/tmp';
await mkdir(out, { recursive: true });
const port = +(process.env.PORT || 5966);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(process.env.DIST || join(root, 'dist'), p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const errors = [];
const shot = async (page, name) => {
  const png = join(tmp, `jm-${name}.png`);
  await page.screenshot({ path: png });
  execFileSync('convert', [png, '-quality', '85', join(out, `${name}.jpg`)]);
  console.log('captura', name);
};
const G = 'window.__game';
const PLAY = `${G}.scene.getScene('Play')`, HUD = `${G}.scene.getScene('Hud')`;
const KEY = 'jelly-merge.v1';
// dailyDate 'today' = the player's local day (no daily gift window)
const setSave = (page, d) => page.evaluate(([k, d]) => { const t = new Date(), p = (n) => `${n}`.padStart(2, '0');
  if (d.dailyDate === 'today') d = { ...d, dailyDate: `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}` };
  localStorage.setItem(k, JSON.stringify(d)); }, [KEY, d]);
const boot = async (page, d) => {
  await setSave(page, d);
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 90000 });
  await page.waitForTimeout(700);
};
const start = async (page) => {
  await page.evaluate(`${G}.scene.getScene('Menu').go()`);
  await page.waitForFunction(`${G}.scene.isActive('Play') && ${PLAY}.alive && ${PLAY}.started`, null, { timeout: 90000 });
};
/** Autopilot sped up until the jar holds n jellies, then normal speed for a moment (the faces and springs settle). */
const grow = async (page, n, score = 0) => {
  await page.evaluate(`(() => { const p = ${PLAY}; p.turbo = 8; p.autoplay(); })()`);
  await page.waitForFunction(`${PLAY}.jellies.length >= ${n} && ${PLAY}.score >= ${score} || !${PLAY}.alive`, null, { timeout: 120000, polling: 200 });
  await page.evaluate(`(() => { const p = ${PLAY}; p.turbo = 1; p.auto = false; })()`);
};
const progress = { best: 3420, coins: 85, runs: 12, clouds: 4, bestTier: 8, tutorialDone: true, dailyDate: 'today', dailyStreak: 3 };

// ---------------------------------------------------------------- desktop 1920×1080
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/jelly-merge/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 90000 });
  await boot(page, progress);
  await shot(page, '01-menu');

  // tutorial: first run on a fresh save (aim with the finger, release to drop)
  await boot(page, { tutorialDone: false, dailyDate: 'today' });
  await start(page);
  await page.waitForTimeout(1600);
  await shot(page, '02-tutorial');

  // gameplay: a busy jar, aim guide down to the landing spot
  await boot(page, progress);
  await start(page);
  await grow(page, 16, 500);
  await page.evaluate(`${PLAY}.aimAt(-60)`);
  await page.waitForTimeout(900);
  await shot(page, '03-juego');

  // a merge: two same-size jellies squish into the next size (+points)
  await page.evaluate(`(() => { const p = ${PLAY}; p.addJelly(4, 130, -700, 0, 6); p.addJelly(4, 130, -560, 0, 6); })()`);
  await page.waitForFunction(`${HUD}.children.list.some((o) => o.text && o.text.startsWith('+'))`, null, { timeout: 15000, polling: 50 });
  await page.waitForTimeout(120);
  await shot(page, '04-fusion');

  // the hook: two of the second-biggest make the crowned king jelly, which puffs into a cloud and floats away
  await page.evaluate(`(() => { const p = ${PLAY}; p.addJelly(7, -40, -760, 0, 4); p.addJelly(7, 40, -1000, 0, 4); })()`);
  await page.waitForFunction(`${PLAY}.clouds > 0`, null, { timeout: 15000, polling: 50 });
  await page.waitForTimeout(1250);
  await shot(page, '05-nube');

  // danger: the pile crosses the top line, faces get worried, the line blinks red
  await page.evaluate(`(() => { const p = ${PLAY}; p.prefill(26); const t = setInterval(() => { if (!p.alive || p.dangerT > 0) clearInterval(t); else p.prefill(6); }, 3000); })()`);
  await page.waitForFunction(`${PLAY}.dangerT > 0.7 || !${PLAY}.alive`, null, { timeout: 90000, polling: 50 }).catch(async (e) => {
    console.log(await page.evaluate(`(() => { const p = ${PLAY}; return JSON.stringify({ n: p.jellies.length, simT: p.simT, paused: p.paused, alive: p.alive, warn: p.warn, d: p.dangerT, tops: p.jellies.map((j) => Math.round(j.body.position.y - j.r) + '/' + j.age.toFixed(1)).slice(0, 50) }); })()`));
    throw e;
  });
  await shot(page, '06-peligro');

  // game over with a new best (×2 coins, revive and restart buttons appear on portals with ads)
  await page.waitForFunction(`!!${HUD}.over`, null, { timeout: 90000 });
  await page.waitForTimeout(900);
  await shot(page, '07-final');

  // shop and daily gift (menu)
  await boot(page, { ...progress, coins: 210, owned: ['pastel', 'sky-sunset'], equipped: { palette: 'pastel', sky: 'sky-sunset' } });
  await page.evaluate(`(() => { const m = ${G}.scene.getScene('Menu'); const b = m.children.list.find((o) => o.refresh); b.emit('pointerup'); })()`);
  await page.waitForTimeout(700);
  await shot(page, '08-tienda');
  await boot(page, { ...progress, dailyDate: '', dailyStreak: 0 });
  await shot(page, '09-diario');

  // cosmetics in play: neon jellies under the night sky
  await boot(page, { ...progress, owned: ['neon', 'sky-night'], equipped: { palette: 'neon', sky: 'sky-night' } });
  await start(page);
  await grow(page, 14, 400);
  await page.waitForTimeout(900);
  await shot(page, '10-noche-neon');
  await page.close();
}

// ---------------------------------------------------------------- portrait phone 390×844 (touch): drag + release drops
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/jelly-merge/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 90000 });
  await boot(page, progress);
  await shot(page, '11-movil-menu');
  await start(page);
  await grow(page, 12, 300);
  await page.waitForTimeout(800);
  // a real finger: touch at the left, drag to the right third, lift = drop there
  const cdp = await ctx.newCDPSession(page);
  const drops0 = await page.evaluate(`${PLAY}.drops`);
  const y = 300;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 80, y, id: 1 }] });
  for (let x = 80; x <= 290; x += 30) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 1 }] }); await page.waitForTimeout(40); }
  await page.waitForTimeout(250);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(350);
  const st = await page.evaluate(`(() => { const p = ${PLAY}, j = p.jellies[p.jellies.length - 1]; return { drops: p.drops, x: j.body.position.x, sx: p.toScreen(j.body.position.x, 0).x }; })()`);
  await shot(page, '12-movil-juego');
  console.log('portrait touch drop: drops', drops0, '→', st.drops, '· dropped at screen x', st.sx.toFixed(0), '(finger lifted at 290)');
  if (st.drops !== drops0 + 1 || Math.abs(st.sx - 290) > 40) errors.push('portrait touch drag + release did not drop the jelly under the finger');
  await ctx.close();
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
if (errors.length) process.exitCode = 1;
