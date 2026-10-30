// Prueba propia de Bike Flip con el SDK de Poki simulado (complementa scripts/sdk-test.mjs):
// choque → saltar nivel con anuncio con recompensa → meta → siguiente nivel (intersticial) → selector de niveles.
// Uso (desde proyectos/juegos, tras GAME=bike-flip node scripts/build.mjs all): PORT=5179 node bike-flip/test-sdk.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5179);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(root, 'dist-portales', 'bike-flip', 'poki', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const MOCK = `window.__log = []; const L = (m) => window.__log.push(m);
  window.PokiSDK = { init: async () => L('init'), gameLoadingFinished: () => L('gameLoadingFinished'),
    gameplayStart: () => L('gameplayStart'), gameplayStop: () => L('gameplayStop'),
    commercialBreak: (fn) => { L('commercialBreak'); fn && fn(); return new Promise((r) => setTimeout(r, 300)); },
    rewardedBreak: (fn) => { L('rewardedBreak'); typeof fn === 'function' && fn(); return new Promise((r) => setTimeout(() => r(true), 300)); } };`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('https://game-cdn.poki.com/scripts/v2/poki-sdk.js', (r) => r.fulfill({ contentType: 'text/javascript', body: MOCK }));
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
const G = 'window.__game.scene.getScene';
const step = async (label, code, wait = 1500) => {
  await page.evaluate(code); await page.waitForTimeout(wait);
  const st = await page.evaluate(`({ log: window.__log.splice(0), level: ${G}('Play').level, unlocked: JSON.parse(localStorage.getItem('bike-flip.v1') || '{}').unlocked, active: window.__game.scene.getScenes(true).map((s) => s.scene.key) })`);
  console.log(label.padEnd(30), st.log.join(', ').padEnd(44), `nivel ${st.level} · desbloqueado ${st.unlocked} · ${st.active.join('+')}`);
};
await page.evaluate('window.__log.splice(0)');
await step('jugar (nivel 1)', `${G}('Menu').go(1)`);
await step('choque', `${G}('Play').crash()`);
await step('saltar nivel (anuncio)', `${G}('Hud').skip()`, 2500);
// meta: complete() es lo que llama Play al cruzar la bandera
await step('llegar a la meta', `${G}('Play').complete()`, 2000);
await step('siguiente nivel', `${G}('Hud').next()`, 2500);
await step('selector de niveles', `${G}('Hud').home()`, 1000);
console.log('errores:', errors.length ? errors : 'ninguno');
await browser.close();
server.close();
