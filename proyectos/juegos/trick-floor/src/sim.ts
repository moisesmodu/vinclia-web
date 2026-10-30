import type { Level } from './levels';

/**
 * Trick Floor simulation: tile platformer physics and traps, with no Phaser inside. Fixed steps of 1/120 s,
 * deterministic, plain-data state (structuredClone works): the scene draws it and trick-floor/test-niveles.mjs
 * searches it to prove every level can be finished.
 */

export const T = 48; // tile size in world pixels
export const P = {
  DT: 1 / 120,
  G: 2600, MAXF: 1100,
  RUN: 290, ACC: 3400, DEC: 4200, AIR: 2400,
  JUMP: 820, CUT: 0.45, SPRING: 1320,
  COYOTE: 0.09, BUFFER: 0.12,
  HW: 15, HH: 19,                     // player half size
  DROP_DELAY: 0.22,                   // D: after standing on it
  FALL_DELAY: 0.04,                   // F: after getting close
  CRUSH_DELAY: 0.05, CRUSH_G: 4200, CRUSH_MAX: 1400,
  POP_TIME: 0.07,
  FLY: 560,
  DOOR_NEAR: 2.4, DOOR_MOVE: 0.35,
};

export type Kind = 'D' | 'F' | 'C' | 'X' | '!';
export type Group = { kind: Kind; cells: [number, number][]; down?: boolean };
export type Flyer = { c: number; r: number; dir: 1 | -1 };
export type Door = { x: number; y: number; flip: boolean };

export type Parsed = {
  w: number; h: number; rows: string[]; par: number;
  start: { x: number; y: number };
  doors: Door[];
  groups: Group[];
  flyers: Flyer[];
  spikes: { c: number; r: number; down: boolean }[];
  springs: { c: number; r: number }[];
  zone: Uint8Array;  // 1 = gravity up, 2 = gravity down
  solid0: Uint8Array;
};

export type GroupState = { st: number; t: number; oy: number; vy: number };
export type FlyState = { st: number; x: number };
export type State = {
  x: number; y: number; vx: number; vy: number; g: 1 | -1;
  grounded: boolean; coyote: number; buffer: number; held: boolean; cut: boolean; face: 1 | -1;
  dead: string; won: boolean; t: number;
  solid: Uint8Array;
  grp: GroupState[];
  fly: FlyState[];
  door: { i: number; mt: number };
  ev: string[];
};
export type Input = { l: boolean; r: boolean; j: boolean };

const SOLID_CH = '#DFC<>';

export function parse(L: Level): Parsed {
  const h = L.rows.length, w = Math.max(...L.rows.map((r) => r.length));
  const rows = L.rows.map((r) => r.padEnd(w, '.'));
  const at = (c: number, r: number) => (c < 0 || c >= w ? '#' : r < 0 || r >= h ? '.' : rows[r][c]);
  const solid0 = new Uint8Array(w * h);
  const zone = new Uint8Array(w * h);
  let start = { x: T * 1.5, y: T * 9 };
  const doorAt: Record<string, Door> = {};
  const spikes: Parsed['spikes'] = [], springs: Parsed['springs'] = [], flyers: Flyer[] = [];
  const groups: Group[] = [];
  const seen = new Uint8Array(w * h);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const ch = rows[r][c];
    if (SOLID_CH.includes(ch)) solid0[r * w + c] = 1;
    const feetY = (r + 1) * T;
    if (ch === 'S') start = { x: c * T + T / 2, y: feetY - P.HH };
    if ('Eabc'.includes(ch)) {
      const flip = SOLID_CH.includes(at(c, r - 1)) && !SOLID_CH.includes(at(c, r + 1));
      doorAt[ch] = { x: c * T + T / 2, y: flip ? r * T : feetY, flip };
    }
    if (ch === '^') spikes.push({ c, r, down: false });
    if (ch === 'v') spikes.push({ c, r, down: true });
    if (ch === 'J') springs.push({ c, r });
    if (ch === 'g') zone[r * w + c] = 1;
    if (ch === 'n') zone[r * w + c] = 2;
    if (ch === '<' || ch === '>') flyers.push({ c, r, dir: ch === '<' ? -1 : 1 });
    if ('DFCX!'.includes(ch) && !seen[r * w + c]) {
      // contiguous cells of the same code act together
      const cells: [number, number][] = [];
      const stack: [number, number][] = [[c, r]];
      seen[r * w + c] = 1;
      while (stack.length) {
        const [cc, rr] = stack.pop()!;
        cells.push([cc, rr]);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = cc + dc, nr = rr + dr;
          if (nc >= 0 && nc < w && nr >= 0 && nr < h && !seen[nr * w + nc] && rows[nr][nc] === ch) { seen[nr * w + nc] = 1; stack.push([nc, nr]); }
        }
      }
      const g: Group = { kind: ch as Kind, cells };
      if (ch === '!') g.down = !SOLID_CH.includes(at(c, r + 1)) && SOLID_CH.includes(at(c, r - 1));
      groups.push(g);
    }
  }
  const doors = ['a', 'b', 'c', 'E'].filter((k) => doorAt[k]).map((k) => doorAt[k]);
  return { w, h, rows, par: L.par, start, doors, groups, flyers, spikes, springs, zone, solid0 };
}

