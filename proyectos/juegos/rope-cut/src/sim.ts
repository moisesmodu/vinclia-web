/**
 * Rope Cut simulation: pure TypeScript, no Phaser, no physics engine (the same code runs in the game, in the level
 * bot of rope-cut/test-niveles.mjs and in Node). Fixed step of 1/120 s; the scene feeds it real elapsed time.
 *
 * The candy is a Verlet point. Each attached rope is a hard "at most this long" constraint between its anchor and the
 * candy (an exact pendulum, stable at any number of ropes). The rope you see is a separate chain of light Verlet
 * points pinned to the anchor and to the candy; it never pulls the candy, it is only drawn and swiped (cut).
 *
 * World: W × H design pixels, y down. Everything outside a margin around the world loses the candy.
 */

export const W = 720;
export const H = 800;
export const DT = 1 / 120;

export const P = {
  G: 1150,            // gravity (px/s²)
  DAMP: 0.9993,       // velocity kept per step
  CANDY_R: 22,
  STAR_R: 46,         // distance candy-star to collect it
  MOUTH_R: 56,        // distance candy-mouth to be eaten
  BUBBLE_R: 44,       // distance candy-bubble to be caught by it
  BUBBLE_ACC: -330,   // in a bubble: net upward acceleration
  BUBBLE_DAMP: 0.988,
  PUFF_V: 480,        // speed a puff adds at the puffer's mouth (px/s)
  PUFF_RANGE: 400,
  PUFF_COOL: 0.3,
  SPIKE_R: 10,        // half thickness of a spike bar
  HOOK_R: 95,         // default reach of an auto-rope peg
  SEG: 22,            // chain segment length (visual rope)
  CHAIN_G: 1150,
  CHAIN_DAMP: 0.985,
  OUT: 90,            // margin outside the world before the candy is lost
};

export type V = [number, number];
/** Ping-pong motion between the base point and `to` (smooth, period in seconds). */
export type Mover = { to: V; period: number; phase?: number };
export type RopeDef = { a: V; len?: number; move?: Mover };
export type Level = {
  candy: V;
  ropes: RopeDef[];
  monster: V;               // centre of the monster's mouth
  stars: V[];               // always 3
  bubbles?: V[];
  puffers?: { p: V; dir: number }[];   // dir in degrees (0 = right, 90 = down)
  spikes?: { a: V; b: V; move?: Mover }[];
  hooks?: { p: V; r?: number; move?: Mover }[];
  winds?: { x: number; y: number; w: number; h: number; fx: number; fy: number }[];
};

export type Rope = {
  def: number;              // index in L.ropes, or -1 - hookIndex for an auto-rope
  len: number;
  on: boolean;              // attached to the candy (pulls it)
  cutAt: number;            // chain segment removed by the cut (-1 = whole)
  pinEnd: boolean;          // last chain point follows the candy
  n: number;                // chain segments
  x: number[]; y: number[]; ox: number[]; oy: number[];
};

export type State = {
  t: number;
  x: number; y: number; px: number; py: number;
  dead: '' | 'out' | 'spike';
  won: boolean;
  stars: number;            // bit mask of collected stars
  bubble: number;           // index of the bubble carrying the candy, -1 none
  bubbles: number[];        // 0 free, 1 carrying, 2 popped
  hooks: number[];          // 0 free, 1 used
  ropes: Rope[];
  puffCool: number[];
  visual: boolean;
  ev: string[];
};

export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

/** Position of a (possibly moving) point at time t. */
export function moverPos(p: V, m: Mover | undefined, t: number): V {
  if (!m) return p;
  const u = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / m.period + (m.phase || 0)));
  return [p[0] + (m.to[0] - p[0]) * u, p[1] + (m.to[1] - p[1]) * u];
}

export function anchorOf(L: Level, r: Rope, t: number): V {
  if (r.def >= 0) { const d = L.ropes[r.def]; return moverPos(d.a, d.move, t); }
  const h = L.hooks![-1 - r.def];
  return moverPos(h.p, h.move, t);
}

export function hookPos(L: Level, i: number, t: number): V { const h = L.hooks![i]; return moverPos(h.p, h.move, t); }
export function spikeEnds(L: Level, i: number, t: number): [V, V] {
  const s = L.spikes![i];
  if (!s.move) return [s.a, s.b];
  const a = moverPos(s.a, s.move, t), dx = a[0] - s.a[0], dy = a[1] - s.a[1];
  return [a, [s.b[0] + dx, s.b[1] + dy]];
}

