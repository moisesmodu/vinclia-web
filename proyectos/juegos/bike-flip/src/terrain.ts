import Phaser from 'phaser';
import { PX_PER_M } from './state';
import type { Level } from './levels';

/**
 * Terreno de un nivel a partir de sus tramos (levels.ts). Motor sacado de Egg Truck:
 * física = cadena de rectángulos estáticos; dibujo = una textura horneada por bloque de ~1000 px.
 * Novedad: huecos sin suelo (segmentos marcados en `gap`). Se construye por delante de la moto y se
 * destruye por detrás, así los cuerpos y la memoria son constantes en niveles largos.
 */

const STEP = 25;           // separación entre puntos del perfil (2 por metro)
const CHUNK = 24;          // puntos por bloque (600 px: texturas pequeñas, picos de carga cortos)
const Y0 = 600;
export const START_X = 0;

const DIRT = 0xf2b65e;     // arena
const DIRT_DARK = 0xe0974a;
const TOP = 0xff7a3d;      // franja naranja de la superficie
const TOP_LIGHT = 0xffa86b;
const INK = 0x2b2340;
let texId = 0; // global: los nombres de textura no se repiten entre partidas

type Chunk = { endX: number; bodies: MatterJS.BodyType[]; imgs: Phaser.GameObjects.GameObject[]; key: string };

export class Terrain {
  readonly xs: number[] = [];
  readonly ys: number[] = [];
  /** gap[i] = true si entre el punto i y el i+1 no hay suelo. */
  readonly gap: boolean[] = [];
  readonly finishX: number;
  readonly endX: number;
  /** Altura más baja del nivel: por debajo de ella (+ margen) la moto ha caído a un hueco. */
  readonly maxY: number;
  private chunks: Chunk[] = [];
  private built = 0;
  private rng = new Phaser.Math.RandomDataGenerator(['bike-flip']);
  culledUntil = -Infinity;

  constructor(private scene: Phaser.Scene, level: Level) {
    const M = PX_PER_M;
    let x = START_X - 600, y = Y0;
    this.add(x, y);
    const line = (len: number, f: (t: number) => number) => {
      const n = Math.max(1, Math.round((len * M) / STEP));
      const x0 = x, y0 = y;
      for (let i = 1; i <= n; i++) { const t = i / n; this.add(x0 + i * STEP, y0 + f(t)); }
      x = x0 + n * STEP; y = this.ys[this.ys.length - 1];
    };
    line(600 / M + 6, () => 0); // llano de salida (la moto empieza en START_X)
    for (const s of level.segs) {
      switch (s[0]) {
        case 'F': line(s[1], () => 0); break;
        case 'H': { const dy = s[2] * M; line(s[1], (t) => dy * (0.5 - 0.5 * Math.cos(Math.PI * t))); break; }
        case 'B': { const a = s[2] * M, wl = s[3] * M, len = s[1] * M; line(s[1], (t) => -Math.abs(Math.sin(((t * len) / wl) * Math.PI)) * a); break; }
        case 'R': {
          // perfil t^p con la pendiente final fija (tan = 0,72 ≈ 36°): todas las rampas lanzan igual, la altura cambia la velocidad
          const h = s[2] * M, p = Math.max(1, (0.72 * s[1]) / s[2]);
          line(s[1], (t) => -h * Math.pow(t, p));
          break;
        }
        case 'W': { const h = s[2] * M; line(s[1], (t) => -h * Math.sin(Math.PI * t)); break; }
        case 'G': {
          this.gap[this.xs.length - 1] = true;
          x += Math.round((s[1] * M) / STEP) * STEP; y += s[2] * M;
          this.add(x, y);
          break;
        }
      }
    }
    line(4, () => 0);
    this.finishX = x;
    line(30, () => 0);
    this.endX = x;
    // muro final: el nivel no sigue
    this.add(x + 1, y - 400);
    this.maxY = Math.max(...this.ys);
  }

  private add(x: number, y: number) { this.xs.push(x); this.ys.push(y); this.gap.push(false); }

