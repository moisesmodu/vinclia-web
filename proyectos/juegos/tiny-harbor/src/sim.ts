import { LAYOUTS, PORTS, BASE, prestigeMult, OFFLINE_CAP_S, type Layout, type LayoutName, type Pad, type PortDef } from './data';

/**
 * Simulación de Tiny Harbor, sin Phaser (la dibuja Play y la prueba de progresión la avanza en Node a toda velocidad).
 * Barcos que llegan al fondeadero, el dedo que los arrastra hasta una grúa libre, grúas que cargan cajas, barcos que
 * zarpan al mar abierto y pagan, remolcadores y práctico (automatización) y las mejoras de cada puerto.
 */

export type BoatState = 'arrive' | 'queue' | 'float' | 'drag' | 'dock' | 'tow' | 'load' | 'ready' | 'sail';
export type Boat = { id: number; x: number; y: number; ang: number; cap: number; load: number; state: BoatState; slot: number; t: number; look: number; tug: number };
export type Tug = { id: number; x: number; y: number; ang: number; state: 'home' | 'go' | 'tow' | 'back'; boat: number; berth: number };
export type BerthS = { boat: number; t: number };
export type Ev =
  | { k: 'crate'; berth: number }
  | { k: 'ready'; x: number; y: number }
  | { k: 'dock'; berth: number }
  | { k: 'sail'; x: number; y: number; v: number }
  | { k: 'star'; x: number; y: number }
  | { k: 'buy'; pad: Pad }
  | { k: 'gate' }
  | { k: 'grab' }
  | { k: 'drop'; ok: boolean };

export type SaveData = {
  port: number; prestige: number; cash: number; stars: number; earned: number; sailed: number;
  bought: string[]; rate: number; savedAt: number;
};

export function freshSave(): SaveData {
  return { port: 0, prestige: 0, cash: 0, stars: 0, earned: 0, sailed: 0, bought: [], rate: 0, savedAt: 0 };
}

/** Mueve hacia (tx, ty) girando hacia la marcha. Devuelve true al llegar. */
function moveTo(e: { x: number; y: number; ang?: number }, tx: number, ty: number, sp: number, dt: number, turn = true) {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), step = sp * dt;
  if (d <= step || d < 0.5) { e.x = tx; e.y = ty; return true; }
  e.x += (dx / d) * step; e.y += (dy / d) * step;
  if (turn && e.ang !== undefined && d > 4) {
    const want = Math.atan2(dx, -dy); // 0 = proa hacia arriba
    let da = want - e.ang;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    e.ang += da * Math.min(1, dt * 6);
  }
  return false;
}
const straighten = (b: { ang: number }, dt: number) => { b.ang += (0 - b.ang) * Math.min(1, dt * 5); };

export class Sim {
  port = 0; prestige = 0; cash = 0; stars = 0; earned = 0; sailed = 0;
  bought = new Set<string>();
  def!: PortDef;
  L: Layout = LAYOUTS.wide;
  boats: Boat[] = [];
  tugs: Tug[] = [];
  berths: BerthS[] = [];
  owned = 1; craneLv = 0; hullLv = 0; cargoLv = 0; buoyLv = 0; pilot = 0;
  finger = { x: 0, y: 0, boat: 0, sx: 0, sy: 0 };
  /** Segundos reales de "barco doble" que quedan (anuncio con recompensa): cada barco paga ×2. */
  boost = 0;
  spawnT = 2.5;
  time = 0;
  rate = 0; private rateWin = 0; private rateT = 0;
  events: Ev[] = [];
  private nextId = 1;
  /** Para pruebas: semilla del azar. */
  rnd: () => number = Math.random;

  constructor(d: SaveData = freshSave(), layout: LayoutName = 'wide') { this.L = LAYOUTS[layout]; this.load(d); }

  load(d: SaveData) {
    const f = { ...freshSave(), ...d };
    this.port = Math.min(PORTS.length - 1, Math.max(0, f.port | 0));
    this.prestige = f.prestige | 0; this.cash = f.cash; this.stars = f.stars; this.earned = f.earned; this.sailed = f.sailed;
    this.bought = new Set(f.bought); this.rate = f.rate;
    this.build();
  }

