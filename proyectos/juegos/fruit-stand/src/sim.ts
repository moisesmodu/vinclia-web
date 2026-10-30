import {
  STANDS, PRICE, TREE, WORLD, SHELF_CAP, MACHINE, CASHIER_SPOT, COUNTER, PILE, ENTRY, EXIT, SPAWN, HELPER_HOME, BASE,
  prestigeMult, OFFLINE_CAP_S, type Fruit, type Item, type PadDef, type StandDef,
} from './data';

/**
 * Simulación de Fruit Stand, sin Phaser (la dibuja Play y la prueba la avanza en Node a toda velocidad).
 * Todo lo que pasa en el puesto: árboles que dan fruta, estantes, clientes que compran y hacen cola, ayudantes
 * (que nunca se duermen), cajero, montón de monedas y alfombrillas de compra.
 */

export type Tree = { id: string; fruit: Fruit; x: number; y: number; n: number; max: number; t: number };
export type Shelf = { id: string; item: Item; x: number; y: number; n: number; cap: number; users: number; machine: boolean; inp: number; mt: number };
export type Customer = {
  id: number; x: number; y: number; look: number; want: Item; qty: number; got: number;
  state: 'in' | 'shop' | 'queue' | 'out'; shelf: Shelf | null; slot: number; t: number; face: number; paid: number;
};
export type Helper = { id: number; x: number; y: number; carry: Item[]; state: 'pick' | 'drop' | 'idle'; tree: Tree | null; shelf: Shelf | null; t: number; tx: number; ty: number; face: number; cashier: boolean };
export type Ev =
  | { k: 'pick'; x: number; y: number; item: Item }
  | { k: 'drop'; x: number; y: number; item: Item }
  | { k: 'sell'; x: number; y: number; v: number }
  | { k: 'collect'; v: number; stars: number }
  | { k: 'pay' }
  | { k: 'build'; pad: PadDef }
  | { k: 'gate' }
  | { k: 'star'; x: number; y: number };

export type SaveData = {
  stand: number; prestige: number; cash: number; stars: number; earned: number; served: number;
  bought: string[]; paid: Record<string, number>; stock: Record<string, number>; inp: Record<string, number>;
  carry: Item[]; pile: number; pileStars: number; rate: number; savedAt: number;
};

export function freshSave(): SaveData {
  return { stand: 0, prestige: 0, cash: 0, stars: 0, earned: 0, served: 0, bought: [], paid: {}, stock: {}, inp: {}, carry: [], pile: 6, pileStars: 0, rate: 0, savedAt: 0 };
}

const dist2 = (ax: number, ay: number, bx: number, by: number) => (ax - bx) ** 2 + (ay - by) ** 2;
const near = (a: { x: number; y: number }, x: number, y: number, r: number) => dist2(a.x, a.y, x, y) < r * r;

/** Mueve hacia (tx, ty). Devuelve true al llegar. */
function moveTo(e: { x: number; y: number; face?: number }, tx: number, ty: number, sp: number, dt: number) {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), step = sp * dt;
  if (d <= step || d < 0.5) { e.x = tx; e.y = ty; return true; }
  e.x += (dx / d) * step; e.y += (dy / d) * step;
  if (Math.abs(dx) > 2) e.face = dx < 0 ? -1 : 1;
  return false;
}

export class Sim {
  stand = 0; prestige = 0; cash = 0; stars = 0; earned = 0; served = 0;
  bought = new Set<string>();
  paid: Record<string, number> = {};
  def!: StandDef;
  trees: Tree[] = [];
  shelves: Shelf[] = [];
  customers: Customer[] = [];
  helpers: Helper[] = [];
  queue: Customer[] = [];
  player = { x: SPAWN.x, y: SPAWN.y, carry: [] as Item[], cap: BASE.cap, speed: BASE.speed, ix: 0, iy: 0, face: 1, moving: false, pickT: 0, dropT: 0, padT: 0, pad: '' };
  pile = 0; pileStars = 0;
  cashier = false;
  rate = 0; private rateWin = 0; private rateT = 0;
  payT = 0;
  spawnT = 1.5;
  time = 0;
  /** Segundos reales de turbo ×2 que quedan (anuncio con recompensa). */
  boost = 0;
  events: Ev[] = [];
  private nextId = 1;
  /** Para pruebas: semilla del azar (Math.random por defecto). */
  rnd: () => number = Math.random;