function makeRope(def: number, ax: number, ay: number, cx: number, cy: number, len: number, visual: boolean): Rope {
  const n = visual ? Math.max(4, Math.min(34, Math.round(len / P.SEG))) : 0;
  const r: Rope = { def, len, on: true, cutAt: -1, pinEnd: true, n, x: [], y: [], ox: [], oy: [] };
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // a slack rope starts with a little sag so it does not look like a stiff stick
    const sag = Math.sin(u * Math.PI) * Math.max(0, len - dist(ax, ay, cx, cy)) * 0.45;
    const x = ax + (cx - ax) * u, y = ay + (cy - ay) * u + sag;
    r.x.push(x); r.y.push(y); r.ox.push(x); r.oy.push(y);
  }
  return r;
}

export function init(L: Level, visual = true): State {
  const [cx, cy] = L.candy;
  const s: State = {
    t: 0, x: cx, y: cy, px: cx, py: cy, dead: '', won: false, stars: 0, bubble: -1,
    bubbles: (L.bubbles || []).map(() => 0), hooks: (L.hooks || []).map(() => 0), ropes: [],
    puffCool: (L.puffers || []).map(() => 0), visual, ev: [],
  };
  L.ropes.forEach((d, i) => {
    const a = moverPos(d.a, d.move, 0);
    const len = d.len ?? dist(a[0], a[1], cx, cy);
    s.ropes.push(makeRope(i, a[0], a[1], cx, cy, len, visual));
  });
  return s;
}

function segDist(px: number, py: number, a: V, b: V) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let u = l2 ? ((px - a[0]) * dx + (py - a[1]) * dy) / l2 : 0;
  u = Math.max(0, Math.min(1, u));
  return Math.hypot(px - (a[0] + dx * u), py - (a[1] + dy * u));
}

/** One fixed step. Events (for sound and effects) go to s.ev; the caller clears them. */
export function step(L: Level, s: State) {
  if (s.dead || s.won) { if (s.visual) chains(L, s); s.t += DT; return; }
  s.t += DT;
  const t = s.t;
  let ax = 0, ay = P.G, damp = P.DAMP;
  if (s.bubble >= 0) { ay = P.BUBBLE_ACC; damp = P.BUBBLE_DAMP; }
  if (L.winds) for (const w of L.winds) {
    if (s.x > w.x && s.x < w.x + w.w && s.y > w.y && s.y < w.y + w.h) { ax += w.fx; ay += w.fy; }
  }
  const vx = (s.x - s.px) * damp, vy = (s.y - s.py) * damp;
  s.px = s.x; s.py = s.y;
  s.x += vx + ax * DT * DT;
  s.y += vy + ay * DT * DT;

  // rope constraints: the candy can never be further from an anchor than the rope is long
  for (let it = 0; it < 6; it++) {
    let moved = false;
    for (const r of s.ropes) {
      if (!r.on) continue;
      const [qx, qy] = anchorOf(L, r, t);
      const d = dist(s.x, s.y, qx, qy);
      if (d > r.len) {
        const k = r.len / d;
        s.x = qx + (s.x - qx) * k; s.y = qy + (s.y - qy) * k;
        moved = true;
      }
    }
    if (!moved) break;
  }

  // auto-ropes: a free peg grabs the candy when it comes within reach
  if (L.hooks) L.hooks.forEach((h, i) => {
    if (s.hooks[i]) return;
    const [hx, hy] = hookPos(L, i, t);
    const r = h.r ?? P.HOOK_R;
    if (dist(s.x, s.y, hx, hy) < r) {
      s.hooks[i] = 1;
      s.ropes.push(makeRope(-1 - i, hx, hy, s.x, s.y, r, s.visual));
      s.ev.push('hook');
    }
  });

  // bubbles
  if (s.bubble < 0 && L.bubbles) L.bubbles.forEach((b, i) => {
    if (s.bubble >= 0 || s.bubbles[i]) return;
    if (dist(s.x, s.y, b[0], b[1]) < P.BUBBLE_R) {
      s.bubble = i; s.bubbles[i] = 1; s.ev.push('bubble');
      // the bubble catches the candy: most of its speed is lost
      s.px = s.x - (s.x - s.px) * 0.35; s.py = s.y - (s.y - s.py) * 0.35;
    }
  });

  // stars
  L.stars.forEach((st, i) => {
    if (s.stars & (1 << i)) return;
    if (dist(s.x, s.y, st[0], st[1]) < P.STAR_R) { s.stars |= 1 << i; s.ev.push(`star${i}`); }
  });

  // spikes
  if (L.spikes) for (let i = 0; i < L.spikes.length; i++) {
    const [a, b] = spikeEnds(L, i, t);
    if (segDist(s.x, s.y, a, b) < P.CANDY_R + P.SPIKE_R) { s.dead = 'spike'; s.ev.push('spike'); break; }
  }

  // eaten?
  if (!s.dead && dist(s.x, s.y, L.monster[0], L.monster[1]) < P.MOUTH_R) { s.won = true; s.ev.push('eat'); }

  // lost? (only when no rope holds it: a swing may go past the edge and come back)
  if (!s.dead && !s.won && !s.ropes.some((r) => r.on) && (s.x < -P.OUT || s.x > W + P.OUT || s.y > H + P.OUT || s.y < -P.OUT * 2)) { s.dead = 'out'; s.ev.push('out'); }

  for (let i = 0; i < s.puffCool.length; i++) if (s.puffCool[i] > 0) s.puffCool[i] -= DT;
  if (s.dead || s.won) { for (const r of s.ropes) r.on = false; if (s.bubble >= 0) { s.bubbles[s.bubble] = 2; s.bubble = -1; } }
  if (s.visual) chains(L, s);
}

