/**
 * Penalty Season: pure logic (no Phaser). The game and the Node tests (test-logica.mjs) run this same code.
 *  - Shot model: swipe → shot (aim, height, curve, flight time) → outcome against a keeper with reaction/speed/reach.
 *  - Save model: opponent shot + the player's dive (tap position and time) → outcome.
 *  - League: 6 teams, double round robin (10 matchdays), table with tiebreaks, season end, 3 divisions.
 *  - Squad: 5 shooters (power, accuracy) + 1 keeper (reflexes), upgrades paid with coins, team morale.
 *
 * Goal coordinates: x from -1 (left post) to 1 (right post), y from 0 (ground) to BAR (crossbar).
 */

export const BAR = 0.67;
export const BALL_R = 0.06;
export const KICKS = 5;
export const ROUNDS = 10;
export const MAX_LEVEL = 10;
export const START_LEVEL = 3;

/* ------------------------------------------------------------------ random */
export type Rng = () => number;
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gauss(rng: Rng) {
  const u = Math.max(1e-9, rng()), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ teams */
export const SPECIES = ['fox', 'bear', 'cat', 'rabbit', 'frog', 'panda', 'pig', 'lion', 'koala', 'dog', 'mouse', 'owl', 'penguin', 'tiger', 'raccoon', 'cow'] as const;
export type Species = typeof SPECIES[number];
export type Team = { id: number; species: Species; c1: number; c2: number; rating: number };

/** id 0 = the player's club (colours come from the equipped kit). 1-5 division 1, 6-10 division 2, 11-15 division 3. */
export const TEAMS: Team[] = [
  { id: 0, species: 'fox', c1: 0xff8a3d, c2: 0xffffff, rating: 0 },
  { id: 1, species: 'frog', c1: 0x3ddc84, c2: 0xffd23f, rating: 1.0 },
  { id: 2, species: 'pig', c1: 0xff8fc8, c2: 0x6b4fd8, rating: 1.25 },
  { id: 3, species: 'mouse', c1: 0x9aa4b8, c2: 0xff5d5d, rating: 1.5 },
  { id: 4, species: 'cow', c1: 0xffffff, c2: 0x2b2340, rating: 1.75 },
  { id: 5, species: 'penguin', c1: 0x2f86d9, c2: 0xffffff, rating: 2.0 },
  { id: 6, species: 'koala', c1: 0x7a8a9e, c2: 0x3ddc84, rating: 2.2 },
  { id: 7, species: 'owl', c1: 0x8b5a2b, c2: 0xffd23f, rating: 2.45 },
  { id: 8, species: 'dog', c1: 0xff5d5d, c2: 0xffffff, rating: 2.7 },
  { id: 9, species: 'rabbit', c1: 0x9b6bff, c2: 0xffffff, rating: 2.95 },
  { id: 10, species: 'raccoon', c1: 0x2b2340, c2: 0x4aa8ff, rating: 3.2 },
  { id: 11, species: 'panda', c1: 0x1e1e2a, c2: 0xff5d5d, rating: 3.4 },
  { id: 12, species: 'cat', c1: 0xffd23f, c2: 0x2b2340, rating: 3.7 },
  { id: 13, species: 'bear', c1: 0x22b267, c2: 0xffffff, rating: 4.0 },
  { id: 14, species: 'tiger', c1: 0xff6a00, c2: 0x1e1e2a, rating: 4.3 },
  { id: 15, species: 'lion', c1: 0xffc23f, c2: 0xb3261e, rating: 4.6 },
];
export const DIVISIONS = 3;
export function divisionTeams(div: number): number[] { return [0, 1, 2, 3, 4, 5].map((i) => (i === 0 ? 0 : div * 5 + i)); }
/** Opponent strength grows a little each time the top division is won again. */
export function teamRating(id: number, titles = 0) { return TEAMS[id].rating + (id >= 11 ? Math.min(1, titles * 0.15) : 0); }

/* ------------------------------------------------------------------ squad */
export const SHOOTERS: Species[] = ['fox', 'rabbit', 'cat', 'dog', 'raccoon'];
export const KEEPER: Species = 'bear';
export type Squad = { pow: number[]; acc: number[]; ref: number };
export function newSquad(): Squad { return { pow: SHOOTERS.map(() => START_LEVEL), acc: SHOOTERS.map(() => START_LEVEL), ref: START_LEVEL }; }
export function upgradeCost(level: number) { return 10 + 10 * level; }
export type Stat = 'pow' | 'acc' | 'ref';
export function statLevel(sq: Squad, stat: Stat, i = 0) { return stat === 'ref' ? sq.ref : sq[stat][i]; }
/** Upgrade a stat by one level if affordable. Returns the new squad and coins (inputs are not modified). */
export function upgrade(sq: Squad, coins: number, stat: Stat, i = 0): { ok: boolean; squad: Squad; coins: number } {
  const lv = statLevel(sq, stat, i);
  const cost = upgradeCost(lv);
  if (lv >= MAX_LEVEL || coins < cost) return { ok: false, squad: sq, coins };
  const n: Squad = { pow: [...sq.pow], acc: [...sq.acc], ref: sq.ref };
  if (stat === 'ref') n.ref++; else n[stat][i]++;
  return { ok: true, squad: n, coins: coins - cost };
}

/** Morale 20..100. A regulation win lifts it most, a regulation loss drops it most. */
export function moraleAfter(m: number, won: boolean, sd: boolean) {
  return clamp(m + (won ? (sd ? 8 : 12) : (sd ? -6 : -10)), 20, 100);
}
/** -0.6 (low) .. 1 (top): small effect on aim and dive reach. */
export const moraleFactor = (m: number) => (m - 50) / 50;

/* ------------------------------------------------------------------ shot model */
export type Pt = { x: number; y: number; t: number };
/** What the swipe says, before stats and randomness. */
export type ShotInput = { aimX: number; s: number; bulge: number };

/**
 * Swipe (screen points, y down, t in seconds) → shot input. unit = reference length in pixels (min(w, h) * 0.5).
 * Direction from the chord (start → end), power (s) from the swipe speed, curve (bulge) from how far the path bows
 * away from the chord. Returns null if the swipe is not a forward flick.
 */
export function swipeToShot(pts: Pt[], unit: number): ShotInput | null {
  if (pts.length < 2) return null;
  const a = pts[0], b = pts[pts.length - 1];
  const dx = (b.x - a.x) / unit, dy = (b.y - a.y) / unit;
  if (dy > -0.12) return null; // must go up the screen (toward the goal)
  const len = Math.hypot(dx, dy);
  // power = flick speed: the fastest 0.12 s of the swipe (a pause before the flick or before lifting does not count)
  let speed = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = i + 1; j < pts.length && pts[j].t - pts[i].t <= 0.12; j++) {
      const v = Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y) / unit / Math.max(0.03, pts[j].t - pts[i].t);
      if (v > speed) speed = v;
    }
  }
  if (speed === 0) speed = len / Math.max(0.03, b.t - a.t);
  const s = clamp((speed - 0.8) / 7.5, 0, 1.3);
  const aimX = clamp((dx / -dy) * 1.5, -1.7, 1.7);
  // signed largest deviation from the chord (positive = path bows to the right)
  let dev = 0;
  for (const p of pts) {
    const px = (p.x - a.x) / unit, py = (p.y - a.y) / unit;
    const cross = (px * dy - py * dx) / len; // <0: right of the chord when going up
    if (Math.abs(cross) > Math.abs(dev)) dev = cross;
  }
  const bulge = clamp((-dev / len) * 3.2, -1, 1);
  return { aimX, s, bulge: Math.abs(bulge) < 0.08 ? 0 : bulge };
}

