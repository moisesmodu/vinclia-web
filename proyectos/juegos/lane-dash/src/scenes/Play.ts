import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { save } from '../state';
import { PX } from './Boot';

/**
 * Lane Dash: corredor de 3 carriles en pseudo-3D (proyección 2D hecha a mano, sin librería 3D).
 * Mundo: x = carril (-1, 0, 1; 1 unidad = ancho de carril), y = altura, wz = distancia recorrida.
 * Cámara detrás y encima del carrito: z = wz - (dist - P_Z); pantalla = centro + x·S/z, horizonte + (camH - y)·S/z.
 * Estático (suelo, estanterías, tablas) horneado en una textura por tamaño de pantalla; lo que se mueve
 * (baldosas, productos, postes) en un solo Graphics de triángulos; obstáculos y monedas: imágenes de un pool.
 */

export type Kind = 'box' | 'sign' | 'cart' | 'wet' | 'coin' | 'turbo' | 'magnet';
export interface Obj {
  kind: Kind; img: Phaser.GameObjects.Image; wz: number; x: number; y: number;
  on: boolean; knocked: boolean; vx: number; vy: number; spin: number;
}

const P_Z = 4;            // distancia cámara-carrito
const FAR = 62;           // aparecen a esta distancia
const DYN_FAR = 30;       // hasta aquí se dibujan productos y baldosas que se mueven
const HALF = 1.75;        // medio ancho del pasillo
const SHELF_H = 4.0;
const CEIL = 4.7;
const SEG = 2.5;          // largo de un tramo de estantería
const BOARDS = [0.12, 0.92, 1.72, 2.52, 3.25, 3.92];
const PRODUCT = [0xff5d5d, 0xffd23f, 0x3ddc84, 0xff9f43, 0x9b6bff, 0xffffff, 0xff9ec7, 0x6cc8ff];
const GRAV = 27, JUMP_V = 7.2, DUCK_T = 0.7;
const TOP: Record<string, number> = { box: 0.6, cart: 1.3, wet: 1.2 };
const SIGN_BOTTOM = 0.78;
const TEXW: Record<Kind, number> = { box: 260, sign: 250, cart: 280, wet: 250, coin: 80, turbo: 150, magnet: 150 };
const WORLDW: Record<Kind, number> = { box: 1.0, sign: 1.0, cart: 1.05, wet: 0.95, coin: 0.36, turbo: 0.55, magnet: 0.55 };

export class Play extends Phaser.Scene {
  private static firstRun = true;
  // estado de la partida (todo se reinicia en create: la instancia se reutiliza)
  alive = false;
  revived = false;
  paused = true;
  dist = 0;
  coins = 0;
  speed = 13;
  time0 = 0;
  lane = 0;
  px = 0;
  py = 0;
  vy = 0;
  duckT = 0;
  turboT = 0;
  magnetT = 0;
  invulnT = 0;
  objs: Obj[] = [];
  private pool = new Map<string, Phaser.GameObjects.Image[]>();
  private nextRow = 0;
  private freeLane = 0;
  private nextTag = 0;
  private tutorialRows = 0;
  private faceT = 0;
  private lastFace = '';
  private lean = 0;
  // proyección (se recalcula al cambiar el tamaño)
  private S = 500; private cx = 400; private vw = 800; private hy = 150; private camH = 1.3;
  private bg!: Phaser.GameObjects.Image;
  private bgKey = '';
  private dyn!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Image;
  private streaks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkle!: Phaser.GameObjects.Particles.ParticleEmitter;
  private rnd!: Phaser.Math.RandomDataGenerator;
  private bgN = 0;
  private runId = 0;

  constructor() { super('Play'); }

