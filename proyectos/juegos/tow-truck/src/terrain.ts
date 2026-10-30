import Phaser from 'phaser';
import { PX_PER_M, DEPOT_EVERY_M } from './state';

/**
 * Camino de granja infinito por tramos (llano, colina, baches, rampa y puente), copiado del motor de Egg Truck.
 * Novedades: puentes de tablas estrechos sobre un barranco con río (se comban y traquetean) y un llano
 * garantizado alrededor de cada depósito (granero cada 200 m).
 * Física: una cadena de rectángulos estáticos. Dibujo: una textura horneada por bloque de ~1000 px.
 * Lo que queda detrás de la cámara se destruye para que el móvil no acumule cuerpos.
 */

const STEP = 24;           // separación entre puntos del perfil
const CHUNK = 40;          // puntos por bloque
const Y_MIN = 200, Y_MAX = 1150, Y_START = 620;
const FULL_DIFFICULTY_M = 500;
const DEPOT_FLAT = 300;    // medio llano alrededor del depósito (px)

type Kind = 'flat' | 'hill' | 'bumps' | 'ramp' | 'bridge';
type Seg = { kind: Kind; x0: number; y0: number; len: number; y1: number; amp: number; wl: number };
type Chunk = { endX: number; bodies: MatterJS.BodyType[]; objs: Phaser.GameObjects.GameObject[]; key: string };
const GRASS = 0x9cc84a, GRASS_DARK = 0x6f9e33, SOIL = 0xc07a45, SOIL_DEEP = 0x8a5233, CANYON = 0x6b3d5e, WATER = 0x5fb8e8, PLANK = 0xc98a4b;
const INK = 0x2b2340;
let texId = 0; // global: los nombres de textura no se repiten entre partidas

export type DepotSpot = { x: number; y: number };

export class Terrain {
  private xs: number[] = [];
  private ys: number[] = [];
  private bridge: boolean[] = [];
  private seg!: Seg;
  private chunks: Chunk[] = [];
  private built = 0;               // puntos ya convertidos en bloques
  private nextDepotX: number;
  readonly depots: DepotSpot[] = []; // depósitos con su suelo ya construido (los coloca Play)
  private depotXs: number[] = [];
  private mills: Phaser.GameObjects.Image[] = [];

  constructor(private scene: Phaser.Scene, private startX: number, private rng: Phaser.Math.RandomDataGenerator) {
    this.nextDepotX = startX + DEPOT_EVERY_M * PX_PER_M;
    this.seg = { kind: 'flat', x0: startX - 600, y0: Y_START, len: 1100, y1: Y_START, amp: 0, wl: 1 };
    for (let x = startX - 600; x <= startX + 400; x += STEP) this.push(x);
  }

  difficulty(x: number) {
    return Phaser.Math.Clamp((x - this.startX) / (PX_PER_M * FULL_DIFFICULTY_M), 0, 1);
  }

  /** Altura del suelo en x (interpolación lineal). */
  heightAt(x: number) {
    const i = Math.floor((x - this.xs[0]) / STEP);
    if (i < 0) return this.ys[0];
    if (i >= this.xs.length - 1) return this.ys[this.ys.length - 1];
    const t = (x - this.xs[i]) / STEP;
    return this.ys[i] + (this.ys[i + 1] - this.ys[i]) * t;
  }

  /** ¿Hay puente en x? (traqueteo de las tablas) */
  bridgeAt(x: number) {
    const i = Math.floor((x - this.xs[0]) / STEP);
    return i >= 0 && i < this.bridge.length && this.bridge[i];
  }

  /** Genera y construye hasta x. */
  ensure(untilX: number) {
    while (this.xs[this.xs.length - 1] < untilX) this.push(this.xs[this.xs.length - 1] + STEP);
    while (this.xs.length - this.built > CHUNK) this.buildChunk();
  }

