import { Yard } from './grid';

/**
 * Simulación de Paint Grab (pura: sin Phaser). Pintores que se mueven en continuo sobre la rejilla del patio;
 * fuera de su territorio dejan estela; al volver cierran el lazo y capturan (grid.ts). Tocar la estela de otro lo
 * elimina; tocar la propia, también a uno mismo. Bots con tres caracteres (prudente, glotón y cazador) que mejoran
 * con cada ronda. Play.ts la avanza a paso fijo y dibuja lo que cambia.
 */

export type Kind = 'player' | 'cautious' | 'greedy' | 'hunter';
export type SimEvent =
  | { t: 'capture'; id: number; gained: number }
  | { t: 'kill'; victim: number; killer: number; reason: 'cut' | 'self' | 'head' | 'wiped' }
  | { t: 'respawn'; id: number };

export type Painter = {
  id: number; kind: Kind; isPlayer: boolean;
  x: number; y: number; heading: number; target: number;
  speed: number; turn: number;
  alive: boolean; outside: boolean; cell: number;
  trail: number[];                 // celdas de estela (índices)
  pts: number[];                   // polilínea de la estela: x0, y0, x1, y1... (en celdas)
  respawnT: number; invuln: number; kills: number;
  /** IA: también la usa el piloto automático del jugador en las pruebas. */
  ai: Kind | null;
  mode: 'home' | 'out' | 'back';
  plan: number[]; thinkT: number; hx: number; hy: number; huntId: number;
};

export const GRID = 96;
export const PLAYER_SPEED = 6.2;  // celdas por segundo
export const START_R = 3.2;       // radio del territorio inicial (celdas)