  serialize(now = Date.now()): SaveData {
    return {
      port: this.port, prestige: this.prestige, cash: Math.floor(this.cash), stars: this.stars, earned: Math.floor(this.earned),
      sailed: this.sailed, bought: [...this.bought], rate: Math.round(this.rate), savedAt: now,
    };
  }

  /** Monta el puerto a partir de lo comprado: un barco ya esperando para el primer arrastre. */
  private build() {
    this.def = PORTS[this.port];
    this.owned = this.def.berths; this.craneLv = 0; this.hullLv = 0; this.cargoLv = 0; this.buoyLv = 0; this.pilot = 0;
    this.boats = []; this.tugs = []; this.finger.boat = 0;
    for (let i = 0; i < this.def.tugs; i++) this.addTug();
    for (const p of this.def.pads) if (this.bought.has(p.id)) this.apply(p);
    this.berths = this.L.berths.map(() => ({ boat: 0, t: 0 }));
    const b = this.newBoat(); b.state = 'queue'; const q = this.L.queue[0]; b.x = q.x; b.y = q.y;
    this.spawnT = 2.5;
  }

  private apply(p: Pad) {
    switch (p.kind) {
      case 'berth': this.owned = Math.min(this.L.berths.length, this.owned + 1); break;
      case 'crane': this.craneLv++; break;
      case 'hull': this.hullLv++; break;
      case 'cargo': this.cargoLv++; break;
      case 'buoy': this.buoyLv++; break;
      case 'tug': this.addTug(); break;
      case 'pilot': this.pilot++; break;
      case 'gate': break;
    }
  }

  private addTug() {
    const h = this.L.tugHome;
    this.tugs.push({ id: this.nextId++, x: h.x + this.tugs.length * 70, y: h.y, ang: 0, state: 'home', boat: 0, berth: -1 });
  }

  /* ---------------------------------------------------------------- valores */
  get mult() { return prestigeMult(this.prestige); }
  get cap() { return BASE.cap + this.hullLv; }
  get craneS() { return BASE.craneS * BASE.craneMul ** this.craneLv; }
  get crateValue() { return this.def.crate * BASE.cargoMul ** this.cargoLv * this.mult; }
  get queueCap() { return Math.min(this.L.queue.length, BASE.queue + this.buoyLv); }
  get arriveS() { return BASE.arriveS * BASE.arriveMul ** this.buoyLv; }
  /** Monedas que da un barco lleno ahora mismo (sin el ×2). */
  get boatValue() { return Math.round(this.cap * this.crateValue); }

  /** Mejoras visibles: las tres siguientes sin comprar. */
  activePads(): Pad[] {
    const out: Pad[] = [];
    for (const p of this.def.pads) { if (!this.bought.has(p.id)) { out.push(p); if (out.length === 3) break; } }
    return out;
  }
  progress() { return this.def.pads.filter((p) => this.bought.has(p.id)).length / this.def.pads.length; }
  canBuy(p: Pad) { return this.cash >= p.cost; }

  buy(id: string): boolean {
    const p = this.activePads().find((x) => x.id === id);
    if (!p || this.cash < p.cost) return false;
    this.cash -= p.cost;
    this.bought.add(p.id);
    this.apply(p);
    this.events.push({ k: 'buy', pad: p });
    if (p.kind === 'gate') this.events.push({ k: 'gate' });
    return true;
  }

  /** Pasa de puerto (o, en el último, prestigio y vuelta al primero con multiplicador permanente). */
  nextPort() {
    if (this.port < PORTS.length - 1) { this.port++; this.stars += 10; }
    else { this.port = 0; this.prestige++; this.stars += 50; }
    this.bought.clear(); this.cash = 0; this.boost = 0;
    this.build();
  }

