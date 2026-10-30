// Tiny Harbor ad/SDK flow with the CrazyGames and Poki SDKs mocked (same mocks as scripts/sdk-test.mjs).
// Checks: init + loading done; first play of the session with no ad; "double boat" rewarded ad (boats pay ×2 for 60 s)
// with gameplayStop/Start around it and really doubling the pay; autoplay without ads; menu → gameplayStop; back to
// the harbor within 3 min → no interstitial (pacing); after the gap → interstitial before gameplayStart; offline
// earnings panel with ×2 (rewarded) that really adds the coins; port finished → panel with ×2 stars (rewarded), stars
// saved (SDK.data on CrazyGames, localStorage on Poki), no interstitial after a rewarded ad; next port finished
// without ×2 → interstitial; reload → first play again with no ad and progress kept; no page errors.
// Usage (from proyectos/juegos, after GAME=tiny-harbor node scripts/build.mjs all): PORT=5942 node tiny-harbor/test-sdk.mjs [crazygames|poki]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5942);
const portals = process.argv[2] ? [process.argv[2]] : ['crazygames', 'poki'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
let current = 'crazygames';
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist-portales', 'tiny-harbor', current, p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const MOCKS = {
  crazygames: { url: 'https://sdk.crazygames.com/crazygames-sdk-v3.js', body: `
    window.__log = []; const L = (m) => window.__log.push(m);
    // el almacén del SDK.data sobrevive a la recarga (como la cuenta del jugador)
    const store = JSON.parse(sessionStorage.getItem('__cgstore') || '{}'); window.__store = store;
    window.CrazyGames = { SDK: {
      init: async () => L('init'), environment: 'crazygames',
      game: { loadingStart: () => L('loadingStart'), loadingStop: () => L('loadingStop'), gameplayStart: () => L('gameplayStart'),
              gameplayStop: () => L('gameplayStop'), happytime: () => L('happytime') },
      ad: { requestAd: (t, cb) => { L('requestAd:' + t); cb.adStarted(); setTimeout(() => cb.adFinished(), 300); } },
      data: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; sessionStorage.setItem('__cgstore', JSON.stringify(store)); } },
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
  const P = "window.__game.scene.getScene('Play')", H = "window.__game.scene.getScene('Hud')", M = "window.__game.scene.getScene('Menu')";
  const saved = `JSON.parse((window.__store && window.__store['tiny-harbor.v1']) || localStorage.getItem('tiny-harbor.v1') || '{}')`;
  const playing = `(window.__game.scene.isActive('Play') && ${P}.sim && !${P}.paused && !${P}.leaving)`;
  const checks = [];
  const expect = (label, ok) => { checks.push([label, ok]); if (!ok) failures++; };
  const step = async (label, code, wait = 1200) => {
    if (code) await page.evaluate(code);
    await page.waitForTimeout(wait);
    const st = await page.evaluate(`({ log: window.__log.splice(0), port: ${P}.sim?.port, active: window.__game.scene.getScenes(true).map((s) => s.scene.key).join('+') })`);
    console.log(`[${name}] ${label.padEnd(36)} ${st.log.join(', ').padEnd(56)} port ${st.port} · ${st.active}`);
    return st;
  };
  console.log(`\n=== ${name} ===`);
  let st = await step('boot', null, 300);
  expect('init + loading done', st.log.includes('init') && (st.log.includes('loadingStop') || st.log.includes('gameLoadingFinished')));
  await page.keyboard.press('Enter'); // regalo diario
  await step('daily gift', null, 400);
  st = await step('play (first of the session)', `${M}.go()`, 1500);
  expect('gameplayStart, no interstitial on the first play', st.log.includes('gameplayStart') && !st.log.some(isInterstitial) && await page.evaluate(playing));
  await page.evaluate(`${P}.fastForward(120)`); // tutorial hecho y algo de dinero
  st = await step('double boat (rewarded)', `${H}.boost()`, 1200);
  expect('double boat: gameplayStop → rewarded → gameplayStart, 60 s', st.log.some(isRewarded) && st.log.indexOf('gameplayStop') < st.log.findIndex(isRewarded) && st.log.at(-1) === 'gameplayStart' && await page.evaluate(`${P}.sim.boost > 55`));
  const pay = await page.evaluate(`(() => { const s = ${P}.sim; const b = s.boats[0]; b.load = b.cap; b.state = 'ready'; const c0 = s.cash; s.finger.boat = 0; s['sail'](b); return { got: s.cash - c0, normal: Math.round(b.load * s.def.crate * 1.5 ** s.cargoLv * s.mult) }; })()`);
  expect(`double boat pays ×2 (${pay.got} = 2 × ${pay.normal})`, pay.got === 2 * pay.normal && pay.normal > 0);
  st = await step('5 min of autoplay', `${P}.fastForward(300)`, 600);
  expect('autoplay: no ads', !st.log.some(isInterstitial) && !st.log.some(isRewarded));
  st = await step('home button', `${H}.home()`, 800);
  expect('menu: gameplayStop, no ad', st.log.includes('gameplayStop') && !st.log.some(isInterstitial) && st.active.includes('Menu'));
  st = await step('play again (< 3 min since last ad)', `${M}.go()`, 1500);
  expect('no interstitial before 3 min have passed', !st.log.some(isInterstitial) && st.log.includes('gameplayStart'));
  await page.evaluate('window.__thAdGap = 1500');
  await step('home button', `${H}.home()`, 1800);
  // vuelve una hora después: ganancias sin conexión (remolcador o práctico comprados)
  await page.evaluate(`(() => { const p = ${P}; })()`);
  await page.evaluate(`(() => { const s = window.__thSave; const g = s.get('game'); if (!g.rate) g.rate = 300; s.set('game', { ...g, savedAt: Date.now() - 3600e3 }); })()`);
  st = await step('play again (after the gap)', `${M}.go()`, 1800);
  expect('interstitial before gameplayStart', st.log.some(isInterstitial) && st.log.indexOf('gameplayStart') > st.log.findIndex(isInterstitial));
  const off = await page.evaluate(`({ panel: !!${H}.offlinePanel, auto: ${P}.sim.tugs.length + ${P}.sim.pilot, cash: Math.floor(${P}.sim.cash) })`);
  expect(`offline panel (automation ${off.auto})`, off.panel && off.auto > 0);
  st = await step('offline ×2 (rewarded)', `${H}.dbl && ${H}.dbl.press()`, 1000);
  expect('offline ×2: rewarded ad', st.log.some(isRewarded));
  await step('offline collect', `${H}.offlinePanel.close()`, 400);
  const cash1 = await page.evaluate(`Math.floor(${P}.sim.cash)`);
  console.log(`[${name}] offline coins: ${off.cash} → ${cash1}`);
  expect('offline coins added', cash1 > off.cash);
  // terminar el puerto con el piloto automático
  st = await step('finish port 1 (autoplay)', `(() => { const p = ${P}; for (let i = 0; i < 80 && !p.leaving; i++) p.fastForward(30); })()`, 600);
  expect('port done: gameplayStop + panel', st.log.includes('gameplayStop') && await page.evaluate(`!!${H}.portPanel`));
  const stars0 = await page.evaluate(`${saved}.stars ?? -1`);
  st = await step('×2 stars (rewarded)', `${H}.dbl && ${H}.dbl.press()`, 1000);
  expect('×2 stars: rewarded ad, gameplay stays stopped on the panel', st.log.some(isRewarded) && !st.log.some(isInterstitial) && !st.log.includes('gameplayStart'));
  st = await step('next port (after ×2)', `${H}.portPanel.close()`, 1800);
  const stars1 = await page.evaluate(`${saved}.stars ?? -1`);
  console.log(`[${name}] saved stars before the new port: ${stars0} · after: ${stars1} (+10 ×2 = +20)`);
  expect('saved stars +20 (port reward ×2)', stars1 - stars0 === 20);
  expect('port 2 starts, no interstitial after a rewarded ad', st.port === 1 && !st.log.some(isInterstitial) && st.log.includes('gameplayStart'));
  await page.waitForTimeout(1600);
  st = await step('finish port 2 (buy everything)', `(() => { const p = ${P}; p.sim.cash = 1e7; for (let i = 0; i < 40 && !p.leaving; i++) { const a = p.sim.activePads()[0]; p.tapSign(a.id); p.update(); } })()`, 2200);
  expect('port 2 done: panel', await page.evaluate(`!!${H}.portPanel`));
  st = await step('next port (no ×2)', `${H}.portPanel.close()`, 1800);
  expect('interstitial at the chapter end, then gameplayStart', st.port === 2 && st.log.some(isInterstitial) && st.log.indexOf('gameplayStart') > st.log.findIndex(isInterstitial));
  await page.evaluate(`${P}.persist()`);
  // nueva sesión: recarga, el progreso sigue y la primera partida no lleva anuncio
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.evaluate('window.__log.splice(0)');
  st = await step('new session: play', `${M}.go()`, 1500);
  expect('progress kept (port 3) and no interstitial on the first play', st.port === 2 && !st.log.some(isInterstitial) && st.log.includes('gameplayStart'));
  expect(name === 'crazygames' ? 'saved in SDK.data (cloud)' : 'saved in localStorage', await page.evaluate(name === 'crazygames' ? `!!window.__store['tiny-harbor.v1'] && !localStorage.getItem('tiny-harbor.v1')` : `!!localStorage.getItem('tiny-harbor.v1')`));
  expect('no page errors', errors.length === 0);
  for (const [l, ok] of checks) console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${l}`);
  if (errors.length) console.log('  errors:', errors);
  await page.close();
}
await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
if (failures) process.exitCode = 1;
