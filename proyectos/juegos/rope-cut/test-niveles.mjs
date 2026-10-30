// Proves every Rope Cut level can be won with all 3 stars, with the real simulation (src/sim.ts, the same code the
// game runs). Two independent checks per level:
//   1. replay: the designer's line (SOLUTIONS in src/levels.ts) is played from scratch and must feed the monster with 3 stars;
//   2. bot: a best-first search over timed actions every 1/20 s (wait, cut any attached rope, pop the bubble, blow
//      any puffer) that knows nothing about the designer's line must also find a 3-star win.
// It also reports whether doing nothing or cutting everything at once wins (it should not, except level 1).
// Usage (from proyectos/juegos):
//   GAME=rope-cut node scripts/build.mjs web && PORT=5802 node rope-cut/test-niveles.mjs [level]   (in the built game)
//   NODE=1 node rope-cut/test-niveles.mjs [level]                                                  (in Node, via esbuild)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const only = process.argv[2] ? [+process.argv[2]] : null;

/** Replay + search for one level. Self-contained (it is also sent to the browser as text). */
function checkLevel(SIM, n, budget) {
  const L = SIM.LEVELS[n - 1];
  const apply = (s, a) => {
    if (a[0] === 'c') return SIM.cut(s, +a.slice(1));
    if (a === 'p') return SIM.pop(s);
    if (a[0] === 'f') return SIM.puff(L, s, +a.slice(1));
    return false;
  };
  const play = (script, maxT = 15) => {
    const s = SIM.init(L, false), acts = [...script].sort((a, b) => a[0] - b[0]);
    let k = 0;
    while (s.t < maxT && !s.dead && !s.won) {
      while (k < acts.length && acts[k][0] <= s.t + 1e-9) apply(s, acts[k++][1]);
      SIM.step(L, s); s.ev.length = 0;
    }
    return s;
  };
  const rep = play(SIM.SOLUTIONS[n - 1]);
  const wait = play([]), all = play(L.ropes.map((_, i) => [0, `c${i}`]));
  const tag = (s) => (s.won ? `win${SIM.starCount(s)}` : s.dead || 'stuck');

  // ---- search bot
  const K = 6; // steps per decision (1/20 s)
  const key = (s) => [Math.round(s.x / 3), Math.round(s.y / 3), Math.round((s.x - s.px) * 8), Math.round((s.y - s.py) * 8),
    s.ropes.map((r) => (r.on ? 1 : 0)).join(''), s.bubbles.join(''), s.hooks.join(''), s.stars, s.puffCool.map((c) => (c > 0 ? 1 : 0)).join(''),
    // time step: a resting candy (in a bubble, at the end of a swing) must not look like an older state
    Math.round(s.t * 20)].join(',');
  const targets = (s) => {
    const left = L.stars.filter((_, i) => !(s.stars & (1 << i)));
    return left.length ? left : [L.monster];
  };
  const h = (s) => {
    const left = 3 - SIM.starCount(s);
    const d = Math.min(...targets(s).map((p) => Math.hypot(p[0] - s.x, p[1] - s.y)));
    return left * 1.2 + d / 260;
  };
  const heap = [];
  const push = (e) => { heap.push(e); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p].f <= e.f) break; heap[i] = heap[p]; i = p; } heap[i] = e; };
  const popH = () => { const top = heap[0], e = heap.pop(); if (heap.length) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= heap.length) break; if (c + 1 < heap.length && heap[c + 1].f < heap[c].f) c++; if (heap[c].f >= e.f) break; heap[i] = heap[c]; i = c; } heap[i] = e; } return top; };
  const s0 = SIM.init(L, false);
  const seen = new Set([key(s0)]);
  push({ s: s0, f: h(s0), g: 0, path: null });
  let found = null, expanded = 0, wins = 0;
  while (heap.length && expanded < budget && !found) {
    const node = popH(); expanded++;
    const acts = ['-'];
    node.s.ropes.forEach((r, i) => { if (r.on) acts.push(`c${i}`); });
    if (node.s.bubble >= 0) acts.push('p');
    node.s.puffCool.forEach((c, j) => { if (c <= 0) acts.push(`f${j}`); });
    for (const a of acts) {
      const s = structuredClone(node.s);
      if (a !== '-') apply(s, a);
      for (let i = 0; i < K && !s.dead && !s.won; i++) { SIM.step(L, s); s.ev.length = 0; }
      if (s.dead || s.t > 15) continue;
      const path = a === '-' ? node.path : { t: +node.s.t.toFixed(4), a, prev: node.path };
      if (s.won) { wins++; if (SIM.starCount(s) === 3) { found = path; break; } continue; }
      const k = key(s);
      if (seen.has(k)) continue;
      seen.add(k);
      const g = node.g + (a === '-' ? 0 : 0.25) + 0.02;
      push({ s, g, f: g + h(s) * 3, path });
    }
  }
  let bot = null;
  if (found) {
    const script = []; for (let p = found; p; p = p.prev) script.unshift([p.t, p.a]);
    const s = play(script);   // replay the bot's line from scratch
    bot = { ok: s.won && SIM.starCount(s) === 3, actions: script.length, secs: +s.t.toFixed(2), script };
  }
  return {
    level: n, replay: rep.won && SIM.starCount(rep) === 3, replaySecs: +rep.t.toFixed(2), replayStars: SIM.starCount(rep),
    bot, expanded, wait: tag(wait), cutAll: tag(all), lowerWins: wins,
  };
}