  constructor(d: SaveData = freshSave()) { this.load(d); }

  load(d: SaveData) {
    const f = { ...freshSave(), ...d };
    this.stand = Math.min(STANDS.length - 1, Math.max(0, f.stand | 0));
    this.prestige = f.prestige | 0; this.cash = f.cash; this.stars = f.stars; this.earned = f.earned; this.served = f.served;
    this.bought = new Set(f.bought); this.paid = { ...f.paid };
    this.pile = f.pile; this.pileStars = f.pileStars; this.rate = f.rate;
    this.build();
    for (const s of this.shelves) { s.n = Math.min(s.cap, f.stock[s.id] ?? (this.bought.size ? 0 : 3)); s.inp = Math.min(MACHINE.inputCap, f.inp[s.id] ?? 0); }
    this.player.carry = f.carry.slice(0, this.player.cap);
  }

  serialize(now = Date.now()): SaveData {
    const stock: Record<string, number> = {}, inp: Record<string, number> = {};
    for (const s of this.shelves) { stock[s.id] = s.n; if (s.machine) inp[s.id] = s.inp; }
    return {
      stand: this.stand, prestige: this.prestige, cash: Math.floor(this.cash), stars: this.stars, earned: Math.floor(this.earned), served: this.served,
      bought: [...this.bought], paid: { ...this.paid }, stock, inp, carry: [...this.player.carry], pile: this.pile, pileStars: this.pileStars,
      rate: Math.round(this.rate), savedAt: now,
    };
  }

  /** Construye el puesto a partir de lo comprado. */
  private build() {
    this.def = STANDS[this.stand];
    this.trees = []; this.shelves = []; this.customers = []; this.helpers = []; this.queue = []; this.cashier = false;
    this.player.cap = BASE.cap; this.player.speed = BASE.speed;
    this.player.x = SPAWN.x; this.player.y = SPAWN.y; this.player.carry = [];
    for (const p of this.def.prebuilt) this.apply(p, false);
    for (const p of this.def.pads) if (this.bought.has(p.id)) this.apply(p, false);
  }

  private apply(p: PadDef, live: boolean) {
    switch (p.kind) {
      case 'tree': { const m = TREE[p.fruit!].max; this.trees.push({ id: p.id, fruit: p.fruit!, x: p.x, y: p.y, n: m, max: m, t: 0 }); break; }
      case 'shelf': case 'machine':
        this.shelves.push({ id: p.id, item: p.item!, x: p.x, y: p.y, n: 0, cap: p.kind === 'machine' ? MACHINE.cap : SHELF_CAP, users: 0, machine: p.kind === 'machine', inp: 0, mt: 0 });
        break;
      case 'cap': this.player.cap += BASE.capStep; break;
      case 'speed': this.player.speed *= BASE.speedMul; break;
      case 'helper': this.helpers.push(this.newHelper(false)); break;
      case 'cashier': this.cashier = true; this.helpers.push(this.newHelper(true)); break;
      case 'gate': if (live) this.events.push({ k: 'gate' }); break;
    }
  }

  private newHelper(cashier: boolean): Helper {
    const h = cashier ? CASHIER_SPOT : HELPER_HOME;
    return { id: this.nextId++, x: h.x, y: h.y, carry: [], state: 'idle', tree: null, shelf: null, t: 0, tx: h.x, ty: h.y, face: 1, cashier };
  }

