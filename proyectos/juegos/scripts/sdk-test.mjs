// Prueba de integración de los SDK sin red: intercepta la URL oficial del SDK, sirve uno simulado que anota
// cada llamada y juega una partida completa (morir → revivir con anuncio → morir → reiniciar con anuncio).
// Uso: npm run paquetes && node scripts/sdk-test.mjs [crazygames|poki]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = process.env.GAME || 'egg-truck';
const portalName = process.argv[2] || 'crazygames';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(join(root, 'dist-portales', game, portalName, p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(5088);

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
await page.goto('http://localhost:5088/');
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 20000 });
const step = async (label, fn, wait = 800) => { await page.evaluate(fn); await page.waitForTimeout(wait); console.log(label.padEnd(26), (await page.evaluate(() => window.__log.splice(0))).join(', ')); };
console.log('arranque'.padEnd(26), (await page.evaluate(() => window.__log.splice(0))).join(', '));
await step('jugar (1.ª partida)', () => { window.__game.scene.getScene('Menu').go(); }, 1500);
const kill = () => window.__game.scene.getScene('Play').breakEgg();
await step('se rompe el huevo', kill, 1500);
await step('revivir (anuncio)', () => window.__game.scene.getScene('Hud').revive(), 1200);
await step('se rompe otra vez', kill, 1500);
const canRevive = await page.evaluate(() => window.__game.scene.getScene('Hud').over?.list.length);
await step('reiniciar (1 clic)', () => window.__game.scene.getScene('Hud').restart(), 1500);
await step('volver al menú', () => { window.__game.scene.getScene('Play').breakEgg(); setTimeout(() => window.__game.scene.getScene('Hud').home(), 900); }, 2000);
console.log('errores:', errors.length ? errors : 'ninguno');
await browser.close();
server.close();