  private idx(x: number) { return Phaser.Math.Clamp(Math.floor((x - this.xs[0]) / STEP), 0, this.xs.length - 2); }

  /** Altura del suelo en x (interpolación lineal; en un hueco, la recta entre los dos bordes). */
  heightAt(x: number) {
    let i = this.idx(x);
    while (i > 0 && this.xs[i] > x) i--;
    while (i < this.xs.length - 2 && this.xs[i + 1] < x) i++;
    const t = Phaser.Math.Clamp((x - this.xs[i]) / (this.xs[i + 1] - this.xs[i]), 0, 1);
    return this.ys[i] + (this.ys[i + 1] - this.ys[i]) * t;
  }

  isGap(x: number) {
    let i = this.idx(x);
    while (i > 0 && this.xs[i] > x) i--;
    while (i < this.xs.length - 2 && this.xs[i + 1] < x) i++;
    return this.gap[i];
  }

  /**
   * Construye bloques hasta x. Con `ops` limitado (en la partida, 1 por fotograma) cada bloque se hace en dos
   * fotogramas: primero los cuerpos físicos y después la textura, para no juntar los dos picos en uno.
   */
  ensure(untilX: number, ops = Infinity) {
    while (ops > 0 && (this.pending || this.upload || (this.built < this.xs.length - 1 && this.xs[this.built] < untilX))) {
      if (this.upload) { this.upload(); this.upload = null; } else if (this.pending) { this.drawChunk(this.pending); this.pending = null; } else this.pending = this.buildBodies();
      ops--;
    }
  }

  /** Elimina bloques que ya quedaron atrás. */
  cull(beforeX: number) {
    while (this.chunks.length > 1 && this.chunks[0].endX < beforeX) {
      const c = this.chunks.shift()!;
      for (const b of c.bodies) this.scene.matter.world.remove(b);
      for (const o of c.imgs) o.destroy();
      this.scene.textures.remove(c.key);
      this.culledUntil = c.endX;
    }
  }

  /** Al salir de la partida: libera imágenes y texturas (el mundo de Matter se destruye con la escena). */
  destroy() {
    for (const c of this.chunks) { for (const o of c.imgs) o.destroy(); this.scene.textures.remove(c.key); }
    this.chunks = [];
    this.pending = null;
    this.upload = null;
  }

  private pending: { from: number; to: number; bodies: MatterJS.BodyType[] } | null = null;
  /** Tercer paso de un bloque: subir la textura a la GPU y crear la imagen (en otro fotograma). */
  private upload: (() => void) | null = null;

  private buildBodies() {
    const from = this.built;
    const to = Math.min(this.xs.length - 1, from + CHUNK);
    const bodies: MatterJS.BodyType[] = [];
    // segmentos seguidos con la misma pendiente (llanos, rampas rectas) = un solo cuerpo: menos trabajo para Matter
    const ang = (i: number) => Math.atan2(this.ys[i + 1] - this.ys[i], this.xs[i + 1] - this.xs[i]);
    let i = from;
    while (i < to) {
      if (this.gap[i]) { i++; continue; }
      let j = i + 1;
      while (j < to && !this.gap[j] && Math.abs(ang(j) - ang(i)) < 0.004) j++;
      const x1 = this.xs[i], y1 = this.ys[i], x2 = this.xs[j], y2 = this.ys[j];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const nx = -dy / len, ny = dx / len; // normal hacia abajo
      const th = 44;
      bodies.push(this.scene.matter.add.rectangle((x1 + x2) / 2 + (nx * th) / 2, (y1 + y2) / 2 + (ny * th) / 2, len + 3, th, {
        isStatic: true, angle: Math.atan2(dy, dx), friction: 0.95, frictionStatic: 1, label: 'ground', restitution: 0,
      }));
      i = j;
    }
    this.built = to;
    return { from, to, bodies };
  }

