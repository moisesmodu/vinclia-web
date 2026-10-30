/**
 * Paper Glide · física del planeo, mejoras y generación del mundo. Módulo PURO (sin Phaser): lo usan la escena
 * de juego y la simulación de progresión en Node (`node --experimental-strip-types paper-glide/sim-progresion.ts`).
 *
 * Unidades: metros y segundos. x = distancia, y = altura sobre el suelo (0 = suelo).
 * Modelo arcade estable (sin oscilación fugoide, que con un solo botón es incontrolable):
 *   el morro (ángulo a) sube mientras se mantiene y baja al soltar, a una velocidad angular fija;
 *   la trayectoria sigue al morro; dv/dt = −g·sen a − D(v), con D(v) = cd·v² + ci/v² (forma + inducida:
 *   hay una velocidad de mejor planeo); por debajo de vStall el ala no sustenta (cae y el morro baja solo).
 * Sustentación ∝ v²: bajo vLift el avión se hunde además en proporción a lo que le falta (1 − v²/vLift²).
 */

export const G = 9.8;
export const UP_IDS = ['wings', 'tail', 'weight', 'launch', 'magnet'] as const;
export type UpId = (typeof UP_IDS)[number];
export type Levels = Record<UpId, number>;
export const MAX_LVL = 10;
/** Precio base por nivel (0 → 1, 1 → 2, ...): sube cada vez más. */
const PRICE = [10, 22, 40, 65, 100, 150, 215, 300, 410, 550];
const PRICE_MUL: Record<UpId, number> = { wings: 1.2, tail: 1, weight: 1.1, launch: 1, magnet: 0.8 };

export function price(id: UpId, lvl: number) {
  return lvl >= MAX_LVL ? Infinity : Math.round(PRICE[lvl] * PRICE_MUL[id]);
}
export function zeroLevels(): Levels { return { wings: 0, tail: 0, weight: 0, launch: 0, magnet: 0 }; }

export interface Stats {
  cd: number; ci: number; vStall: number; vLift: number; turn: number; maxUp: number; maxDown: number;
  v0: number; h0: number; magnet: number; keep: number;
}

/** Lo que da cada nivel de mejora. */
export function stats(l: Levels): Stats {
  const cd = 0.0058 * Math.pow(0.915, l.wings) * Math.pow(0.92, l.weight); // alas y peso: menos frenada (más lejos y más rápido)
  const ci = 176 * Math.pow(0.985, l.wings) * Math.pow(1.03, l.weight);    // peso: pide más velocidad para planear bien
  const vStall = 7.4 * (1 - 0.018 * l.wings - 0.022 * l.tail);             // alas y cola: entra en pérdida más tarde
  return {
    cd, ci, vStall, vLift: vStall * 1.3,
    turn: 1.25 + 0.09 * l.tail,                          // cola: el morro responde más rápido y más suave
    maxUp: 0.85, maxDown: -1.05,
    v0: 17 + 2.2 * l.launch, h0: 40 + 3 * l.launch,      // lanzador: más velocidad y rampa más alta
    magnet: 1.6 + 1.1 * l.magnet,                        // imán: radio de recogida de monedas (m)
    keep: 0.6 + 0.02 * l.weight + 0.012 * l.tail,        // velocidad que conserva al chocar con un pájaro o globo
  };
}

/** Velocidad de mejor planeo (mínima resistencia) y planeo máximo L/D. */
export function bestGlide(st: Stats) {
  const v = Math.pow(st.ci / st.cd, 0.25);
  return { v, ld: G / (2 * Math.sqrt(st.cd * st.ci)) };
}

/** a = ángulo del morro (rad, positivo = arriba). */
export interface Glider { x: number; y: number; v: number; a: number; stall: boolean }

export function launch(st: Stats, power: number, x = 0): Glider {
  return { x, y: st.h0, v: st.v0 * power, a: 0.3, stall: false };
}

