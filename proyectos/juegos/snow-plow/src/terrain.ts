import Phaser from 'phaser';
import { PX_PER_M, SLEIGH_EVERY_M } from './state';

/**
 * Carretera nevada infinita por tramos (llano, colina, baches, rampa), copiada del motor de Egg Truck.
 * Novedades: placas de hielo (fricción casi nula) cada vez más frecuentes y un llano garantizado
 * alrededor de cada trineo de Papá Noel (cada 150 m).
 * Física: una cadena de rectángulos estáticos. Dibujo: una textura horneada por bloque de ~1000 px.
 * Lo que queda detrás de la cámara se destruye para que el móvil no acumule cuerpos.
 */

const STEP = 24;           // separación entre puntos del perfil
const CHUNK = 40;          // puntos por bloque
const Y_MIN = 200, Y_MAX = 1150, Y_START = 620;
const FULL_DIFFICULTY_M = 750;
const SLEIGH_FLAT = 260;   // medio llano alrededor del trineo (px)

type Seg = { kind: 'flat' | 'hill' | 'bumps' | 'ramp'; x0: number; y0: number; len: number; y1: number; amp: number; wl: number; ice: boolean };
type Chunk = { endX: number; bodies: MatterJS.BodyType[]; objs: Phaser.GameObjects.GameObject[]; key: string };
const SNOW = 0xeef4ff, SNOW_SHADE = 0xc5d4ee, SNOW_DEEP = 0x9fb3d9, ICE = 0x8fe3ff, INK = 0x2b2340;
let texId = 0; // global: los nombres de textura no se repiten entre partidas

export type SleighSpot = { x: number; y: number };

export class Terrain {
  private xs: number[] = [];
  private ys: number[] = [];
  private ice: boolean[] = [];
  private seg!: Seg;
  private chunks: Chunk[] = [];
  private built = 0;               // puntos ya convertidos en bloques
  private nextSleighX: number;
  readonly sleighs: SleighSpot[] = []; // trineos con su suelo ya construido (los coloca Play)
  private sleighXs: number[] = [];
  private lights: Phaser.GameObjects.Image[] = [];

