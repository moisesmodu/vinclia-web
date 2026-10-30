// Tiny Harbor screenshots (1920×1080 and portrait 390×844, JPG q85) into fichas/tiny-harbor/capturas/.
// Usage (from proyectos/juegos): GAME=tiny-harbor node scripts/build.mjs web && PORT=5941 node tiny-harbor/test-capturas.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'fichas', 'tiny-harbor', 'capturas');
await mkdir(outDir, { recursive: true });
const port = +(process.env.PORT || 5941);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const errors = [];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const want = (n) => !only || only.some((o) => n.startsWith(o));
const shot = (page, name) => page.screenshot({ path: resolve(outDir, name), type: 'jpeg', quality: 85 });
const KEY = 'tiny-harbor.v1';
const today = () => { const d = new Date(), p = (n) => `${n}`.padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

async function open(vp, store) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: vp.width < vp.height, isMobile: vp.width < vp.height });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(([k, v]) => { if (v !== null && !sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, [KEY, store ? JSON.stringify(store) : null]);
  await page.goto(`http://localhost:${port}/tiny-harbor/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(700);
  return page;
}
const playing = () => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.sim && !p.paused && !p.leaving; };
const play = async (page) => {
  await page.evaluate(() => window.__game.scene.getScene('Menu').go());
  await page.waitForFunction(playing, null, { timeout: 30000 });
};
const ffTo = async (page, portIdx, secs) => {
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.sim && !p.paused && !p.leaving ? p.sim.port : -1; });
    if (st === portIdx) break;
    // panel de puerto terminado: se cierra
    await page.evaluate(() => window.__game.scene.getScene('Hud')?.portPanel?.close?.());
    if (st >= 0) await page.evaluate(() => window.__game.scene.getScene('Play').fastForward(60));
    await page.waitForTimeout(st >= 0 ? 50 : 400);
  }
  await page.evaluate((s) => window.__game.scene.getScene('Play').fastForward(s), secs);
  await page.evaluate(() => window.__game.scene.getScene('Play').autoplay(true));
  await page.waitForTimeout(2500);
};

if (want('10') || want('01')) {
  let page = await open({ width: 1920, height: 1080 }, null);
  await shot(page, '10-diario.jpg');
  await page.context().close();
  page = await open({ width: 1920, height: 1080 }, { dailyDate: today(), dailyStreak: 1, stars: 5 });
  await shot(page, '01-menu.jpg');
  await page.context().close();
}
if (want('09')) {
  const page = await open({ width: 1920, height: 1080 }, { stars: 140, dailyDate: today(), dailyStreak: 3, owned: ['hull-blue', 'flag-star'], equipped: { hull: 'hull-blue', flag: 'flag-star' }, tutorialDone: true });
  await page.mouse.click(93, 987);
  await page.waitForTimeout(700);
  await shot(page, '09-tienda.jpg');
  await page.context().close();
}
let saved = null;
if (want('02') || want('03') || want('04') || want('05') || want('06') || want('07')) {
  const page = await open({ width: 1920, height: 1080 }, { dailyDate: today(), dailyStreak: 1, owned: ['flag-heart'], equipped: { flag: 'flag-heart' } });
  await play(page);
  await page.waitForTimeout(2600);
  await shot(page, '02-tutorial.jpg');
  // segundo paso del tutorial: el barco cargado al mar abierto
  await page.evaluate(() => { const s = window.__game.scene.getScene('Play').sim; const b = s.waiting()[0]; s.grab(b.x, b.y); const r = s.L.berths[0]; s.moveFinger(r.x, r.y); b.x = r.x; b.y = r.y; s.release(); });
  await page.waitForFunction(() => window.__game.scene.getScene('Play').sim.readyBoats().length > 0, null, { timeout: 15000 });
  await page.waitForTimeout(900);
  await shot(page, '13-tutorial-zarpar.jpg');
  await ffTo(page, 0, 240);
  await shot(page, '03-juego.jpg');
  await ffTo(page, 0, 420);
  await shot(page, '04-juego.jpg');
  await ffTo(page, 1, 500);
  await shot(page, '05-juego.jpg');
  await ffTo(page, 2, 700);
  await shot(page, '06-juego.jpg');
  console.log('city', await page.evaluate(() => { const s = window.__game.scene.getScene('Play').sim; return { port: s.port, boats: s.boats.length, tugs: s.tugs.length, berths: s.owned, cash: Math.floor(s.cash) }; }));
  saved = await page.evaluate((k) => localStorage.getItem(k), KEY);
  // panel de puerto terminado (ahí está el ×2)
  await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); p.autoplay(false); p.sim.cash = 1e6; const g = p.sim.activePads().find((x) => x.kind === 'gate'); let n = 0; while (!p.leaving && n++ < 60) { const a = p.sim.activePads()[0]; p.tapSign(a.id); p.update(); } });
  await page.waitForFunction(() => !!window.__game.scene.getScene('Hud')?.portPanel, null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '11-puerto.jpg');
  await page.context().close();
}
if (want('07') || want('08')) {
  let page = await open({ width: 390, height: 844 }, { ...(saved ? JSON.parse(saved) : {}), dailyDate: today(), tutorialDone: true });
  await play(page);
  await page.evaluate(() => window.__game.scene.getScene('Play').autoplay(true));
  await page.waitForTimeout(4000);
  await page.screenshot({ path: resolve(outDir, '07-vertical.jpg'), type: 'jpeg', quality: 85 });
  await page.context().close();
  page = await open({ width: 390, height: 844 }, { dailyDate: today(), stars: 30 });
  await page.screenshot({ path: resolve(outDir, '08-vertical-menu.jpg'), type: 'jpeg', quality: 85 });
  await page.context().close();
  // vertical, partida nueva con el tutorial
  page = await open({ width: 390, height: 844 }, { dailyDate: today() });
  await play(page);
  await page.waitForTimeout(2300);
  await page.screenshot({ path: resolve(outDir, '12-vertical-tutorial.jpg'), type: 'jpeg', quality: 85 });
  await page.context().close();
}

await browser.close();
server.close();
console.log('errors:', errors.length ? errors : 'none');