let results = [];
const budget = +(process.env.BUDGET || 250000);
if (process.env.NODE) {
  const esbuild = createRequire(import.meta.url)('esbuild');
  const outfile = join(process.env.TMPDIR || tmpdir(), `rope-sim-${process.pid}.mjs`);
  await esbuild.build({ stdin: { contents: `export * from './src/sim.ts'; export { LEVELS, SOLUTIONS } from './src/levels.ts';`, resolveDir: here, loader: 'ts' }, bundle: true, format: 'esm', outfile, logLevel: 'error' });
  const SIM = await import(pathToFileURL(outfile).href);
  for (const n of only || SIM.LEVELS.map((_, i) => i + 1)) { const r = checkLevel(SIM, n, budget); results.push(r); print(r); }
} else {
  const { chromium } = createRequire(import.meta.url)(createRequire(import.meta.url).resolve('playwright', { paths: [process.env.NODE_PATH || '', '/opt/node-tools/node_modules'] }));
  const port = +(process.env.PORT || 5802);
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
  await page.goto(`http://localhost:${port}/rope-cut/`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Menu'), null, { timeout: 30000 });
  const count = await page.evaluate(() => window.__game.scene.getScene('Play').constructor.SIM.LEVELS.length);
  for (const n of only || Array.from({ length: count }, (_, i) => i + 1)) {
    const r = await page.evaluate(({ fn, n, budget }) => {
      const S = window.__game.scene.getScene('Play').constructor.SIM;
      return new Function(`return (${fn})`)()(S, n, budget);
    }, { fn: checkLevel.toString(), n, budget });
    results.push(r); print(r);
  }
  console.log('page errors:', errors.length ? errors : 'none');
  await browser.close();
  server.close();
}
const rep = results.filter((r) => r.replay).length, bot = results.filter((r) => r.bot?.ok).length;
console.log(`3 stars with the designer's line: ${rep}/${results.length} · 3 stars found by the search bot: ${bot}/${results.length}`);
const failed = results.filter((r) => !r.replay || !r.bot?.ok).map((r) => r.level);
if (failed.length) { console.log('FAILED:', failed.join(', ')); process.exitCode = 1; }

function print(r) {
  const b = r.bot ? `${r.bot.ok ? 'OK' : 'BAD'} ${r.bot.actions} actions, ${r.bot.secs} s` : 'not found';
  console.log(`level ${String(r.level).padStart(2)}: replay ${r.replay ? 'OK' : 'FAIL'} (${r.replayStars}★ ${r.replaySecs} s) · bot ${b} · searched ${r.expanded} · do nothing: ${r.wait} · cut all at once: ${r.cutAll}`);
}
