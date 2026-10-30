/**
 * Patio de Paint Grab como rejilla de celdas (módulo puro: sin Phaser, se prueba con Node en test-grid.mjs).
 *
 *  owner[i]  0 = suelo libre, k = territorio del pintor k-1
 *  trail[i]  0 = sin estela, k = estela del pintor k-1 (fuera de su territorio)
 *
 * Captura (al volver a casa con estela): la estela pasa a territorio y se rellena todo lo que queda encerrado.
 * "Encerrado" = celdas que no son del pintor y no se pueden alcanzar desde el borde del patio sin pisar su territorio.
 * El relleno solo recorre la caja del territorio del pintor más un margen de 1 (fuera de esa caja no hay nada suyo,
 * así que todo es exterior): con 96×96 celdas, menos de 10 000 pasos en el peor caso, con colas de arrays tipados y
 * marcas por generación (sin limpiar memoria entre rellenos).
 */
export type Box = { x0: number; y0: number; x1: number; y1: number };

export class Yard {
  readonly w: number;
  readonly h: number;
  readonly owner: Uint8Array;
  readonly trail: Uint8Array;
  /** Celdas de territorio de cada pintor. */
  readonly counts: Int32Array;
  /** Caja que contiene todo el territorio de cada pintor (solo crece; se recalcula al borrar). */
  private boxes: Box[];
  private visit: Uint32Array;
  private stamp = 0;
  private queue: Int32Array;
  /** Zona cambiada desde la última vez que se pidió (para redibujar solo eso). */
  dirty: Box | null = null;

  constructor(w: number, h: number, players = 8) {
    this.w = w; this.h = h;
    this.owner = new Uint8Array(w * h);
    this.trail = new Uint8Array(w * h);
    this.counts = new Int32Array(players);
    this.boxes = Array.from({ length: players }, () => ({ x0: w, y0: h, x1: -1, y1: -1 }));
    this.visit = new Uint32Array(w * h);
    this.queue = new Int32Array(w * h);
  }

  get total() { return this.w * this.h; }
  idx(x: number, y: number) { return y * this.w + x; }
  inside(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  /** Porcentaje del patio de un pintor (0..100). */
  pct(id: number) { return (this.counts[id] * 100) / this.total; }

  reset() {
    this.owner.fill(0); this.trail.fill(0); this.counts.fill(0);
    for (const b of this.boxes) { b.x0 = this.w; b.y0 = this.h; b.x1 = -1; b.y1 = -1; }
    this.markDirty(0, 0, this.w - 1, this.h - 1);
  }

  markDirty(x0: number, y0: number, x1: number, y1: number) {
    const d = this.dirty;
    if (!d) this.dirty = { x0, y0, x1, y1 };
    else { d.x0 = Math.min(d.x0, x0); d.y0 = Math.min(d.y0, y0); d.x1 = Math.max(d.x1, x1); d.y1 = Math.max(d.y1, y1); }
  }

  takeDirty(): Box | null { const d = this.dirty; this.dirty = null; return d; }

  private grow(id: number, x: number, y: number) {
    const b = this.boxes[id];
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
  }

  /** Pone una celda a nombre de un pintor (o la libera con id = -1), con cuentas y caja al día. */
  setOwner(i: number, id: number) {
    const prev = this.owner[i] - 1;
    if (prev === id) return;
    if (prev >= 0) this.counts[prev]--;
    this.owner[i] = id + 1;
    const x = i % this.w, y = (i - x) / this.w;
    if (id >= 0) { this.counts[id]++; this.grow(id, x, y); }
    const d = this.dirty;
    if (!d) this.dirty = { x0: x, y0: y, x1: x, y1: y };
    else { if (x < d.x0) d.x0 = x; if (x > d.x1) d.x1 = x; if (y < d.y0) d.y0 = y; if (y > d.y1) d.y1 = y; }
  }

  /** Territorio inicial: un disco de radio r (en celdas) alrededor de (cx, cy). Devuelve los pintores que se quedan sin nada. */
  claimDisc(id: number, cx: number, cy: number, r: number): number[] {
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(this.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(this.h - 1, Math.ceil(cy + r));
    const before = this.alivePlayers();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) { const i = this.idx(x, y); this.setOwner(i, id); this.trail[i] = 0; }
    }
    return before.filter((p) => p !== id && this.counts[p] === 0);
  }

  private alivePlayers() { const out: number[] = []; for (let p = 0; p < this.counts.length; p++) if (this.counts[p] > 0) out.push(p); return out; }

