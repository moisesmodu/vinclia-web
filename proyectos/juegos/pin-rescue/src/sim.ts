/**
 * Pin Rescue simulation: pure TypeScript, no Phaser (the same code runs in the game, in pin-rescue/test-niveles.mjs and
 * in Node). A falling-sand cellular automaton on a GW × GH grid of typed arrays, fixed step of 1/120 s; the scene feeds
 * it real elapsed time and draws the grid into one small texture.
 *
 * Materials: water, lava, sand, gold, stone (granular), plus static walls, wooden crates and pins.
 *  - granular (sand, gold, stone) falls straight or diagonally and sinks through liquids;
 *  - liquids (water fast, lava slow) fall and spread sideways;
 *  - lava + water → stone (the water boils away); lava + sand → stone (the sand is used up); lava melts gold and
 *    burns crates.
 * Entities are boxes of cells that fall as one piece: the jelly hero, grumpy slimes, bombs and gems.
 *  - gold and gems that reach the hero are collected; lava touching the hero, a slime touching the hero, a bomb going
 *    off next to the hero, melting too much gold or running out of pins without a win lose the level;
 *  - live slimes gobble any gold that touches them; slimes drown in water and burn in lava; bombs explode when lava touches them (they break crates);
 *  - win: every slime gone and at least half the gold collected (stars for 70 % and 85 % + every gem).
 * Levels are ASCII maps of COLS × ROWS blocks (BS × BS cells each). Everything is deterministic (seeded generator).
 */

export const BS = 5;             // cells per map block
export const COLS = 24, ROWS = 32;
export const GW = COLS * BS, GH = ROWS * BS;
export const CELL = 4;           // world px per cell
export const W = GW * CELL, H = GH * CELL;   // 480 × 640 world px
export const DT = 1 / 120;

export const E = 0, WALL = 1, CRATE = 2, PIN = 3, ENT = 4, WATER = 5, LAVA = 6, SAND = 7, GOLD = 8, STONE = 9;

export const P = {
  PIN_SPEED: 2,      // pin cells retracted per step (along its length)
  WATER_SPREAD: 4,   // max sideways cells per step
  LAVA_EVERY: 1,     // lava spreads sideways once every N steps
  LAVA_SPREAD: 2,    // ... by up to this many cells
  ABSORB: 10,        // hero collects gold within this many cells of its box (two blocks)
  DROWN: 0.4,        // fraction of the ring under water that drowns a slime
  DROWN_T: 0.45,     // seconds under water to drown
  BOOM_R: 24,        // bomb blast radius (cells)
  NEED: 0.5,         // gold fraction to win
  STAR2: 0.7,
  STAR3: 0.85,       // plus every gem
  SETTLE: 1.0,       // seconds without new gold before a win is called
  STUCK: 2.5,        // seconds after the last pin before "no pins left" fails
};

export type Kind = 'hero' | 'slime' | 'bomb' | 'gem';
export type Ent = { kind: Kind; x: number; y: number; w: number; h: number; alive: boolean; drown: number; moved: number; vy: number };
export type PinDef = { x: number; y: number; w: number; h: number; dir: 'l' | 'r' | 'u' | 'd' };
export type PinS = PinDef & { pulled: boolean; done: boolean; out: number; at: number };
export type Level = { map: string[]; dirs: string; sol: [number, number][]; note?: string };
export type Parsed = {
  pins: PinDef[]; ents: Omit<Ent, 'alive' | 'drown' | 'moved' | 'vy'>[]; g: Uint8Array;
  walls: Uint8Array;                                  // wall blocks (1 per map block)
  ramps: { x: number; y: number; left: boolean }[];   // blocks with a 45° ramp (wall on the left or right side)
};