/** Final shot in goal coordinates. tx/ty: where it crosses the goal line; bulge: sideways bow of the path; T: flight time (s). */
export type Shot = { tx: number; ty: number; bulge: number; T: number };

/** Applies the shooter's stats and morale: accuracy = scatter, power = pace and how hard you can hit before it flies over. */
export function resolveShot(inp: ShotInput, pow: number, acc: number, morale: number, rng: Rng): Shot {
  const mf = moraleFactor(morale);
  const sigma = (0.17 - acc * 0.013) * (1 - 0.15 * mf);
  const s1 = Math.min(1, inp.s);
  const ty = 0.03 + inp.s * 0.62 * (1.12 - 0.025 * pow) + gauss(rng) * sigma * 0.5;
  const tx = inp.aimX + gauss(rng) * sigma;
  const T = lerp(1.0, 0.4, s1) * (1.1 - 0.03 * pow);
  return { tx, ty: Math.max(0.02, ty), bulge: inp.bulge * 0.3, T };
}

/** Where the ball is (goal coordinates, p = 0 at the spot .. 1 on the goal line). The bow peaks halfway. */
export function ballAt(sh: Shot, p: number) {
  return { x: sh.tx * p + sh.bulge * 4 * p * (1 - p), y: sh.ty * p };
}