  /** Alfombrillas visibles: las tres siguientes sin comprar (la puerta sale sola al final). */
  activePads(): PadDef[] {
    const out: PadDef[] = [];
    for (const p of this.def.pads) { if (!this.bought.has(p.id)) { out.push(p); if (out.length === 3) break; } }
    return out;
  }
  progress() { return this.def.pads.filter((p) => this.bought.has(p.id)).length / this.def.pads.length; }
  get mult() { return prestigeMult(this.prestige); }
  /** Artículos a la venta (estantes de fruta y zumo de la máquina). */
  get sellables(): Item[] { return [...new Set(this.shelves.map((s) => s.item))]; }

  /** Pasa de puesto (o, en el último, prestigio y vuelta al primero con multiplicador permanente). */
  nextStand() {
    if (this.stand < STANDS.length - 1) { this.stand++; this.stars += 10; }
    else { this.stand = 0; this.prestige++; this.stars += 50; }
    this.bought.clear(); this.paid = {}; this.cash = 0; this.pile = 6; this.pileStars = 0; this.boost = 0;
    this.build();
    for (const s of this.shelves) s.n = 3;
  }

  /** Anuncio con recompensa "cosecha al instante": árboles y estantes llenos. */
  instantHarvest() {
    for (const t of this.trees) { t.n = t.max; t.t = 0; }
    for (const s of this.shelves) s.n = s.cap;
  }

  /** Ganancias sin conexión (los ayudantes siguen trabajando), con tope de 2 horas. */
  offlineGain(now = Date.now(), savedAt = 0) {
    if (!savedAt || now <= savedAt) return 0;
    const secs = Math.min(OFFLINE_CAP_S, (now - savedAt) / 1000);
    const stockers = this.helpers.filter((h) => !h.cashier).length;
    if (secs < 60 || stockers === 0) return 0;
    const eff = Math.min(1, 0.22 * stockers + (this.cashier ? 0.3 : 0));
    return Math.floor((this.rate / 60) * secs * eff * 0.35);
  }

  /** Avanza el tiempo real dt (segundos). El turbo duplica el tiempo de juego. */
  update(realDt: number) {
    let dt = realDt;
    if (this.boost > 0) { this.boost = Math.max(0, this.boost - realDt); dt *= 2; }
    while (dt > 1e-6) { const s = Math.min(dt, 1 / 30); this.step(s); dt -= s; }
  }

  private step(dt: number) {
    this.time += dt;
    this.stepPlayer(dt);
    for (const t of this.trees) {
      if (t.n < t.max) { t.t += dt; const r = TREE[t.fruit].regrow; if (t.t >= r) { t.t -= r; t.n++; } } else t.t = 0;
    }
    for (const s of this.shelves) {
      if (!s.machine) continue;
      if (s.inp > 0 && s.n < s.cap) { s.mt += dt; if (s.mt >= MACHINE.secs) { s.mt = 0; s.inp--; s.n++; } } else s.mt = 0;
    }
    this.stepCustomers(dt);
    this.stepHelpers(dt);
    this.stepCounter(dt);
    this.rateT += dt;
    if (this.rateT >= 10) { this.rate = this.rate ? this.rate * 0.8 + this.rateWin * 6 * 0.2 : this.rateWin * 6; this.rateWin = 0; this.rateT = 0; }
  }

