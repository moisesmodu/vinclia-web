// Trick Floor ad/SDK flow with the CrazyGames and Poki SDKs mocked (same mocks as scripts/sdk-test.mjs).
// Checks: init + loading done; gameplayStart on the first level with no ad; deaths respawn without ads or stops;
// "skip level" button after 3 deaths; give-up panel → skip with a rewarded ad (next level, no interstitial);
// interstitial only between levels, at most once every 3 finished levels, never on the first; menu → gameplayStop.
// Usage (from proyectos/juegos, after GAME=trick-floor node scripts/build.mjs all): PORT=5471 node trick-floor/test-sdk.mjs [crazygames|poki]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5471);
const portals = process.argv[2] ? [process.argv[2]] : ['crazygames', 'poki'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
let current = 'crazygames';
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist-portales', 'trick-floor', current, p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
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
const isInterstitial = (m) => m === 'requestAd:midgame' || m === 'commercialBreak';
const isRewarded = (m) => m === 'requestAd:rewarded' || m === 'rewardedBreak';

const browser = await chromium.launch();
let failures = 0;
for (const name of portals) {
  current = name;
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(MOCKS[name].url, (r) => r.fulfill({ contentType: 'text/javascript', body: MOCKS[name].body }));
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  const P = "window.__game.scene.getScene('Play')", H = "window.__game.scene.getScene('Hud')";
  const checks = [];
  const expect = (label, ok) => { checks.push([label, ok]); if (!ok) failures++; };
  const step = async (label, code, wait = 1200) => {
    if (code) await page.evaluate(code);
    await page.waitForTimeout(wait);
    const st = await page.evaluate(`({ log: window.__log.splice(0), level: ${P}.level, alive: ${P}.alive, active: window.__game.scene.getScenes(true).map((s) => s.scene.key).join('+') })`);
    console.log(`[${name}] ${label.padEnd(34)} ${st.log.join(', ').padEnd(46)} level ${st.level} · ${st.active}`);
    return st;
  };
  console.log(`\n=== ${name} ===`);
  let st = await step('boot', null, 300);
  expect('init + loading done', st.log.includes('init') && (st.log.includes('loadingStop') || st.log.includes('gameLoadingFinished')));
  st = await step('play level 1 (first of the session)', `${P}.scene.isActive() || window.__game.scene.getScene('Menu').go(1)`, 1500);
  expect('gameplayStart, no interstitial on the first level', st.log.includes('gameplayStart') && !st.log.some(isInterstitial));
  st = await step('die 3 times (instant respawn)', `(async () => { for (let i = 0; i < 3; i++) { ${P}.s.dead = 'spike'; await new Promise((r) => setTimeout(r, 700)); } })()`, 2600);
  expect('deaths: no ads, no gameplayStop', !st.log.some(isInterstitial) && !st.log.includes('gameplayStop'));
  expect('deaths counted, skip button offered', await page.evaluate(`${P}.deaths === 3 && !!${H}.skipBtn`));
  st = await step('give up (breakEgg)', `${P}.breakEgg()`, 800);
  expect('give up: gameplayStop + panel', st.log.includes('gameplayStop') && await page.evaluate(`!!${H}.over`));
  st = await step('skip level (rewarded ad)', `${H}.revive()`, 1600);
  expect('rewarded ad → level 2, gameplayStart, no interstitial', st.log.some(isRewarded) && st.level === 2 && st.log.includes('gameplayStart') && !st.log.some(isInterstitial));
  for (const lv of [2, 3, 4]) {
    await step(`finish level ${lv}`, `${P}.complete()`, 1200);
    st = await step(`next level (${lv + 1})`, `${H}.next()`, 1500);
    if (lv < 4) expect(`no interstitial after ${lv - 1} finished level(s)`, !st.log.some(isInterstitial) && st.log.includes('gameplayStart'));
    else expect('interstitial after 3 finished levels, then gameplayStart', st.log.some(isInterstitial) && st.log.includes('gameplayStart') && st.log.indexOf('gameplayStart') > st.log.findIndex(isInterstitial));
  }
  st = await step('restart level (1 click)', `${H}.restart()`, 1200);
  expect('restart: no ad', !st.log.some(isInterstitial) && !st.log.some(isRewarded));
  st = await step('back to level select', `${H}.home()`, 800);
  expect('menu: gameplayStop', st.log.includes('gameplayStop') && st.active.includes('Levels'));
  expect('no page errors', errors.length === 0);
  for (const [l, ok] of checks) console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${l}`);
  if (errors.length) console.log('  errors:', errors);
  await page.close();
}
await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
if (failures) process.exitCode = 1;