  constructor(private scene: Phaser.Scene, private startX: number, private rng: Phaser.Math.RandomDataGenerator) {
    this.nextSleighX = startX + SLEIGH_EVERY_M * PX_PER_M;
    this.seg = { kind: 'flat', x0: startX - 600, y0: Y_START, len: 1100, y1: Y_START, amp: 0, wl: 1, ice: false };
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

  /** ¿Hay hielo en x? (para el chirrido de las ruedas y el tutorial) */
  iceAt(x: number) {
    const i = Math.floor((x - this.xs[0]) / STEP);
    return i >= 0 && i < this.ice.length && this.ice[i];
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

  /** Las luces de los abetos alternan entre dos fases (parpadeo barato: un cambio de textura). */
  blink(phase: number) {
    this.lights = this.lights.filter((l) => l.active);
    for (const l of this.lights) l.setTexture(`tree-lights${(phase + Math.round(l.x / STEP)) & 1}`);
  }

  /** Al salir de la partida: libera texturas (el mundo de Matter se destruye con la escena). */
  destroy() {
    for (const c of this.chunks) { for (const o of c.objs) o.destroy(); this.scene.textures.remove(c.key); }
    this.chunks = [];
  }

  private push(x: number) {
    if (x > this.seg.x0 + this.seg.len) this.nextSeg(x);
    this.xs.push(x);
    this.ys.push(this.yInSeg(x));
    this.ice.push(this.seg.ice);
  }

  private yInSeg(x: number) {
    const s = this.seg;
    const t = Phaser.Math.Clamp((x - s.x0) / s.len, 0, 1);
    switch (s.kind) {
      case 'flat': return s.y0;
      case 'hill': return s.y0 + (s.y1 - s.y0) * (0.5 - 0.5 * Math.cos(Math.PI * t));
      case 'bumps': {
        // ondas completas que empiezan y acaban en y0 (perfil continuo)
        const n = Math.max(1, Math.round(s.len / s.wl));
        return s.y0 - Math.abs(Math.sin(t * n * Math.PI)) * s.amp;
      }
      case 'ramp': {
        // subida cada vez más empinada (78 % del tramo) y bajada: pequeño salto
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
    // llano alrededor del trineo: los regalos tienen que poder llegar quietos
    const toSleigh = this.nextSleighX - SLEIGH_FLAT - lastX;
    if (toSleigh < 260) {
      const len = this.nextSleighX + SLEIGH_FLAT - lastX;
      this.sleighXs.push(this.nextSleighX);
      this.nextSleighX += SLEIGH_EVERY_M * PX_PER_M;
      this.seg = { kind: 'flat', x0: lastX, y0, len, y1: y0, amp: 0, wl: 1, ice: false };
      return;
    }
    const w = { flat: 0.26 - 0.18 * d, hill: 0.5 - 0.05 * d, bumps: 0.14 + 0.14 * d, ramp: 0.04 + 0.12 * d };
    let pick = r.frac() * (w.flat + w.hill + w.bumps + w.ramp);
    let kind: Seg['kind'] = 'hill';
    for (const k of ['flat', 'hill', 'bumps', 'ramp'] as const) { if ((pick -= w[k]) <= 0) { kind = k; break; } }

    const toward = y0 < (Y_MIN + Y_MAX) / 2 ? 1 : -1; // tiende a volver al centro de la banda
    let len = 400, y1 = y0, amp = 0, wl = 100;
    if (kind === 'ramp' && toSleigh < 420) kind = 'hill';
    if (kind === 'flat') len = r.between(200, 420);
    if (kind === 'hill') {
      len = r.between(420 - 60 * d, 800 - 160 * d);
      const dy = (50 + 210 * d) * r.realInRange(0.5, 1);
      y1 = Phaser.Math.Clamp(y0 + dy * (r.frac() < 0.55 ? toward : -toward), Y_MIN, Y_MAX);
    }
    if (kind === 'bumps') { len = r.between(240, 480); amp = 6 + 18 * d; wl = r.between(90, 140); }
    if (kind === 'ramp') { len = r.between(300, 380); amp = 40 + 70 * d; y1 = Phaser.Math.Clamp(y0 + 30 + 80 * d, Y_MIN, Y_MAX); }
    len = Math.min(len, toSleigh);
    // hielo: aparece a partir de unos 60 m y cada vez más a menudo (nunca en rampas ni baches)
    const ice = (kind === 'flat' || kind === 'hill') && d > 0.08 && r.frac() < 0.12 + 0.3 * d;
    this.seg = { kind, x0: lastX, y0, len, y1, amp, wl, ice };
  }

  private buildChunk() {
    const from = Math.max(0, this.built - 1);
    const to = Math.min(this.xs.length - 1, this.built + CHUNK);
    const bodies: MatterJS.BodyType[] = [];
    for (let i = from; i < to; i++) {
      const x1 = this.xs[i], y1 = this.ys[i], x2 = this.xs[i + 1], y2 = this.ys[i + 1];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const nx = -dy / len, ny = dx / len; // normal hacia abajo
      const th = 40, ice = this.ice[i] && this.ice[i + 1];
      bodies.push(this.scene.matter.add.rectangle((x1 + x2) / 2 + (nx * th) / 2, (y1 + y2) / 2 + (ny * th) / 2, len + 3, th, {
        isStatic: true, angle: Math.atan2(dy, dx), label: 'ground', restitution: 0,
        friction: ice ? 0.025 : 0.95, frictionStatic: ice ? 0.05 : 1,
      }));
    }
    // Dibujo horneado en una textura por bloque: el Graphics se teselaría en cada fotograma.
    let minY = Infinity, maxY = -Infinity;
    for (let i = from; i <= to; i++) { minY = Math.min(minY, this.ys[i]); maxY = Math.max(maxY, this.ys[i]); }
    const ox = this.xs[from], oy = minY - 20, depth = 240;
    const w = Math.ceil(this.xs[to] - ox) + 2, h = Math.ceil(maxY - oy + depth);
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const top: Phaser.Math.Vector2[] = [];
    for (let i = from; i <= to; i++) top.push(V(this.xs[i] - ox, this.ys[i] - oy));
    // nieve en capas: blanca arriba y cada vez más azul hacia abajo
    g.fillStyle(SNOW_DEEP);
    g.fillPoints([...top, V(w, h), V(0, h)], true);
    g.fillStyle(SNOW_SHADE);
    g.fillPoints([...top, ...top.slice().reverse().map((p) => V(p.x, p.y + 110))], true);
    g.fillStyle(SNOW);
    g.fillPoints([...top, ...top.slice().reverse().map((p) => V(p.x, p.y + 34))], true);
    // copos de sombra y piedrecitas
    const r = this.rng;
    g.fillStyle(0xb2c3e3);
    for (let i = from; i < to; i += 3) g.fillCircle(this.xs[i] - ox + r.between(-8, 8), this.ys[i] - oy + r.between(60, depth - 30), r.between(4, 10));
    g.fillStyle(0xffffff, 0.9);
    for (let i = from; i < to; i += 2) g.fillCircle(this.xs[i] - ox + r.between(-6, 6), this.ys[i] - oy + r.between(10, 26), r.between(2, 4));
    g.lineStyle(6, INK); g.strokePoints(top);
    // hielo: franja azul brillante con reflejos
    for (let i = from; i < to; i++) {
      if (!(this.ice[i] && this.ice[i + 1])) continue;
      const a = top[i - from], b = top[i - from + 1];
      g.fillStyle(ICE, 0.9);
      g.fillPoints([V(a.x, a.y + 3), V(b.x, b.y + 3), V(b.x, b.y + 16), V(a.x, a.y + 16)], true);
      g.lineStyle(4, 0x3fb6ea); g.lineBetween(a.x, a.y, b.x, b.y);
      if (i % 3 === 0) { g.lineStyle(3, 0xffffff, 0.95); g.lineBetween(a.x + 4, a.y + 8, a.x + 14, a.y + 7 + (b.y - a.y) * 0.4); }
    }
    const key = `snow-${texId++}`;
    g.generateTexture(key, w, h);
    g.destroy();
    const objs: Phaser.GameObjects.GameObject[] = [
      this.scene.add.image(ox, oy, key).setOrigin(0, 0).setDepth(-1),
      this.scene.add.rectangle(ox, oy + h - 1, w, 2600, SNOW_DEEP).setOrigin(0, 0).setDepth(-1),
    ];
    // abetos con luces de Navidad detrás de la carretera (decorado, sin física)
    for (let i = from + 4; i < to - 2; i += r.between(9, 16)) {
      if (this.ice[i] || r.frac() < 0.35) continue;
      const tx = this.xs[i], ty = this.heightAt(tx);
      const s = r.realInRange(0.7, 1.1);
      objs.push(this.scene.add.image(tx, ty + 10, 'tree').setOrigin(0.5, 1).setScale(s).setDepth(-1.5)
        .setTint(r.frac() < 0.5 ? 0xffffff : 0xdde6ff));
      const lights = this.scene.add.image(tx, ty + 10, 'tree-lights0').setOrigin(0.5, 1).setScale(s).setDepth(-1.4);
      objs.push(lights);
      this.lights.push(lights);
    }
    this.chunks.push({ endX: this.xs[to], bodies, objs, key });
    this.built = to;
    // trineos cuyo suelo ya existe
    while (this.sleighXs.length && this.sleighXs[0] <= this.xs[to]) {
      const sx = this.sleighXs.shift()!;
      this.sleighs.push({ x: sx, y: this.heightAt(sx) });
    }
  }
}