  /** Cambia la distribución (al girar la pantalla): los barcos en un hueco van a su sitio; los sueltos, a escala. */
  setLayout(name: LayoutName) {
    if (this.L.name === name) return;
    const a = this.L, b = LAYOUTS[name];
    const sx = (x: number) => (x / a.w) * b.w, sy = (y: number) => (y / a.h) * b.h;
    this.L = b;
    for (const o of this.boats) {
      if (o.state === 'queue') { const q = b.queue[o.slot]; o.x = q.x; o.y = q.y; }
      else if ((o.state === 'load' || o.state === 'ready') && o.slot >= 0) { const r = b.berths[o.slot]; o.x = r.x; o.y = r.y; }
      else { o.x = sx(o.x); o.y = sy(o.y); }
      if (o.state === 'drag') this.finger.boat = 0, o.state = 'float';
      if (o.state === 'float') this.clampWater(o);
    }
    for (const t of this.tugs) { t.x = sx(t.x); t.y = sy(t.y); }
    if (this.finger.boat) this.finger.boat = 0;
  }

  /* ---------------------------------------------------------------- el dedo */
  /** Coge el barco que hay bajo (x, y). Devuelve su id o 0. */
  grab(x: number, y: number): number {
    if (this.finger.boat) return 0;
    let best: Boat | null = null, bd = 1.35;
    for (const b of this.boats) {
      if (b.state !== 'queue' && b.state !== 'arrive' && b.state !== 'float' && b.state !== 'ready') continue;
      const dx = (x - b.x) / 62, dy = (y - b.y) / 100, d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = b; }
    }
    if (!best) return 0;
    const b = best;
    if (b.state === 'ready' && b.slot >= 0) { this.berths[b.slot].boat = 0; b.slot = -1; }
    if (b.state === 'queue' || b.state === 'arrive') { b.slot = -1; this.compactQueue(); }
    this.cancelTug(b);
    b.state = 'drag'; b.t = 0;
    this.finger.x = x; this.finger.y = y; this.finger.sx = b.x; this.finger.sy = b.y; this.finger.boat = b.id;
    this.events.push({ k: 'grab' });
    return b.id;
  }

  moveFinger(x: number, y: number) { this.finger.x = x; this.finger.y = y; }

  /** Suelta el barco: cargado en mar abierto = zarpa; vacío junto a una grúa libre = amarra; si no, se queda flotando. */
  release(): 'sail' | 'dock' | 'float' | '' {
    const b = this.boats.find((o) => o.id === this.finger.boat);
    this.finger.boat = 0;
    if (!b) return '';
    if (b.load >= b.cap) {
      const e = this.L.exit;
      const out = (b.x >= e.x0 && b.x <= e.x1 && b.y >= e.y0 && b.y <= e.y1) || b.y - this.finger.sy > 170 && b.y > this.L.berths[0].y + 120;
      if (out) { this.sail(b); this.events.push({ k: 'drop', ok: true }); return 'sail'; }
      b.state = 'float'; this.events.push({ k: 'drop', ok: false }); return 'float';
    }
    const i = this.nearestFreeBerth(b.x, b.y, 230);
    if (i >= 0) { this.berths[i].boat = b.id; b.slot = i; b.state = 'dock'; this.events.push({ k: 'drop', ok: true }); return 'dock'; }
    b.state = 'float'; this.clampWater(b);
    this.events.push({ k: 'drop', ok: false });
    return 'float';
  }

  freeBerth(i: number) { return i < this.owned && !this.berths[i].boat; }
  nearestFreeBerth(x: number, y: number, r: number) {
    let best = -1, bd = r * r;
    for (let i = 0; i < this.owned; i++) {
      if (this.berths[i].boat) continue;
      const p = this.L.berths[i], d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  private clampWater(b: Boat) {
    const L = this.L;
    b.x = Math.max(50, Math.min(L.w - 50, b.x));
    b.y = Math.max(L.landY + 95, Math.min(L.h - 90, b.y));
    if (L.pier && b.y > L.pier.y0 - 95 && b.y < L.pier.y1 + 95) b.y = b.y < (L.pier.y0 + L.pier.y1) / 2 ? L.pier.y0 - 95 : L.pier.y1 + 95;
  }

  /* ---------------------------------------------------------------- barcos */
  private newBoat(): Boat {
    const s = this.L.spawn;
    const b: Boat = { id: this.nextId++, x: s.x, y: s.y, ang: Math.PI / 2, cap: this.cap, load: 0, state: 'arrive', slot: this.queued(), t: 0, look: Math.floor(this.rnd() * 4), tug: 0 };
    this.boats.push(b);
    return b;
  }
  private queued() { return this.boats.filter((b) => b.state === 'queue' || b.state === 'arrive').length; }
  private compactQueue() {
    const q = this.boats.filter((b) => (b.state === 'queue' || b.state === 'arrive') && b.slot >= 0).sort((a, b) => a.slot - b.slot);
    q.forEach((b, i) => { if (b.slot !== i) { b.slot = i; b.state = 'arrive'; } });
    for (const b of this.boats) if ((b.state === 'queue' || b.state === 'arrive') && b.slot < 0) b.slot = q.length;
  }

  private sail(b: Boat) {
    if (b.slot >= 0 && (b.state === 'ready' || b.state === 'load')) this.berths[b.slot].boat = 0;
    b.slot = -1; b.state = 'sail'; b.t = 0;
    const v = Math.round(b.load * this.def.crate * BASE.cargoMul ** this.cargoLv * this.mult * (this.boost > 0 ? 2 : 1));
    this.cash += v; this.earned += v; this.sailed++; this.rateWin += v;
    this.events.push({ k: 'sail', x: b.x, y: b.y, v });
    if (this.sailed % BASE.starEvery === 0) { this.stars++; this.events.push({ k: 'star', x: b.x, y: b.y }); }
  }

  private cancelTug(b: Boat) {
    if (!b.tug) return;
    const t = this.tugs.find((o) => o.id === b.tug);
    if (t) { if (t.berth >= 0 && this.berths[t.berth].boat === b.id) this.berths[t.berth].boat = 0; t.boat = 0; t.berth = -1; t.state = 'back'; }
    b.tug = 0;
  }

  /** Ganancias sin conexión (remolcadores y práctico siguen trabajando), con tope de 2 horas. */
  offlineGain(now = Date.now(), savedAt = 0) {
    if (!savedAt || now <= savedAt) return 0;
    const secs = Math.min(OFFLINE_CAP_S, (now - savedAt) / 1000);
    if (secs < 60 || (!this.tugs.length && !this.pilot)) return 0;
    const eff = Math.min(1, 0.4 * this.tugs.length + (this.pilot ? 0.4 : 0));
    return Math.floor((this.rate / 60) * secs * eff * 0.2);
  }

  /** Avanza el tiempo real dt (segundos). */
  update(realDt: number) {
    if (this.boost > 0) this.boost = Math.max(0, this.boost - realDt);
    let dt = realDt;
    while (dt > 1e-6) { const s = Math.min(dt, 1 / 30); this.step(s); dt -= s; }
  }

  private step(dt: number) {
    this.time += dt;
    const L = this.L;
    // llegadas al fondeadero
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = this.arriveS * (0.85 + this.rnd() * 0.3);
      if (this.queued() < this.queueCap) this.newBoat();
    }
    for (let i = this.boats.length - 1; i >= 0; i--) {
      const b = this.boats[i];
      b.t += dt;
      switch (b.state) {
        case 'arrive': {
          const q = L.queue[Math.min(b.slot, L.queue.length - 1)];
          if (moveTo(b, q.x, q.y, BASE.boatSpeed, dt)) b.state = 'queue';
          break;
        }
        case 'queue': case 'float': straighten(b, dt); if (b.state === 'float' && b.load >= b.cap && this.pilot && b.t > BASE.sailDelay) this.sail(b); break;
        case 'drag': {
          moveTo(b, this.finger.x, this.finger.y, 4000, dt, false);
          this.clampDrag(b);
          straighten(b, dt);
          break;
        }
        case 'dock': {
          const p = L.berths[b.slot];
          if (moveTo(b, p.x, p.y, 520, dt)) this.startLoad(b);
          else if (Math.hypot(p.x - b.x, p.y - b.y) < 60) straighten(b, dt);
          break;
        }
        case 'load': {
          const r = this.berths[b.slot];
          r.t += dt;
          if (r.t >= this.craneS) {
            r.t = 0; b.load++;
            this.events.push({ k: 'crate', berth: b.slot });
            if (b.load >= b.cap) { b.state = 'ready'; b.t = 0; this.events.push({ k: 'ready', x: b.x, y: b.y }); }
          }
          break;
        }
        case 'ready': if (this.pilot && b.t >= BASE.sailDelay / this.pilot) this.sail(b); break;
        case 'sail': {
          const sp = BASE.boatSpeed * Math.min(2.2, 0.6 + b.t * 1.4);
          if (moveTo(b, L.exitTo.x, L.exitTo.y, sp, dt)) this.boats.splice(i, 1);
          break;
        }
        case 'tow': break; // lo mueve su remolcador
      }
    }
    this.stepTugs(dt);
    this.rateT += dt;
    if (this.rateT >= 10) { this.rate = this.rate ? this.rate * 0.8 + this.rateWin * 6 * 0.2 : this.rateWin * 6; this.rateWin = 0; this.rateT = 0; }
  }

  private clampDrag(b: Boat) {
    const L = this.L;
    b.x = Math.max(40, Math.min(L.w - 40, b.x));
    b.y = Math.max(L.landY + 85, Math.min(L.h - 60, b.y));
  }

  private startLoad(b: Boat) {
    b.state = 'load'; b.ang = 0; b.t = 0;
    this.berths[b.slot].t = 0;
    this.events.push({ k: 'dock', berth: b.slot });
    if (b.load >= b.cap) { b.state = 'ready'; this.events.push({ k: 'ready', x: b.x, y: b.y }); }
  }

  /* ---------------------------------------------------------------- remolcadores */
  private stepTugs(dt: number) {
    const L = this.L;
    for (const t of this.tugs) {
      if (t.state === 'home' || t.state === 'back') {
        const k = this.tugs.indexOf(t);
        const h = { x: L.tugHome.x - k * 70, y: L.tugHome.y };
        if (t.state === 'back' && moveTo(t, h.x, h.y, BASE.tugSpeed, dt)) t.state = 'home';
        // trabajo: barco vacío esperando y amarre libre
        const free = this.nearestFreeBerthAny();
        if (free < 0) continue;
        let target: Boat | null = null;
        for (const b of this.boats) {
          if ((b.state === 'queue' || b.state === 'float') && !b.tug && b.load < b.cap && (!target || (b.state === 'queue' && (target.state !== 'queue' || b.slot < target.slot)))) target = b;
        }
        if (!target) continue;
        target.tug = t.id; t.boat = target.id; t.berth = free; t.state = 'go';
        this.berths[free].boat = target.id;
      } else if (t.state === 'go') {
        const b = this.boats.find((o) => o.id === t.boat);
        if (!b || b.tug !== t.id || (b.state !== 'queue' && b.state !== 'float')) { this.releaseTug(t); continue; }
        if (moveTo(t, b.x, b.y + 105, BASE.tugSpeed, dt)) {
          b.state = 'tow';
          if (b.slot >= 0) { b.slot = -1; this.compactQueue(); }
          t.state = 'tow';
        }
      } else if (t.state === 'tow') {
        const b = this.boats.find((o) => o.id === t.boat);
        if (!b || b.state !== 'tow') { this.releaseTug(t); continue; }
        const p = L.berths[t.berth];
        const done = moveTo(b, p.x, p.y, BASE.tugSpeed * 0.85, dt);
        t.x = b.x + Math.sin(b.ang) * -105; t.y = b.y + Math.cos(b.ang) * 105; t.ang = b.ang;
        if (done) {
          b.slot = t.berth; b.tug = 0;
          this.startLoad(b);
          t.boat = 0; t.berth = -1; t.state = 'back';
        }
      }
    }
  }
  private releaseTug(t: Tug) {
    if (t.berth >= 0 && this.berths[t.berth].boat === t.boat) {
      const b = this.boats.find((o) => o.id === t.boat);
      if (!b || (b.state !== 'dock' && b.state !== 'load' && b.state !== 'ready')) this.berths[t.berth].boat = 0;
    }
    t.boat = 0; t.berth = -1; t.state = 'back';
  }
  private nearestFreeBerthAny() { for (let i = 0; i < this.owned; i++) if (!this.berths[i].boat) return i; return -1; }

  /** Barcos esperando a ser llevados a una grúa (para el bot y la flecha guía). */
  waiting() { return this.boats.filter((b) => (b.state === 'queue' || b.state === 'float') && !b.tug && b.load < b.cap); }
  readyBoats() { return this.boats.filter((b) => b.state === 'ready' || (b.state === 'float' && b.load >= b.cap)); }
}