export type Keeper = { reaction: number; speed: number; reach: number; guess: number; noise: number };
/** Opponent keeper from the team rating (1..5+). */
export function keeperAI(rating: number): Keeper {
  return { reaction: 0.3 - 0.02 * rating, speed: 1.45 + 0.14 * rating, reach: 0.2 + 0.012 * rating, guess: 0.3 - 0.03 * rating, noise: 0.4 - 0.04 * rating };
}
/** The player's keeper from the reflexes level (1..10) and morale. */
export function playerKeeper(ref: number, morale: number): Keeper {
  return { reaction: 0.05, speed: 1.55 + 0.11 * ref, reach: 0.19 + 0.01 * ref + 0.02 * moraleFactor(morale), guess: 0, noise: 0 };
}

/** A dive: the keeper stays at (fromX, fromY) until startT, then moves toward (toX, toY) at speed. */
export type Dive = { startT: number; fromX: number; fromY: number; toX: number; toY: number; speed: number; reach: number };
export const KEEPER_Y = 0.24;
export function keeperAt(d: Dive, t: number) {
  const dx = d.toX - d.fromX, dy = d.toY - d.fromY, L = Math.hypot(dx, dy);
  const m = L < 1e-6 ? 0 : Math.min(L, Math.max(0, t - d.startT) * d.speed) / L;
  return { x: d.fromX + dx * m, y: d.fromY + dy * m };
}
const diveTarget = (x: number, y: number) => ({ toX: clamp(x, -1.05, 1.05), toY: clamp(y, 0.12, 0.58) });

/** The opponent keeper reads the shot: either guesses a side at the kick or reacts to the first part of the flight. */
export function planKeeper(sh: Shot, k: Keeper, kx0: number, rng: Rng): Dive & { guessed: boolean } {
  const base = { fromX: kx0, fromY: KEEPER_Y, speed: k.speed, reach: k.reach };
  if (rng() < k.guess) {
    const side = rng() < 0.5 ? -1 : 1;
    return { ...base, startT: 0, ...diveTarget(side * (0.55 + rng() * 0.35), 0.2 + rng() * 0.3), guessed: true };
  }
  // reads the early heading (the bow fools it) plus some error; slow balls are read better
  const early = ballAt(sh, 0.5);
  const px = early.x / 0.5 * 0.6 + sh.tx * 0.4 + gauss(rng) * k.noise * Math.min(1, 0.6 / sh.T);
  return { ...base, startT: k.reaction, ...diveTarget(px, sh.ty + gauss(rng) * k.noise * 0.4), guessed: false };
}

export type Outcome = 'goal' | 'save' | 'post' | 'wide' | 'over';
/** Result of a shot against a dive (null = keeper stays still in the centre). */
export function shotOutcome(sh: Shot, d: Dive | null): Outcome {
  const { x, y } = ballAt(sh, 1);
  const ax = Math.abs(x);
  if (y > BAR + BALL_R) return 'over';
  if (ax > 1 + BALL_R) return 'wide';
  if (ax > 1 - BALL_R || y > BAR - BALL_R) return 'post';
  if (d) {
    const kp = keeperAt(d, sh.T);
    const ex = (x - kp.x) / d.reach, ey = (y - kp.y) / (d.reach * 1.3);
    if (ex * ex + ey * ey < 1) return 'save';
  }
  return 'goal';
}
export const isGoal = (o: Outcome) => o === 'goal';

/** Pre-kick sway of the opponent keeper (shoot when he leans the other way). */
export function keeperSway(t: number, rating: number) { return Math.sin(t * (1.4 + rating * 0.12)) * 0.22; }

/* ------------------------------------------------------------------ opponent shooter (when the player saves) */
export type OppShot = Shot & { tell: number; kickAt: number };
/**
 * The opponent picks a corner. tell = the side his run-up and glance point to (-1/1): usually the true side, sometimes
 * a bluff (more often in higher divisions). kickAt = run-up time before the kick (s).
 */
