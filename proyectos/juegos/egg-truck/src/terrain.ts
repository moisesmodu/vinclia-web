import Phaser from 'phaser';
import { PX_PER_M } from './state';

/**
 * Terreno infinito por tramos (llano, colina, baches, rampa), cada vez más exigente.
 * Física: una cadena de rectángulos estáticos. Dibujo: un Graphics por bloque de ~1000 px.
 * Lo que queda detrás de la cámara se destruye para que el móvil no acumule cuerpos.
 */

const STEP = 24;           // separación entre puntos del perfil
const CHUNK = 40;          // puntos por bloque
const Y_MIN = 200, Y_MAX = 1150, Y_START = 620;
const FULL_DIFFICULTY_M = 320;

type Seg = { kind: 'flat' | 'hill' | 'bumps' | 'ramp'; x0: number; y0: number; len: number; y1: number; amp: number; wl: number };
type Chunk = { endX: number; bodies: MatterJS.BodyType[]; img: Phaser.GameObjects.Image; fill: Phaser.GameObjects.Rectangle; key: string };
const DIRT = 0xb7814e;
let texId = 0; // global: los nombres de textura no se repiten entre partidas

export type StarSpot = { x: number; y: number };

export class Terrain {
  private xs: number[] = [];
  private ys: number[] = [];
  private seg!: Seg;
  private chunks: Chunk[] = [];
  private built = 0;              // puntos ya convertidos en bloques
  readonly stars: StarSpot[] = []; // estrellas pendientes de colocar (las recoge Play)

  constructor(private scene: Phaser.Scene, private startX: number, private rng: Phaser.Math.RandomDataGenerator) {
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
      c.img.destroy();
      c.fill.destroy();
      this.scene.textures.remove(c.key);
    }
  }

  /** Al salir de la partida: libera texturas y cuerpos. */
  destroy() {
    // el mundo de Matter se destruye con la escena: aquí solo se liberan imágenes y texturas
    for (const c of this.chunks) { c.img.destroy(); c.fill.destroy(); this.scene.textures.remove(c.key); }
    this.chunks = [];
  }

  private push(x: number) {
    if (x > this.seg.x0 + this.seg.len) this.nextSeg(x);
    this.xs.push(x);
    this.ys.push(this.yInSeg(x));
  }

  private yInSeg(x: number) {
    const s = this.seg;
    const t = Phaser.Math.Clamp((x - s.x0) / s.len, 0, 1);
    switch (s.kind) {
      case 'flat': return s.y0;
      case 'hill': return s.y0 + (s.y1 - s.y0) * (0.5 - 0.5 * Math.cos(Math.PI * t));
      case 'bumps': return s.y0 - Math.abs(Math.sin(((x - s.x0) / s.wl) * Math.PI)) * s.amp;
      case 'ramp': {
        // subida cada vez más empinada (78 % del tramo) y caída brusca: salto
        const up = 0.78;
        if (t < up) return s.y0 - s.amp * Math.pow(t / up, 2);
        return s.y0 - s.amp + (s.y1 - (s.y0 - s.amp)) * ((t - up) / (1 - up));
      }
    }
  }

  private nextSeg(x: number) {
    // el tramo nuevo arranca exactamente en el último punto: perfil continuo
    const lastX = this.xs[this.xs.length - 1], y0 = this.ys[this.ys.length - 1];
    const d = this.difficulty(x);
    const r = this.rng;
    const w = { flat: 0.3 - 0.25 * d, hill: 0.5 - 0.1 * d, bumps: 0.12 + 0.13 * d, ramp: 0.08 + 0.22 * d };
    let pick = r.frac() * (w.flat + w.hill + w.bumps + w.ramp);
    let kind: Seg['kind'] = 'hill';
    for (const k of ['flat', 'hill', 'bumps', 'ramp'] as const) { if ((pick -= w[k]) <= 0) { kind = k; break; } }

    const toward = y0 < (Y_MIN + Y_MAX) / 2 ? 1 : -1; // tiende a volver al centro de la banda
    let len = 400, y1 = y0, amp = 0, wl = 100;
    if (kind === 'flat') len = r.between(200, 420);
    if (kind === 'hill') {
      len = r.between(380 - 40 * d, 760 - 120 * d);
      const dy = (60 + 230 * d) * r.realInRange(0.5, 1);
      y1 = Phaser.Math.Clamp(y0 + dy * (r.frac() < 0.55 ? toward : -toward), Y_MIN, Y_MAX);
    }
    if (kind === 'bumps') { len = r.between(260, 520); amp = 10 + 26 * d; wl = r.between(70, 120); }
    if (kind === 'ramp') {
      len = r.between(280, 360);
      amp = 70 + 110 * d;
      y1 = Phaser.Math.Clamp(y0 + 40 + 120 * d, Y_MIN, Y_MAX);
      // estrellas en arco sobre el salto: premian volar
      const xEnd = x + len;
      for (let i = 0; i < 4; i++) this.stars.push({ x: xEnd + 70 + i * 70, y: y0 - amp - 70 - Math.sin((i / 3) * Math.PI) * 70 });
    } else if (r.frac() < 0.55) {
      const n = r.between(3, 5), sx = x + r.between(40, Math.max(60, len - 260));
      for (let i = 0; i < n; i++) this.stars.push({ x: sx + i * 56, y: NaN }); // altura al construir
    }
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
        isStatic: true, angle: Math.atan2(dy, dx), friction: 0.95, frictionStatic: 1, label: 'ground', restitution: 0,
      }));
    }
    // Dibujo horneado en una textura por bloque: el Graphics se teselaría en cada fotograma.
    let minY = Infinity, maxY = -Infinity;
    for (let i = from; i <= to; i++) { minY = Math.min(minY, this.ys[i]); maxY = Math.max(maxY, this.ys[i]); }
    const ox = this.xs[from], oy = minY - 20, depth = 240;
    const w = Math.ceil(this.xs[to] - ox) + 2, h = Math.ceil(maxY - oy + depth);
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const top: Phaser.Math.Vector2[] = [];
    for (let i = from; i <= to; i++) top.push(new Phaser.Math.Vector2(this.xs[i] - ox, this.ys[i] - oy));
    g.fillStyle(DIRT);
    g.fillPoints([...top, new Phaser.Math.Vector2(w, h), new Phaser.Math.Vector2(0, h)], true);
    g.fillStyle(0x9c6a3c);
    for (let i = from; i < to; i += 3) {
      const r = this.rng;
      g.fillCircle(this.xs[i] - ox + r.between(-8, 8), this.ys[i] - oy + r.between(50, depth - 30), r.between(5, 12));
    }
    g.lineStyle(22, 0x58c556); g.strokePoints(top.map((p) => new Phaser.Math.Vector2(p.x, p.y + 9)));
    g.lineStyle(6, 0x2b2340); g.strokePoints(top);
    g.lineStyle(4, 0x7ee07a); g.strokePoints(top.map((p) => new Phaser.Math.Vector2(p.x, p.y + 6)));
    const key = `ground-${texId++}`;
    g.generateTexture(key, w, h);
    g.destroy();
    const img = this.scene.add.image(ox, oy, key).setOrigin(0, 0).setDepth(-1);
    const fill = this.scene.add.rectangle(ox, oy + h - 1, w, 2600, DIRT).setOrigin(0, 0).setDepth(-1);
    this.chunks.push({ endX: this.xs[to], bodies, img, fill, key });
    this.built = to;
    for (const s of this.stars) if (Number.isNaN(s.y) && s.x <= this.xs[to]) s.y = this.heightAt(s.x) - 70;
  }
}