  /**
   * Cierra el lazo de un pintor: su estela (lista de índices) pasa a territorio y se rellena lo encerrado.
   * Devuelve las celdas ganadas y los pintores que se han quedado sin territorio (eliminados).
   */
  capture(id: number, trailCells: ArrayLike<number>): { gained: number; wiped: number[] } {
    const start = this.counts[id];
    const before = this.alivePlayers();
    for (let k = 0; k < trailCells.length; k++) {
      const i = trailCells[k];
      if (this.trail[i] === id + 1) this.trail[i] = 0;
      this.setOwner(i, id);
    }
    const b = this.boxes[id];
    if (b.x1 >= 0) {
      const x0 = Math.max(0, b.x0 - 1), y0 = Math.max(0, b.y0 - 1), x1 = Math.min(this.w - 1, b.x1 + 1), y1 = Math.min(this.h - 1, b.y1 + 1);
      this.fillEnclosed(id, x0, y0, x1, y1);
    }
    return { gained: this.counts[id] - start, wiped: before.filter((p) => p !== id && this.counts[p] === 0) };
  }

  /** Relleno por inundación desde el borde de la caja: lo que no se alcanza (y no es del pintor) queda encerrado. */
  private fillEnclosed(id: number, x0: number, y0: number, x1: number, y1: number) {
    const W = this.w, own = id + 1, owner = this.owner, visit = this.visit, q = this.queue;
    if (++this.stamp === 0xffffffff) { visit.fill(0); this.stamp = 1; }
    const st = this.stamp;
    let head = 0, tail = 0;
    const seed = (x: number, y: number) => {
      const i = y * W + x;
      if (owner[i] !== own && visit[i] !== st) { visit[i] = st; q[tail++] = i; }
    };
    for (let x = x0; x <= x1; x++) { seed(x, y0); seed(x, y1); }
    for (let y = y0 + 1; y < y1; y++) { seed(x0, y); seed(x1, y); }
    while (head < tail) {
      const i = q[head++];
      const x = i % W, y = (i - x) / W;
      if (x > x0) { const j = i - 1; if (owner[j] !== own && visit[j] !== st) { visit[j] = st; q[tail++] = j; } }
      if (x < x1) { const j = i + 1; if (owner[j] !== own && visit[j] !== st) { visit[j] = st; q[tail++] = j; } }
      if (y > y0) { const j = i - W; if (owner[j] !== own && visit[j] !== st) { visit[j] = st; q[tail++] = j; } }
      if (y < y1) { const j = i + W; if (owner[j] !== own && visit[j] !== st) { visit[j] = st; q[tail++] = j; } }
    }
    for (let y = y0 + 1; y < y1; y++) {
      let i = y * W + x0 + 1;
      for (let x = x0 + 1; x < x1; x++, i++) if (owner[i] !== own && visit[i] !== st) this.setOwner(i, id);
    }
  }

  /** Borra la estela de un pintor (lista de índices). */
  clearTrail(id: number, cells: ArrayLike<number>) {
    for (let k = 0; k < cells.length; k++) if (this.trail[cells[k]] === id + 1) this.trail[cells[k]] = 0;
  }

  /** Quita todo el territorio de un pintor (eliminado). */
  wipe(id: number) {
    const b = this.boxes[id];
    if (b.x1 >= 0) {
      for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
        const i = y * this.w + x;
        if (this.owner[i] === id + 1) this.owner[i] = 0;
      }
      this.markDirty(b.x0, b.y0, b.x1, b.y1);
    }
    this.counts[id] = 0;
    b.x0 = this.w; b.y0 = this.h; b.x1 = -1; b.y1 = -1;
  }

  /** Celda propia más cercana a (x, y) buscando en cuadrados crecientes (-1 si no tiene). */
  nearestOwn(id: number, x: number, y: number, maxR = 200): number {
    if (this.counts[id] === 0) return -1;
    const cx = Math.floor(x), cy = Math.floor(y), own = id + 1;
    let best = -1, bd = Infinity;
    for (let r = 0; r <= maxR; r++) {
      const y0 = cy - r, y1 = cy + r, x0 = cx - r, x1 = cx + r;
      for (let yy = y0; yy <= y1; yy++) {
        if (yy < 0 || yy >= this.h) continue;
        const step = yy === y0 || yy === y1 ? 1 : x1 - x0;
        for (let xx = x0; xx <= x1; xx += Math.max(1, step)) {
          if (xx < 0 || xx >= this.w) continue;
          const i = yy * this.w + xx;
          if (this.owner[i] === own) { const d = (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2; if (d < bd) { bd = d; best = i; } }
        }
      }
      // un anillo más lejos ya no puede mejorar lo encontrado
      if (best >= 0 && (r - 1) * (r - 1) > bd) break;
    }
    return best;
  }

  /** Cuenta las celdas libres en un cuadrado de radio r (para elegir dónde reaparecer). */
  freeAround(cx: number, cy: number, r: number) {
    let n = 0;
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (!this.inside(x, y)) { n -= 2; continue; }
      const i = y * this.w + x;
      if (this.owner[i] === 0 && this.trail[i] === 0) n++;
    }
    return n;
  }
}
