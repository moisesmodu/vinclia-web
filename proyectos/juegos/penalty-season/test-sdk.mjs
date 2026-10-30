// Penalty Season ad/SDK flow with the CrazyGames and Poki SDKs mocked (same mocks as scripts/sdk-test-espera.mjs).
// Waits on game state, not fixed times. Checks: init + loading done; first match of the session starts with
// gameplayStart and no interstitial; a missed penalty offers the retake (rewarded ad, gameplayStop/Start around it,
// the miss is erased); only once per match; ending a match → gameplayStop; ×2 coins with a rewarded ad; the next
// match (one click) and a match started from the season screen both get an interstitial before gameplayStart;
// menu → gameplayStop; progress saved through the portal; no page errors.
// Usage (from proyectos/juegos, after GAME=penalty-season node scripts/build.mjs all): PORT=5741 node penalty-season/test-sdk.mjs [crazygames|poki]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5741);
const portals = process.argv[2] ? [process.argv[2]] : ['crazygames', 'poki'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
let current = 'crazygames';
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist-portales', 'penalty-season', current, p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
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
      data: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; window.__saved = (window.__saved || 0) + 1; } },
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
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 60000 });
  const G = 'window.__game', P = `${G}.scene.getScene('Play')`, H = `${G}.scene.getScene('Hud')`, HUB = `${G}.scene.getScene('Hub')`;
  const checks = [];
  const expect = (label, ok) => { checks.push([label, ok]); if (!ok) failures++; };
  const W = { timeout: 30000 };
  const step = async (label, code, until) => {
    if (code) await page.evaluate(code);
    if (until) await page.waitForFunction(until, null, W).catch(() => console.log(`  (timeout waiting: ${until})`));
    await page.waitForTimeout(200);
    const st = await page.evaluate(`({ log: window.__log.splice(0), phase: ${G}.scene.isActive('Play') ? ${P}.phase : '-', active: ${G}.scene.getScenes(true).map((s) => s.scene.key).join('+') })`);
    console.log(`[${name}] ${label.padEnd(34)} ${st.log.join(', ').padEnd(56)} ${st.phase} · ${st.active}`);
    return st;
  };
  const playing = `${G}.scene.isActive('Play') && ${P}.alive && !${P}.paused && ${P}.phase !== 'idle'`;
  console.log(`\n=== ${name} ===`);
  let st = await step('boot', null, null);
  expect('init + loading done', st.log.includes('init') && (st.log.includes('loadingStop') || st.log.includes('gameLoadingFinished')));
  st = await step('menu → season screen', `${G}.scene.getScene('Menu').go()`, `${G}.scene.isActive('Hub')`);
  st = await step('first match of the session', `${HUB}.go()`, playing);
  expect('gameplayStart, no interstitial before the first match', st.log.includes('gameplayStart') && !st.log.some(isInterstitial));
  await page.waitForFunction(`${P}.phase === 'aim'`, null, W);
  st = await step('shoot over the bar (miss)', `${P}.autoShoot(0, 1.3)`, `${P}.phase === 'retake'`);
  expect('miss → retake offered (button on screen)', st.phase === 'retake' && await page.evaluate(`!!${H}.retakeBox && ${P}.mine.length === 1 && ${P}.mine[0] === false`));
  st = await step('retake (rewarded ad)', `${H}.revive()`, `${P}.phase === 'aim' || ${P}.phase === 'intro'`);
  const iR = st.log.findIndex(isRewarded);
  expect('rewarded ad with gameplayStop before and gameplayStart after', iR > 0 && st.log.lastIndexOf('gameplayStop', iR) >= 0 && st.log.indexOf('gameplayStart', iR) > iR);
  expect('the miss is erased, same kick again', await page.evaluate(`${P}.mine.length === 0 && ${P}.retakeUsed && ${P}.meShooting`));
  await page.waitForFunction(`${P}.phase === 'aim'`, null, W);
  st = await step('miss again', `${P}.autoShoot(0, 1.3)`, `${P}.phase === 'intro' || ${P}.phase === 'runup' || ${P}.phase === 'retake'`);
  expect('no second retake in the same match', st.phase !== 'retake' && !st.log.some(isRewarded));
  st = await step('end the match (breakEgg)', `${P}.breakEgg()`, `!!${H}.over`);
  expect('end of match: gameplayStop, result panel', st.log.includes('gameplayStop') && await page.evaluate(`!!${H}.over`));
  const before = await page.evaluate(`${G}.scene.getScene('Play').earned`);
  const coins0 = await page.evaluate(`JSON.parse(localStorage.getItem('penalty-season.v1') || 'null')?.coins ?? -1`);
  st = await step('×2 coins (rewarded ad)', `${H}.dbl && ${H}.dbl.press()`, `${P}.doubled`);
  expect('×2: rewarded ad and coins doubled', st.log.some(isRewarded) && await page.evaluate(`${P}.doubled`) && before > 0);
  st = await step('next match (1 click)', `${H}.restart()`, playing);
  const iI = st.log.findIndex(isInterstitial);
  expect('interstitial between matches, then gameplayStart', iI >= 0 && st.log.indexOf('gameplayStart', iI) > iI);
  st = await step('end the match', `${P}.breakEgg()`, `!!${H}.over`);
  st = await step('to the league table', `${H}.table()`, `${G}.scene.isActive('Hub')`);
  expect('season screen shown, 2 matchdays recorded', await page.evaluate(`window.__game.scene.isActive('Hub') && !window.__game.scene.isActive('Play')`) && await page.evaluate(`(() => { const raw = window.CrazyGames ? window.CrazyGames.SDK.data.getItem('penalty-season.v1') : localStorage.getItem('penalty-season.v1'); return JSON.parse(raw).season.round === 2; })()`));
  st = await step('match from the season screen', `${HUB}.go()`, playing);
  const iI2 = st.log.findIndex(isInterstitial);
  expect('interstitial before it too, then gameplayStart', iI2 >= 0 && st.log.indexOf('gameplayStart', iI2) > iI2);
  st = await step('end and go home', `${P}.breakEgg()`, `!!${H}.over`);
  st = await step('  home button', `${H}.home()`, `${G}.scene.isActive('Menu')`);
  expect('menu: no gameplay running', st.active.includes('Menu') && !st.active.includes('Play'));
  if (name === 'crazygames') expect('progress saved in the CrazyGames data module', await page.evaluate(`(window.__saved || 0) > 0`));
  const se = await page.evaluate(`(() => { const raw = window.CrazyGames ? null : localStorage.getItem('penalty-season.v1'); return raw ? JSON.parse(raw).season?.round : 'cloud'; })()`);
  console.log(`  coins before ×2: ${coins0}, season round now: ${se}`);
  expect('no page errors', errors.length === 0);
  for (const [l, ok] of checks) console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${l}`);
  if (errors.length) console.log('  errors:', errors);
  await page.close();
}
await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
if (failures) process.exitCode = 1;