export type State = {
  g: Uint8Array;     // cell type
  sh: Uint8Array;    // per-cell shade 0..3 (colour variation, travels with the cell)
  mv: Uint8Array;    // step stamp: moved this step
  wake: Uint8Array;  // per row: steps left to look at it (rows where nothing changed go to sleep)
  dirty: boolean;    // something changed since the scene last drew the grid
  n: number; t: number; rng: number;
  ents: Ent[]; pins: PinS[];
  goldTotal: number; gold: number; collected: number; melted: number;
  gemsTotal: number; gems: number;
  lastPull: number; lastCollect: number; lastGem: number;
  won: boolean; dead: '' | 'lava' | 'slime' | 'boom' | 'gold' | 'stuck';
  ev: string[];
  fx: { k: string; x: number; y: number }[];   // positions (cells) for effects, capped per step
};

const isLiquid = (t: number) => t === WATER || t === LAVA;

/* ------------------------------------------------------------------ parsing */

const cache = new Map<Level, Parsed>();

export function parse(L: Level): Parsed {
  const hit = cache.get(L);
  if (hit) return hit;
  const rows = L.map;
  if (rows.length !== ROWS) throw new Error(`map needs ${ROWS} rows, has ${rows.length}`);
  const ch = (x: number, y: number) => (x < 0 || y < 0 || x >= COLS || y >= ROWS ? '#' : rows[y][x] ?? ' ');
  const g = new Uint8Array(GW * GH), walls = new Uint8Array(COLS * ROWS);
  const fill = (bx: number, by: number, t: number) => {
    for (let y = by * BS; y < by * BS + BS; y++) for (let x = bx * BS; x < bx * BS + BS; x++) g[y * GW + x] = t;
  };
  const MAT: Record<string, number> = { '#': WALL, x: CRATE, '~': WATER, '^': LAVA, ':': SAND, '$': GOLD, o: STONE };
  const seen = new Uint8Array(COLS * ROWS);
  const pins: PinDef[] = [], ents: Parsed['ents'] = [];
  const pinIdx: Record<string, number> = {};
  const ramps: Parsed['ramps'] = [];
  for (let by = 0; by < ROWS; by++) {
    if (rows[by].length !== COLS) throw new Error(`row ${by} has ${rows[by].length} columns, needs ${COLS}`);
    for (let bx = 0; bx < COLS; bx++) {
      const c = ch(bx, by);
      if (c === '#') walls[by * COLS + bx] = 1;
      if (MAT[c] !== undefined) { fill(bx, by, MAT[c]); continue; }
      if (c === ' ' || c === '.') continue;
      if (seen[by * COLS + bx]) continue;
      // a region of the same letter: its bounding box (regions are rectangles)
      let x1 = bx, y1 = by;
      while (ch(x1 + 1, by) === c) x1++;
      while (ch(bx, y1 + 1) === c) y1++;
      for (let y = by; y <= y1; y++) for (let x = bx; x <= x1; x++) seen[y * COLS + x] = 1;
      const box = { x: bx * BS, y: by * BS, w: (x1 - bx + 1) * BS, h: (y1 - by + 1) * BS };
      if (c >= '1' && c <= '9') {
        const d = L.dirs[+c - 1] as PinDef['dir'];
        if (!d) throw new Error(`pin ${c} has no direction`);
        pinIdx[c] = pins.length;
        pins.push({ ...box, dir: d });
      } else {
        const kind = ({ H: 'hero', S: 'slime', B: 'bomb', G: 'gem' } as Record<string, Kind>)[c];
        if (!kind) throw new Error(`unknown map character '${c}'`);
        ents.push({ kind, ...box });
      }
    }
  }
  // stair corners become smooth 45° ramps (cell level), so grains slide down instead of piling on every tread
  const isWall = (x: number, y: number) => ch(x, y) === '#';
  const soft = (c: string) => c === ' ' || c === '.' || MAT[c] !== undefined && c !== '#' && c !== 'x';
  for (let by = 0; by < ROWS; by++) for (let bx = 0; bx < COLS; bx++) {
    if (!soft(ch(bx, by)) || !isWall(bx, by + 1) || isWall(bx, by - 1)) continue;
    const left = isWall(bx - 1, by) && !isWall(bx + 1, by), right = isWall(bx + 1, by) && !isWall(bx - 1, by);
    if (!left && !right) continue;
    for (let cy = 0; cy < BS; cy++) for (let cx = 0; cx < BS; cx++) {
      const k = left ? cx : BS - 1 - cx;
      if (cy > k) g[(by * BS + cy) * GW + bx * BS + cx] = WALL;
    }
    ramps.push({ x: bx, y: by, left });
  }
  // pins in digit order (1, 2, 3...)
  const order = Object.keys(pinIdx).sort();
  const sorted = order.map((k) => pins[pinIdx[k]]);
  if (order.some((k, i) => +k !== i + 1)) throw new Error('pins must be numbered 1..n');
  const p: Parsed = { pins: sorted, ents, g, walls, ramps };
  cache.set(L, p);
  return p;
}

