// Capturas de Paint Grab para las fichas (1920×1080, JPG q85) y comprobación en vertical (390×844).
// Uso (desde proyectos/juegos): GAME=paint-grab node scripts/build.mjs web && PORT=5722 node paint-grab/test-capturas.mjs
// Variables: OUT (carpeta de salida, por defecto fichas/paint-grab/capturas), PORTRAIT=1 (solo vertical, a OUT).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const port = +(process.env.PORT || 5722);
const portrait = !!process.env.PORTRAIT;
const out = resolve(root, process.env.OUT || 'fichas/paint-grab/capturas');
await mkdir(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist', p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const ctx = await browser.newContext(portrait
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:${port}/paint-grab/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 60000 });
const shot = async (name) => { await page.screenshot({ path: join(out, `${name}.jpg`), type: 'jpeg', quality: 85 }); console.log('✔', name); };
const wait = (ms) => page.waitForTimeout(ms);
const waitFor = (fn, t = 60000) => page.waitForFunction(fn, null, { timeout: t });

await wait(900);
await shot(portrait ? 'v-01-diario' : '10-diario');
await page.keyboard.press('Space'); // cobra la recompensa diaria
await wait(1200);
await shot(portrait ? 'v-02-menu' : '01-menu');

await page.evaluate(() => window.__game.scene.getScene('Menu').go());
await waitFor(() => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.alive; });
await wait(1500);
await shot(portrait ? 'v-03-tutorial' : '02-tutorial');

// piloto automático para jugar de verdad un rato
await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); p.autopilot = true; p.sim.player.ai = 'greedy'; });
await wait(2500);
await page.evaluate(() => { window.__game.scene.getScene('Hud').steerTime = 99; });
for (const [name, ms] of portrait ? [['v-04-juego', 14000]] : [['03-juego', 14000], ['04-juego', 12000]]) {
  await wait(ms);
  await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); if (!p.alive) window.__game.scene.getScene('Hud').revive?.(); });
  await shot(name);
}

if (!portrait) {
  // captura grande guiada: un lazo amplio (protegido para la foto) y foto justo al cerrarlo
  await page.evaluate(() => {
    const p = window.__game.scene.getScene('Play'), s = p.sim, me = s.player;
    if (!p.alive) { p.revive(); }
    me.ai = null; p.autopilot = true; me.invuln = 60; p.timeLeft = Math.max(p.timeLeft, 90);
    // lazo amplio guiado por posición (no por tiempo: el contenedor sin GPU va más lento que el tiempo real)
    const x0 = me.x, y0 = me.y, n = s.yard.w;
    const L = Math.min(22, n - 3 - x0, n - 3 - y0);
    let phase = 0;
    window.__bigDone = false;
    const timer = setInterval(() => {
      if (phase === 0) { s.steer(0); if (me.x > x0 + L) phase = 1; }
      else if (phase === 1) { s.steer(Math.PI / 2); if (me.y > y0 + L) phase = 2; }
      else if (phase === 2) { s.steer(Math.PI); if (me.x < x0 - 2) phase = 3; }
      else { s.steer(-Math.PI / 2); if (me.trail.length === 0) { window.__bigDone = true; clearInterval(timer); } }
    }, 30);
  });
  for (let k = 0; k < 90 && !(await page.evaluate(() => window.__bigDone)); k++) {
    await wait(1000);
    if (k % 10 === 0) console.log(await page.evaluate(() => { const p = window.__game.scene.getScene('Play'), me = p.sim.player; return { alive: p.alive, x: +me.x.toFixed(1), y: +me.y.toFixed(1), trail: me.trail.length, t: +p.timeLeft.toFixed(1), over: !!window.__game.scene.getScene('Hud').over }; }));
  }
  await wait(250);
  await shot('05-captura');
  await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); p.sim.player.invuln = 0; p.timeLeft = Math.max(p.timeLeft, 20); p.sim.player.ai = 'greedy'; });
  await wait(6000);
  await shot('06-juego');

  // fin de ronda
  await page.evaluate(() => { window.__game.scene.getScene('Play').timeLeft = 0.3; });
  await waitFor(() => !!window.__game.scene.getScene('Hud')?.over);
  await wait(900);
  await shot('07-ronda');
  // siguiente ronda y eliminación
  await page.evaluate(() => window.__game.scene.getScene('Hud').next());
  await waitFor(() => { const p = window.__game.scene.getScene('Play'); return p.alive && p.round === 2; });
  await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); p.autopilot = true; p.sim.player.ai = 'greedy'; });
  await wait(8000);
  await page.evaluate(() => window.__game.scene.getScene('Play').breakEgg());
  await waitFor(() => !!window.__game.scene.getScene('Hud')?.over);
  await wait(900);
  await shot('08-final');
  // tienda
  await page.evaluate(() => window.__game.scene.getScene('Hud').home());
  await waitFor(() => window.__game.scene.isActive('Menu'));
  await page.evaluate(() => {
    const m = window.__game.scene.getScene('Menu');
    const shop = m.children.list.find((o) => o.list?.some?.((c) => c.texture?.key === 'ic-shop'));
    shop.emit('pointerup', {}, 0, 0, { stopPropagation() {} });
  });
  await wait(800);
  await shot('09-tienda');
} else {
  await page.evaluate(() => { window.__game.scene.getScene('Play').timeLeft = 0.3; });
  await waitFor(() => !!window.__game.scene.getScene('Hud')?.over);
  await wait(900);
  await shot('v-05-ronda');
  await page.evaluate(() => window.__game.scene.getScene('Hud').next());
  await waitFor(() => { const p = window.__game.scene.getScene('Play'); return p.alive && p.round === 2; });
  await page.evaluate(() => window.__game.scene.getScene('Play').breakEgg());
  await waitFor(() => !!window.__game.scene.getScene('Hud')?.over);
  await wait(900);
  await shot('v-06-final');
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
