// Capturas de Fruit Stand (1920×1080, JPG q85) en fichas/fruit-stand/capturas/ y una vertical (390×844) para revisar.
// Uso (desde proyectos/juegos): GAME=fruit-stand node scripts/build.mjs web && node fruit-stand/test-capturas.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'fichas', 'fruit-stand', 'capturas');
await mkdir(outDir, { recursive: true });
const port = +(process.env.PORT || 5711);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist', p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const errors = [];
const shot = (page, name) => page.screenshot({ path: resolve(outDir, name), type: 'jpeg', quality: 85 });
const KEY = 'fruit-stand.v1';
const today = () => { const d = new Date(), p = (n) => `${n}`.padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

async function open(vp, store) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: vp.width < vp.height, isMobile: vp.width < vp.height });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(([k, v]) => { if (v !== null && !sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, [KEY, store ? JSON.stringify(store) : null]);
  await page.goto(`http://localhost:${port}/fruit-stand/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.waitForTimeout(700);
  return page;
}
const play = async (page) => {
  await page.evaluate(() => window.__game.scene.getScene('Menu').go());
  await page.waitForFunction(() => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.sim && !p.paused; }, null, { timeout: 30000 });
};
const ffTo = async (page, stand, secsInStand) => {
  // avanza hasta el puesto pedido (abriendo puertas) y luego secsInStand segundos
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.sim && !p.paused && !p.leaving ? p.sim.stand : -1; });
    if (st === stand) break;
    if (st >= 0) await page.evaluate(() => window.__game.scene.getScene('Play').fastForward(60));
    await page.waitForTimeout(st >= 0 ? 50 : 400);
  }
  await page.evaluate((s) => window.__game.scene.getScene('Play').fastForward(s), secsInStand);
  await page.evaluate(() => { window.__game.scene.getScene('Play').autopilot = true; });
  await page.waitForTimeout(2500);
};

// 1) diario (primera vez del día) y menú
let page = await open({ width: 1920, height: 1080 }, null);
await shot(page, '10-diario.jpg');
await page.keyboard.press('Enter');
await page.context().close();
// menú con el regalo de hoy ya cobrado (la ráfaga de estrellas del diario no sale en la captura)
page = await open({ width: 1920, height: 1080 }, { dailyDate: today(), dailyStreak: 1, stars: 5 });
await shot(page, '01-menu.jpg');
await page.context().close();

// 2) tienda con algunas estrellas y cosas compradas
page = await open({ width: 1920, height: 1080 }, { stars: 140, dailyDate: today(), dailyStreak: 3, owned: ['apron-blue', 'hat-straw', 'awning-blue'], equipped: { apron: 'apron-blue', hat: 'hat-straw', awning: 'awning-blue' }, tutorialDone: true });
await page.mouse.click(93, 987);
await page.waitForTimeout(700);
await shot(page, '09-tienda.jpg');
await page.context().close();

// 3) partida nueva: tutorial; luego tres momentos de la partida (puesto 1, 2 y 3)
page = await open({ width: 1920, height: 1080 }, { dailyDate: today(), dailyStreak: 1, owned: ['hat-straw'], equipped: { hat: 'hat-straw' } });
await play(page);
await page.waitForTimeout(1800);
await shot(page, '02-tutorial.jpg');
await ffTo(page, 0, 300);
await shot(page, '03-juego.jpg');
await ffTo(page, 1, 900);
await shot(page, '04-juego.jpg');
await ffTo(page, 2, 1500);
await shot(page, '05-juego.jpg');
const state = await page.evaluate(() => { const s = window.__game.scene.getScene('Play').sim; return { stand: s.stand, customers: s.customers.length, helpers: s.helpers.length, bought: s.bought.size, cash: Math.floor(s.cash) }; });
console.log('city state', state);
// guardado para la vertical: el mismo puesto
const saved = await page.evaluate((k) => localStorage.getItem(k), KEY);
await page.context().close();

// 4) vertical 390×844 (móvil) con la partida avanzada
page = await open({ width: 390, height: 844 }, { ...JSON.parse(saved), dailyDate: today() });
await play(page);
await page.evaluate(() => { window.__game.scene.getScene('Play').autopilot = true; });
await page.waitForTimeout(2500);
await page.screenshot({ path: resolve(here, '..', 'fichas', 'fruit-stand', 'capturas', '07-vertical.jpg'), type: 'jpeg', quality: 85 });
await page.context().close();
page = await open({ width: 390, height: 844 }, { dailyDate: today(), stars: 30 });
await page.screenshot({ path: resolve(outDir, '08-vertical-menu.jpg'), type: 'jpeg', quality: 85 });
await page.context().close();

await browser.close();
server.close();
console.log('errors:', errors.length ? errors : 'none');