  async create() {
    this.alive = true; this.revived = false; this.paused = true;
    this.dist = 0; this.coins = 0; this.speed = 13; this.time0 = 0;
    this.lane = 0; this.px = 0; this.py = 0; this.vy = 0; this.duckT = 0;
    this.turboT = 0; this.magnetT = 0; this.invulnT = 0;
    this.objs = []; this.pool = new Map();
    this.nextRow = 26; this.freeLane = 0; this.nextTag = 160; this.faceT = 0; this.lastFace = ''; this.lean = 0;
    this.tutorialRows = !save.get('tutorialDone') || save.get('runs') < 2 ? 4 : 0;
    this.rnd = new Phaser.Math.RandomDataGenerator([`${Date.now()}`]);

    this.bg = this.add.image(0, 0, '__WHITE').setOrigin(0, 0).setDepth(-2000);
    this.dyn = this.add.graphics().setDepth(-1500);
    this.player = this.add.image(0, 0, 'cart-normal').setOrigin(0.5, 268 / 280);
    this.streaks = this.add.particles(0, 0, 'streak', {
      x: { min: -1, max: 1 }, lifespan: 380, speedY: { min: 900, max: 1500 }, alpha: { start: 0.7, end: 0 },
      scaleY: { min: 0.6, max: 1.4 }, frequency: 30, emitting: false,
    }).setDepth(50);
    this.sparkle = this.add.particles(0, 0, 'ic-star', {
      speed: { min: 120, max: 300 }, lifespan: 450, scale: { start: 0.22, end: 0 }, gravityY: 500, emitting: false,
    }).setDepth(60);

    this.layout();
    this.scale.on('resize', this.layout, this);

    const kb = this.input.keyboard!;
    const keys: [string, 'left' | 'right' | 'up' | 'down'][] = [
      ['LEFT', 'left'], ['A', 'left'], ['RIGHT', 'right'], ['D', 'right'], ['UP', 'up'], ['W', 'up'], ['SPACE', 'up'], ['DOWN', 'down'], ['S', 'down'],
    ];
    for (const [k, d] of keys) kb.on(`keydown-${k}`, () => this.act(d));

    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      this.runId++;
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      kb.removeAllListeners();
      this.scene.stop('Hud');
      if (this.bgKey && this.textures.exists(this.bgKey)) this.textures.remove(this.bgKey);
      this.bgKey = '';
    });

    save.set('runs', save.get('runs') + 1);
    this.place();
    // Anuncio intersticial en pausa natural: antes de cada partida salvo la primera de la sesión.
    const run = ++this.runId;
    if (!Play.firstRun) await portal.commercialBreak();
    Play.firstRun = false;
    if (run !== this.runId) return; // la escena se cerró durante el anuncio
    this.paused = false;
    portal.gameplayStart();
  }

  /* ---------------------------------------------------------------- proyección y fondo */

  private layout() {
    const w = this.scale.width, h = this.scale.height, portrait = h > w;
    // en vertical la cámara sube (para ver lejos en una pantalla estrecha); siempre por debajo de las estanterías
    const lanePx = Math.min(w * 0.29, h * 0.36);
    this.S = lanePx * P_Z;
    this.cx = w / 2;
    this.vw = w;
    this.camH = Phaser.Math.Clamp(1.45 + (h / w - 0.75) * 2.2, 1.45, 2.4);
    this.hy = h * (portrait ? 0.9 : 0.88) - this.camH * lanePx;
    this.bakeBg();
    this.streaks.setPosition(0, 0);
    this.streaks.updateConfig({ x: { min: 0, max: w }, y: { min: this.hy, max: h * 0.6 } });
    this.place();
  }

  private sx(x: number, z: number) { return this.cx + (x * this.S) / z; }
  private sy(y: number, z: number) { return this.hy + ((this.camH - y) * this.S) / z; }

  /** Pasillo estático: techo, pared del fondo, suelo, estanterías y tablas (líneas paralelas al avance = quietas). */
  private bakeBg() {
    const w = this.scale.width, h = this.scale.height;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const N = 0.35, F = 90;
    const quad = (pts: number[][], color: number, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.fillPoints(pts.map(([x, y, z]) => new Phaser.Math.Vector2(this.sx(x, z), this.sy(y, z))), true);
    };
    g.fillStyle(0xcfeaff); g.fillRect(0, 0, w, h);
    // techo con franja de luz
    quad([[-HALF, CEIL, N], [HALF, CEIL, N], [HALF, CEIL, F], [-HALF, CEIL, F]], 0xb8defc);
    // pared del fondo
    quad([[-HALF - 1, 0, F], [HALF + 1, 0, F], [HALF + 1, CEIL, F], [-HALF - 1, CEIL, F]], 0xfff3c4);
    // suelo y carriles
    quad([[-HALF, 0, N], [HALF, 0, N], [HALF, 0, F], [-HALF, 0, F]], 0xfff6e2);
    for (const x of [-0.5, 0.5]) quad([[x - 0.025, 0, N], [x + 0.025, 0, N], [x + 0.025, 0, F], [x - 0.025, 0, F]], 0xe8d3a8);
    for (const s of [-1, 1]) {
      const x = s * HALF, xo = s * (HALF + 0.7);
      // parte de arriba de la estantería (se ve en vertical) y lateral
      quad([[x, SHELF_H, N], [xo, SHELF_H, N], [xo, SHELF_H, F], [x, SHELF_H, F]], 0x2f6fd0);
      quad([[x, 0, N], [x, SHELF_H, N], [x, SHELF_H, F], [x, 0, F]], 0x4aa8ff);
      quad([[x, SHELF_H, N], [x, CEIL, N], [x, CEIL, F], [x, SHELF_H, F]], 0xffb3d1);
      for (const b of BOARDS) quad([[x, b, N], [x, b + 0.09, N], [x, b + 0.09, F], [x, b, F]], 0xffffff);
      // zócalo
      quad([[x, 0, N], [x, 0.1, N], [x, 0.1, F], [x, 0, F]], 0x2b2340);
    }
    // productos lejanos (horneados: a esa distancia apenas se mueven)
    for (let z = DYN_FAR; z < 70; z += 0.9) {
      for (const sd of [-1, 1]) for (let r = 0; r < 3; r++) {
        const y0 = BOARDS[r] + 0.09, h = 0.36 + ((z * 7 + r * 3 + sd) & 3) * 0.08;
        quad([[sd * HALF, y0, z], [sd * HALF, y0 + h, z], [sd * HALF, y0 + h, z + 0.7], [sd * HALF, y0, z + 0.7]], PRODUCT[Math.floor(z * 3.1 + r * 5 + sd * 2 + 16) % PRODUCT.length]);
      }
    }
    // resplandor al fondo
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(this.cx, this.sy(1.2, F), w * 0.25, h * 0.12);
    const key = `aisle-${++this.bgN}`;
    g.generateTexture(key, w, h);
    g.destroy();
    this.bg.setTexture(key);
    if (this.bgKey && this.textures.exists(this.bgKey)) this.textures.remove(this.bgKey);
    this.bgKey = key;
  }

  /** Cuadrilátero en un plano vertical x (cara de la estantería), entre alturas y0-y1 y profundidades z0-z1. */
  private quadV(x: number, y0: number, y1: number, z0: number, z1: number) {
    const k0 = this.S / z0, k1 = this.S / z1;
    const X0 = this.cx + x * k0, X1 = this.cx + x * k1;
    if ((X0 < 0 && X1 < 0) || (X0 > this.vw && X1 > this.vw)) return; // fuera de la pantalla: ni se envía
    const a0 = this.hy + (this.camH - y0) * k0, b0 = this.hy + (this.camH - y1) * k0;
    const a1 = this.hy + (this.camH - y0) * k1, b1 = this.hy + (this.camH - y1) * k1;
    if (a0 < 0 && a1 < 0) return;
    this.dyn.fillTriangle(X0, a0, X0, b0, X1, b1);
    this.dyn.fillTriangle(X0, a0, X1, b1, X1, a1);
  }

  /** Cuadrilátero horizontal a altura y (suelo o techo) entre x0-x1 y z0-z1. */
  private quadH(y: number, x0: number, x1: number, z0: number, z1: number) {
    const k0 = this.S / z0, k1 = this.S / z1;
    const Y0 = this.hy + (this.camH - y) * k0, Y1 = this.hy + (this.camH - y) * k1;
    const l0 = this.cx + x0 * k0, r0 = this.cx + x1 * k0, l1 = this.cx + x0 * k1, r1 = this.cx + x1 * k1;
    this.dyn.fillTriangle(l0, Y0, r0, Y0, r1, Y1);
    this.dyn.fillTriangle(l0, Y0, r1, Y1, l1, Y1);
  }

  /**
   * Baldosas, productos y postes que se mueven: triángulos en un solo Graphics, sin crear objetos por fotograma.
   * Más allá de DYN_FAR los productos van horneados en el fondo (allí apenas se mueven).
   */
  private drawDyn() {
    const g = this.dyn;
    g.clear();
    const camZ = this.dist - P_Z;
    const near = 0.9;
    const k0 = Math.floor((camZ + near) / SEG), k1 = Math.ceil((camZ + DYN_FAR) / SEG);
    g.fillStyle(0xf3e2bf);
    for (let k = k0; k <= k1; k++) {
      if (k & 1) continue;
      const z1 = Math.max(near, k * SEG - camZ), z2 = Math.min(DYN_FAR, (k + 1) * SEG - camZ);
      if (z2 > z1) this.quadH(0, -HALF, HALF, z1, z2);
    }
    for (let k = k1; k >= k0; k--) this.segment(k, camZ, near, DYN_FAR);
  }

  /** Un tramo de estantería (dos lados): productos de colores (siempre los mismos para el mismo tramo) y poste. */
  private segment(k: number, camZ: number, near: number, far: number) {
    const g = this.dyn;
    for (let s = -1; s <= 1; s += 2) {
      const x = s * HALF;
      for (let r = 0; r < 3; r++) {
        let h = Math.imul(k, 73856093) ^ Math.imul(r + 1, 19349663) ^ Math.imul(s + 2, 83492791);
        h = (h ^ (h >>> 13)) >>> 0;
        const n = 2 + (h % 2);
        const step = (SEG - 0.2) / n;
        for (let i = 0; i < n; i++) {
          const hi = (h >>> (4 + i * 5)) & 31;
          const za = Math.max(near, k * SEG + 0.2 + i * step + 0.07 - camZ), zb = Math.min(far, k * SEG + 0.2 + (i + 1) * step - 0.07 - camZ);
          if (zb <= za) continue;
          const y0 = BOARDS[r] + 0.09;
          g.fillStyle(PRODUCT[hi % PRODUCT.length]);
          this.quadV(x, y0, y0 + 0.36 + (hi % 4) * 0.08, za, zb);
        }
      }
      // fila de arriba: cajas de almacén
      const zt0 = Math.max(near, k * SEG + 0.35 - camZ), zt1 = Math.min(far, (k + 1) * SEG - 0.35 - camZ);
      if (zt1 > zt0) {
        g.fillStyle((k & 1) ? 0xe0a15e : 0xd08a4a); this.quadV(x, 2.61, 3.12, zt0, zt1);
        g.fillStyle((k & 1) ? 0xd08a4a : 0xe0a15e); this.quadV(x, 3.34, 3.84, zt0, zt1);
      }
      const p1 = k * SEG - camZ;
      if (p1 > near && p1 < far) {
        g.fillStyle(0x2f6fd0);
        this.quadV(x, 0, SHELF_H, p1, p1 + 0.16);
      }
    }
    if (k % 2 === 0) {
      const zl = k * SEG - camZ;
      if (zl > near && zl < far) { g.fillStyle(0xffffff); this.quadH(CEIL, -0.6, 0.6, zl, zl + 1.0); }
    }
  }

  /* ---------------------------------------------------------------- objetos */

  private take(key: string) {
    const list = this.pool.get(key);
    const img = list?.pop() ?? this.add.image(0, 0, key);
    return img.setVisible(true).setAlpha(1).setAngle(0).setTexture(key);
  }

  private spawn(kind: Kind, x: number, wz: number, y = 0) {
    const key = kind === 'sign' ? `sign${this.rnd.between(0, 1)}` : kind === 'cart' ? 'ocart' : kind === 'turbo' || kind === 'magnet' ? `tag-${kind}` : kind;
    const img = this.take(key);
    if (kind === 'coin' || kind === 'turbo' || kind === 'magnet') img.setOrigin(0.5, 0.5);
    else if (kind === 'box') img.setOrigin(0.5, 162 / 170);
    else if (kind === 'cart') img.setOrigin(0.5, 388 / 400);
    else if (kind === 'wet') img.setOrigin(0.5, 312 / 330);
    else img.setOrigin(0.5, 1);
    const o: Obj = { kind, img, wz, x, y, on: true, knocked: false, vx: 0, vy: 0, spin: 0 };
    this.objs.push(o);
    return o;
  }

  private release(o: Obj) {
    o.on = false;
    o.img.setVisible(false);
    const key = o.img.texture.key;
    if (!this.pool.has(key)) this.pool.set(key, []);
    this.pool.get(key)!.push(o.img);
  }

  private coinLine(lane: number, wz: number, n: number, arcOver = false) {
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0;
      this.spawn('coin', lane, wz + i * 1.6, arcOver ? 0.45 + Math.sin(t * Math.PI) * 0.75 : 0.45);
    }
  }

  /** Genera una fila de obstáculos en wz, siempre con al menos un carril sin obstáculo infranqueable. */
  private makeRow(wz: number) {
    const lanes = [-1, 0, 1];
    const diff = Phaser.Math.Clamp(this.time0 / 110, 0, 1);
    const r = this.rnd;
    // carril libre: a lo sumo a un carril del anterior cuando todo va rápido
    let free = r.pick(lanes);
    if (Math.abs(free - this.freeLane) > 1 && diff > 0.25) free = 0;
    if (this.tutorialRows > 0) {
      const step = 4 - this.tutorialRows--;
      if (step === 0) { this.spawn('cart', 0, wz); this.coinLine(-1, wz - 6, 5); free = -1; }
      else if (step === 1) { this.spawn('wet', -1, wz); this.spawn('cart', 1, wz); this.coinLine(0, wz - 6, 5); free = 0; }
      else if (step === 2) { for (const l of lanes) this.spawn('box', l, wz); this.coinLine(0, wz - 2.4, 4, true); free = 0; }
      else { for (const l of lanes) this.spawn('sign', l, wz); this.coinLine(0, wz + 2, 4); free = 0; }
      this.freeLane = free;
      return;
    }
    const roll = r.frac();
    if (roll < 0.14) {
      // fila de cajas: saltar
      for (const l of lanes) this.spawn('box', l, wz);
      this.coinLine(free, wz - 2.4, 4, true);
    } else if (roll < 0.26) {
      // carteles colgantes: agacharse
      for (const l of lanes) this.spawn('sign', l, wz);
      this.coinLine(free, wz + 1.5, 4);
    } else if (roll < 0.26 + 0.34 * (1 - diff * 0.5)) {
      // uno solo
      const l = r.pick(lanes.filter((q) => q !== free));
      this.spawn(r.pick(['box', 'sign', 'cart', 'wet', 'cart'] as Kind[]), l, wz);
      this.coinLine(free, wz - 5, 5);
    } else {
      // dos bloqueos (o tres con uno que se salta/agacha)
      for (const l of lanes) {
        if (l === free) {
          if (diff > 0.35 && r.frac() < 0.4) this.spawn(r.pick(['box', 'sign'] as Kind[]), l, wz);
          else this.coinLine(l, wz - 5, 5);
        } else this.spawn(r.pick(['cart', 'wet', 'cart', 'box', 'sign'] as Kind[]), l, wz);
      }
    }
    if (wz > this.nextTag) {
      this.nextTag = wz + this.rnd.between(170, 280);
      this.spawn(r.frac() < 0.5 ? 'turbo' : 'magnet', free, wz - this.speed * 0.45, 0.6);
    }
    this.freeLane = free;
  }

  /* ---------------------------------------------------------------- controles */

  /** Gesto: izquierda / derecha (carril), arriba (saltar), abajo (agacharse o caer rápido). */
  act(d: 'left' | 'right' | 'up' | 'down') {
    if (!this.alive || this.paused) return;
    this.events.emit('gesture', d);
    if (d === 'left' || d === 'right') {
      const nl = Phaser.Math.Clamp(this.lane + (d === 'left' ? -1 : 1), -1, 1);
      if (nl === this.lane) return;
      this.lane = nl;
      audio.noise(0.08, 0.15, 2400);
    } else if (d === 'up') {
      if (this.py > 0.02) return;
      this.duckT = 0;
      this.vy = JUMP_V;
      audio.tone(420, 0.16, 'square', 0.08, 820);
    } else {
      if (this.py > 0.02) this.vy = -14;
      this.duckT = DUCK_T;
      audio.tone(500, 0.12, 'triangle', 0.1, 200);
    }
  }

  /* ---------------------------------------------------------------- bucle */

  update(_t: number, dtMs: number) {
    const dt = Math.min(dtMs, 50) / 1000;
    if (this.paused) { this.drawDyn(); return; }
    if (this.alive) {
      this.time0 += dt;
      const base = 13 + 17 * (1 - Math.exp(-this.time0 / 95));
      this.speed = base * (this.turboT > 0 ? 1.65 : 1);
      this.dist += this.speed * dt;
      // carril, salto y agacharse
      this.px += Phaser.Math.Clamp(this.lane - this.px, -dt * 9, dt * 9);
      if (this.py > 0 || this.vy > 0) {
        this.vy -= GRAV * dt;
        this.py += this.vy * dt;
        if (this.py <= 0) { this.py = 0; this.vy = 0; }
      }
      this.duckT = Math.max(0, this.duckT - dt);
      this.turboT = Math.max(0, this.turboT - dt);
      this.magnetT = Math.max(0, this.magnetT - dt);
      this.invulnT = Math.max(0, this.invulnT - dt);
      this.faceT = Math.max(0, this.faceT - dt);
      this.streaks.emitting = this.turboT > 0;
      // generar filas por delante (separación en tiempo: más juntas cuanto más se avanza)
      while (this.nextRow < this.dist + FAR) {
        this.makeRow(this.nextRow);
        const diff = Phaser.Math.Clamp(this.time0 / 110, 0, 1);
        const gapT = this.tutorialRows > 0 || this.time0 < 6 ? 1.7 : Phaser.Math.Linear(1.15, 0.66, diff);
        this.nextRow += Math.max(9, gapT * (13 + 17 * (1 - Math.exp(-(this.time0 + 3) / 95))));
      }
      this.collide();
    }
    this.drawDyn();
    this.place();
  }

  private collide() {
    const ph = this.duckT > 0 ? 0.55 : 0.95;
    for (const o of this.objs) {
      if (!o.on || o.knocked) continue;
      const dz = o.wz - this.dist;
      const pickup = o.kind === 'coin' || o.kind === 'turbo' || o.kind === 'magnet';
      if (pickup) {
        if (o.kind === 'coin' && this.magnetT > 0 && dz < 14 && dz > -0.5) {
          // imán: las monedas vuelan hacia el carrito
          const k = 1 - Math.exp(-12 * Math.min(0.05, this.game.loop.delta / 1000));
          o.x += (this.px - o.x) * k;
          o.y += (this.py + 0.45 - o.y) * k;
          o.wz -= Math.max(0, dz) * k;
        }
        if (Math.abs(o.wz - this.dist) < 0.6 && Math.abs(o.x - this.px) < 0.55 && Math.abs(o.y - (this.py + 0.45)) < 0.7) this.pick(o);
        continue;
      }
      if (Math.abs(dz) > 0.42 || Math.abs(o.x - this.px) > 0.68) continue;
      let hit = false;
      if (o.kind === 'sign') hit = this.py + ph > SIGN_BOTTOM;
      else hit = this.py < TOP[o.kind] - 0.04;
      if (!hit) continue;
      if (this.turboT > 0 || this.invulnT > 0) {
        if (this.turboT > 0) this.knock(o);
        continue;
      }
      this.crash();
      return;
    }
  }

  private pick(o: Obj) {
    const x = o.img.x, y = o.img.y;
    this.release(o);
    if (o.kind === 'coin') {
      this.coins++;
      audio.tone(1040, 0.08, 'square', 0.05, 1560);
      this.sparkle.explode(3, x, y);
    } else {
      if (o.kind === 'turbo') { this.turboT = 3.2; audio.tone(300, 0.5, 'sawtooth', 0.08, 1200); this.cameras.main.flash(120, 255, 240, 200); }
      else { this.magnetT = 7; audio.tone(660, 0.3, 'sine', 0.12, 990); }
      this.sparkle.explode(12, x, y);
      this.events.emit('power', o.kind);
    }
    this.faceT = 0.5;
  }

  /** Con turbo, los obstáculos salen volando. */
  private knock(o: Obj) {
    o.knocked = true;
    o.vx = (o.x === 0 ? this.rnd.pick([-1, 1]) : Math.sign(o.x)) * 4;
    o.vy = 6;
    o.spin = this.rnd.pick([-1, 1]) * 540;
    audio.noise(0.15, 0.3, 600);
    this.cameras.main.shake(80, 0.004);
  }

  /** Coloca cada imagen según la proyección; las que quedan detrás de la cámara vuelven al pool. */
  private place() {
    const camZ = this.dist - P_Z;
    const dt = this.game.loop.delta / 1000;
    let alive = 0;
    for (const o of this.objs) {
      if (!o.on) continue;
      if (o.knocked && !this.paused) {
        o.vy -= GRAV * 0.6 * dt; o.y += o.vy * dt; o.x += o.vx * dt; o.wz += this.speed * 0.6 * dt;
        o.img.angle += o.spin * dt;
      }
      const z = o.wz - camZ;
      if (z < P_Z - 1.1 || o.y < -3) { this.release(o); continue; }
      this.objs[alive++] = o;
      const s = this.S / z;
      const k = (WORLDW[o.kind] * s) / TEXW[o.kind];
      const yy = o.kind === 'sign' ? SIGN_BOTTOM : o.y;
      o.img.setPosition(this.sx(o.x, z), this.sy(yy, z)).setScale(k).setDepth(-z);
      if (o.kind === 'coin') o.img.scaleX = k * Math.cos(this.time.now / 160 + o.wz);
      o.img.setAlpha(z > FAR - 12 ? Math.max(0, (FAR - z) / 12) : z < P_Z - 0.2 ? Math.max(0, (z - P_Z + 1.1) / 0.9) : 1);
    }
    this.objs.length = alive;
    // carrito
    const s = this.S / P_Z;
    const k = (0.95 * s) / 280;
    const face = !this.alive ? 'cart-scared' : this.duckT > 0 ? 'cart-duck' : this.faceT > 0 || this.turboT > 0 ? 'cart-happy' : 'cart-normal';
    if (face !== this.lastFace) { this.player.setTexture(face); this.lastFace = face; }
    const tgtLean = (this.lane - this.px) * 14;
    this.lean += (tgtLean - this.lean) * Math.min(1, dt * 12);
    const bob = this.alive && this.py === 0 ? Math.sin(this.time.now / 60) * 0.012 : 0;
    this.player.setPosition(this.sx(this.px, P_Z), this.sy(this.py + bob, P_Z)).setScale(k).setDepth(-P_Z + 0.01);
    if (this.alive) this.player.setAngle(this.lean);
    this.player.setAlpha(this.invulnT > 0 && Math.floor(this.time.now / 90) % 2 ? 0.45 : 1);
  }

  /* ---------------------------------------------------------------- final y revivir */

  crash() {
    if (!this.alive || !this.sys.isActive()) return;
    this.alive = false;
    this.turboT = 0; this.magnetT = 0; this.duckT = 0;
    this.streaks.emitting = false;
    portal.gameplayStop();
    audio.noise(0.45, 0.5, 700);
    audio.tone(300, 0.45, 'sawtooth', 0.1, 70);
    this.cameras.main.shake(240, 0.014);
    this.sparkle.explode(16, this.player.x, this.player.y - this.player.displayHeight * 0.6);
    this.tweens.add({ targets: this.player, angle: this.rnd.pick([-18, 18]), duration: 160, yoyo: true });
    const score = Math.floor(this.dist);
    const total = save.get('coins') + this.coins;
    save.set('coins', total);
    this.time.delayedCall(750, () => {
      if (this.alive) return; // ya revivió
      const best = save.get('best');
      const newBest = score > best;
      if (newBest) save.set('best', score);
      this.events.emit('over', { score, best: Math.max(best, score), newBest, canRevive: portal.hasRewarded && !this.revived });
    });
  }

  /** Alias para scripts/sdk-test.mjs (que llama a breakEgg() en todos los juegos). */
  breakEgg() { this.crash(); }

  /** Revivir tras anuncio con recompensa (una vez por partida): se despeja el pasillo cercano y 2 s de escudo. */
  revive() {
    if (this.alive) return;
    this.revived = true;
    // las monedas de esta partida ya se guardaron al chocar; se siguen contando desde aquí
    save.set('coins', save.get('coins') - this.coins);
    for (const o of this.objs) if (o.on && o.wz - this.dist < 30 && o.kind !== 'coin') this.release(o);
    this.objs = this.objs.filter((o) => o.on);
    this.nextRow = Math.max(this.nextRow, this.dist + 30);
    this.py = 0; this.vy = 0; this.px = this.lane; this.lean = 0;
    this.player.setAngle(0);
    this.invulnT = 2.2;
    this.alive = true;
    portal.gameplayStart();
  }
}