export function aiShot(rating: number, rng: Rng): OppShot {
  const side = rng() < 0.5 ? -1 : 1;
  const centre = rng() < 0.12;
  const sigma = 0.2 - 0.025 * rating;
  const tx = centre ? gauss(rng) * 0.15 : side * (0.35 + rng() * 0.55) + gauss(rng) * sigma;
  const ty = 0.06 + rng() * 0.5 + gauss(rng) * sigma * 0.4;
  const truth = rng() < 0.9 - 0.07 * rating;
  const tell = centre ? side : truth ? Math.sign(tx) || side : -(Math.sign(tx) || side);
  return { tx, ty: Math.max(0.03, ty), bulge: (rng() - 0.5) * 0.12, T: 0.6 - 0.035 * rating, tell, kickAt: 1.15 };
}
/** The player dove early (dt seconds before the kick): the shooter may change side. */
export function adaptShot(sh: OppShot, diveX: number, earlyBy: number, rng: Rng): OppShot {
  if (earlyBy < 0.18 || Math.sign(diveX) !== Math.sign(sh.tx) || Math.abs(diveX) < 0.2) return sh;
  if (rng() < Math.min(0.75, 0.3 + earlyBy * 0.6)) return { ...sh, tx: -sh.tx * 0.9 };
  return sh;
}
/** The player's dive: tapped at goal point (gx, gy) at time t (seconds after the kick; negative = before). */
export function playerDive(gx: number, gy: number, t: number, k: Keeper): Dive {
  return { startT: Math.max(0, t) + k.reaction, fromX: 0, fromY: KEEPER_Y, ...diveTarget(gx, gy), speed: k.speed, reach: k.reach };
}

/* ------------------------------------------------------------------ shootout */
export type State = 'ongoing' | 'won' | 'lost';
/** Five kicks each (the player shoots first), stops early when it is decided, then sudden death in pairs. */
export function shootoutState(mine: boolean[], theirs: boolean[], n = KICKS): State {
  const gm = mine.filter(Boolean).length, gt = theirs.filter(Boolean).length;
  if (Math.max(mine.length, theirs.length) <= n) {
    const remM = n - mine.length, remT = n - theirs.length;
    if (gm > gt + remT) return 'won';
    if (gt > gm + remM) return 'lost';
    return 'ongoing';
  }
  if (mine.length === theirs.length && gm !== gt) return gm > gt ? 'won' : 'lost';
  return 'ongoing';
}

/** AI vs AI shootout (the other matches of each matchday). */
export function simShootout(rA: number, rB: number, rng: Rng): { a: number; b: number; sd: boolean } {
  const p = (s: number, k: number) => clamp(0.74 + 0.05 * (s - k), 0.55, 0.9);
  const A: boolean[] = [], B: boolean[] = [];
  for (let i = 0; i < 60; i++) {
    A.push(rng() < p(rA, rB));
    if (shootoutState(A, B) !== 'ongoing') break;
    B.push(rng() < p(rB, rA));
    if (shootoutState(A, B) !== 'ongoing') break;
  }
  if (shootoutState(A, B) === 'ongoing') A.push(true); // safety (never in practice)
  return { a: A.filter(Boolean).length, b: B.filter(Boolean).length, sd: A.length > KICKS };
}

/* ------------------------------------------------------------------ league */
export type Result = { round: number; home: number; away: number; hg: number; ag: number; sd: boolean };
export type Season = { div: number; num: number; seed: number; round: number; teams: number[]; results: Result[] };
export type Row = { id: number; p: number; w: number; l: number; gf: number; ga: number; pts: number };

/** Win in five kicks 3, win in sudden death 2, loss in sudden death 1, loss in five kicks 0. */
export function points(gf: number, ga: number, sd: boolean) { return gf > ga ? (sd ? 2 : 3) : sd ? 1 : 0; }

/** Double round robin (circle method): 10 matchdays of 3 matches for 6 teams. */
export function schedule(teams: number[]): [number, number][][] {
  const n = teams.length, rounds: [number, number][][] = [];
  const arr = [...teams];
  for (let r = 0; r < n - 1; r++) {
    const ms: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      ms.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(ms);
    arr.splice(1, 0, arr.pop()!); // rotate all but the first
  }
  return [...rounds, ...rounds.map((ms) => ms.map(([a, b]) => [b, a] as [number, number]))];
}