  /** Elimina bloques que ya quedaron atrás. */
  cull(beforeX: number) {
    while (this.chunks.length && this.chunks[0].endX < beforeX) {
      const c = this.chunks.shift()!;
      for (const b of c.bodies) this.scene.matter.world.remove(b);
      for (const o of c.objs) o.destroy();
      this.scene.textures.remove(c.key);
    }
  }

  /** Aspas de los molinos girando (pocas imágenes: barato). */
  spin(dt: number) {
    this.mills = this.mills.filter((m) => m.active);
    for (const m of this.mills) m.rotation += dt * 0.0012;
  }

  /** Al salir de la partida: libera texturas (el mundo de Matter se destruye con la escena). */
  destroy() {
    for (const c of this.chunks) { for (const o of c.objs) o.destroy(); this.scene.textures.remove(c.key); }
    this.chunks = [];
    this.mills = [];
  }

  private push(x: number) {
    if (x > this.seg.x0 + this.seg.len) this.nextSeg(x);
    this.xs.push(x);
    this.ys.push(this.yInSeg(x));
    this.bridge.push(this.seg.kind === 'bridge' && x > this.seg.x0 + 1 && x < this.seg.x0 + this.seg.len - 1);
  }

  private yInSeg(x: number) {
    const s = this.seg;
    const t = Phaser.Math.Clamp((x - s.x0) / s.len, 0, 1);
    switch (s.kind) {
      case 'flat': return s.y0;
      case 'hill': return s.y0 + (s.y1 - s.y0) * (0.5 - 0.5 * Math.cos(Math.PI * t));
      case 'bumps': {
        // ondas completas que empiezan y acaban en y0 (perfil continuo)
        // jorobas redondeadas (sin valles en V donde se encajaría una rueda)
        const n = Math.max(1, Math.round(s.len / s.wl));
        return s.y0 - (0.5 - 0.5 * Math.cos(t * n * Math.PI * 2)) * s.amp;
      }
      case 'ramp': {
        // subida cada vez más empinada (78 % del tramo) y bajada: pequeño salto
        const up = 0.78;
        if (t < up) return s.y0 - s.amp * Math.pow(t / up, 2);
        return s.y0 - s.amp + (s.y1 - (s.y0 - s.amp)) * ((t - up) / (1 - up));
      }
      case 'bridge': {
        // puente colgante: se comba en el centro y cada tabla es un pequeño escalón
        const plank = Math.round((x - s.x0) / STEP) % 2 ? s.wl : 0;
        return s.y0 + Math.sin(Math.PI * t) * s.amp - plank;
      }
    }
  }