  /* ---------------------------------------------------------------- jugador */
  private stepPlayer(dt: number) {
    const p = this.player;
    const m = Math.hypot(p.ix, p.iy);
    p.moving = m > 0.08;
    if (p.moving) {
      const k = Math.min(1, m) / m;
      p.x += p.ix * k * p.speed * dt; p.y += p.iy * k * p.speed * dt;
      if (Math.abs(p.ix) > 0.1) p.face = p.ix < 0 ? -1 : 1;
    }
    this.collide(p);
    // recoger fruta de los árboles cercanos
    p.pickT += dt;
    if (p.carry.length < p.cap) {
      // solo fruta que tenga dónde ir (estante de su tipo o, las naranjas, la máquina de zumo)
      const t = this.nearestTree(p.x, p.y, 84, undefined, this.wanted());
      if (t && p.pickT >= 0.12) { p.pickT = 0; t.n--; p.carry.push(t.fruit); this.events.push({ k: 'pick', x: t.x, y: t.y - 60, item: t.fruit }); }
    }
    // dejar fruta en los estantes (y naranjas en la máquina de zumo)
    p.dropT += dt;
    if (p.carry.length && p.dropT >= 0.09) {
      for (const s of this.shelves) {
        if (!near(p, s.x, s.y, 92)) continue;
        if (this.dropInto(s, p.carry)) { p.dropT = 0; break; }
      }
    }
    // monedas del mostrador
    if ((this.pile > 0 || this.pileStars > 0) && near(p, PILE.x, PILE.y, 80)) {
      const v = this.pile, st = this.pileStars;
      this.cash += v; this.stars += st; this.pile = 0; this.pileStars = 0;
      this.events.push({ k: 'collect', v, stars: st });
    }
    // alfombrillas: quieto encima o pasando, las monedas van entrando
    const pad = this.activePads().find((d) => near(p, d.x, d.y, 56));
    if (!pad) { p.padT = 0; p.pad = ''; return; }
    if (p.pad !== pad.id) { p.pad = pad.id; p.padT = 0; }
    p.padT += dt;
    if (p.padT < 0.25 || this.cash < 1) return;
    const paid = this.paid[pad.id] || 0;
    const step = Math.max(1, Math.ceil((pad.cost * dt) / 1.0));
    const n = Math.min(step, Math.floor(this.cash), pad.cost - paid);
    if (n <= 0) return;
    this.cash -= n; this.paid[pad.id] = paid + n;
    this.events.push({ k: 'pay' });
    if (paid + n >= pad.cost) this.buy(pad);
  }

  private buy(pad: PadDef) {
    this.bought.add(pad.id);
    delete this.paid[pad.id];
    this.player.pad = ''; this.player.padT = 0;
    this.apply(pad, true);
    const sh = this.shelves.find((s) => s.id === pad.id);
    if (sh && !sh.machine) sh.n = 2; // estante nuevo con algo para el primer cliente
    this.events.push({ k: 'build', pad });
  }

  /** Mete fruta en un estante o máquina. true si ha dejado una. */
  private dropInto(s: Shelf, carry: Item[]): boolean {
    if (s.machine) {
      if (s.inp >= MACHINE.inputCap) return false;
      const i = carry.lastIndexOf('orange');
      if (i < 0) return false;
      carry.splice(i, 1); s.inp++;
      this.events.push({ k: 'drop', x: s.x, y: s.y, item: 'orange' });
      return true;
    }
    if (s.n >= s.cap) return false;
    const i = carry.lastIndexOf(s.item);
    if (i < 0) return false;
    carry.splice(i, 1); s.n++;
    this.events.push({ k: 'drop', x: s.x, y: s.y, item: s.item });
    return true;
  }

  /** Frutas que algún estante (o la máquina) acepta. */
  wanted() {
    const w = new Set<Item>();
    for (const s of this.shelves) w.add(s.machine ? 'orange' : s.item);
    return w;
  }