export function init(L: Parsed): State {
  return {
    x: L.start.x, y: L.start.y, vx: 0, vy: 0, g: 1,
    grounded: true, coyote: 0, buffer: 0, held: false, cut: true, face: 1,
    dead: '', won: false, t: 0,
    solid: L.solid0.slice(),
    grp: L.groups.map(() => ({ st: 0, t: 0, oy: 0, vy: 0 })),
    fly: L.flyers.map((f) => ({ st: 0, x: f.c * T + T / 2 })),
    door: { i: 0, mt: 1 },
    ev: [],
  };
}

const solidAt = (L: Parsed, s: State, c: number, r: number) => (c < 0 || c >= L.w ? true : r < 0 || r >= L.h ? false : s.solid[r * L.w + c] === 1);

function hits(L: Parsed, s: State, x: number, y: number) {
  const c0 = Math.floor((x - P.HW) / T), c1 = Math.floor((x + P.HW - 0.001) / T);
  const r0 = Math.floor((y - P.HH) / T), r1 = Math.floor((y + P.HH - 0.001) / T);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solidAt(L, s, c, r)) return true;
  return false;
}

const overlap = (ax: number, ay: number, ahw: number, ahh: number, bx: number, by: number, bhw: number, bhh: number) =>
  Math.abs(ax - bx) < ahw + bhw && Math.abs(ay - by) < ahh + bhh;

/** Door position now (it slides between its places with an ease). */
export function doorPos(L: Parsed, s: State) {
  const d = L.doors[s.door.i];
  if (s.door.mt >= 1 || s.door.i === 0) return { x: d.x, y: d.y, flip: d.flip, moving: false };
  const p = L.doors[s.door.i - 1], k = s.door.mt, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const hop = Math.sin(k * Math.PI) * T * 1.2;
  return { x: p.x + (d.x - p.x) * e, y: p.y + (d.y - p.y) * e - hop, flip: k > 0.5 ? d.flip : p.flip, moving: true };
}

