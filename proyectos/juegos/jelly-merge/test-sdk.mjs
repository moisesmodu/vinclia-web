// Jelly Merge ad/SDK flow with the CrazyGames and Poki SDKs mocked (same mocks as scripts/sdk-test.mjs).
// Checks: init + loading done; gameplayStart on the first run with no ad; game over → gameplayStop; revive (rewarded)
// clears the top of the jar and plays on, once per run; ×2 coins (rewarded) adds exactly the run's coins to the coins
// really saved (SDK.data on CrazyGames, localStorage on Poki); best score saved; interstitial only when a new run
// starts after 3 finished runs (never on the first run, never on revive); home → gameplayStop.
// Every step waits for the game state, not a fixed time (reliable on a loaded machine with software rendering).
// Usage (from proyectos/juegos, after GAME=jelly-merge node scripts/build.mjs all): PORT=5963 node jelly-merge/test-sdk.mjs [crazygames|poki]
//   DIST=<folder> serves the build from another folder (default: dist/, or dist-portales/ for the SDK test).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5963);
const portals = process.argv[2] ? [process.argv[2]] : ['crazygames', 'poki'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
let current = 'crazygames';
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(process.env.DIST || join(root, 'dist-portales'), 'jelly-merge', current, p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
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
  const ALIVE = `window.__game.scene.isActive('Play') && ${P}.alive && ${P}.started && !${P}.paused`;
  const OVER = `!!${H}.over`;
  const checks = [];
  const expect = (label, ok) => { checks.push([label, ok]); if (!ok) failures++; };
  const step = async (label, code, until, extra = 300) => {
    if (code) await page.evaluate(code);
    if (until) await page.waitForFunction(until, null, { timeout: 30000 });
    await page.waitForTimeout(extra);
    const st = await page.evaluate(`({ log: window.__log.splice(0), jellies: ${P}.jellies?.length ?? 0, score: ${P}.score, active: window.__game.scene.getScenes(true).map((s) => s.scene.key).join('+') })`);
    console.log(`[${name}] ${label.padEnd(36)} ${st.log.join(', ').padEnd(44)} jellies ${st.jellies} · score ${st.score} · ${st.active}`);
    return st;
  };
  /** Plays with the autopilot (sped up) until the run has some score and jellies. */
  const fill = `(async () => { const p = ${P}; p.turbo = 8; p.autoplay(); await new Promise((r) => { const t = setInterval(() => { if (p.score >= 120 && p.jellies.length >= 6) { clearInterval(t); r(); } }, 100); }); p.turbo = 1; p.auto = false; })()`;
  console.log(`\n=== ${name} ===`);
  let st = await step('boot', null, null, 100);
  expect('init + loading done', st.log.includes('init') && (st.log.includes('loadingStop') || st.log.includes('gameLoadingFinished')));
  st = await step('play (1st run of the session)', `window.__game.scene.getScene('Menu').go()`, ALIVE);
  expect('gameplayStart, no interstitial on the first run', st.log.includes('gameplayStart') && !st.log.some(isInterstitial));
  st = await step('autopilot drops jellies', fill, null);
  expect('jellies merge and score while playing, no ads', st.score >= 120 && !st.log.some(isInterstitial) && !st.log.some(isRewarded));
  st = await step('game over (breakEgg)', `${P}.breakEgg()`, OVER);
  expect('game over: gameplayStop + end panel with revive', st.log.includes('gameplayStop') && await page.evaluate(`!!${H}.reviveBtn`));
  const before = st.jellies;
  st = await step('revive (rewarded ad)', `${H}.revive()`, ALIVE);
  expect('revive: rewarded ad, top jellies cleared, gameplayStart, no interstitial', st.log.some(isRewarded) && st.jellies < before && st.log.includes('gameplayStart') && !st.log.some(isInterstitial));
  st = await step('game over again', `${P}.breakEgg()`, OVER);
  expect('revive offered only once per run', await page.evaluate(`${P}.revived && !${H}.reviveBtn`));
  const saved = `JSON.parse((window.__store && window.__store['jelly-merge.v1']) || localStorage.getItem('jelly-merge.v1') || '{}')`;
  const s0 = await page.evaluate(saved), run = await page.evaluate(`${P}.coinsRun`), score = await page.evaluate(`${P}.score`);
  st = await step('×2 coins (rewarded ad)', `${H}.dbl && ${H}.dbl.press()`, `${P}.doubled`);
  const s1 = await page.evaluate(saved);
  console.log(`[${name}] saved coins before ×2: ${s0.coins} · after: ${s1.coins} · run paid: ${run} · saved best ${s1.best} (score ${score})`);
  expect('×2: rewarded ad, saved coins grow by exactly the run\'s coins', st.log.some(isRewarded) && !st.log.some(isInterstitial) && run > 0 && s1.coins - s0.coins === run);
  expect('best score saved through the portal', s1.best === score && score > 0);
  for (let i = 1; i <= 3; i++) {
    st = await step(`restart (finished runs since ad: ${i})`, `${H}.restart()`, ALIVE);
    if (i < 3) {
      expect(`restart after ${i} finished run(s): no interstitial`, !st.log.some(isInterstitial) && st.log.includes('gameplayStart'));
      await step('  game over', `${P}.breakEgg()`, OVER);
    } else {
      expect('restart after 3 finished runs: interstitial, then gameplayStart', st.log.some(isInterstitial) && st.log.indexOf('gameplayStart') > st.log.findIndex(isInterstitial));
    }
  }
  st = await step('home while playing', `${H}.home()`, `window.__game.scene.isActive('Menu')`);
  expect('menu: gameplayStop', st.log.includes('gameplayStop'));
  st = await step('play again from the menu', `window.__game.scene.getScene('Menu').go()`, ALIVE);
  expect('next run right after an interstitial: no new interstitial', !st.log.some(isInterstitial) && st.log.includes('gameplayStart'));
  expect('no page errors', errors.length === 0);
  for (const [l, ok] of checks) console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${l}`);
  if (errors.length) console.log('  errors:', errors);
  await page.close();
}
await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
if (failures) process.exitCode = 1;