export type RNG = () => number;
/** Generador determinista (mulberry32) para pruebas reproducibles. */
export function rng(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const angDiff = (a: number, b: number) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

/** Ajustes por carácter y ronda (r = 0 en la primera ronda). */
function brain(kind: Kind, r: number) {
  switch (kind) {
    case 'cautious': return { min: 3, max: 6 + r, threat: 6 + r, hunt: 0, maxTrail: 22 + 4 * r };
    case 'hunter': return { min: 4, max: 8 + r, threat: 4 + r * 0.5, hunt: 6 + 2 * r, maxTrail: 28 + 4 * r };
    default: return { min: 6, max: 11 + 2 * r, threat: 3 + r * 0.6, hunt: r >= 2 ? 4 : 0, maxTrail: 40 + 6 * r };
  }
}

export class Sim {
  readonly yard: Yard;
  readonly painters: Painter[] = [];
  readonly events: SimEvent[] = [];
  readonly round: number;
  private rand: RNG;
  private botSpeed: number;
  private botTurn: number;

  constructor(o: { round: number; bots: number; rand?: RNG; w?: number }) {
    const n = o.w ?? GRID;
    this.round = Math.max(1, o.round);
    this.rand = o.rand ?? Math.random;
    this.yard = new Yard(n, n, o.bots + 1);
    const r = this.round - 1;
    this.botSpeed = PLAYER_SPEED * Math.min(1.0, 0.8 + 0.06 * r);
    this.botTurn = 6.5 + 0.6 * r;
    const kinds: Kind[] = ['cautious', 'greedy', 'hunter', 'greedy', 'cautious', 'hunter', 'greedy'];
    // jugador en el centro; bots en un anillo con algo de azar
    this.painters.push(this.make(0, 'player', n / 2, n / 2));
    for (let i = 0; i < o.bots; i++) {
      const a = (i / o.bots) * TAU + this.rand() * 0.5;
      const rad = n * (0.3 + this.rand() * 0.12);
      this.painters.push(this.make(i + 1, kinds[i % kinds.length], n / 2 + Math.cos(a) * rad, n / 2 + Math.sin(a) * rad));
    }
    for (const p of this.painters) this.spawnAt(p, p.x, p.y);
  }

  private make(id: number, kind: Kind, x: number, y: number): Painter {
    const isPlayer = kind === 'player';
    return {
      id, kind, isPlayer, x, y, heading: -Math.PI / 2, target: -Math.PI / 2,
      speed: isPlayer ? PLAYER_SPEED : this.botSpeed, turn: isPlayer ? 9 : this.botTurn,
      alive: true, outside: false, cell: -1, trail: [], pts: [], respawnT: 0, invuln: 0, kills: 0,
      ai: isPlayer ? null : kind, mode: 'home', plan: [], thinkT: 0, hx: x, hy: y, huntId: -1,
    };
  }

  get player() { return this.painters[0]; }

  private spawnAt(p: Painter, x: number, y: number) {
    const cx = Math.floor(x) + 0.5, cy = Math.floor(y) + 0.5;
    const wiped = this.yard.claimDisc(p.id, cx, cy, START_R);
    p.x = cx; p.y = cy; p.hx = cx; p.hy = cy;
    p.cell = this.yard.idx(Math.floor(cx), Math.floor(cy));
    p.alive = true; p.outside = false; p.trail = []; p.pts = []; p.mode = 'home'; p.plan = [];
    if (!p.isPlayer) { p.heading = p.target = this.rand() * TAU; }
    for (const w of wiped) this.kill(this.painters[w], p, 'wiped');
  }

  /** Revivir al jugador: sin estela, en su celda propia más cercana (o un territorio nuevo si no le queda). */
  revivePlayer() {
    const p = this.player, y = this.yard;
    y.clearTrail(p.id, p.trail);
    p.trail = []; p.pts = [];
    const i = y.nearestOwn(p.id, p.x, p.y);
    if (i < 0) this.spawnAt(p, ...this.freeSpot(p));
    else { p.x = (i % y.w) + 0.5; p.y = Math.floor(i / y.w) + 0.5; p.cell = i; }
    p.alive = true; p.outside = false; p.invuln = 2;
  }

  /** Lugar libre lejos del jugador para reaparecer. */
  private freeSpot(p: Painter): [number, number] {
    const n = this.yard.w, pl = this.player;
    let best: [number, number] = [n / 2, n / 2], bs = -Infinity;
    for (let k = 0; k < 28; k++) {
      const x = 4 + Math.floor(this.rand() * (n - 8)), y = 4 + Math.floor(this.rand() * (n - 8));
      let s = this.yard.freeAround(x, y, 3);
      if (p !== pl && Math.hypot(x - pl.x, y - pl.y) < 10) s -= 100;
      if (s > bs) { bs = s; best = [x + 0.5, y + 0.5]; }
    }
    return best;
  }

  /** Dirección que quiere el jugador (radianes). */
  steer(angle: number) { this.player.target = angle; }

  /** Avanza la simulación dt segundos (llamar a paso fijo, 1/60). */
  step(dt: number) {
    for (const p of this.painters) {
      if (!p.alive) {
        if (!p.isPlayer) { p.respawnT -= dt; if (p.respawnT <= 0) { this.spawnAt(p, ...this.freeSpot(p)); this.events.push({ t: 'respawn', id: p.id }); } }
        continue;
      }
      if (p.invuln > 0) p.invuln -= dt;
      if (p.ai) this.think(p, dt);
      // girar hacia la dirección deseada con velocidad de giro limitada (curvas suaves)
      const d = angDiff(p.heading, p.target), mx = p.turn * dt;
      p.heading += Math.abs(d) <= mx ? d : Math.sign(d) * mx;
      this.move(p, dt);
    }
    this.heads();
  }

  private move(p: Painter, dt: number) {
    const y = this.yard, lim = y.w - 0.001;
    const nx = Math.min(lim, Math.max(0.001, p.x + Math.cos(p.heading) * p.speed * dt));
    const ny = Math.min(lim, Math.max(0.001, p.y + Math.sin(p.heading) * p.speed * dt));
    const ox = p.cell % y.w, oy = (p.cell - ox) / y.w;
    const cx = Math.floor(nx), cy = Math.floor(ny);
    p.x = nx; p.y = ny;
    if (cx === ox && cy === oy) return;
    // estela 4-conexa: en diagonal se pasa por una celda intermedia (si no, el relleno se escaparía por la esquina)
    if (cx !== ox && cy !== oy) { this.enter(p, y.idx(cx, oy)); if (!p.alive) return; }
    this.enter(p, y.idx(cx, cy));
  }

  private enter(p: Painter, i: number) {
    const y = this.yard;
    p.cell = i;
    if (y.owner[i] === p.id + 1) {
      if (p.trail.length) {
        const r = y.capture(p.id, p.trail);
        p.trail = []; p.pts = [];
        this.events.push({ t: 'capture', id: p.id, gained: r.gained });
        for (const w of r.wiped) this.kill(this.painters[w], p, 'wiped');
      }
      p.outside = false;
      return;
    }
    const t = y.trail[i];
    if (t === p.id + 1) { this.kill(p, p, 'self'); return; }
    if (t > 0) {
      const v = this.painters[t - 1];
      if (v.invuln > 0) return; // estela protegida un momento tras revivir: no se pisa ni se corta
      this.kill(v, p, 'cut');
    }
    y.trail[i] = p.id + 1;
    p.trail.push(i);
    // polilínea para dibujar: en los bots, los tramos rectos se quedan en un solo segmento (menos que dibujar)
    const n = p.pts.length;
    if (!p.isPlayer && n >= 4) {
      const ax = p.pts[n - 4], ay = p.pts[n - 3], bx = p.x - ax, by = p.y - ay, len = Math.hypot(bx, by);
      const off = len > 0 ? Math.abs((p.pts[n - 2] - ax) * by - (p.pts[n - 1] - ay) * bx) / len : 1;
      if (off < 0.12) { p.pts[n - 2] = p.x; p.pts[n - 1] = p.y; p.outside = true; return; }
    }
    p.pts.push(p.x, p.y);
    p.outside = true;
  }

  /** Choque de cabezas: dentro de tu territorio estás a salvo; fuera, pierde quien lleva la estela más larga. */
  private heads() {
    const ps = this.painters;
    for (let a = 0; a < ps.length; a++) {
      const A = ps[a];
      if (!A.alive) continue;
      for (let b = a + 1; b < ps.length; b++) {
        const B = ps[b];
        if (!B.alive || Math.abs(A.x - B.x) > 0.8 || Math.abs(A.y - B.y) > 0.8 || Math.hypot(A.x - B.x, A.y - B.y) > 0.8) continue;
        if (!A.outside && !B.outside) continue;
        if (!A.outside) this.kill(B, A, 'head');
        else if (!B.outside) this.kill(A, B, 'head');
        else if (A.trail.length > B.trail.length) this.kill(A, B, 'head');
        else if (B.trail.length > A.trail.length) this.kill(B, A, 'head');
        else { this.kill(A, B, 'head'); this.kill(B, A, 'head'); }
      }
    }
  }

  kill(v: Painter, killer: Painter, reason: 'cut' | 'self' | 'head' | 'wiped') {
    if (!v.alive) return;
    if (v.invuln > 0 && reason !== 'self') return;
    v.alive = false;
    this.yard.clearTrail(v.id, v.trail);
    v.trail = []; v.pts = [];
    if (!v.isPlayer) { this.yard.wipe(v.id); v.respawnT = 1.6 + this.rand() * 1.4; }
    if (killer !== v) killer.kills++;
    this.events.push({ t: 'kill', victim: v.id, killer: killer.id, reason });
  }

  /** Puesto de un pintor (1 = más territorio). */
  rank(id: number) {
    const c = this.yard.counts, mine = c[id];
    let r = 1;
    for (let k = 0; k < this.painters.length; k++) if (k !== id && c[k] > mine) r++;
    return r;
  }

  /* ------------------------------------------------------------------ IA */

  private think(p: Painter, dt: number) {
    const b = brain(p.ai!, this.round - 1);
    const y = this.yard;
    p.thinkT -= dt;
    if (!p.outside) {
      if (p.mode !== 'home') { p.mode = 'home'; p.plan = []; }
      if (p.plan.length === 0) {
        // salir hacia fuera del territorio, en una de las 4 direcciones (dibujan rectángulos, como con tiza)
        let a = Math.atan2(p.y - p.hy, p.x - p.hx);
        if (Math.hypot(p.y - p.hy, p.x - p.hx) < 1) a = this.rand() * TAU;
        a += (this.rand() - 0.5) * 2.2;
        a = Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
        p.plan = [a];
        p.target = a;
      }
    } else if (p.mode === 'home') {
      // acaba de salir: plan de lazo rectangular desde aquí
      const a = p.plan[0] ?? p.heading;
      const L1 = b.min + this.rand() * (b.max - b.min), L2 = b.min + this.rand() * (b.max - b.min);
      const side = this.rand() < 0.5 ? 1 : -1;
      const dx = Math.cos(a), dy = Math.sin(a), px = -dy * side, py = dx * side;
      const x1 = p.x + dx * L1, y1 = p.y + dy * L1, x2 = x1 + px * L2, y2 = y1 + py * L2;
      p.plan = [x1, y1, x2, y2, x2 - dx * (L1 + 2), y2 - dy * (L1 + 2)];
      p.mode = 'out';
    }

    if (p.outside) {
      // peligro: alguien cerca o estela demasiado larga = volver a casa
      if (p.mode === 'out' && (p.trail.length > b.maxTrail || this.nearestHead(p) < b.threat)) p.mode = 'back';
      if (p.mode === 'out') {
        while (p.plan.length >= 2 && Math.hypot(p.plan[0] - p.x, p.plan[1] - p.y) < 0.7) p.plan.splice(0, 2);
        if (p.plan.length < 2) p.mode = 'back';
        else p.target = Math.atan2(p.plan[1] - p.y, p.plan[0] - p.x);
      }
      if (p.mode === 'back' && p.thinkT <= 0) {
        const i = y.nearestOwn(p.id, p.x, p.y);
        if (i >= 0) p.target = Math.atan2((Math.floor(i / y.w) + 0.5) - p.y, (i % y.w) + 0.5 - p.x);
      }
    }

    // cazar: ir a por la estela ajena más cercana (con preferencia por la del jugador)
    if (b.hunt > 0 && p.thinkT <= 0 && p.trail.length < 12) {
      let best = -1, bd = b.hunt * b.hunt;
      for (const q of this.painters) {
        if (q === p || !q.alive || q.trail.length === 0 || q.invuln > 0) continue;
        const bonus = q.isPlayer ? 1.6 : 1;
        for (let k = q.trail.length - 1; k >= 0; k -= 2) {
          const i = q.trail[k], tx = (i % y.w) + 0.5, ty = Math.floor(i / y.w) + 0.5;
          const d = ((tx - p.x) ** 2 + (ty - p.y) ** 2) / bonus;
          if (d < bd) { bd = d; best = i; }
        }
      }
      if (best >= 0) p.target = Math.atan2(Math.floor(best / y.w) + 0.5 - p.y, (best % y.w) + 0.5 - p.x);
    }
    if (p.thinkT <= 0) p.thinkT = Math.max(0.08, 0.25 - 0.03 * (this.round - 1));
    this.avoid(p);
  }

  private nearestHead(p: Painter) {
    let d = Infinity;
    for (const q of this.painters) if (q !== p && q.alive) d = Math.min(d, Math.hypot(q.x - p.x, q.y - p.y));
    return d;
  }

  /** Celdas libres en línea recta hacia un ángulo (borde del patio o estela propia = bloqueado). */
  private clear(p: Painter, a: number, n: number) {
    const y = this.yard, own = p.id + 1, dx = Math.cos(a), dy = Math.sin(a);
    for (let k = 1; k <= n; k++) {
      const x = Math.floor(p.x + dx * k * 0.9), yy = Math.floor(p.y + dy * k * 0.9);
      if (!y.inside(x, yy)) return k - 1;
      const i = y.idx(x, yy);
      if (y.trail[i] === own && i !== p.cell) return k - 1;
    }
    return n;
  }

  private avoid(p: Painter) {
    const need = 3;
    if (this.clear(p, p.target, need) >= need && this.clear(p, p.heading, 1) >= 1) return;
    let best = p.target, bs = -1;
    for (const off of [0, 0.5, -0.5, 1.0, -1.0, 1.57, -1.57, 2.2, -2.2, 3.14]) {
      const a = p.target + off;
      const s = this.clear(p, a, 5) * 10 - Math.abs(off);
      if (s > bs) { bs = s; best = a; }
    }
    p.target = best;
  }
}