  private drawChunk({ from, to, bodies }: { from: number; to: number; bodies: MatterJS.BodyType[] }) {
    // Tramos continuos dentro del bloque (un hueco corta el dibujo)
    const runs: [number, number][] = [];
    let s = from;
    for (let i = from; i < to; i++) if (this.gap[i]) { if (i > s) runs.push([s, i]); s = i + 1; }
    if (to > s) runs.push([s, to]);

    let minY = Infinity, maxY = -Infinity;
    for (let i = from; i <= to; i++) { minY = Math.min(minY, this.ys[i]); maxY = Math.max(maxY, this.ys[i]); }
    const ox = this.xs[from] - 4, oy = minY - 20, depth = 160;
    const w = Math.ceil(this.xs[to] - ox) + 8, h = Math.ceil(maxY - oy + depth);
    // Lienzo 2D propio: Graphics.generateTexture pide un lienzo "willReadFrequently" (dibujo por CPU, lento)
    const key = `bf-ground-${texId++}`;
    const tex = this.scene.textures.createCanvas(key, w, h)!;
    const ctx = tex.getContext();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const css = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
    const imgs: Phaser.GameObjects.GameObject[] = [];
    for (const [a, b] of runs) {
      const left = this.gap[a - 1], right = this.gap[b];
      const path = (dy: number) => {
        ctx.beginPath();
        for (let i = a; i <= b; i++) ctx[i === a ? 'moveTo' : 'lineTo'](this.xs[i] - ox, this.ys[i] - oy + dy);
      };
      // relleno 4 px más ancho por los lados que no son hueco: los bordes suavizados de dos bloques vecinos
      // dejarían ver una raya vertical
      const el = left ? 0 : 4, er = right ? 0 : 4;
      path(0);
      ctx.lineTo(this.xs[b] - ox + er, this.ys[b] - oy); ctx.lineTo(this.xs[b] - ox + er, h);
      ctx.lineTo(this.xs[a] - ox - el, h); ctx.lineTo(this.xs[a] - ox - el, this.ys[a] - oy); ctx.closePath();
      ctx.fillStyle = css(DIRT); ctx.fill();
      // capas de roca: manchas ovaladas más oscuras
      ctx.fillStyle = css(DIRT_DARK);
      for (let i = a; i < b; i += 2) {
        const r = this.rng;
        ctx.beginPath();
        ctx.ellipse(this.xs[i] - ox + r.between(-6, 6), this.ys[i] - oy + r.between(70, depth - 30), r.between(7, 15), r.between(3, 5), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      path(11); ctx.lineWidth = 26; ctx.strokeStyle = css(TOP); ctx.stroke();
      path(6); ctx.lineWidth = 5; ctx.strokeStyle = css(TOP_LIGHT); ctx.stroke();
      path(0); ctx.lineWidth = 6; ctx.strokeStyle = css(INK); ctx.stroke();
      // bordes de los huecos: acantilado con contorno
      ctx.lineWidth = 6; ctx.strokeStyle = css(INK);
      if (left) { ctx.beginPath(); ctx.moveTo(this.xs[a] - ox, this.ys[a] - oy); ctx.lineTo(this.xs[a] - ox, h); ctx.stroke(); }
      if (right) { ctx.beginPath(); ctx.moveTo(this.xs[b] - ox, this.ys[b] - oy); ctx.lineTo(this.xs[b] - ox, h); ctx.stroke(); }
      const fx = this.xs[a], fw = this.xs[b] - this.xs[a];
      imgs.push(this.scene.add.rectangle(fx, oy + h - 1, fw, 3000, DIRT).setOrigin(0, 0).setDepth(-1.2));
      if (left) imgs.push(this.scene.add.rectangle(fx - 3, oy + h - 1, 6, 3000, INK).setOrigin(0, 0).setDepth(-1.2));
      if (right) imgs.push(this.scene.add.rectangle(fx + fw - 3, oy + h - 1, 6, 3000, INK).setOrigin(0, 0).setDepth(-1.2));
    }
    const chunk: Chunk = { endX: this.xs[to], bodies, imgs, key };
    this.chunks.push(chunk);
    this.upload = () => { tex.refresh(); imgs.push(this.scene.add.image(ox, oy, key).setOrigin(0, 0).setDepth(-1)); };
  }
}