  private nextSeg(x: number) {
    // el tramo nuevo arranca exactamente en el último punto: perfil continuo
    const lastX = this.xs[this.xs.length - 1], y0 = this.ys[this.ys.length - 1];
    const d = this.difficulty(x);
    const r = this.rng;
    // llano alrededor del depósito: la carga tiene que llegar tranquila
    const toDepot = this.nextDepotX - DEPOT_FLAT - lastX;
    if (toDepot < 260) {
      const len = this.nextDepotX + DEPOT_FLAT - lastX;
      this.depotXs.push(this.nextDepotX);
      this.nextDepotX += DEPOT_EVERY_M * PX_PER_M;
      this.seg = { kind: 'flat', x0: lastX, y0, len, y1: y0, amp: 0, wl: 1 };
      return;
    }
    const prev = this.seg.kind;
    // tras una rampa, un llano corto para aterrizar: el remolque no se queda atascado en un valle en V
    if (prev === 'ramp') {
      this.seg = { kind: 'flat', x0: lastX, y0, len: Math.min(r.between(220, 320), toDepot), y1: y0, amp: 0, wl: 1 };
      return;
    }
    const w: Record<Kind, number> = { flat: 0.24 - 0.16 * d, hill: 0.46 - 0.08 * d, bumps: 0.12 + 0.12 * d, ramp: 0.04 + 0.12 * d, bridge: d < 0.06 ? 0 : 0.06 + 0.1 * d };
    if (prev === 'bridge') w.bridge = 0;
    let pick = r.frac() * (w.flat + w.hill + w.bumps + w.ramp + w.bridge);
    let kind: Kind = 'hill';
    for (const k of ['flat', 'hill', 'bumps', 'ramp', 'bridge'] as const) { if ((pick -= w[k]) <= 0) { kind = k; break; } }

    const toward = y0 < (Y_MIN + Y_MAX) / 2 ? 1 : -1; // tiende a volver al centro de la banda
    let len = 400, y1 = y0, amp = 0, wl = 100;
    if ((kind === 'ramp' || kind === 'bridge') && toDepot < 460) kind = 'hill';
    if (kind === 'flat') len = r.between(200, 420);
    if (kind === 'hill') {
      len = r.between(420 - 60 * d, 800 - 160 * d);
      const dy = (50 + 220 * d) * r.realInRange(0.5, 1);
      y1 = Phaser.Math.Clamp(y0 + dy * (r.frac() < 0.55 ? toward : -toward), Y_MIN, Y_MAX);
      // pendiente máxima ~25°: con el remolque cargado, una cuesta más empinada no se sube
      len = Math.max(len, Math.abs(y1 - y0) * 3.4);
    }
    if (kind === 'bumps') {
      len = r.between(240, 480);
      // más adelante, a veces lomas largas: a toda velocidad lanzan el remolque y la carga salta
      if (r.frac() < 0.6 * d) { wl = r.between(200, 280); amp = Math.min(14 + 32 * d, wl * 0.16); len = Math.max(len, wl * 2); }
      else { wl = r.between(100, 150); amp = Math.min(8 + 30 * d, wl * (0.12 + 0.1 * d)); }
    }
    if (kind === 'ramp') { len = r.between(340, 440 + 160 * d); amp = Math.min(35 + 90 * d, len * 0.17); // labio de ~24° como mucho: con remolque se sube sin encabritarse
      y1 = Phaser.Math.Clamp(y0 + 10 + 40 * d, Y_MIN, Y_MAX); }
    if (kind === 'bridge') { len = Math.round(r.between(380, 520 + 200 * d) / STEP) * STEP; amp = 14 + 32 * d; wl = 3 + 5 * d; }
    len = Math.min(len, toDepot);
    // si el tramo se acortó para dejar sitio al granero, la colina se suaviza (nunca más de ~25°)
    if (kind === 'hill' && Math.abs(y1 - y0) * 3.4 > len) y1 = y0 + Math.sign(y1 - y0) * (len / 3.4);
    this.seg = { kind, x0: lastX, y0, len, y1, amp, wl };
  }

