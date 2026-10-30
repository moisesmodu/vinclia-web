import { CASHIER_SPOT, MACHINE, PILE, COUNTER, type Fruit } from './data';
import type { Sim, Shelf } from './sim';

/**
 * Piloto automático (pruebas de progresión y de rendimiento, y capturas): decide adónde ir y escribe la dirección
 * en sim.player.ix/iy, como lo haría el dedo. No hace trampas: solo mueve al personaje.
 */
export function botThink(s: Sim) {
  const p = s.player;
  const target = pickTarget(s);
  if (!target) { p.ix = 0; p.iy = 0; return; }
  let dx = target.x - p.x, dy = target.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < (target.r ?? 20)) { p.ix = 0; p.iy = 0; return; }
  dx /= d; dy /= d;
  // esquiva árboles, estantes y mostrador que estén por delante
  const obst: [number, number, number][] = [
    ...s.trees.map((t) => [t.x, t.y, 34] as [number, number, number]),
    ...s.shelves.map((o) => [o.x, o.y, 46] as [number, number, number]),
    [COUNTER.x, COUNTER.y, 52],
  ];
  let ax = 0, ay = 0;
  for (const [ox, oy, r] of obst) {
    const rx = ox - p.x, ry = oy - p.y, along = rx * dx + ry * dy;
    if (along < 0 || along > 90 || Math.hypot(rx, ry) > d) continue;
    const side = rx * -dy + ry * dx; // lateral
    if (Math.abs(side) < r + 22) { const k = side > 0 ? 1 : -1; ax += dy * k * 1.2; ay += -dx * k * 1.2; }
  }
  p.ix = dx + ax; p.iy = dy + ay;
  const m = Math.hypot(p.ix, p.iy) || 1;
  p.ix /= m; p.iy /= m;
}

export type T = { x: number; y: number; r?: number };

function accepts(s: Shelf, carry: string[]) {
  return s.machine ? s.inp < MACHINE.inputCap && carry.includes('orange') : s.n < s.cap && carry.includes(s.item);
}

export function pickTarget(s: Sim): T | null {
  const p = s.player;
  // 1) comprar lo que alcance (lo más barato primero)
  const pads = s.activePads().filter((d) => d.cost - (s.paid[d.id] || 0) <= s.cash).sort((a, b) => a.cost - b.cost);
  if (pads.length) return { x: pads[0].x, y: pads[0].y, r: 10 };
  // 2) recoger monedas si hay bastantes (o si una compra está cerca)
  const next = s.activePads()[0];
  if (s.pile > 0 && (s.pile >= 15 || (next && s.cash + s.pile >= next.cost - (s.paid[next.id] || 0)))) return { x: PILE.x, y: PILE.y, r: 30 };
  // 3) cobrar si hay cola y no hay cajero
  if (!s.cashier && s.queue.length >= 2) return { x: CASHIER_SPOT.x, y: CASHIER_SPOT.y, r: 30 };
  // 4) llevar la fruta a un estante que la acepte
  if (p.carry.length) {
    const sh = s.shelves.filter((o) => accepts(o, p.carry)).sort((a, b) => a.n / a.cap - b.n / b.cap)[0];
    const full = p.carry.length >= p.cap;
    if (sh && (full || !s.trees.some((t) => t.n > 0 && p.carry.includes(t.fruit) && Math.hypot(t.x - p.x, t.y - p.y) < 78))) return { x: sh.x, y: sh.y + 60, r: 30 };
    if (full) return s.queue.length && !s.cashier ? { x: CASHIER_SPOT.x, y: CASHIER_SPOT.y, r: 30 } : { x: PILE.x, y: PILE.y, r: 30 };
  }
  // 5) a por la fruta que más falta
  const need = s.shelves
    .map((o) => ({ o, fill: o.machine ? o.inp / MACHINE.inputCap : o.n / o.cap, fruit: (o.machine ? 'orange' : o.item) as Fruit }))
    .filter((x) => x.fill < 1 && s.trees.some((t) => t.fruit === x.fruit && t.n > 0))
    .sort((a, b) => a.fill - b.fill)[0];
  if (need && p.carry.length < p.cap) {
    let best = null as null | { x: number; y: number }, bd = Infinity;
    for (const t of s.trees) {
      if (t.fruit !== need.fruit || t.n <= 0) continue;
      const dd = Math.hypot(t.x - p.x, t.y - p.y);
      if (dd < bd) { bd = dd; best = t; }
    }
    if (best) return { x: best.x + 36, y: best.y + 34, r: 14 };
  }
  if (s.queue.length && !s.cashier) return { x: CASHIER_SPOT.x, y: CASHIER_SPOT.y, r: 30 };
  if (s.pile > 0) return { x: PILE.x, y: PILE.y, r: 30 };
  return null;
}
