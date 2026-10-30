// Screenshots for the portal listings (1920×1080, JPG q85) and a portrait phone check (390×844, touch).
// Usage (from proyectos/juegos, after GAME=penalty-season node scripts/build.mjs web): PORT=5743 node penalty-season/test-capturas.mjs
// Writes fichas/penalty-season/capturas/*.jpg (the p-*.jpg files are the portrait phone check).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'fichas/penalty-season/capturas');
const tmp = process.env.TMPDIR || '/tmp';
await mkdir(out, { recursive: true });
const port = +(process.env.PORT || 5743);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const errors = [];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const shot = async (page, name) => {
  if (only && !only.some((o) => name.startsWith(o))) return;
  const png = join(tmp, `ps-${name}.png`);
  await page.screenshot({ path: png });
  execFileSync('convert', [png, '-quality', '85', join(out, `${name}.jpg`)]);
  console.log('captura', name);
};
const G = 'window.__game';
const PLAY = `${G}.scene.getScene('Play')`, HUD = `${G}.scene.getScene('Hud')`, HUB = `${G}.scene.getScene('Hub')`;
/** A lived-in save: 4 matchdays played, some coins and upgrades, daily reward already collected today. */
const seed = (tutorial) => `(() => {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  const today = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  localStorage.setItem('penalty-season.v1', JSON.stringify({ coins: 345, best: 1, runs: 14, tutorialDone: ${!tutorial}, tutorialSave: ${!tutorial},
    dailyDate: today, dailyStreak: 3, morale: 78, owned: ['sky'], equipped: { kit: 'orange', ball: 'ball-classic' },
    squad: { pow: [5, 4, 3, 4, 3], acc: [4, 5, 3, 3, 4], ref: 5 }, season: null }));
})()`;
const waitPhase = (page, cond, timeout = 20000) => page.waitForFunction(`${G}.scene.isActive('Play') && (${cond})`, null, { timeout });
/** Freezes the match logic (drawing goes on) on the first frame where cond is true. */
const freezeWhen = async (page, cond, timeout = 20000) => {
  await page.evaluate(`(() => { const p = ${PLAY}; p.__frozen = false;
    const f = () => { if (!p.paused && (${cond})) { p.paused = true; p.__frozen = true; p.events.off('postupdate', f); } };
    p.events.on('postupdate', f); })()`);
  await page.waitForFunction(`${PLAY}.__frozen`, null, { timeout });
};
const unfreeze = (page) => page.evaluate(`${PLAY}.paused = false`);

async function session(viewport, prefix, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: !!opts.mobile, hasTouch: !!opts.mobile });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${prefix}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${prefix}: ${m.text()}`); });
  await page.goto(`http://localhost:${port}/penalty-season/`);
  await page.evaluate(seed(opts.tutorial));
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.evaluate(`(() => { window.__game.scene.getScene('Menu').go(); })()`);
  await page.waitForFunction(`${G}.scene.isActive('Hub')`, null, { timeout: 10000 });
  return { ctx, page };
}