/* ------------------------------------------------------------------ state */

export function init(L: Level, seed = 12345): State {
  const pr = parse(L);
  const g = pr.g.slice();
  const sh = new Uint8Array(GW * GH);
  let r = seed >>> 0 || 1;
  for (let i = 0; i < sh.length; i++) { r ^= r << 13; r >>>= 0; r ^= r >>> 17; r ^= r << 5; r >>>= 0; sh[i] = r & 7; }
  const pins: PinS[] = pr.pins.map((p) => ({ ...p, pulled: false, done: false, out: 0, at: -1 }));
  for (const p of pins) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) g[y * GW + x] = PIN;
  const ents: Ent[] = pr.ents.map((e) => ({ ...e, alive: true, drown: 0, moved: 0, vy: 0 }));
  for (const e of ents) for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) g[y * GW + x] = ENT;
  let gold = 0;
  for (let i = 0; i < g.length; i++) if (g[i] === GOLD) gold++;
  const gems = ents.filter((e) => e.kind === 'gem').length;
  return {
    g, sh, mv: new Uint8Array(GW * GH), wake: new Uint8Array(GH).fill(3), dirty: true, n: 0, t: 0, rng: (seed * 2654435761) >>> 0 || 7,
    ents, pins, goldTotal: gold, gold, collected: 0, melted: 0, gemsTotal: gems, gems: 0,
    lastPull: -10, lastCollect: -10, lastGem: -10, won: false, dead: '', ev: [], fx: [],
  };
}

/** Pulls pin i (starts sliding out). Returns false if it was already pulled or the level is over. */
export function pull(s: State, i: number) {
  const p = s.pins[i];
  if (!p || p.pulled || s.won || s.dead) return false;
  p.pulled = true;
  p.at = s.t;
  s.lastPull = s.t;
  s.ev.push(`pull${i}`);
  return true;
}

/** Rows y0..y1 (cells) must be looked at again for a few steps. */
function wakeRows(s: State, y0: number, y1: number) {
  const a = Math.max(0, y0 - 2), b = Math.min(GH - 1, y1 + 2);
  for (let y = a; y <= b; y++) s.wake[y] = 3;
  s.dirty = true;
}

const rnd = (s: State) => { let r = s.rng; r ^= r << 13; r >>>= 0; r ^= r >>> 17; r ^= r << 5; r >>>= 0; s.rng = r; return r; };

function fx(s: State, k: string, x: number, y: number) { if (s.fx.length < 24) s.fx.push({ k, x, y }); }

/* ------------------------------------------------------------------ step */