export function newSeason(div: number, num: number, seed: number): Season {
  return { div, num, seed, round: 0, teams: divisionTeams(div), results: [] };
}
export function opponentOf(se: Season, round = se.round): { opp: number; home: boolean } {
  const m = schedule(se.teams)[round].find(([a, b]) => a === 0 || b === 0)!;
  return m[0] === 0 ? { opp: m[1], home: true } : { opp: m[0], home: false };
}

export function table(teams: number[], results: Result[]): Row[] {
  const rows = new Map<number, Row>(teams.map((id) => [id, { id, p: 0, w: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
  for (const r of results) {
    const h = rows.get(r.home), a = rows.get(r.away);
    if (!h || !a) continue;
    h.p++; a.p++;
    h.gf += r.hg; h.ga += r.ag; a.gf += r.ag; a.ga += r.hg;
    if (r.hg > r.ag) { h.w++; a.l++; } else { a.w++; h.l++; }
    h.pts += points(r.hg, r.ag, r.sd); a.pts += points(r.ag, r.hg, r.sd);
  }
  const primary = (x: Row, y: Row) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || y.w - x.w;
  const list = [...rows.values()].sort((x, y) => primary(x, y) || x.id - y.id);
  // still level: head-to-head mini table between the tied teams, then the fixed team order
  const out: Row[] = [];
  for (let i = 0; i < list.length;) {
    let j = i + 1;
    while (j < list.length && primary(list[i], list[j]) === 0) j++;
    const grp = list.slice(i, j);
    if (grp.length > 1) {
      const ids = new Set(grp.map((g) => g.id));
      const mini = new Map(grp.map((g) => [g.id, { pts: 0, gd: 0 }]));
      for (const r of results) {
        if (!ids.has(r.home) || !ids.has(r.away)) continue;
        mini.get(r.home)!.pts += points(r.hg, r.ag, r.sd); mini.get(r.away)!.pts += points(r.ag, r.hg, r.sd);
        mini.get(r.home)!.gd += r.hg - r.ag; mini.get(r.away)!.gd += r.ag - r.hg;
      }
      grp.sort((x, y) => mini.get(y.id)!.pts - mini.get(x.id)!.pts || mini.get(y.id)!.gd - mini.get(x.id)!.gd || x.id - y.id);
    }
    out.push(...grp);
    i = j;
  }
  return out;
}
export const rankOf = (rows: Row[], id = 0) => rows.findIndex((r) => r.id === id) + 1;

/** Records the player's match of the current matchday and simulates the other two. */
export function playRound(se: Season, my: { gf: number; ga: number; sd: boolean }, titles = 0): Season {
  if (se.round >= ROUNDS) return se;
  const rng = mulberry32(se.seed * 31 + se.round * 977 + 7);
  const results = [...se.results];
  for (const [h, a] of schedule(se.teams)[se.round]) {
    if (h === 0) results.push({ round: se.round, home: h, away: a, hg: my.gf, ag: my.ga, sd: my.sd });
    else if (a === 0) results.push({ round: se.round, home: h, away: a, hg: my.ga, ag: my.gf, sd: my.sd });
    else {
      const r = simShootout(teamRating(h, titles), teamRating(a, titles), rng);
      results.push({ round: se.round, home: h, away: a, hg: r.a, ag: r.b, sd: r.sd });
    }
  }
  return { ...se, round: se.round + 1, results };
}
export const seasonOver = (se: Season) => se.round >= ROUNDS;

export type SeasonEnd = { rank: number; promoted: boolean; champion: boolean; coins: number; div: number };
export function seasonEnd(se: Season): SeasonEnd {
  const rank = rankOf(table(se.teams, se.results));
  const coins = Math.round([120, 70, 45, 30, 20, 10][rank - 1] * (1 + se.div * 0.5));
  return { rank, promoted: rank === 1 && se.div < DIVISIONS - 1, champion: rank === 1 && se.div === DIVISIONS - 1, coins, div: se.div };
}
/** Next season: promoted if first (up to the top division); otherwise the same division again. */
export function nextSeason(se: Season, seed: number): Season {
  const e = seasonEnd(se);
  return newSeason(e.promoted ? se.div + 1 : se.div, se.num + 1, seed);
}

/** Coins for a match. */
export function matchCoins(r: { won: boolean; gf: number; saves: number; div: number }) {
  return Math.round(((r.won ? 25 : 10) + r.gf * 3 + r.saves * 4) * (1 + r.div * 0.5));
}
