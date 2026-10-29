// Screenshots for the portal listings (1920×1080, JPG q85) and a portrait phone check (390×844, touch).
// Usage (from proyectos/juegos, after GAME=trick-floor node scripts/build.mjs web): PORT=5473 node trick-floor/test-capturas.mjs
// Writes fichas/trick-floor/capturas/*.jpg (09/10: portrait phone, with the touch buttons pressed by real touches).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'fichas/trick-floor/capturas');
const tmp = process.env.TMPDIR || '/tmp';
await mkdir(out, { recursive: true });
const port = +(process.env.PORT || 5473);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const errors = [];
const shot = async (page, name) => {
  const png = join(tmp, `tf-${name}.png`);
  await page.screenshot({ path: png });
  execFileSync('convert', [png, '-quality', '85', join(out, `${name}.jpg`)]);
  console.log('captura', name);
};
const G = 'window.__game';
const PLAY = `${G}.scene.getScene('Play')`;
const waitPlay = (page) => page.waitForFunction(`${G}.scene.isActive('Play') && ${PLAY}.started && ${PLAY}.alive`, null, { timeout: 20000 });
const startLevel = async (page, n) => {
  await page.evaluate(`(() => { const g = ${G}; for (const k of ['Menu', 'Levels', 'Play', 'Hud']) if (g.scene.isActive(k)) g.scene.stop(k); g.scene.start('Play', { level: ${n}, transition: false }); })()`);
  await waitPlay(page);
  await page.waitForTimeout(300);
};
/** Holds keys for ms of real time. */
const hold = async (page, keys, ms) => { for (const k of keys) await page.keyboard.down(k); await page.waitForTimeout(ms); for (const k of keys) await page.keyboard.up(k); };
/** Freezes the simulation (drawing goes on) on the first frame where cond is true, then waits for it. */
const until = async (page, cond, timeout = 30000) => {
  await page.evaluate(`(() => { const p = ${PLAY}; p.__frozen = false;
    const f = () => { if (!p.paused && (${cond})) { p.paused = true; p.__frozen = true; p.events.off('postupdate', f); } };
    p.events.on('postupdate', f); })()`);
  await page.waitForFunction(`${PLAY}.__frozen`, null, { timeout });
};
const resume = (page) => page.evaluate(`${PLAY}.paused = false`);

// ---------------------------------------------------------------- desktop 1920×1080
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/trick-floor/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  // some progress so the menu and the level select look lived-in
  await page.evaluate(() => {
    const k = 'trick-floor.v1', d = JSON.parse(localStorage.getItem(k) || '{}');
    Object.assign(d, { unlocked: 9, stars: [3, 3, 2, 3, 1, 3, 2, 2], best: [1, 2, 5, 1, 9, 2, 6, 5], tutorialDone: false });
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await shot(page, '01-menu');
  await page.evaluate(`${G}.scene.getScene('Menu').scene.start('Levels')`);
  await page.waitForTimeout(600);
  await shot(page, '02-niveles');

  // tutorial on level 1 (first play)
  await startLevel(page, 1);
  await page.waitForTimeout(700);
  await shot(page, '03-tutorial');

  // level 5: the ceiling falls
  await startLevel(page, 5);
  await page.keyboard.down('ArrowRight');
  await until(page, `${PLAY}.s.grp[0].st >= 2 && ${PLAY}.s.grp[0].oy > 40`);
  await page.keyboard.up('ArrowRight');
  await shot(page, '04-techo-cae');

  // level 1: the floor in front of the door drops
  await startLevel(page, 1);
  await page.keyboard.down('ArrowRight');
  await until(page, `${PLAY}.s.x > 6.6 * 48`);
  await page.keyboard.down('ArrowUp');
  await resume(page);
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowUp');
  await until(page, `${PLAY}.s.grp[0].st >= 2 && ${PLAY}.s.grp[0].oy > 25`, 8000);
  await page.keyboard.up('ArrowRight');
  await shot(page, '05-suelo-cae');

  // level 18: the door runs away to the ceiling, the hero walks upside down
  await startLevel(page, 18);
  await page.keyboard.down('ArrowRight');
  await until(page, `${PLAY}.s.g === -1 && ${PLAY}.s.y < 5 * 48`);
  await page.keyboard.up('ArrowRight');
  await shot(page, '06-gravedad');

  // level 10: the door runs away (legs out) + a death splat on the counter
  await startLevel(page, 10);
  await page.keyboard.down('ArrowRight');
  await until(page, `${PLAY}.s.door.i === 1 && ${PLAY}.s.door.mt > 0.35`);
  await page.keyboard.up('ArrowRight');
  await shot(page, '07-puerta-huye');

  // level complete panel
  await startLevel(page, 2);
  await page.evaluate(`(() => { const p = ${PLAY}; p.deaths = 2; p.complete(); })()`);
  await page.waitForFunction(`${G}.scene.getScene('Hud').over`, null, { timeout: 5000 });
  await page.waitForTimeout(1300);
  await shot(page, '08-nivel-superado');
  await page.close();
}

// ---------------------------------------------------------------- portrait phone 390×844 (touch): controls usable?
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/trick-floor/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(600);
  await shot(page, '09-movil-menu');
  await startLevel(page, 4);
  // press the on-screen right button with a real touch (CDP) and check the hero moves
  const btn = await page.evaluate(`(() => { const b = ${G}.scene.getScene('Hud').btns; return b.map((x) => ({ k: x.key, x: x.c.x, y: x.c.y, v: x.c.visible })); })()`);
  const cdp = await ctx.newCDPSession(page);
  const R = btn.find((b) => b.k === 'r'), J = btn.find((b) => b.k === 'j');
  const x0 = await page.evaluate(`${PLAY}.s.x`);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: R.x, y: R.y, id: 1 }] });
  await page.waitForTimeout(250);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: R.x, y: R.y, id: 1 }, { x: J.x, y: J.y, id: 2 }] });
  await page.waitForTimeout(120);
  const midJump = await page.evaluate(`({ x: ${PLAY}.s.x, grounded: ${PLAY}.s.grounded, vy: ${PLAY}.s.vy })`);
  await shot(page, '10-movil-juego');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  console.log('portrait buttons', JSON.stringify(btn), 'hero x', Math.round(x0), '->', Math.round(midJump.x), 'airborne', !midJump.grounded);
  await ctx.close();
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