  private buildChunk() {
    const from = Math.max(0, this.built - 1);
    const to = Math.min(this.xs.length - 1, this.built + CHUNK);
    const bodies: MatterJS.BodyType[] = [];
    for (let i = from; i < to; i++) {
      const x1 = this.xs[i], y1 = this.ys[i], x2 = this.xs[i + 1], y2 = this.ys[i + 1];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const nx = -dy / len, ny = dx / len; // normal hacia abajo
      const th = 40;
      bodies.push(this.scene.matter.add.rectangle((x1 + x2) / 2 + (nx * th) / 2, (y1 + y2) / 2 + (ny * th) / 2, len + 3, th, {
        isStatic: true, angle: Math.atan2(dy, dx), label: 'ground', restitution: 0, friction: 0.95, frictionStatic: 1,
      }));
    }
    // Dibujo horneado en una textura por bloque: el Graphics se teselaría en cada fotograma.
    let minY = Infinity, maxY = -Infinity;
    for (let i = from; i <= to; i++) { minY = Math.min(minY, this.ys[i]); maxY = Math.max(maxY, this.ys[i]); }
    const ox = this.xs[from], oy = minY - 60, depth = 280;
    const w = Math.ceil(this.xs[to] - ox) + 2, h = Math.ceil(maxY - oy + depth);
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const top: Phaser.Math.Vector2[] = [];
    for (let i = from; i <= to; i++) top.push(V(this.xs[i] - ox, this.ys[i] - oy));
    // tierra en capas: hierba arriba, tierra naranja y tierra oscura
    g.fillStyle(SOIL_DEEP);
    g.fillPoints([...top, V(w, h), V(0, h)], true);
    g.fillStyle(SOIL);
    g.fillPoints([...top, ...top.slice().reverse().map((p) => V(p.x, p.y + 120))], true);
    const r = this.rng;
    g.fillStyle(0xa86538);
    for (let i = from; i < to; i += 3) g.fillCircle(this.xs[i] - ox + r.between(-8, 8), this.ys[i] - oy + r.between(50, depth - 30), r.between(4, 9));
    g.fillStyle(GRASS);
    g.fillPoints([...top, ...top.slice().reverse().map((p) => V(p.x, p.y + 26))], true);
    g.fillStyle(GRASS_DARK);
    g.fillPoints([...top.map((p) => V(p.x, p.y + 20)), ...top.slice().reverse().map((p) => V(p.x, p.y + 28))], true);
    g.lineStyle(6, INK); g.strokePoints(top);
    // puentes: barranco con río debajo y tablas con cuerdas
    let b0 = -1;
    for (let i = from; i <= to + 1; i++) {
      const on = i <= to && this.bridge[i];
      if (on && b0 < 0) b0 = i;
      if (!on && b0 >= 0) { this.drawBridge(g, b0, i - 1, ox, oy, h); b0 = -1; }
    }
    // hierbas
    g.lineStyle(3, GRASS_DARK);
    for (let i = from; i < to; i += 2) {
      if (this.bridge[i]) continue;
      const x = this.xs[i] - ox + r.between(-6, 6), y = this.heightAt(this.xs[i]) - oy;
      g.lineBetween(x, y, x - 4, y - 9); g.lineBetween(x + 3, y, x + 5, y - 8);
    }
    const key = `farm-${texId++}`;
    g.generateTexture(key, w, h);
    g.destroy();
    const objs: Phaser.GameObjects.GameObject[] = [
      this.scene.add.image(ox, oy, key).setOrigin(0, 0).setDepth(-1),
      this.scene.add.rectangle(ox, oy + h - 1, w, 2600, SOIL_DEEP).setOrigin(0, 0).setDepth(-1),
    ];
    // decorado detrás del camino: balas de paja, vallas, girasoles y algún molino (sin física)
    for (let i = from + 3; i < to - 3; i += r.between(7, 13)) {
      if (this.bridge[i] || this.bridge[i + 3] || this.bridge[i - 3] || r.frac() < 0.3) continue;
      const tx = this.xs[i], ty = this.heightAt(tx);
      const pick = r.frac();
      if (pick < 0.3) objs.push(this.scene.add.image(tx, ty + 14, 'hay').setOrigin(0.5, 1).setScale(r.realInRange(0.8, 1.05)).setDepth(-1.5));
      else if (pick < 0.6) objs.push(this.scene.add.image(tx, ty + 14, 'fence').setOrigin(0.5, 1).setRotation(Math.atan2(this.heightAt(tx + 50) - this.heightAt(tx - 50), 100)).setDepth(-1.5));
      else if (pick < 0.92) {
        for (let k = 0; k < 3; k++) objs.push(this.scene.add.image(tx + k * 22, this.heightAt(tx + k * 22) + 16, 'flower').setOrigin(0.5, 1).setScale(0.6 + 0.2 * ((k + i) % 3)).setDepth(-1.5));
      } else {
        objs.push(this.scene.add.image(tx, ty + 14, 'mill').setOrigin(0.5, 1).setDepth(-1.6));
        const bl = this.scene.add.image(tx, ty + 14 - 146, 'blades').setDepth(-1.55);
        objs.push(bl);
        this.mills.push(bl);
      }
    }
    this.chunks.push({ endX: this.xs[to], bodies, objs, key });
    this.built = to;
    // depósitos cuyo suelo ya existe
    while (this.depotXs.length && this.depotXs[0] <= this.xs[to]) {
      const sx = this.depotXs.shift()!;
      this.depots.push({ x: sx, y: this.heightAt(sx) });
    }
  }

