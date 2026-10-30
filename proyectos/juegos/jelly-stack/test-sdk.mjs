// SDK flow test for Jelly Stack: same mocks as scripts/sdk-test.mjs, but every step waits for the game state
// (not a fixed time), so it is reliable on a loaded machine with software rendering.
// Usage (from proyectos/juegos, after build all): GAME=jelly-stack PORT=5201 node jelly-stack/test-sdk.mjs [crazygames|poki]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = 'jelly-stack';
const portalName = process.argv[2] || 'crazygames';
const port = +(process.env.PORT || 5201);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist-portales', game, portalName, p))); }
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
      data: { getItem: (k) => (L('data.getItem'), store[k] ?? null), setItem: (k, v) => { store[k] = v; L('data.setItem'); } },
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
const alive = () => { const g = window.__game, p = g.scene.getScene('Play'); return g.scene.isActive('Play') && p.alive && !p.paused && window.__log.includes('gameplayStart'); };
const over = () => !!window.__game.scene.getScene('Hud')?.over;
const step = async (label, fn, until) => {
  await page.evaluate(fn);
  await page.waitForFunction(until, null, W);
  await page.waitForTimeout(150);
  console.log(label.padEnd(26), (await page.evaluate(() => window.__log.splice(0))).join(', '));
};
console.log('boot'.padEnd(26), (await page.evaluate(() => window.__log.splice(0))).join(', '));
await step('play (1st run)', () => window.__game.scene.getScene('Menu').go(), alive);
const kill = () => window.__game.scene.getScene('Play').breakEgg();
await step('miss (game over)', kill, over);
const canRevive = await page.evaluate(() => window.__game.scene.getScene('Hud').over.list.length);
await step('revive (rewarded ad)', () => window.__game.scene.getScene('Hud').revive(), alive);
await step('miss again', kill, over);
await step('restart (1 click)', () => { window.__game.scene.getScene('Hud').restart(); }, alive);
await step('back to menu', () => { window.__game.scene.getScene('Play').breakEgg(); window.__homeAt = 1; },
  () => window.__game.scene.getScene('Hud')?.over);
await step('  home button', () => window.__game.scene.getScene('Hud').home(), () => window.__game.scene.isActive('Menu'));
console.log('game-over items (with revive):', canRevive);
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