/** Visual ropes: light Verlet chains pinned to the anchor (and to the candy while it is there). */
function chains(L: Level, s: State) {
  const g = P.CHAIN_G * DT * DT;
  for (const r of s.ropes) {
    const n = r.n;
    if (!n) continue;
    for (let i = 1; i <= n; i++) {
      const vx = (r.x[i] - r.ox[i]) * P.CHAIN_DAMP, vy = (r.y[i] - r.oy[i]) * P.CHAIN_DAMP;
      r.ox[i] = r.x[i]; r.oy[i] = r.y[i];
      r.x[i] += vx; r.y[i] += vy + g;
    }
    const [qx, qy] = anchorOf(L, r, s.t);
    const rest = r.len / n;
    const endPinned = r.pinEnd && !s.dead;
    for (let it = 0; it < 10; it++) {
      r.x[0] = qx; r.y[0] = qy;
      if (endPinned) { r.x[n] = s.x; r.y[n] = s.y; }
      for (let i = 0; i < n; i++) {
        if (i === r.cutAt) continue;
        const dx = r.x[i + 1] - r.x[i], dy = r.y[i + 1] - r.y[i];
        const d = Math.hypot(dx, dy) || 0.0001;
        const diff = (d - rest) / d;
        const wa = i === 0 ? 0 : 0.5, wb = i + 1 === n && endPinned ? 0 : 0.5;
        const sum = wa + wb;
        if (!sum) continue;
        r.x[i] += dx * diff * (wa / sum); r.y[i] += dy * diff * (wa / sum);
        r.x[i + 1] -= dx * diff * (wb / sum); r.y[i + 1] -= dy * diff * (wb / sum);
      }
    }
    r.x[0] = qx; r.y[0] = qy;
    if (endPinned) { r.x[n] = s.x; r.y[n] = s.y; }
  }
}

/* ------------------------------------------------------------------ player actions */

/** Cut rope i (at chain segment seg, for the drawing). Returns true if it was attached. */
export function cut(s: State, i: number, seg = -1) {
  const r = s.ropes[i];
  if (!r || !r.on || s.dead || s.won) return false;
  r.on = false;
  r.cutAt = seg >= 0 ? seg : Math.floor(r.n / 2);
  s.ev.push('cut');
  return true;
}

/** Pop the bubble carrying the candy. */
export function pop(s: State) {
  if (s.bubble < 0 || s.dead || s.won) return false;
  s.bubbles[s.bubble] = 2;
  s.bubble = -1;
  s.ev.push('pop');
  return true;
}

/** Blow puffer j: pushes the candy if it is in front of it (a cone that widens with distance). */
export function puff(L: Level, s: State, j: number) {
  if (s.dead || s.won || s.puffCool[j] > 0) return false;
  s.puffCool[j] = P.PUFF_COOL;
  s.ev.push(`puff${j}`);
  const pf = L.puffers![j];
  const a = (pf.dir * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
  const rx = s.x - pf.p[0], ry = s.y - pf.p[1];
  const along = rx * dx + ry * dy, perp = Math.abs(rx * dy - ry * dx);
  if (along > 0 && along < P.PUFF_RANGE && perp < 60 + along * 0.35) {
    const v = P.PUFF_V * (1 - (along / P.PUFF_RANGE) * 0.55);
    s.px -= dx * v * DT; s.py -= dy * v * DT;
  }
  return true;
}

/** Ropes whose chain crosses the swipe segment (world coordinates): [rope index, chain segment]. */
export function swipeHits(s: State, x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const out: [number, number][] = [];
  s.ropes.forEach((r, i) => {
    if (!r.on) return;
    for (let k = 0; k < r.n; k++) {
      if (segX(x0, y0, x1, y1, r.x[k], r.y[k], r.x[k + 1], r.y[k + 1])) { out.push([i, k]); return; }
    }
  });
  return out;
}

function segX(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(d) < 1e-9) return false;
  const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
  const v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}

export const starCount = (s: State) => (s.stars & 1) + ((s.stars >> 1) & 1) + ((s.stars >> 2) & 1);
