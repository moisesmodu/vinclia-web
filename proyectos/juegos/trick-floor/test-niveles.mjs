// Proves every Trick Floor level can be finished: a search bot (best-first over 1/15 s input chunks: left, right,
// jump and combinations) plays the real simulation (src/sim.ts, the same code the game runs) until it touches the
// exit door, then the found input sequence is replayed from scratch to confirm it. It also reports what kills a
// naive player who just holds "right" (that is, which trap fires first) and the solution time.
// Usage (from proyectos/juegos):
//   GAME=trick-floor node scripts/build.mjs web && PORT=5472 node trick-floor/test-niveles.mjs [level]   (in the built game)
//   NODE=1 node trick-floor/test-niveles.mjs [level]                                                    (in Node, via esbuild)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const only = process.argv[2] ? [+process.argv[2]] : null;

/** Search + replay for one level. Self-contained (it is also sent to the browser as text). */
function solveLevel(SIM, LEVELS, n, budget) {
  const L = SIM.parse(LEVELS[n - 1]);
  const ACTS = [[0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 1, 1], [1, 0, 1], [0, 0, 1]];
  const K = 8; // steps per chunk (1/15 s)
  const run = (s, a) => { const inp = { l: !!ACTS[a][0], r: !!ACTS[a][1], j: !!ACTS[a][2] }; for (let i = 0; i < K && !s.dead && !s.won; i++) { SIM.step(L, s, inp); s.ev.length = 0; } };
  const key = (s) => [Math.round(s.x / 10), Math.round(s.y / 10), Math.round(s.vx / 100), Math.round(s.vy / 140), s.g, s.grounded ? 1 : 0, s.held ? 1 : 0, s.door.i,
    s.grp.map((g) => g.st).join(''), s.fly.map((f) => f.st).join('')].join(',');
  const dd = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) * 0.6;
  // distance to the door now plus the legs it will still run (so a door that runs away does not mislead the search)
  const rest = L.doors.map((_, i) => L.doors.slice(i).reduce((acc, d, k, arr) => acc + (k ? dd(arr[k - 1], d) : 0), 0));
  const h = (s) => (dd(s, L.doors[s.door.i]) + rest[s.door.i]) / 290;
  // binary heap on f
  const heap = [];
  const push = (e) => { heap.push(e); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p].f <= e.f) break; heap[i] = heap[p]; i = p; } heap[i] = e; };
  const pop = () => { const top = heap[0], e = heap.pop(); if (heap.length) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= heap.length) break; if (c + 1 < heap.length && heap[c + 1].f < heap[c].f) c++; if (heap[c].f >= e.f) break; heap[i] = heap[c]; i = c; } heap[i] = e; } return top; };
  const s0 = SIM.init(L);
  const seen = new Set([key(s0)]);
  push({ s: s0, f: h(s0), path: null });
  let found = null, expanded = 0;
  while (heap.length && expanded < budget) {
    const node = pop(); expanded++;
    for (let a = 0; a < ACTS.length; a++) {
      const s = structuredClone(node.s);
      run(s, a);
      if (s.dead) continue;
      const path = { a, prev: node.path };
      if (s.won) { found = path; break; }
      const k = key(s);
      if (seen.has(k)) continue;
      seen.add(k);
      push({ s, f: s.t + 3 * h(s), path });
    }
    if (found) break;
  }
  const naive = SIM.init(L);
  for (let i = 0; i < 120 * 30 && !naive.dead && !naive.won; i++) { SIM.step(L, naive, { l: false, r: true, j: false }); naive.ev.length = 0; }
  const out = { level: n, ok: false, expanded, naive: naive.won ? 'wins' : `${naive.dead || 'stuck'} at ${naive.t.toFixed(1)}s`, traps: L.groups.length + L.flyers.length + (L.doors.length - 1) };
  if (!found) return out;
  const acts = []; for (let p = found; p; p = p.prev) acts.unshift(p.a);
  // replay from scratch: same result, and count the trap events seen on the way
  const s = SIM.init(L); let events = 0;
  for (const a of acts) { const inp = { l: !!ACTS[a][0], r: !!ACTS[a][1], j: !!ACTS[a][2] }; for (let i = 0; i < K && !s.dead && !s.won; i++) { SIM.step(L, s, inp); events += s.ev.filter((e) => /^(trap|pop|drop|wobble|dart|door|fake|flip)/.test(e)).length; s.ev.length = 0; } }
  return { ...out, ok: s.won && !s.dead, secs: +s.t.toFixed(1), events };
}

let results = [];
const budget = +(process.env.BUDGET || 400000);
if (process.env.NODE) {
  const esbuild = createRequire(import.meta.url)('esbuild');
  const outfile = join(process.env.TMPDIR || tmpdir(), `trick-sim-${process.pid}.mjs`);
  await esbuild.build({ stdin: { contents: `export * as SIM from './src/sim.ts'; export { LEVELS } from './src/levels.ts';`, resolveDir: here, loader: 'ts' }, bundle: true, format: 'esm', outfile, logLevel: 'error' });
  const { SIM, LEVELS } = await import(pathToFileURL(outfile).href);
  for (const n of only || LEVELS.map((_, i) => i + 1)) { const r = solveLevel(SIM, LEVELS, n, budget); results.push(r); print(r); }
} else {
  const { chromium } = createRequire(import.meta.url)(createRequire(import.meta.url).resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));
  const port = +(process.env.PORT || 5472);
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
  await page.goto(`http://localhost:${port}/trick-floor/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  const count = await page.evaluate(() => window.__game.scene.getScene('Play').constructor.SIM.LEVELS.length);
  for (const n of only || Array.from({ length: count }, (_, i) => i + 1)) {
    const r = await page.evaluate(({ fn, n, budget }) => {
      const S = window.__game.scene.getScene('Play').constructor.SIM;
      return new Function(`return (${fn})`)()(S, S.LEVELS, n, budget);
    }, { fn: solveLevel.toString(), n, budget });
    results.push(r); print(r);
  }
  console.log('page errors:', errors.length ? errors : 'none');
  await browser.close();
  server.close();
}
const okN = results.filter((r) => r.ok).length;
console.log(`completable: ${okN}/${results.length}` + (okN === results.length ? '' : '  FAILED: ' + results.filter((r) => !r.ok).map((r) => r.level).join(', ')));
if (okN !== results.length) process.exitCode = 1;

function print(r) {
  console.log(`level ${String(r.level).padStart(2)}: ${r.ok ? `OK ${String(r.secs).padStart(5)} s (bot)` : 'NOT SOLVED      '} · trap objects ${r.traps} · trap events on the bot's path ${r.events ?? '-'} · holding right only: ${r.naive} · searched ${r.expanded}`);
}