export function step(L: Level, s: State) {
  void L;
  if (s.won || s.dead) { s.t += DT; s.n++; return; }
  const g = s.g, sh = s.sh, mv = s.mv;
  s.n++;
  s.t += DT;
  const stamp = (s.n & 255) || 1;
  if (stamp === 1) mv.fill(0);

  // 1 · pins slide out
  for (const p of s.pins) {
    if (!p.pulled || p.done) continue;
    const horiz = p.dir === 'l' || p.dir === 'r';
    const len = horiz ? p.w : p.h;
    for (let k = 0; k < P.PIN_SPEED && p.out < len; k++, p.out++) {
      // the far end retreats first: pulling left clears columns from the right
      if (horiz) {
        const x = p.dir === 'l' ? p.x + p.w - 1 - p.out : p.x + p.out;
        for (let y = p.y; y < p.y + p.h; y++) if (g[y * GW + x] === PIN) g[y * GW + x] = E;
      } else {
        const y = p.dir === 'u' ? p.y + p.h - 1 - p.out : p.y + p.out;
        for (let x = p.x; x < p.x + p.w; x++) if (g[y * GW + x] === PIN) g[y * GW + x] = E;
      }
    }
    if (p.out >= len) p.done = true;
    wakeRows(s, p.y, p.y + p.h);
  }

  // 2 · materials, bottom row first; the x direction alternates every step
  const ltr = (s.n & 1) === 0;
  // lava spreads every LAVA_EVERY steps, alternating scan directions (left-to-right and right-to-left)
  const lavaSide = Math.floor(s.n / 2) % P.LAVA_EVERY === 0;
  let hiss = 0, melt = 0;
  const wake = s.wake;
  let changes = 0;
  for (let y = GH - 1; y >= 0; y--) {
    if (!wake[y]) continue;
    wake[y]--;
    const row = y * GW, before = changes;
    for (let k = 0; k < GW; k++) {
      const x = ltr ? k : GW - 1 - k;
      const i = row + x;
      const t = g[i];
      if (t < WATER || mv[i] === stamp) continue;
      if (t === LAVA) {
        // reactions with the four neighbours
        let gone = false;
        for (let d = 0; d < 4 && !gone; d++) {
          const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
          const j = ny * GW + nx, u = g[j];
          if (u === WATER) { g[i] = STONE; g[j] = E; mv[i] = stamp; gone = true; changes++; if (hiss++ % 7 === 0) fx(s, 'steam', nx, ny); }
          else if (u === SAND) { g[i] = STONE; g[j] = E; mv[i] = stamp; gone = true; changes++; if (hiss++ % 7 === 0) fx(s, 'smoke', nx, ny); }
          else if (u === GOLD) { g[j] = E; s.gold--; s.melted++; changes++; if (melt++ % 4 === 0) fx(s, 'melt', nx, ny); }
          else if (u === CRATE) { g[j] = E; changes++; if (melt++ % 4 === 0) fx(s, 'burn', nx, ny); }
        }
        if (gone) continue;
      }
      if (y === GH - 1) continue;
      const below = i + GW;
      const b = g[below];
      const gran = t >= SAND;
      // sand landing in lava: both turn to stone
      if (t === SAND && b === LAVA) { g[i] = E; g[below] = STONE; mv[i] = mv[below] = stamp; changes++; if (hiss++ % 7 === 0) fx(s, 'smoke', x, y); continue; }
      // straight down
      if (b === E || (gran && isLiquid(b) && mv[below] !== stamp)) { swap(g, sh, i, below); mv[below] = stamp; mv[i] = b === E ? 0 : stamp; changes++; continue; }
      // diagonal down
      // granular picks a random side; liquids keep their own flow direction (bit 2 of the shade byte)
      const first = gran ? (rnd(s) & 1 ? 1 : -1) : (sh[i] & 4 ? 1 : -1);
      let moved = false;
      for (let q = 0; q < 2 && !moved; q++) {
        const dx = q === 0 ? first : -first, nx = x + dx;
        if (nx < 0 || nx >= GW) continue;
        const j = below + dx, u = g[j];
        if (t === SAND && u === LAVA) { g[i] = E; g[j] = STONE; mv[i] = mv[j] = stamp; moved = true; changes++; break; }
        if (u === E || (gran && isLiquid(u) && mv[j] !== stamp)) {
          // do not squeeze through a diagonal gap between two solids
          if (g[i + dx] !== E && g[i + dx] < WATER) continue;
          swap(g, sh, i, j); mv[j] = stamp; if (u !== E) mv[i] = stamp; moved = true; changes++;
        }
      }
      if (moved || gran) continue;
      // liquids spread sideways
      if (t === LAVA && !lavaSide) continue;
      const reach = t === WATER ? P.WATER_SPREAD : P.LAVA_SPREAD;
      for (let q = 0; q < 2; q++) {
        const dx = q === 0 ? first : -first;
        if (q === 1) sh[i] ^= 4;   // blocked: turn around
        let best = -1;
        for (let r = 1; r <= reach; r++) {
          const nx = x + dx * r;
          if (nx < 0 || nx >= GW || g[row + nx] !== E) break;
          best = row + nx;
          if (g[best + GW] === E) break; // stop over a hole: it falls next step
        }
        if (best >= 0) { swap(g, sh, i, best); mv[best] = stamp; changes++; break; }
      }
    }
    if (changes !== before) {
      for (let k = Math.max(0, y - 2); k <= Math.min(GH - 1, y + 2); k++) wake[k] = 3;
    }
  }
  if (changes) s.dirty = true;
  if (hiss) s.ev.push('hiss');
  if (melt) s.ev.push('melt');

  // 3 · entities fall as one piece (lowest first)
  const ents = s.ents;
  const order = ents.map((_, k) => k).sort((a, b) => ents[b].y + ents[b].h - (ents[a].y + ents[a].h));
  for (const k of order) {
    const e = ents[k];
    if (!e.alive) continue;
    e.vy = Math.min(1, e.vy + 0.08);   // up to one cell per step, after a short ramp
    let steps = 0;
    for (e.moved += e.vy; e.moved >= 1; e.moved--) {
      if (!fall(s, e)) { e.vy = 0; e.moved = 0; break; }
      steps++;
    }
    // resting on an edge or a ramp: tumble off it (one cell sideways every other step, towards the free side)
    if (!steps && (s.n & 1) && tumble(s, e)) { steps++; e.vy = 0.5; }
    if (steps && e.kind === 'gem') s.lastGem = s.t;
  }

  // 4 · contacts
  const hero = ents.find((e) => e.kind === 'hero')!;
  for (const e of ents) {
    if (!e.alive) continue;
    const c = ring(s, e, 1);
    if (e.kind === 'hero') {
      if (c.lava) { s.dead = 'lava'; s.ev.push('lose'); }
    } else if (e.kind === 'slime') {
      if (c.lava) { kill(s, e); s.ev.push(`burn${ents.indexOf(e)}`); continue; }
      if (c.water >= c.size * P.DROWN) {
        e.drown += DT;
        if (e.drown >= P.DROWN_T) { kill(s, e); s.ev.push(`drown${ents.indexOf(e)}`); continue; }
      } else e.drown = Math.max(0, e.drown - DT);
      if (c.gold) eat(s, e);
      if (hero.alive && gap(e, hero) <= 1) { s.dead = 'slime'; s.ev.push('lose'); }
    } else if (e.kind === 'bomb') {
      if (c.lava) boom(s, e);
    } else if (e.kind === 'gem') {
      if (c.lava) { kill(s, e); s.ev.push('gemlost'); fx(s, 'melt', e.x + e.w / 2, e.y + e.h / 2); }
      else if (hero.alive && gap(e, hero) <= P.ABSORB) { kill(s, e); s.gems++; s.lastCollect = s.t; s.ev.push('gem'); fx(s, 'gem', e.x + e.w / 2, e.y + e.h / 2); }
    }
  }
  // hero collects nearby gold
  if (!s.dead) {
    const R = P.ABSORB;
    const x0 = Math.max(0, hero.x - R), x1 = Math.min(GW - 1, hero.x + hero.w - 1 + R);
    const y0 = Math.max(0, hero.y - R), y1 = Math.min(GH - 1, hero.y + hero.h - 1 + R);
    let got = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * GW + x;
      if (g[i] === GOLD) { g[i] = E; got++; if (got % 6 === 1) fx(s, 'coin', x, y); }
    }
    if (got) { wakeRows(s, y0, y1); s.collected += got; s.gold -= got; s.lastCollect = s.t; s.ev.push('collect'); }
  }

  // 5 · win / lose
  if (s.dead) return;
  const need = Math.ceil(s.goldTotal * P.NEED);
  if (s.collected + s.gold < need) { s.dead = 'gold'; s.ev.push('lose'); return; }
  const slimes = ents.some((e) => e.kind === 'slime' && e.alive);
  if (!slimes && s.collected >= need && (s.gold === 0 || s.t - s.lastCollect > P.SETTLE) && s.t - s.lastGem > 0.4) {
    s.won = true; s.ev.push('win'); return;
  }
  if (s.pins.every((p) => p.done) && s.t - s.lastPull > P.STUCK && s.t - s.lastCollect > P.SETTLE && s.t - s.lastGem > 0.6) { s.dead = 'stuck'; s.ev.push('lose'); }
}