  private nearestTree(x: number, y: number, r: number, fruit?: Fruit, ok?: Set<Item>) {
    let best: Tree | null = null, bd = r * r;
    for (const t of this.trees) {
      if (t.n <= 0 || (fruit && t.fruit !== fruit) || (ok && !ok.has(t.fruit))) continue;
      const d = dist2(x, y, t.x, t.y);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  /** Empuja al jugador fuera de árboles, estantes y mostrador, y dentro del mundo. */
  private collide(p: { x: number; y: number }) {
    const push = (cx: number, cy: number, r: number) => {
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
      if (d < r && d > 0.01) { p.x = cx + (dx / d) * r; p.y = cy + (dy / d) * r; }
    };
    for (const t of this.trees) push(t.x, t.y, 34);
    for (const s of this.shelves) push(s.x, s.y, 46);
    push(COUNTER.x, COUNTER.y, 52);
    p.x = Math.max(40, Math.min(WORLD.w - 40, p.x));
    p.y = Math.max(60, Math.min(WORLD.h - 30, p.y));
  }

  /* ---------------------------------------------------------------- clientes */
  maxCustomers() { return Math.min(18, 3 + 2 * this.shelves.length); }
  spawnEvery() { return Math.max(1.1, 4.2 / (1 + 0.3 * (this.shelves.length - 1))); }

  private stepCustomers(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = this.spawnEvery() * (0.75 + this.rnd() * 0.5);
      if (this.customers.length < this.maxCustomers()) this.spawnCustomer();
    }
    const sp = 120;
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      if (c.state === 'in' && c.shelf) {
        const sx = c.shelf.x - 36 + c.slot * 36, sy = c.shelf.y + 66;
        if (moveTo(c, sx, sy, sp, dt)) { c.state = 'shop'; c.t = 0; }
      } else if (c.state === 'shop' && c.shelf) {
        c.t += dt;
        if (c.t >= 0.35 && c.shelf.n > 0) {
          c.t = 0; c.shelf.n--; c.got++;
          if (c.got >= c.qty) { c.shelf.users--; c.shelf = null; c.state = 'queue'; this.queue.push(c); }
        }
      } else if (c.state === 'queue') {
        const k = this.queue.indexOf(c);
        moveTo(c, COUNTER.x + (k > 8 ? -60 : 0), COUNTER.y + 74 + Math.min(k, 8) * 48, sp, dt);
      } else if (c.state === 'out') {
        if (moveTo(c, EXIT.x, EXIT.y, sp * 1.2, dt)) this.customers.splice(i, 1);
      }
    }
  }

  private spawnCustomer() {
    // qué quiere: más probable lo que hay en los estantes; nunca un estante con los tres huecos ocupados
    const opts = this.shelves.filter((s) => s.users < 3);
    if (!opts.length) return;
    let tot = 0;
    const w = opts.map((s) => { const v = 1 + s.n; tot += v; return v; });
    let r = this.rnd() * tot, s = opts[0];
    for (let i = 0; i < opts.length; i++) { r -= w[i]; if (r <= 0) { s = opts[i]; break; } }
    const used = new Set(this.customers.filter((c) => c.shelf === s).map((c) => c.slot));
    let slot = 0; while (used.has(slot)) slot++;
    s.users++;
    const qty = s.item === 'melon' || s.item === 'juice' ? 1 + Math.floor(this.rnd() * 2) : 1 + Math.floor(this.rnd() * 3);
    this.customers.push({
      id: this.nextId++, x: ENTRY.x + (this.rnd() - 0.5) * 120, y: ENTRY.y, look: Math.floor(this.rnd() * 6), want: s.item, qty, got: 0,
      state: 'in', shelf: s, slot, t: 0, face: 1, paid: 0,
    });
  }

  /** Cobro: el jugador junto a la caja cobra rápido; el cajero contratado, algo más lento pero siempre. */
  private stepCounter(dt: number) {
    const c = this.queue[0];
    const here = near(this.player, CASHIER_SPOT.x, CASHIER_SPOT.y, 74);
    if (!c || (!here && !this.cashier)) { this.payT = 0; return; }
    if (!near(c, COUNTER.x, COUNTER.y + 74, 8)) return;
    this.payT += dt;
    if (this.payT < (here ? 0.4 : 0.7)) return;
    this.payT = 0;
    this.queue.shift();
    const v = Math.round(c.qty * PRICE[c.want] * this.mult);
    c.paid = v; c.state = 'out';
    this.pile += v; this.earned += v; this.served++; this.rateWin += v;
    this.events.push({ k: 'sell', x: COUNTER.x, y: COUNTER.y - 40, v });
    if (this.served % 6 === 0) { this.pileStars++; this.events.push({ k: 'star', x: PILE.x, y: PILE.y }); }
  }