  /** Barranco con río bajo un puente de tablas (puntos a..b del perfil; puede seguir en el bloque vecino). */
  private drawBridge(g: Phaser.GameObjects.Graphics, a: number, b: number, ox: number, oy: number, h: number) {
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const startEdge = !this.bridge[a - 1], endEdge = !this.bridge[b + 1];
    const deck: Phaser.Math.Vector2[] = [];
    for (let i = a; i <= b; i++) deck.push(V(this.xs[i] - ox, this.ys[i] - oy + 6));
    const xa = deck[0].x, xb = deck[deck.length - 1].x;
    let bottom = 0;
    for (const p of deck) bottom = Math.max(bottom, p.y);
    bottom = Math.min(h - 4, bottom + 170);
    const ia = startEdge ? 30 : 0, ib = endEdge ? 30 : 0;
    // barranco: hueco oscuro bajo las tablas, paredes inclinadas en los extremos y río al fondo
    g.fillStyle(CANYON); g.fillPoints([...deck, V(xb - ib, bottom), V(xa + ia, bottom)], true);
    g.fillStyle(WATER); g.fillRect(xa + ia - 4, bottom - 34, xb - xa - ia - ib + 8, 30);
    g.fillStyle(0xffffff, 0.7);
    for (let x = xa + ia + 10; x < xb - ib - 20; x += 46) g.fillRect(x, bottom - 26, 18, 4);
    g.lineStyle(5, INK);
    if (startEdge) g.lineBetween(xa, deck[0].y, xa + ia, bottom);
    if (endEdge) g.lineBetween(xb, deck[deck.length - 1].y, xb - ib, bottom);
    // tablas
    for (let i = a; i < b; i++) {
      const x1 = this.xs[i] - ox, y1 = this.ys[i] - oy, x2 = this.xs[i + 1] - ox, y2 = this.ys[i + 1] - oy;
      g.fillStyle(i % 2 ? PLANK : 0xb57a3e);
      g.fillPoints([V(x1, y1), V(x2, y2), V(x2, y2 + 12), V(x1, y1 + 12)], true);
      g.lineStyle(3, INK); g.strokePoints([V(x1, y1), V(x2, y2), V(x2, y2 + 12), V(x1, y1 + 12)], true, true);
    }
    // cuerda de barandilla y postes en los extremos
    g.lineStyle(4, 0x7a4a24);
    g.beginPath(); g.moveTo(this.xs[a] - ox, this.ys[a] - oy - 30);
    for (let i = a; i <= b; i++) g.lineTo(this.xs[i] - ox, this.ys[i] - oy - 30);
    g.strokePath();
    g.lineStyle(2, 0x7a4a24);
    for (let i = a; i <= b; i += 3) g.lineBetween(this.xs[i] - ox, this.ys[i] - oy - 30, this.xs[i] - ox, this.ys[i] - oy);
    for (const [on, i] of [[startEdge, a], [endEdge, b]] as const) {
      if (!on) continue;
      const x = this.xs[i] - ox, y = this.ys[i] - oy;
      g.fillStyle(0x8a5a2b); g.fillRect(x - 5, y - 46, 10, 50);
      g.lineStyle(3, INK); g.strokeRect(x - 5, y - 46, 10, 50);
    }
  }
}