function swap(g: Uint8Array, sh: Uint8Array, a: number, b: number) {
  const t = g[a]; g[a] = g[b]; g[b] = t;
  const u = sh[a]; sh[a] = sh[b]; sh[b] = u;
}

/** Moves an entity one cell down if every cell under it is empty or liquid (the liquid goes to its top row). */
function fall(s: State, e: Ent) {
  const g = s.g, yb = e.y + e.h;
  if (yb >= GH) return false;
  for (let x = e.x; x < e.x + e.w; x++) { const u = g[yb * GW + x]; if (u !== E && !isLiquid(u)) return false; }
  for (let x = e.x; x < e.x + e.w; x++) {
    const j = yb * GW + x;
    g[e.y * GW + x] = g[j];
    s.sh[e.y * GW + x] = s.sh[j];
    g[j] = ENT;
  }
  e.y++;
  wakeRows(s, e.y - 1, e.y + e.h);
  return true;
}

const free = (u: number) => u === E || isLiquid(u);

/** An entity held only by the cells under one side of it shifts one cell to the other side (stairs, pile edges). */
function tumble(s: State, e: Ent) {
  const g = s.g, yb = e.y + e.h;
  if (yb >= GH) return false;
  let n = 0, sum = 0;
  for (let x = e.x; x < e.x + e.w; x++) if (!free(g[yb * GW + x])) { n++; sum += x; }
  if (!n || n === e.w) return false;
  const c = sum / n - (e.x + (e.w - 1) / 2);   // where it is held, relative to its centre
  const dx = c > 0.25 ? -1 : c < -0.25 ? 1 : 0;
  if (!dx) return false;
  const col = dx < 0 ? e.x - 1 : e.x + e.w;
  if (col < 0 || col >= GW) return false;
  for (let y = e.y; y < e.y + e.h; y++) if (!free(g[y * GW + col])) return false;
  // move: the column it enters swaps with the column it leaves
  const back = dx < 0 ? e.x + e.w - 1 : e.x;
  for (let y = e.y; y < e.y + e.h; y++) {
    g[y * GW + back] = g[y * GW + col]; s.sh[y * GW + back] = s.sh[y * GW + col];
    g[y * GW + col] = ENT;
  }
  e.x += dx;
  wakeRows(s, e.y, e.y + e.h);
  return true;
}