/** One fixed step. Events for sounds and effects are pushed to s.ev (the caller clears them). */
export function step(L: Parsed, s: State, inp: Input) {
  if (s.dead || s.won) return;
  const dt = P.DT;
  s.t += dt;

  // --- run
  const dir = (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
  if (dir) s.face = dir as 1 | -1;
  const target = dir * P.RUN;
  const acc = s.grounded ? (dir ? P.ACC : P.DEC) : P.AIR;
  if (s.vx < target) s.vx = Math.min(target, s.vx + acc * dt);
  else if (s.vx > target) s.vx = Math.max(target, s.vx - acc * dt);

  // --- jump: buffer, coyote time, variable height
  if (inp.j && !s.held) s.buffer = P.BUFFER;
  s.held = inp.j;
  if (s.buffer > 0 && s.coyote > 0) {
    s.vy = -P.JUMP * s.g; s.buffer = 0; s.coyote = 0; s.grounded = false; s.cut = false;
    s.ev.push('jump');
  }
  if (!inp.j && !s.cut && s.vy * s.g < -P.JUMP * P.CUT) { s.vy = -P.JUMP * P.CUT * s.g; s.cut = true; }
  s.buffer -= dt; s.coyote -= dt;
  s.vy += P.G * s.g * dt;
  if (Math.abs(s.vy) > P.MAXF) s.vy = Math.sign(s.vy) * P.MAXF;

  // --- move and collide, one axis at a time
  const dx = s.vx * dt;
  if (dx) {
    const nx = s.x + dx;
    if (hits(L, s, nx, s.y)) {
      s.x = dx > 0 ? Math.floor((nx + P.HW - 0.001) / T) * T - P.HW : (Math.floor((nx - P.HW) / T) + 1) * T + P.HW;
      if (hits(L, s, s.x, s.y)) s.x = nx - dx; // safety: never push into another block
      s.vx = 0;
    } else s.x = nx;
  }
  const wasGrounded = s.grounded, fallV = s.vy;
  s.grounded = false;
  const dy = s.vy * dt;
  if (dy) {
    const ny = s.y + dy;
    if (hits(L, s, s.x, ny)) {
      s.y = dy > 0 ? Math.floor((ny + P.HH - 0.001) / T) * T - P.HH : (Math.floor((ny - P.HH) / T) + 1) * T + P.HH;
      if (hits(L, s, s.x, s.y)) s.y = ny - dy;
      if (dy * s.g > 0) { s.grounded = true; if (!wasGrounded && Math.abs(fallV) > 500) s.ev.push('land'); }
      else s.ev.push('bonk');
      s.vy = 0;
    } else s.y = ny;
  }
  if (s.grounded) s.coyote = P.COYOTE;

  // --- gravity zones
  const pc = Math.floor(s.x / T), pr = Math.floor(s.y / T);
  if (pc >= 0 && pc < L.w && pr >= 0 && pr < L.h) {
    const z = L.zone[pr * L.w + pc];
    if (z === 1 && s.g === 1) { s.g = -1; s.grounded = false; s.coyote = 0; s.vy *= 0.3; s.ev.push('flip'); }
    if (z === 2 && s.g === -1) { s.g = 1; s.grounded = false; s.coyote = 0; s.vy *= 0.3; s.ev.push('flip'); }
  }

  // --- springs
  for (const sp of L.springs) {
    const cx = sp.c * T + T / 2, cy = (sp.r + 1) * T - 8;
    if (s.vy >= 0 && s.g === 1 && overlap(s.x, s.y, P.HW, P.HH, cx, cy, T / 2 - 8, 8)) {
      s.vy = -P.SPRING; s.cut = true; s.grounded = false; s.coyote = 0; s.ev.push('spring:' + sp.c + ',' + sp.r);
    }
  }

  // --- traps
  const feetRow = Math.floor((s.y + s.g * (P.HH + 1)) / T);
  const c0 = Math.floor((s.x - P.HW) / T), c1 = Math.floor((s.x + P.HW - 0.001) / T);
  L.groups.forEach((g, i) => {
    const gs = s.grp[i];
    if (g.kind === 'D') {
      if (gs.st === 0 && s.grounded && g.cells.some(([c, r]) => r === feetRow && c >= c0 && c <= c1)) { gs.st = 1; gs.t = P.DROP_DELAY; s.ev.push('wobble:' + i); }
      if (gs.st === 1 && (gs.t -= dt) <= 0) drop(L, s, g, gs, i);
    } else if (g.kind === 'F') {
      if (gs.st === 0 && g.cells.some(([c, r]) => Math.abs(s.x - (c * T + T / 2)) < T * 1.2 && Math.abs(s.y - r * T) < T * 3)) { gs.st = 1; gs.t = P.FALL_DELAY; }
      if (gs.st === 1 && (gs.t -= dt) <= 0) drop(L, s, g, gs, i);
    } else if (g.kind === 'C') {
      if (gs.st === 0 && g.cells.some(([c, r]) => Math.abs(s.x - (c * T + T / 2)) < T * 1.3 && s.y > (r + 1) * T && s.y - r * T < T * 9)) {
        gs.st = 1; gs.t = P.CRUSH_DELAY; s.ev.push('trap:' + i);
      }
      if (gs.st === 1 && (gs.t -= dt) <= 0) { gs.st = 2; for (const [c, r] of g.cells) s.solid[r * L.w + c] = 0; }
      if (gs.st === 2) {
        gs.vy = Math.min(P.CRUSH_MAX, gs.vy + P.CRUSH_G * dt);
        let oy = gs.oy + gs.vy * dt;
        let land = -1;
        for (const [c, r] of g.cells) {
          const rb = Math.floor(((r + 1) * T + oy) / T);
          if (solidAt(L, s, c, rb) && !g.cells.some(([c2, r2]) => c2 === c && r2 === rb)) { const k = (rb - r - 1) * T; land = land < 0 ? k : Math.min(land, k); }
        }
        if (land >= 0) oy = land;
        gs.oy = oy;
        for (const [c, r] of g.cells) if (overlap(s.x, s.y, P.HW - 2, P.HH - 2, c * T + T / 2, r * T + T / 2 + oy, T / 2, T / 2)) die(s, 'crush');
        if (land >= 0) {
          gs.st = 3; s.ev.push('thud:' + i);
          for (const [c, r] of g.cells) { const rr = r + Math.round(oy / T); if (rr >= 0 && rr < L.h) s.solid[rr * L.w + c] = 1; }
        } else if (oy > L.h * T) gs.st = 4;
      }
    } else if (g.kind === 'X') {
      if (gs.st === 0 && g.cells.some(([c, r]) => overlap(s.x, s.y, P.HW + 1, P.HH + 2, c * T + T / 2, r * T + T / 2, T / 2, T / 2))) { gs.st = 1; s.ev.push('fake:' + i); }
    } else if (g.kind === '!') {
      if (gs.st === 0 && g.cells.some(([c, r]) => Math.abs(s.x - (c * T + T / 2)) < T * 1.4 && Math.abs(s.y - (r * T + T / 2)) < T * 2)) {
        gs.st = 1; gs.t = P.POP_TIME; s.ev.push('pop:' + i);
      }
      if (gs.st === 1 && (gs.t -= dt) <= 0) gs.st = 2;
      if (gs.st >= 1 && gs.t < P.POP_TIME * 0.6) for (const [c, r] of g.cells) if (spikeHit(s, c, r, !!g.down)) die(s, 'spike');
    }
    if ((g.kind === 'D' || g.kind === 'F') && gs.st === 2) { gs.vy += P.G * dt; gs.oy += gs.vy * dt; if (gs.oy > L.h * T) gs.st = 3; }
  });

  // --- darts
  L.flyers.forEach((f, i) => {
    const fs = s.fly[i], cy = f.r * T + T / 2;
    if (fs.st === 0) {
      const d = (s.x - (f.c * T + T / 2)) * f.dir;
      if (Math.abs(s.y - cy) < T * 0.9 && d > 0 && d < T * 6.5) { fs.st = 1; s.solid[f.r * L.w + f.c] = 0; s.ev.push('dart:' + i); }
    } else if (fs.st === 1) {
      fs.x += f.dir * P.FLY * dt;
      const tip = Math.floor((fs.x + f.dir * 18) / T);
      if (tip !== f.c && solidAt(L, s, tip, f.r)) { fs.st = 2; s.ev.push('dartHit:' + i); }
      if (overlap(s.x, s.y, P.HW - 2, P.HH - 3, fs.x, cy, 18, 8)) die(s, 'dart');
    }
  });

  // --- spikes
  for (const sp of L.spikes) if (spikeHit(s, sp.c, sp.r, sp.down)) die(s, 'spike');

  // --- door: runs away when you get close, opens when you touch it
  if (s.door.mt < 1) s.door.mt = Math.min(1, s.door.mt + dt / P.DOOR_MOVE);
  else {
    const d = L.doors[s.door.i];
    const dcy = d.flip ? d.y + 28 : d.y - 28;
    if (s.door.i < L.doors.length - 1 && Math.abs(s.x - d.x) < T * P.DOOR_NEAR && Math.abs(s.y - dcy) < T * 2) {
      s.door.i++; s.door.mt = 0; s.ev.push('door');
    } else if (!s.dead && overlap(s.x, s.y, P.HW, P.HH, d.x, dcy, 14, 26)) { s.won = true; s.ev.push('win'); }
  }

  // --- out of the castle
  if (s.y > L.h * T + 60 || s.y < -60) die(s, 'fall');
}

function drop(L: Parsed, s: State, g: Group, gs: GroupState, i: number) {
  gs.st = 2; gs.vy = 0; gs.oy = 0;
  for (const [c, r] of g.cells) s.solid[r * L.w + c] = 0;
  s.ev.push('drop:' + i);
}

function spikeHit(s: State, c: number, r: number, down: boolean) {
  const cx = c * T + T / 2, cy = down ? r * T + T * 0.27 : r * T + T * 0.73;
  return overlap(s.x, s.y, P.HW - 3, P.HH - 3, cx, cy, T / 2 - 9, T * 0.22);
}

function die(s: State, why: string) {
  if (s.dead || s.won) return;
  s.dead = why;
  s.ev.push('die');
}
