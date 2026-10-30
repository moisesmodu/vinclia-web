// Tiny Harbor real input check: drags with the mouse (landscape 1280×720) and with touch (portrait 390×844, CDP touch
// events), exactly like a player: grab the waiting boat, drop it at the free crane, wait for the cargo, drag it to the
// open sea, then tap the price sign. Also turns the screen mid-game (layout switch).
// Usage (from proyectos/juegos): GAME=tiny-harbor node scripts/build.mjs web && PORT=5944 node tiny-harbor/test-input.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5944);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(ok ? '✔' : '✘', msg); };
const today = () => { const d = new Date(), p = (n) => `${n}`.padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

for (const mode of ['mouse', 'touch']) {
  const vp = mode === 'mouse' ? { width: 1280, height: 720 } : { width: 390, height: 844 };
  const ctx = await browser.newContext({ viewport: vp, hasTouch: mode === 'touch', isMobile: mode === 'touch' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((d) => { localStorage.setItem('tiny-harbor.v1', JSON.stringify({ dailyDate: d })); }, today());
  await page.goto(`http://localhost:${port}/tiny-harbor/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(500);
  // jugar con un toque / clic en el botón (centro del botón de jugar)
  const playBtn = await page.evaluate(() => { const m = window.__game.scene.getScene('Menu'); const c = m.children.list.find((o) => o.type === 'Container'); return { x: c.x, y: c.y }; });
  const cdp = mode === 'touch' ? await ctx.newCDPSession(page) : null;
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const tap = async (x, y) => { if (cdp) { await touch('touchStart', x, y); await page.waitForTimeout(60); await touch('touchEnd', x, y); } else await page.mouse.click(x, y); };
  const drag = async (a, b) => {
    if (cdp) {
      await touch('touchStart', a.x, a.y);
      for (let i = 1; i <= 12; i++) { await touch('touchMove', a.x + ((b.x - a.x) * i) / 12, a.y + ((b.y - a.y) * i) / 12); await page.waitForTimeout(25); }
      await touch('touchEnd', b.x, b.y);
    } else {
      await page.mouse.move(a.x, a.y); await page.mouse.down();
      await page.mouse.move(b.x, b.y, { steps: 12 }); await page.mouse.up();
    }
  };
  await tap(playBtn.x, playBtn.y);
  await page.waitForFunction(() => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.sim && !p.paused; }, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  const scr = (x, y) => page.evaluate(([x, y]) => window.__game.scene.getScene('Play').toScreen(x, y), [x, y]);
  const boat = await page.evaluate(() => { const s = window.__game.scene.getScene('Play').sim; const b = s.waiting()[0]; return { id: b.id, x: b.x, y: b.y, berth: s.L.berths[0], layout: s.L.name }; });
  await drag(await scr(boat.x, boat.y), await scr(boat.berth.x, boat.berth.y));
  await page.waitForTimeout(500);
  let st = await page.evaluate((id) => window.__game.scene.getScene('Play').sim.boats.find((b) => b.id === id)?.state, boat.id);
  check(st === 'dock' || st === 'load', `[${mode}] ${boat.layout}: dragged boat to the crane → ${st}`);
  await page.waitForFunction((id) => window.__game.scene.getScene('Play').sim.boats.find((b) => b.id === id)?.state === 'ready', boat.id, { timeout: 15000 });
  const cash0 = await page.evaluate(() => window.__game.scene.getScene('Play').sim.cash);
  const e = await page.evaluate(() => window.__game.scene.getScene('Play').sim.L.exit);
  const b2 = await page.evaluate((id) => { const b = window.__game.scene.getScene('Play').sim.boats.find((o) => o.id === id); return { x: b.x, y: b.y }; }, boat.id);
  await drag(await scr(b2.x, b2.y), await scr((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2));
  await page.waitForTimeout(300);
  const cash1 = await page.evaluate(() => window.__game.scene.getScene('Play').sim.cash);
  st = await page.evaluate((id) => window.__game.scene.getScene('Play').sim.boats.find((b) => b.id === id)?.state ?? 'gone', boat.id);
  check(st === 'sail' && cash1 > cash0, `[${mode}] loaded boat dragged to the open sea → ${st}, coins ${cash0} → ${cash1}`);
  // tocar el letrero de la primera mejora con dinero de sobra
  await page.evaluate(() => { window.__game.scene.getScene('Play').sim.cash = 1000; });
  const sign = await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); const s = p.sim.L.signs[0]; return { ...p.toScreen(s.x, s.y), n: p.sim.bought.size }; });
  await tap(sign.x, sign.y);
  await page.waitForTimeout(300);
  const n1 = await page.evaluate(() => window.__game.scene.getScene('Play').sim.bought.size);
  check(n1 === sign.n + 1, `[${mode}] tapped the price sign → bought (${sign.n} → ${n1})`);
  // girar la pantalla
  await page.setViewportSize(mode === 'mouse' ? { width: 600, height: 1000 } : { width: 844, height: 390 });
  await page.waitForTimeout(600);
  const lay = await page.evaluate(() => { const s = window.__game.scene.getScene('Play').sim; return { name: s.L.name, ok: s.boats.every((b) => b.x > -400 && b.y > 0 && b.x < s.L.w + 400 && b.y < s.L.h + 400) }; });
  check(lay.name !== boat.layout && lay.ok, `[${mode}] screen turned → layout ${lay.name}, boats in place`);
  check(!errors.length, `[${mode}] no page errors ${errors.join(' | ')}`);
  await ctx.close();
}
await browser.close();
server.close();
console.log(fails ? `${fails} check(s) failed` : 'all input checks passed');
process.exitCode = fails ? 1 : 0;