/** Counts lava and water in the ring of cells `d` around an entity. */
function ring(s: State, e: Ent, d: number) {
  let lava = 0, water = 0, gold = 0, size = 0;
  const g = s.g;
  for (let y = e.y - d; y < e.y + e.h + d; y++) {
    if (y < 0 || y >= GH) continue;
    const inner = y >= e.y && y < e.y + e.h;
    for (let x = e.x - d; x < e.x + e.w + d; x++) {
      if (x < 0 || x >= GW) continue;
      if (inner && x >= e.x && x < e.x + e.w) { x = e.x + e.w - 1; continue; }
      size++;
      const u = g[y * GW + x];
      if (u === LAVA) lava++; else if (u === WATER) water++; else if (u === GOLD) gold++;
    }
  }
  return { lava, water, gold, size };
}

/** Empty cells between two boxes (0 = touching). */
function gap(a: Ent, b: Ent) {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), 0);
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h), 0);
  return Math.max(dx, dy);
}

/** A live slime gobbles every gold cell touching it (the gold is lost). */
function eat(s: State, e: Ent) {
  const g = s.g;
  let n = 0;
  for (let y = Math.max(0, e.y - 1); y < Math.min(GH, e.y + e.h + 1); y++) {
    for (let x = Math.max(0, e.x - 1); x < Math.min(GW, e.x + e.w + 1); x++) {
      const i = y * GW + x;
      if (g[i] === GOLD) { g[i] = E; n++; }
    }
  }
  if (n) { wakeRows(s, e.y - 1, e.y + e.h + 1); s.gold -= n; s.melted += n; s.ev.push(`eat${s.ents.indexOf(e)}`); if (s.n % 8 === 0) fx(s, 'eat', e.x + e.w / 2, e.y); }
}