/** Un paso de física (dt fijo). wind = viento vertical (m/s) en la posición actual. */
export function step(s: Glider, st: Stats, hold: boolean, wind: number, dt: number) {
  s.stall = s.v < st.vStall || (s.stall && s.v < st.vStall * 1.15);
  const turn = s.stall ? -st.turn * 1.4 : hold ? st.turn : -st.turn;
  s.a = Math.max(st.maxDown, Math.min(st.maxUp, s.a + turn * dt));
  const v2 = s.v * s.v;
  const drag = st.cd * v2 + st.ci / Math.max(v2, 25);
  s.v = Math.max(2.5, s.v + (-G * Math.sin(s.a) - drag) * dt);
  // falta de sustentación (∝ v²): se hunde
  const lack = Math.max(0, 1 - (s.v * s.v) / (st.vLift * st.vLift));
  const sink = lack * 7;
  s.x += s.v * Math.cos(s.a) * dt;
  // techo blando: por encima de 260 m el viento ya no sube
  s.y += (s.v * Math.sin(s.a) - sink + (s.y > 260 ? Math.min(wind, 0) : wind)) * dt;
}

/* ------------------------------------------------------------------ mundo */

export type Kind = 'coin' | 'balloon' | 'bird' | 'ring' | 'updraft';
export interface Item {
  kind: Kind; x: number; y: number; r: number;
  /** corriente: ancho, techo y fuerza */
  w?: number; top?: number; str?: number;
  /** pájaro: velocidad y fase del aleteo; globo: color */
  vx?: number; ph?: number; color?: number;
  taken?: boolean;
}

/** Generador pseudoaleatorio con semilla (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CHUNK = 70;

/**
 * Contenido de un tramo de CHUNK metros que empieza en x0. hintY = altura del avión al generarlo (los objetos salen
 * cerca de donde vuela, para que siempre haya algo que decidir). Cuanto más lejos, menos corrientes y más pájaros.
 */
export function genChunk(R: () => number, x0: number, hintY: number): Item[] {
  const out: Item[] = [];
  const far = x0 / 1000;
  const lane = (lo: number, hi: number) => Math.max(4, Math.min(220, hintY + lo + R() * (hi - lo)));
  // corriente de aire (columna que sube)
  const pUp = 0.1 + 0.45 * Math.exp(-x0 / 2600);
  if (x0 > 120 && R() < pUp) {
    const w = 26 + R() * 22;
    out.push({ kind: 'updraft', x: x0 + 10 + R() * (CHUNK - 20), y: 0, r: w / 2, w, top: Math.max(40, hintY + 25 + R() * 50), str: 5 + R() * 3.5 - Math.min(1.5, far * 0.4) });
  }
  // monedas en arco
  if (R() < 0.75) {
    const n = 5 + Math.floor(R() * 4), cx = x0 + 12 + R() * (CHUNK - 30), cy = lane(-14, 8), span = 3.2, rise = 2 + R() * 5;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) * 2 - 1;
      out.push({ kind: 'coin', x: cx + (i - (n - 1) / 2) * span, y: Math.max(2.5, cy + rise * (1 - t * t)), r: 1.1 });
    }
  }
  // globo (frena)
  if (x0 > 160 && R() < 0.25 + Math.min(0.2, far * 0.08)) {
    out.push({ kind: 'balloon', x: x0 + R() * CHUNK, y: lane(-10, 12), r: 2.0, color: Math.floor(R() * 4) });
  }
  // pájaro (frena; vuela hacia el avión)
  if (x0 > 300 && R() < 0.12 + Math.min(0.3, far * 0.12)) {
    out.push({ kind: 'bird', x: x0 + R() * CHUNK, y: lane(-8, 10), r: 1.6, vx: -(3 + R() * 3), ph: R() * 6 });
  }
  // aro de turbo
  if (x0 > 200 && R() < 0.13) {
    out.push({ kind: 'ring', x: x0 + 20 + R() * (CHUNK - 40), y: lane(-6, 10), r: 2.6 });
  }
  return out;
}

/** Viento vertical de una corriente en (x, y): máximo en el centro, se apaga en los bordes y en el techo. */
export function updraftWind(u: Item, x: number, y: number) {
  const dx = Math.abs(x - u.x) / (u.w! / 2);
  if (dx >= 1 || y > u.top! + 12) return 0;
  const side = 1 - dx * dx;
  const roof = y < u.top! ? 1 : 1 - (y - u.top!) / 12;
  return u.str! * side * roof;
}

export const COINS_PER_M = 1 / 15;
/** Monedas de un vuelo: las recogidas más una por cada 15 m. */
export function flightCoins(dist: number, picked: number) { return picked + Math.floor(dist * COINS_PER_M); }

/** Efectos de los choques y del aro (los usan el juego y la simulación). */
export function hit(s: Glider, st: Stats) { s.v = Math.max(st.vStall * 0.85, s.v * st.keep); s.a = Math.min(s.a, 0) - 0.2; }
export function boost(s: Glider) { s.v += 8; s.a = Math.max(s.a, 0.15); }

