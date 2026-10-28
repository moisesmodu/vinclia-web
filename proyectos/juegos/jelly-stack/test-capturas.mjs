// Screenshots for the store pages: menu, tutorial, gameplay x3, perfect combo, game over.
// Usage (from proyectos/juegos, after the build): node jelly-stack/test-capturas.mjs [width] [height] [outDir] [port]
// Defaults: 1920x1080 → fichas/jelly-stack/capturas/ on port 5203.
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [W, H] = [+(process.argv[2] || 1920), +(process.argv[3] || 1080)];
const out = resolve(root, process.argv[4] || 'fichas/jelly-stack/capturas');
const port = +(process.argv[5] || 5203);
mkdirSync(out, { recursive: true });
process.argv[2] = 'dist'; process.argv[3] = `${port}`;
const { server } = await import(resolve(root, 'scripts/serve.mjs'));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.addInitScript(() => {
  try { localStorage.setItem('jelly-stack.v1', JSON.stringify({ best: 48, coins: 63, runs: 0, tutorialDone: false, muted: true })); } catch { /* */ }
});
await page.goto(`http://localhost:${port}/jelly-stack/`);
await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
await page.waitForTimeout(800);
const shot = async (name) => { await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 85 }); console.log('✔', name); };
await shot('01-menu');
await page.evaluate(() => window.__game.scene.getScene('Menu').go());
await page.waitForFunction(() => window.__game.scene.isActive('Hud'));
await page.waitForTimeout(2500);
await shot('02-tutorial');

// autopilot: drop when the slider crosses (top.x + aim); aim = 0 gives a perfect drop
await page.evaluate(() => {
  const g = window.__game;
  window.__aim = [];
  let prev = null, prevSlider = null;
  // postupdate: right after Play moved the slider; drop when it crossed the target since the last frame
  g.events.on('postrender', () => {
    const s = g.scene.getScene('Play');
    if (!g.scene.isActive('Play') || !s.alive || s.paused || !s.slider) { prev = null; return; }
    const top = s.tower[s.tower.length - 1];
    const aim = window.__aim.length ? window.__aim[0] : 0;
    if (aim === null) { prev = null; return; }
    const d = s.slider.x - (top.x + aim);
    if (prevSlider === s.slider && prev !== null && (prev <= 0) !== (d <= 0) && Math.abs(d) < 120) {
      s.slider.x = top.x + aim; window.__aim.shift(); prev = null; prevSlider = null; s.drop(); return;
    }
    prev = d; prevSlider = s.slider;
  });
});
const playTo = async (n, aims = []) => {
  await page.evaluate((a) => { window.__aim = a; }, aims);
  await page.waitForFunction((n) => window.__game.scene.getScene('Play').score >= n, n, { timeout: 120000 });
};
await playTo(4, [60, 0, -50, 0]);
await page.evaluate(() => { window.__aim = [null]; });
await page.waitForTimeout(30);
await page.evaluate(() => { window.__aim = [70]; });
await page.waitForFunction(() => window.__aim.length === 0, null, { timeout: 20000 });
await page.waitForTimeout(260);
await shot('03-juego');
await playTo(18, [0, 0, 30, 0, 0, 0, -30, 0, 0, 0, 0, 0, 0, 25]);
await page.waitForTimeout(220);
await shot('04-juego');
await playTo(24);
await page.waitForFunction(() => window.__game.scene.getScene('Play').combo >= 4, null, { timeout: 60000 });
await page.waitForTimeout(90);
await shot('06-perfecto');
await playTo(44, [0, 0, 0, 0, 0, 0, 0, 0, -45]);
await page.waitForTimeout(250);
await shot('05-juego');
// miss: hold the next drop until the slider is far away, then drop
await page.evaluate(() => { window.__aim = [null]; });
await page.evaluate(() => { const s = window.__game.scene.getScene('Play'), t = s.tower[s.tower.length - 1]; s.slider.x = t.x + s.slider.w + 40; s.drop(); });
await page.waitForFunction(() => window.__game.scene.getScene('Hud').over, null, { timeout: 20000 });
await page.waitForTimeout(1200);
await shot('08-final');
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