function kill(s: State, e: Ent) {
  e.alive = false;
  wakeRows(s, e.y, e.y + e.h);
  for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) if (s.g[y * GW + x] === ENT) s.g[y * GW + x] = E;
}

function boom(s: State, b: Ent) {
  kill(s, b);
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = P.BOOM_R, g = s.g;
  s.ev.push(`boom${s.ents.indexOf(b)}`);
  wakeRows(s, Math.floor(cy - R), Math.ceil(cy + R));
  fx(s, 'boom', cx, cy);
  for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(GH, cy + R); y++) {
    for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(GW, cx + R); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > R * R) continue;
      const i = y * GW + x, u = g[i];
      if (u === WALL || u === PIN || u === ENT || u === GOLD) continue;   // gold is tough
      g[i] = E;
    }
  }
  for (const e of s.ents) {
    if (!e.alive) continue;
    const nx = Math.max(e.x, Math.min(cx, e.x + e.w)), ny = Math.max(e.y, Math.min(cy, e.y + e.h));
    if ((nx - cx) ** 2 + (ny - cy) ** 2 > R * R) continue;
    if (e.kind === 'hero') { s.dead = 'boom'; s.ev.push('lose'); }
    else if (e.kind === 'bomb') boom(s, e);
    else if (e.kind === 'slime') { kill(s, e); s.ev.push(`burn${s.ents.indexOf(e)}`); }
    // gems shrug off blasts (only lava destroys them)
  }
}

/* ------------------------------------------------------------------ scoring */

/** Stars lit right now (live HUD) and at the end: half the gold = 1, 70 % = 2, 85 % with every gem = 3. */
export function starCount(s: State) {
  const f = s.goldTotal ? s.collected / s.goldTotal : 1;
  if (f < P.NEED - 1e-9) return 0;
  return 1 + (f >= P.STAR2 ? 1 : 0) + (f >= P.STAR3 && s.gems === s.gemsTotal ? 1 : 0);
}

export const slimesLeft = (s: State) => s.ents.filter((e) => e.kind === 'slime' && e.alive).length;

/** Plays a script [seconds, pin] from scratch until the level ends (or maxT). Used by the tests and the autopilot. */
export function run(L: Level, script: [number, number][], maxT = 20) {
  const s = init(L);
  const acts = [...script].sort((a, b) => a[0] - b[0]);
  let k = 0;
  while (s.t < maxT && !s.dead && !s.won) {
    while (k < acts.length && acts[k][0] <= s.t + 1e-9) pull(s, acts[k++][1]);
    step(L, s);
    s.ev.length = 0; s.fx.length = 0;
  }
  return s;
}