// ---------------------------------------------------------------- desktop 1920×1080
{
  const { ctx, page } = await session({ width: 1920, height: 1080 }, 'desk', { tutorial: true });
  // play 4 quick matches (forfeit-free: real results through the pure logic) so the table has numbers
  await page.evaluate(`(async () => {
    for (let i = 0; i < 4; i++) {
      const hub = ${HUB}; hub.go();
      await new Promise((r) => { const t = setInterval(() => { const p = ${PLAY}; if (p && p.started && p.alive) { clearInterval(t); r(); } }, 50); });
      const p = ${PLAY};
      p.mine = [true, true, false, true, i !== 1]; p.theirs = i === 1 ? [true, true, true, true, true] : [true, false, true, false, i === 2];
      p.nextKick();
      await new Promise((r) => setTimeout(r, 300));
      ${HUD}.table();
      await new Promise((r) => { const t = setInterval(() => { if (${G}.scene.isActive('Hub')) { clearInterval(t); r(); } }, 50); });
      await new Promise((r) => setTimeout(r, 300));
    }
  })()`);
  await page.waitForTimeout(600);
  await shot(page, '02-league-table');
  await page.evaluate(`${HUB}.openSquad()`);
  await page.waitForTimeout(400);
  await shot(page, '03-squad-upgrades');
  await page.evaluate(`${HUB}.closeSquad()`);
  // the match (first of a "new player": tutorial hand)
  await page.evaluate(`${HUB}.go()`);
  await waitPhase(page, `${PLAY}.phase === 'aim'`);
  await page.waitForTimeout(900);
  await shot(page, '04-tutorial-swipe');
  // shooting: a curled shot frozen mid-flight
  await page.evaluate(`(() => { const p = ${PLAY}; p.rating = -6; })()`);
  await page.mouse.move(980, 1000);
  await page.mouse.down();
  for (const [x, y] of [[930, 900], [910, 790], [940, 690], [1010, 610]]) { await page.mouse.move(x, y); await page.waitForTimeout(35); }
  await page.mouse.up();
  await freezeWhen(page, `p.phase === 'flight' && p.clock - p.kickT > p.shot.T * 0.45`);
  await page.waitForTimeout(150);
  await shot(page, '05-shooting');
  await unfreeze(page);
  await freezeWhen(page, `p.phase === 'after' && p.clock - p.phaseT > 0.28`);
  await page.waitForTimeout(250);
  await shot(page, '06-goal-celebration');
  await unfreeze(page);
  // saving: the shooter glances (tell) during the run-up
  await freezeWhen(page, `p.phase === 'runup' && p.tellSide !== 0`, 20000);
  await page.waitForTimeout(500);
  await shot(page, '07-saving-tell');
  await page.evaluate(`(() => { const p = ${PLAY}; p.paused = false; p.autoDive(p.oppShot.tell * 0.7, 0.3); })()`);
  await freezeWhen(page, `p.phase === 'flight' && p.clock - p.kickT > p.shot.T * 0.85`);
  await page.waitForTimeout(150);
  await shot(page, '08-saving-dive');
  await unfreeze(page);
  // end of the match
  await page.evaluate(`(() => { const p = ${PLAY}; p.mine = [true, true, true, false, true]; p.theirs = [true, false, true, true, false]; p.events.emit('score', p.mine, p.theirs); p.nextKick(); })()`);
  await page.waitForFunction(`!!${HUD}.over`, null, { timeout: 10000 });
  await page.waitForTimeout(700);
  await shot(page, '09-match-won');
  // win the remaining matchdays → end of season: promotion panel
  await page.evaluate(`(async () => {
    ${HUD}.table();
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => { const t = setInterval(() => { if (${G}.scene.isActive('Hub')) { clearInterval(t); r(); } }, 50); });
      await new Promise((r) => setTimeout(r, 250));
      ${HUB}.go();
      await new Promise((r) => { const t = setInterval(() => { const p = ${PLAY}; if (p && p.started && p.alive && p.phase !== 'idle') { clearInterval(t); r(); } }, 50); });
      const p = ${PLAY};
      p.mine = [true, true, true, true]; p.theirs = [false, true, false];
      p.nextKick();
      await new Promise((r) => setTimeout(r, 300));
      ${HUD}.table();
    }
  })()`);
  await page.waitForFunction(`${G}.scene.isActive('Hub') && ${HUB}.endOpen`, null, { timeout: 30000 });
  await page.waitForTimeout(900);
  await shot(page, '11-season-end');
  await page.evaluate(`${HUB}.claimSeason()`);
  await page.waitForTimeout(500);
  await shot(page, '12-new-division');
  await page.evaluate(`${HUB}.home()`);
  await page.waitForFunction(`${G}.scene.isActive('Menu')`);
  await page.waitForTimeout(700);
  await shot(page, '01-menu');
  await page.evaluate(`(() => { const m = ${G}.scene.getScene('Menu'); const b = m.children.list.find((o) => o.list && o.list.some((c) => c.texture && c.texture.key === 'ic-shop')); b.emit('pointerup'); })()`);
  await page.waitForTimeout(500);
  await shot(page, '10-shop');
  await ctx.close();
}

// ---------------------------------------------------------------- portrait phone 390×844 (touch)
{
  const { ctx, page } = await session({ width: 390, height: 844 }, 'phone', { mobile: true });
  await page.waitForTimeout(500);
  await shot(page, 'p-01-season');
  await page.evaluate(`${HUB}.go()`);
  await waitPhase(page, `${PLAY}.phase === 'aim'`);
  await page.waitForTimeout(400);
  await shot(page, 'p-02-aim');
  // a real touch swipe up and to the right
  const cdp = await ctx.newCDPSession(page);
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', 190, 760);
  for (const [x, y] of [[196, 700], [210, 640], [236, 580]]) { await page.waitForTimeout(18); await touch('touchMove', x, y); }
  await touch('touchEnd', 236, 580);
  await page.waitForTimeout(100);
  const shotTaken = await page.evaluate(`${PLAY}.phase !== 'aim'`);
  console.log('portrait touch swipe → shot taken:', shotTaken);
  await freezeWhen(page, `p.phase === 'flight' && p.clock - p.kickT > p.shot.T * 0.5`);
  await shot(page, 'p-03-shot');
  await unfreeze(page);
  await freezeWhen(page, `p.phase === 'runup' && p.tellSide !== 0`, 20000);
  await page.waitForTimeout(300);
  await shot(page, 'p-04-saving');
  await unfreeze(page);
  // a real tap on the goal (left side) to dive
  await page.waitForFunction(`${PLAY}.phase === 'flight' || ${PLAY}.divedAt !== null`, null, { timeout: 5000 }).catch(() => {});
  await touch('touchStart', 120, 330); await touch('touchEnd', 120, 330);
  const dove = await page.evaluate(`${PLAY}.divedAt !== null`);
  console.log('portrait touch tap → dove:', dove);
  await page.evaluate(`${PLAY}.breakEgg()`);
  await page.waitForFunction(`!!${HUD}.over`, null, { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot(page, 'p-05-result');
  await page.evaluate(`${HUD}.table()`);
  await page.waitForFunction(`${G}.scene.isActive('Hub')`);
  await page.evaluate(`${HUB}.openSquad()`);
  await page.waitForTimeout(400);
  await shot(page, 'p-06-squad');
  await page.evaluate(`(() => { ${HUB}.closeSquad(); ${HUB}.home(); })()`);
  await page.waitForTimeout(800);
  await shot(page, 'p-07-menu');
  await ctx.close();
}

await browser.close();
server.close();
console.log('errors:', errors.length ? errors : 'none');
if (errors.length) process.exitCode = 1;