export type FlightEvent = { type: 'coin' | 'hit' | 'ring' | 'land' | 'stall'; item?: Item };
export const PLANE_R = 2.1;
export const DT = 1 / 60;

/**
 * Un vuelo completo (mundo + avión): lo mueve la escena con pasos fijos y la simulación en Node igual.
 * Sin Phaser; la escena lee `items` para dibujarlos y `events` para los efectos.
 */
export class Flight {
  st: Stats;
  s: Glider;
  items: Item[] = [];
  updrafts: Item[] = [];
  events: FlightEvent[] = [];
  coins = 0;
  t = 0;
  landed = false;
  wind = 0;
  private R: () => number;
  private genX = 0;

  constructor(levels: Levels, seed: number, power = 1) {
    this.st = stats(levels);
    this.s = launch(this.st, power);
    this.R = rng(seed);
    this.genX = 60;
  }

  /** Revivir: vuelve a lanzar desde donde aterrizó. */
  relaunch(power = 1) {
    const x = this.s.x;
    this.s = launch(this.st, power, x);
    this.s.y = this.st.h0 * 0.75;
    this.landed = false;
    // quita lo que esté encima del punto de relanzamiento
    for (const it of this.items) if (it.kind !== 'updraft' && it.kind !== 'coin' && Math.abs(it.x - x) < 40) it.taken = true;
  }

  step(hold: boolean, dt = DT) {
    if (this.landed) return;
    const s = this.s;
    // generar por delante, borrar lo de detrás
    while (this.genX < s.x + 160) {
      for (const it of genChunk(this.R, this.genX, s.y)) (it.kind === 'updraft' ? this.updrafts : this.items).push(it);
      this.genX += CHUNK;
    }
    if (this.items.length && this.items[0].x < s.x - 80) this.items = this.items.filter((i) => i.x > s.x - 80);
    if (this.updrafts.length && this.updrafts[0].x < s.x - 100) this.updrafts = this.updrafts.filter((u) => u.x > s.x - 100);
    let wind = 0;
    for (const u of this.updrafts) wind += updraftWind(u, s.x, s.y);
    this.wind = wind;
    const wasStall = s.stall;
    step(s, this.st, hold, wind, dt);
    if (s.stall && !wasStall) this.events.push({ type: 'stall' });
    this.t += dt;
    // pájaros que vuelan
    for (const it of this.items) {
      if (it.kind === 'bird' && !it.taken) { it.x += it.vx! * dt; it.ph! += dt * 9; it.y += Math.sin(it.ph! * 0.25) * dt * 1.2; }
    }
    // choques y recogidas
    const mr = this.st.magnet;
    for (const it of this.items) {
      if (it.taken) continue;
      const dx = it.x - s.x, dy = it.y - s.y;
      if (dx > 14 || dx < -6) continue;
      const d2 = dx * dx + dy * dy;
      if (it.kind === 'coin') {
        if (d2 < (mr + it.r) * (mr + it.r)) { it.taken = true; this.coins++; this.events.push({ type: 'coin', item: it }); }
      } else if (it.kind === 'ring') {
        if (Math.abs(dx) < 1.2 && Math.abs(dy) < it.r) { it.taken = true; boost(s); this.events.push({ type: 'ring', item: it }); }
      } else if (d2 < (PLANE_R + it.r) * (PLANE_R + it.r) * 0.8) {
        it.taken = true; hit(s, this.st); this.events.push({ type: 'hit', item: it });
      }
    }
    if (s.y <= 0) { s.y = 0; this.landed = true; this.events.push({ type: 'land' }); }
  }

  get dist() { return Math.max(0, Math.floor(this.s.x)); }
}

/**
 * Piloto automático razonable (el de la prueba de rendimiento y la simulación): busca la velocidad de mejor planeo,
 * aprovecha las corrientes subiendo despacio y pica si va a entrar en pérdida.
 */
export function autopilot(f: Flight): boolean {
  const s = f.s, st = f.st, best = bestGlide(st).v;
  if (s.stall || s.v < st.vStall * 1.15) return false;
  if (f.wind > 1) return s.v > Math.max(st.vLift * 1.05, best * 0.85) || s.a < 0.1;
  // mantener el morro en el ángulo que da la velocidad de mejor planeo
  const want = Math.max(-0.5, Math.min(0.3, (s.v - best) * 0.06 - 0.2));
  return s.a < want;
}
