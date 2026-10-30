// Proves every Pin Rescue level with the real simulation (src/sim.ts, the same code the game runs):
//   1. replay: the designer's line (`sol` in src/levels.ts) is played from scratch and must win with 3 stars;
//   2. doing nothing for 20 s never wins (nothing moves until a pin is pulled);
//   3. wrong orders: every other order of the solution's pins, and every unused (trap) pin pulled first, 2.6 s apart.
//      A level "punishes" wrong play when at least one of those loses; most levels must.
// It also reports what pulling every pin at once does.
// Usage (from proyectos/juegos):
//   node pin-rescue/test-niveles.mjs [level]                                                   (in Node, via esbuild)
//   GAME=pin-rescue node scripts/build.mjs web && BROWSER=1 PORT=5902 node pin-rescue/test-niveles.mjs [level]   (in the built game)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const only = process.argv[2] ? [+process.argv[2]] : null;

/** All checks for one level. Self-contained (it is also sent to the browser as text). */
function checkLevel(SIM, n) {
  const L = SIM.LEVELS[n - 1];
  const tag = (s) => (s.won ? `win${SIM.starCount(s)}` : s.dead || 'idle');
  const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  const sol = SIM.run(L, L.sol, 30);
  const none = SIM.run(L, [], 20);
  const pins = SIM.init(L).pins.length;
  const all = SIM.run(L, Array.from({ length: pins }, (_, k) => [0.5, k]), 30);
  const solPins = L.sol.map((x) => x[1]);
  const key = solPins.join('');
  const tries = perms(solPins).filter((p) => p.join('') !== key);
  for (let k = 0; k < pins; k++) if (!solPins.includes(k)) tries.push([k, ...solPins]);
  let lost = 0, won = 0;
  const losses = {};
  for (const p of tries) {
    const s = SIM.run(L, p.map((k, j) => [0.5 + j * 2.6, k]), 30);
    if (s.won) won++;
    else { lost++; losses[s.dead || 'idle'] = (losses[s.dead || 'idle'] || 0) + 1; }
  }
  return {
    level: n, pins, solOk: sol.won && SIM.starCount(sol) === 3, sol: tag(sol), solSecs: +sol.t.toFixed(1),
    gold: Math.round((100 * sol.collected) / sol.goldTotal), none: tag(none), noneWins: none.won, all: tag(all),
    wrong: tries.length, wrongLost: lost, wrongWon: won, losses,
  };
}

const results = [];
if (!process.env.BROWSER) {
  const esbuild = createRequire(import.meta.url)('esbuild');
  const outfile = join(process.env.TMPDIR || tmpdir(), `pin-sim-${process.pid}.mjs`);
  await esbuild.build({ stdin: { contents: `export * from './src/sim.ts'; export { LEVELS } from './src/levels.ts';`, resolveDir: here, loader: 'ts' }, bundle: true, format: 'esm', outfile, logLevel: 'error' });
  const SIM = await import(pathToFileURL(outfile).href);
  for (const n of only || SIM.LEVELS.map((_, i) => i + 1)) { const r = checkLevel(SIM, n); results.push(r); print(r); }
} else {
  const { chromium } = createRequire(import.meta.url)(createRequire(import.meta.url).resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));
  const port = +(process.env.PORT || 5902);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    try { const b = await readFile(join(root, 'dist', p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
    catch { res.writeHead(404); res.end(); }
  }).listen(port);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/pin-rescue/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  const count = await page.evaluate(() => window.__game.scene.getScene('Play').constructor.SIM.LEVELS.length);
  for (const n of only || Array.from({ length: count }, (_, i) => i + 1)) {
    const r = await page.evaluate(({ fn, n }) => {
      const S = window.__game.scene.getScene('Play').constructor.SIM;
      return new Function(`return (${fn})`)()(S, n);
    }, { fn: checkLevel.toString(), n });
    results.push(r); print(r);
  }
  console.log('page errors:', errors.length ? errors : 'none');
  await browser.close();
  server.close();
}
const ok = results.filter((r) => r.solOk).length;
const idle = results.filter((r) => r.noneWins).length;
const punish = results.filter((r) => r.wrongLost > 0).length;
const wrongTotal = results.reduce((a, r) => a + r.wrong, 0), wrongLost = results.reduce((a, r) => a + r.wrongLost, 0);
console.log(`\n3 stars with the designer's line: ${ok}/${results.length} · doing nothing wins: ${idle}/${results.length} · ` +
  `levels where a wrong order loses: ${punish}/${results.length} · wrong orders that lose: ${wrongLost}/${wrongTotal}`);
const failed = results.filter((r) => !r.solOk || r.noneWins).map((r) => r.level);
if (failed.length || punish < Math.ceil(results.length * 0.75)) { console.log('FAILED:', failed.join(', ') || `only ${punish} levels punish wrong orders`); process.exitCode = 1; }
else console.log('all checks passed');

function print(r) {
  const why = Object.entries(r.losses).map(([k, v]) => `${k} ${v}`).join(', ');
  console.log(`level ${String(r.level).padStart(2)} (${r.pins} pins): solution ${r.solOk ? 'OK' : 'FAIL'} ${r.sol} ${r.gold}% gold ${r.solSecs} s · ` +
    `do nothing: ${r.none} · all at once: ${r.all} · wrong orders lose ${r.wrongLost}/${r.wrong}${why ? ` (${why})` : ''}`);
}
