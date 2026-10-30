// Run lengths of Jelly Merge with the autopilot (Play.autoplay()): it drops one jelly every ~1.5 s of simulated time
// (a human pace) and the simulation runs TURBO times faster than real time, so many runs fit in a few minutes.
// Two players: "careful" (always the best spot the autopilot finds) and "average" (SLOPPY share of drops aimed at
// a random spot). Target: runs of 2 to 5 minutes for the average player. Runs longer than CAP minutes are stopped.
// Usage (from proyectos/juegos, after GAME=jelly-merge node scripts/build.mjs web): PORT=5961 node jelly-merge/test-partidas.mjs
//   DIST=<folder> serves the build from another folder (default: dist/, or dist-portales/ for the SDK test).
//   env: RUNS=6 TURBO=16 SLOPPY=0.35 CAP=12
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 5961);
const runs = +(process.env.RUNS || 6), turbo = +(process.env.TURBO || 16), sloppy = +(process.env.SLOPPY ?? 0.35), cap = +(process.env.CAP || 12);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(process.env.DIST || join(root, 'dist'), p)); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(port);

const browser = await chromium.launch();
const errors = [];
const play = async (label, slop) => {
  const page = await browser.newPage({ viewport: { width: 480, height: 480 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/jelly-merge/`);
  await page.evaluate(() => { const t = new Date(), p = (n) => `${n}`.padStart(2, '0'); localStorage.setItem('jelly-merge.v1', JSON.stringify({ tutorialDone: true, runs: 9, dailyDate: `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}` })); });
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.evaluate(() => window.__game.scene.getScene('Menu').go());
  const out = [];
  for (let i = 0; i < runs; i++) {
    await page.waitForFunction(() => { const p = window.__game.scene.getScene('Play'); return window.__game.scene.isActive('Play') && p.alive && p.started; }, null, { timeout: 30000 });
    await page.evaluate(([t, s]) => { const p = window.__game.scene.getScene('Play'); p.turbo = t; p.autoSloppy = s; p.autoplay(); }, [turbo, slop]);
    await page.waitForFunction((c) => { const p = window.__game.scene.getScene('Play'); return !p.alive || p.simT > c * 60; }, cap, { timeout: 30 * 60000, polling: 500 });
    const r = await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); return { min: +(p.simT / 60).toFixed(2), drops: p.drops, score: p.score, tier: p.topTier, clouds: p.clouds, coins: p.coinsRun, ended: !p.alive }; });
    out.push(r);
    console.log(`${label} run ${i + 1}: ${r.ended ? '' : '(stopped at cap) '}${r.min} min, ${r.drops} drops, score ${r.score}, biggest tier ${r.tier}, clouds ${r.clouds}, coins ${r.coins}`);
    await page.evaluate(() => { const p = window.__game.scene.getScene('Play'); if (p.alive) p.breakEgg(); });
    await page.waitForFunction(() => !!window.__game.scene.getScene('Hud').over, null, { timeout: 30000 });
    await page.evaluate(() => window.__game.scene.getScene('Hud').restart());
  }
  await page.close();
  const m = out.map((r) => r.min).sort((a, b) => a - b);
  return { label, minutes: m, median: m[Math.floor(m.length / 2)], meanScore: Math.round(out.reduce((a, r) => a + r.score, 0) / out.length), meanCoins: Math.round(out.reduce((a, r) => a + r.coins, 0) / out.length) };
};
const res = [];
res.push(await play('careful', 0));
res.push(await play(`average (${Math.round(sloppy * 100)} % random drops)`, sloppy));
console.log(JSON.stringify(res, null, 2));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
if (errors.length) process.exitCode = 1;
