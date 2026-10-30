// Pin Rescue ad/SDK flow with the CrazyGames and Poki SDKs mocked (same mocks as scripts/sdk-test.mjs).
// Checks: init + loading done; gameplayStart on the first level with no ad; failed tries retry instantly without ads
// or stops; "skip level" button after 3 failed tries → rewarded ad → next level, no interstitial; ×2 coins on the
// level-complete panel (rewarded), checked against the coins really saved (SDK.data on CrazyGames, localStorage on
// Poki) before and after; interstitial only between levels, at most once every 3 finished levels, never on the first;
// restart = no ad; menu → gameplayStop.
// Usage (from proyectos/juegos, after GAME=pin-rescue node scripts/build.mjs all): PORT=5900 node pin-rescue/test-sdk.mjs [crazygames|poki]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5900);
const portals = process.argv[2] ? [process.argv[2]] : ['crazygames', 'poki'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
let current = 'crazygames';
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist-portales', 'pin-rescue', current, p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const MOCKS = {
  crazygames: { url: 'https://sdk.crazygames.com/crazygames-sdk-v3.js', body: `
    window.__log = []; const L = (m) => window.__log.push(m); const store = {}; window.__store = store;
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
  st = await step('fail 3 times (instant retry)', `(async () => { for (let i = 0; i < 3; i++) { ${P}.breakEgg(); await new Promise((r) => setTimeout(r, 1200)); } })()`, 4000);
  expect('failed tries: no ads, no gameplayStop', !st.log.some(isInterstitial) && !st.log.some(isRewarded) && !st.log.includes('gameplayStop'));
  expect('fails counted, playing again, skip button offered', await page.evaluate(`${P}.fails === 3 && ${P}.alive && !!${H}.skipBtn`));
  st = await step('skip level (rewarded ad)', `${H}.revive()`, 1600);
  expect('rewarded ad → level 2, gameplayStart, no interstitial', st.log.some(isRewarded) && st.level === 2 && st.log.includes('gameplayStart') && !st.log.some(isInterstitial));
  st = await step('finish level 2 (designer line)', `${P}.autoplay()`, 9000);
  expect('level done: gameplayStop + panel', st.log.includes('gameplayStop') && await page.evaluate(`!!${H}.over && ${P}.finished`));
  // coins as really saved: the CrazyGames SDK.data store, or localStorage on Poki
  const saved = `JSON.parse((window.__store && window.__store['pin-rescue.v1']) || localStorage.getItem('pin-rescue.v1') || '{}').coins ?? -1`;
  const coins0 = await page.evaluate(saved);
  st = await step('×2 coins (rewarded ad)', `${H}.dbl && ${H}.dbl.press()`, 1200);
  const coins1 = await page.evaluate(saved), run = await page.evaluate(`${P}.coinsRun`);
  console.log(`[${name}] saved coins before ×2: ${coins0} · after: ${coins1} · level paid: ${run}`);
  expect('×2: rewarded ad, saved coins grow by exactly the level\'s coins', st.log.some(isRewarded) && !st.log.some(isInterstitial) && await page.evaluate(`${P}.doubled`) && run > 0 && coins0 >= run && coins1 - coins0 === run);
  st = await step('next level (3)', `${H}.next()`, 1500);
  expect('no interstitial after 1 finished level', !st.log.some(isInterstitial) && st.log.includes('gameplayStart'));
  for (const lv of [3, 4]) {
    await step(`finish level ${lv}`, `${P}.complete()`, 1600);
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
