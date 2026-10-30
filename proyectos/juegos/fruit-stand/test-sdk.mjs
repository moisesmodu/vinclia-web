// Prueba del ciclo de SDK de Fruit Stand (variante de scripts/sdk-test-espera.mjs: aquí no hay "fin de partida",
// hay sesiones largas). Mismos SDK simulados de CrazyGames y Poki. Comprueba: init y carga terminada; primera
// partida sin anuncio; anuncios con recompensa (turbo ×2, cosecha al instante, ×2 de las ganancias sin conexión)
// siempre con gameplayStop/Start alrededor; menú = gameplayStop; volver del menú = intersticial; abrir puesto nuevo =
// intersticial; sin errores.
// Uso (desde proyectos/juegos): GAME=fruit-stand node scripts/build.mjs all && GAME=fruit-stand PORT=5701 node fruit-stand/test-sdk.mjs crazygames|poki
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const portalName = process.argv[2] || 'crazygames';
const port = +(process.env.PORT || 5701);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist-portales', 'fruit-stand', portalName, p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const MOCKS = {
  crazygames: { url: 'https://sdk.crazygames.com/crazygames-sdk-v3.js', body: `
    window.__log = []; const L = (m) => window.__log.push(m); const store = {};
    window.CrazyGames = { SDK: {
      init: async () => L('init'), environment: 'crazygames',
      game: { loadingStart: () => L('loadingStart'), loadingStop: () => L('loadingStop'), gameplayStart: () => L('gameplayStart'),
              gameplayStop: () => L('gameplayStop'), happytime: () => L('happytime') },
      ad: { requestAd: (t, cb) => { L('requestAd:' + t); cb.adStarted(); setTimeout(() => cb.adFinished(), 300); } },
      data: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    } };` },
  poki: { url: 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js', body: `
    window.__log = []; const L = (m) => window.__log.push(m);
    window.PokiSDK = { init: async () => L('init'), gameLoadingFinished: () => L('gameLoadingFinished'),
      gameplayStart: () => L('gameplayStart'), gameplayStop: () => L('gameplayStop'),
      commercialBreak: (fn) => { L('commercialBreak'); fn && fn(); return new Promise((r) => setTimeout(r, 300)); },
      rewardedBreak: (fn) => { L('rewardedBreak'); typeof fn === 'function' && fn(); return new Promise((r) => setTimeout(() => r(true), 300)); } };` },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const mock = MOCKS[portalName];
await page.route(mock.url, (r) => r.fulfill({ contentType: 'text/javascript', body: mock.body }));
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
const W = { timeout: 30000 };
const playing = () => { const g = window.__game, p = g.scene.getScene('Play'); return g.scene.isActive('Play') && p.sim && !p.paused && !p.leaving; };
const results = [];
const AD = /requestAd:midgame|commercialBreak/, RW = /requestAd:rewarded|rewardedBreak/;
const step = async (label, fn, until, expect) => {
  await page.evaluate(fn);
  await page.waitForFunction(until, null, W);
  await page.waitForTimeout(400);
  const log = await page.evaluate(() => window.__log.splice(0));
  const ok = expect(log);
  results.push(ok);
  console.log((ok ? '✔ ' : '✘ ') + label.padEnd(30), log.join(', '));
};
const boot = await page.evaluate(() => window.__log.splice(0));
results.push(boot.includes('init') && (boot.includes('loadingStop') || boot.includes('gameLoadingFinished')));
console.log((results[0] ? '✔ ' : '✘ ') + 'boot'.padEnd(30), boot.join(', '));

// la ventana del diario puede estar abierta: se cobra con intro
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await page.evaluate(() => window.__log.splice(0));
await step('play (1st run, no ad)', () => window.__game.scene.getScene('Menu').go(), playing,
  (l) => l.includes('gameplayStart') && !l.some((x) => AD.test(x)));
await step('boost ×2 (rewarded)', () => window.__game.scene.getScene('Hud').boost(), () => window.__game.scene.getScene('Play').sim.boost > 0,
  (l) => l.some((x) => RW.test(x)) && l.indexOf('gameplayStop') < l.findIndex((x) => RW.test(x)) && l.at(-1) === 'gameplayStart');
await step('instant harvest (rewarded)', () => { window.__harv = 0; window.__game.scene.getScene('Hud').harvest().then(() => { window.__harv = 1; }); }, () => window.__harv === 1,
  (l) => l.some((x) => RW.test(x)) && l.at(-1) === 'gameplayStart');
await step('play 10 min (autopilot)', () => window.__game.scene.getScene('Play').fastForward(600), () => true,
  (l) => !l.some((x) => AD.test(x)));
await step('home button', () => window.__game.scene.getScene('Hud').home(), () => window.__game.scene.isActive('Menu'),
  (l) => l.includes('gameplayStop') && !l.some((x) => AD.test(x)));
// vuelve una hora después: ganancias sin conexión (los ayudantes trabajan)
await page.evaluate(() => { const s = window.__fsSave; const g = s.get('game'); s.set('game', { ...g, savedAt: Date.now() - 3600e3 }); });

await step('play again (from menu)', () => window.__game.scene.getScene('Menu').go(), () => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.sim && (p.paused === false || !!window.__game.scene.getScene('Hud')?.offlinePanel); },
  (l) => l.some((x) => AD.test(x)) && l.indexOf('gameplayStart') > l.findIndex((x) => AD.test(x)));
console.log(await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); return { off: p.offline, h: p.sim.helpers.length, paused: p.paused }; }));
const before = await page.evaluate(() => Math.floor(window.__game.scene.getScene('Play').sim.cash));
await step('offline ×2 (rewarded)', () => window.__game.scene.getScene('Hud').dbl.press(), () => true, (l) => l.some((x) => RW.test(x)));
await step('offline collect', () => window.__game.scene.getScene('Hud').offlinePanel.close(), () => !window.__game.scene.getScene('Hud').offlinePanel, () => true);
const after = await page.evaluate(() => Math.floor(window.__game.scene.getScene('Play').sim.cash));
console.log(`  offline coins: ${before} → ${after}`);
results.push(after > before);
await step('open next stand', async () => {
  const p = window.__game.scene.getScene('Play');
  window.__stand0 = p.sim.stand;
  for (let i = 0; i < 60 && !p.leaving; i++) p.fastForward(60);
}, () => { const p = window.__game.scene.getScene('Play'); return p.sim.stand !== window.__stand0 && window.__game.scene.isActive('Play') && !p.paused && !p.leaving; },
  (l) => l.includes('gameplayStop') && l.some((x) => AD.test(x)) && l.at(-1) === 'gameplayStart');
// nueva sesión (recarga) un rato después: la primera partida no lleva anuncio y sí ventana de ganancias sin conexión
await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); for (let i = 0; i < 12 && !p.sim.helpers.some((h) => !h.cashier); i++) p.fastForward(300); p.persist(); const s = window.__fsSave; const g = s.get('game'); s.set('game', { ...g, savedAt: Date.now() - 5400e3 }); });
// el almacén simulado de CrazyGames vive en la página: se copia antes de recargar
const kept = await page.evaluate(() => JSON.stringify(window.__fsSave.get('game')));
await page.addInitScript((g) => { window.__keep = g; }, kept);
await page.reload();
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, W);
await page.evaluate(() => { const s = window.__fsSave; if (window.__keep) s.set('game', JSON.parse(window.__keep)); window.__log.splice(0); });
await step('new session: 1st play', () => window.__game.scene.getScene('Menu').go(), () => !!window.__game.scene.getScene('Hud')?.offlinePanel,
  (l) => l.includes('gameplayStart') && !l.some((x) => AD.test(x)));
console.log('errors:', errors.length ? errors : 'none');
const ok = results.every(Boolean) && !errors.length;
console.log(ok ? 'PASS' : 'FAIL');
await browser.close();
server.close();
process.exit(ok ? 0 : 1);
