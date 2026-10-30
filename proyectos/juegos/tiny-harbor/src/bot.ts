import type { Sim, Boat } from './sim';

/**
 * Piloto automático (prueba de progresión, rendimiento y capturas). Juega como un dedo: va hasta el barco, lo coge,
 * lo arrastra a una grúa libre o al mar abierto y lo suelta; y compra la mejora más barata que alcance. No hace
 * trampas: usa grab / moveFinger / release y buy, igual que la pantalla táctil.
 */
export class Bot {
  /** Velocidad del dedo (unidades del mundo por segundo) y pausa entre gestos (s). */
  speed = 1700;
  pause = 0.35;
  buyDelay = 0.6;
  fx = 0; fy = 0;
  private phase: 'idle' | 'reach' | 'drag' = 'idle';
  private boat = 0;
  private tx = 0; private ty = 0;
  private wait = 0;
  private buyT = 0;

  think(s: Sim, dt: number) {
    // comprar lo que alcance (lo más barato primero), con un pequeño retraso humano
    const pads = s.activePads().filter((p) => p.cost <= s.cash).sort((a, b) => a.cost - b.cost);
    if (pads.length) { this.buyT += dt; if (this.buyT >= this.buyDelay) { s.buy(pads[0].id); this.buyT = 0; } } else this.buyT = 0;

    if (this.phase === 'idle') {
      if ((this.wait -= dt) > 0) return;
      const t = this.pick(s);
      if (!t) return;
      this.boat = t.b.id; this.tx = t.x; this.ty = t.y; this.phase = 'reach';
    }
    const b = s.boats.find((o) => o.id === this.boat);
    if (this.phase === 'reach') {
      if (!b || !['queue', 'arrive', 'float', 'ready'].includes(b.state)) { this.phase = 'idle'; return; }
      if (this.move(b.x, b.y, dt)) {
        if (s.grab(this.fx, this.fy) === b.id) this.phase = 'drag';
        else { s.release(); this.phase = 'idle'; this.wait = this.pause; }
      }
    } else if (this.phase === 'drag') {
      // el destino puede ocuparse por el camino (remolcador): se busca otro
      if (b && b.load < b.cap) {
        const i = s.nearestFreeBerth(this.tx, this.ty, 30);
        if (i < 0) { const j = this.berthFor(s); if (j) { this.tx = j.x; this.ty = j.y; } }
      }
      const arrived = this.move(this.tx, this.ty, dt);
      s.moveFinger(this.fx, this.fy);
      if (arrived) { s.release(); this.phase = 'idle'; this.wait = this.pause; }
    }
  }

  private move(x: number, y: number, dt: number) {
    const dx = x - this.fx, dy = y - this.fy, d = Math.hypot(dx, dy), st = this.speed * dt;
    if (d <= st) { this.fx = x; this.fy = y; return true; }
    this.fx += (dx / d) * st; this.fy += (dy / d) * st;
    return false;
  }

  private berthFor(s: Sim) {
    for (let i = 0; i < s.owned; i++) if (!s.berths[i].boat) return s.L.berths[i];
    return null;
  }

  private pick(s: Sim): { b: Boat; x: number; y: number } | null {
    const e = s.L.exit;
    // 1) zarpar los barcos cargados (si no hay práctico que lo haga)
    if (!s.pilot) {
      const r = s.readyBoats()[0];
      if (r) return { b: r, x: (e.x0 + e.x1) / 2, y: (e.y0 + e.y1) / 2 };
    }
    // 2) llevar un barco que espera a una grúa libre
    const berth = this.berthFor(s);
    if (berth) {
      const w = s.waiting().sort((a, b) => (a.state === 'queue' ? a.slot : -1) - (b.state === 'queue' ? b.slot : -1))[0];
      if (w) return { b: w, x: berth.x, y: berth.y };
    }
    return null;
  }

  /** Dónde está el dedo y qué hace (para dibujar la mano en las capturas). */
  get state() { return { x: this.fx, y: this.fy, down: this.phase === 'drag' }; }
}