  /* ---------------------------------------------------------------- ayudantes (nunca se duermen) */
  private stepHelpers(dt: number) {
    for (const h of this.helpers) {
      if (h.cashier) { moveTo(h, CASHIER_SPOT.x, CASHIER_SPOT.y, BASE.helperSpeed, dt); continue; }
      const sp = BASE.helperSpeed;
      if (h.state === 'idle') {
        h.t -= dt;
        // pasea entre los estantes mientras busca trabajo
        if (moveTo(h, h.tx, h.ty, sp * 0.6, dt) || h.t <= 0) this.planHelper(h);
      } else if (h.state === 'pick') {
        const t = h.tree;
        if (!t) { this.planHelper(h); continue; }
        if (moveTo(h, t.x + 40, t.y + 30, sp, dt)) {
          h.t += dt;
          if (h.t >= 0.22) {
            h.t = 0;
            if (t.n > 0 && h.carry.length < BASE.helperCap) { t.n--; h.carry.push(t.fruit); }
            else if (h.carry.length) { h.state = 'drop'; }
            else this.planHelper(h);
            if (h.carry.length >= BASE.helperCap) h.state = 'drop';
          }
        }
      } else if (h.state === 'drop') {
        const s = h.shelf;
        if (!s) { this.planHelper(h); continue; }
        if (moveTo(h, s.x, s.y + 58, sp, dt)) {
          h.t += dt;
          if (h.t >= 0.15) {
            h.t = 0;
            if (!this.dropInto(s, h.carry)) {
              // estante lleno: otro del mismo tipo o, si no hay, a esperar paseando con la fruta
              const other = this.shelves.find((o) => o !== s && (o.machine ? o.inp < MACHINE.inputCap && h.carry.includes('orange') : o.n < o.cap && h.carry.includes(o.item)));
              if (other) h.shelf = other;
              else if (!h.carry.length) this.planHelper(h);
              else { h.state = 'idle'; h.t = 1.2; this.wander(h); }
            }
            if (!h.carry.length) this.planHelper(h);
          }
        }
      }
    }
  }

  private wander(h: Helper) { h.tx = 640 + this.rnd() * 420; h.ty = 420 + this.rnd() * 300; }

  /** Elige el estante más vacío que tenga árboles con fruta de su tipo. */
  private planHelper(h: Helper) {
    h.t = 0;
    if (h.carry.length) {
      const s = this.shelves.find((o) => (o.machine ? o.inp < MACHINE.inputCap && h.carry.includes('orange') : o.n < o.cap && h.carry.includes(o.item)));
      if (s) { h.shelf = s; h.state = 'drop'; return; }
    }
    let best: Shelf | null = null, bf = 0.85;
    // varios ayudantes: cada uno prefiere un estante distinto
    const taken = new Set(this.helpers.filter((o) => o !== h && o.shelf).map((o) => o.shelf));
    for (const s of this.shelves) {
      const fruit: Fruit = s.machine ? 'orange' : (s.item as Fruit);
      const fill = (s.machine ? s.inp / MACHINE.inputCap : s.n / s.cap) + (taken.has(s) ? 0.3 : 0);
      if (fill < bf && this.trees.some((t) => t.fruit === fruit && t.n > 0)) { bf = fill; best = s; }
    }
    if (!best) { h.state = 'idle'; h.shelf = null; h.t = 1 + this.rnd(); this.wander(h); return; }
    const fruit: Fruit = best.machine ? 'orange' : (best.item as Fruit);
    let tree: Tree | null = null, tn = 0;
    for (const t of this.trees) if (t.fruit === fruit && t.n > tn) { tn = t.n; tree = t; }
    h.shelf = best; h.tree = tree; h.state = 'pick';
  }
}
