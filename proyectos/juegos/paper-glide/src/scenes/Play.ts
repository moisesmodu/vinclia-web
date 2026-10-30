import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { PALETTE } from '@comun/ui';
import { save, levels } from '../state';
import { Flight, DT, flightCoins, type Item } from '../vuelo';
import { PLANE_W, trailLook } from '../cosmeticos';
import { GRASS } from './Boot';

/**
 * Paper Glide: un vuelo. La física y el mundo son del módulo puro src/vuelo.ts (pasos fijos de 1/60 s sobre el
 * tiempo real, rawDelta); esta escena solo dibuja: cámara que sigue al avión, cuatro capas de paralaje horneadas
 * (TileSprite), objetos de un pool y partículas en coordenadas de mundo.
 * Fases: 'launch' (medidor: tocar en el momento justo = más potencia) → 'fly' (mantener = subir, soltar = picar)
 * → 'landed' (toca el suelo: fin del vuelo).
 */

const REF = 13;            // px por metro con los que se dibujaron las texturas del paralaje y la colina
type Phase = 'launch' | 'fly' | 'landed';
type Vis = { stamp: number; objs: Phaser.GameObjects.Image[] };

export class Play extends Phaser.Scene {
  private static firstRun = true;
  // estado de la partida (todo se reinicia en create: la instancia se reutiliza)
  alive = false;
  revived = false;
  doubled = false;
  paused = true;
  phase: Phase = 'launch';
  flight!: Flight;
  /** Medidor de lanzamiento (0..1) y si el último lanzamiento fue perfecto. */
  launchP = 0;
  perfect = false;
  /** Monedas abonadas en esta partida (para el ×2) y récord anterior. */
  credited = 0;
  prevBest = 0;
  /** Para el tutorial: tiempo total manteniendo y número de veces que se ha soltado tras mantener. */
  heldMs = 0;
  releases = 0;
  holding = false;
  private holdLock = false;
  private launchT = 0;
  private acc = 0;
  private runId = 0;
  private faceT = 0;
  private face = '';
  private trailT = 0;
  private wobble = 0;
  private skid = 0;
  private skidX = 0;
  // vista
  S = REF;
  camX = 0;
  camB = 0;
  private px0 = 0;
  private sky!: Phaser.GameObjects.Image;
  private layers: { ts: Phaser.GameObjects.TileSprite; f: number; fy: number; h: number; off: number; sc: number; fill?: Phaser.GameObjects.Rectangle }[] = [];
  private ground!: Phaser.GameObjects.Rectangle;
  private hill!: Phaser.GameObjects.Image;
  private flag!: Phaser.GameObjects.Image;
  plane!: Phaser.GameObjects.Image;
  private fx!: { trail: Phaser.GameObjects.Particles.ParticleEmitter; puff: Phaser.GameObjects.Particles.ParticleEmitter; spark: Phaser.GameObjects.Particles.ParticleEmitter };
  private pool = new Map<string, Phaser.GameObjects.Image[]>();
  private vis = new Map<Item, Vis>();
  private stamp = 0;
  private h0 = 0;

  constructor() { super('Play'); }

  async create() {
    this.alive = true; this.revived = false; this.doubled = false; this.paused = true; this.phase = 'launch';
    this.launchP = 0; this.perfect = false; this.credited = 0; this.prevBest = save.get('best');
    this.heldMs = 0; this.releases = 0; this.holding = false; this.holdLock = false;
    this.launchT = 0; this.acc = 0; this.faceT = 0; this.face = ''; this.trailT = 0; this.wobble = 0; this.skid = 0; this.skidX = 0;
    this.pool = new Map(); this.vis = new Map(); this.stamp = 0; this.layers = [];
    this.flight = new Flight(levels(), (Date.now() ^ (Math.random() * 1e9)) >>> 0, 1);
    this.h0 = this.flight.st.h0;

    // fondo: cielo, nubes, colinas, pueblo y parque (TileSprite horneados; solo se mueve su tilePosition)
    this.sky = this.add.image(0, 0, 'sky').setOrigin(0, 0).setDepth(-100);
    const layer = (key: string, f: number, fy: number, h: number, off: number, depth: number, fill?: number, sc = 1) =>
      this.layers.push({
        ts: this.add.tileSprite(0, 0, 10, h, key).setOrigin(0, 1).setDepth(depth), f, fy, h, off, sc,
        fill: fill === undefined ? undefined : this.add.rectangle(0, 0, 10, 10, fill).setOrigin(0, 0).setDepth(depth),
      });
    // fy: cuánto baja la capa cuando el avión sube (1 = como el suelo); off: altura de su base sobre el suelo (px REF)
    layer('px-clouds', 0.08, 0.15, 360, -300, -90);
    layer('px-hills', 0.2, 0.35, 300, -60, -80, 0x8fd0a8, 1);
    layer('px-town', 0.45, 0.65, 320, -24, -70, 0x8fd0a8, 0.62);
    layer('px-park', 1, 1, 200, 30, -60);
    this.ground = this.add.rectangle(0, 0, 10, 10, GRASS).setOrigin(0, 0).setDepth(-59);
    this.hill = this.add.image(0, 0, this.hillTexture()).setOrigin(1, 1).setDepth(-50);
    this.flag = this.add.image(0, 0, 'flag').setOrigin(0.12, 1).setDepth(-30).setVisible(this.prevBest > 50);
    const tl = trailLook();
    this.fx = {
      trail: this.add.particles(0, 0, tl.tex, { lifespan: 650, scale: { start: tl.scale, end: 0 }, alpha: { start: 0.85, end: 0 }, tint: tl.tint, emitting: false }).setDepth(9),
      puff: this.add.particles(0, 0, 'puff', { lifespan: 600, speed: { min: 30, max: 140 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.9, end: 0 }, emitting: false }).setDepth(12),
      spark: this.add.particles(0, 0, 'ic-star', { lifespan: 500, speed: { min: 80, max: 240 }, scale: { start: 0.22, end: 0 }, gravityY: 300, emitting: false }).setDepth(12),
    };
    this.plane = this.add.image(0, 0, 'plane-normal').setDepth(10);

    this.layout();
    this.scale.on('resize', this.layout, this);

    // una sola entrada: mantener (ratón, dedo, espacio, flecha arriba, W)
    const down = (_p?: unknown, over?: unknown[]) => { if (!over || !over.length) this.press(true); };
    const up = () => this.press(false);
    this.input.on('pointerdown', down);
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    const kb = this.input.keyboard!;
    for (const k of ['SPACE', 'UP', 'W']) { kb.on(`keydown-${k}`, (e: KeyboardEvent) => { if (!e.repeat) this.press(true); }); kb.on(`keyup-${k}`, up); }

    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      this.runId++;
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      kb.removeAllListeners();
      this.input.removeAllListeners();
      this.scene.stop('Hud');
    });

    save.set('runs', save.get('runs') + 1);
    this.render();
    // Anuncio intersticial en pausa natural: antes de cada vuelo salvo el primero de la sesión.
    const run = ++this.runId;
    if (!Play.firstRun) await portal.commercialBreak();
    Play.firstRun = false;
    if (run !== this.runId) return; // la escena se cerró durante el anuncio
    this.paused = false;
    portal.gameplayStart();
  }

  /** Colina con el tirachinas, horneada a la escala REF (una textura por altura del lanzador). */
  private hillTexture() {
    const key = `hill-${this.h0}`;
    if (this.textures.exists(key)) return key;
    const W = 46 * REF, H = Math.ceil((this.h0 + 3) * REF), top = H - this.h0 * REF;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const ink = PALETTE.ink;
    // ladera (el borde de la derecha cae en x = W, que es x = 0 del mundo)
    const pts = [{ x: 0, y: H }, { x: 0, y: top + 120 }, { x: 60, y: top + 40 }, { x: 160, y: top + 6 }, { x: W - 60, y: top + 4 }, { x: W - 14, y: top + 40 }, { x: W - 4, y: top + 160 }, { x: W, y: H }];
    g.fillStyle(0xb98552); g.fillPoints(pts, true);
    g.fillStyle(0xa06f42);
    for (let y = top + 90; y < H; y += 70) for (let x = 30 + (y % 140 ? 40 : 0); x < W - 30; x += 110) g.fillRoundedRect(x, y, 56, 22, 10);
    g.lineStyle(6, ink); g.strokePoints(pts, true, true);
    // césped de arriba
    const grass = [{ x: 0, y: top + 120 }, { x: 60, y: top + 40 }, { x: 160, y: top + 6 }, { x: W - 60, y: top + 4 }, { x: W - 14, y: top + 40 }, { x: W - 10, y: top + 70 }, { x: 160, y: top + 50 }, { x: 0, y: top + 150 }];
    g.fillStyle(0x5fd35f); g.fillPoints(grass, true); g.lineStyle(5, ink); g.strokePoints(grass, true, true);
    // rampa de madera inclinada hacia arriba hasta el borde (el avión sale de su punta)
    const rx1 = W - 6, ry1 = top - 6, rx0 = W - 200, ry0 = top + 2;
    g.lineStyle(10, ink); g.lineBetween(rx0, ry0, rx1, ry1);
    g.lineStyle(6, 0xe0a15e); g.lineBetween(rx0, ry0, rx1, ry1);
    // tirachinas detrás
    const sx = W - 230;
    g.lineStyle(14, ink); g.lineBetween(sx, top + 6, sx, top - 50); g.lineBetween(sx, top - 46, sx - 24, top - 96); g.lineBetween(sx, top - 46, sx + 24, top - 96);
    g.lineStyle(8, 0x8a5a3c); g.lineBetween(sx, top + 6, sx, top - 50); g.lineBetween(sx, top - 46, sx - 24, top - 96); g.lineBetween(sx, top - 46, sx + 24, top - 96);
    g.lineStyle(5, 0xff5d5d); g.lineBetween(sx - 24, top - 92, W - 90, top - 20); g.lineBetween(sx + 24, top - 92, W - 90, top - 20);
    // flores
    for (const [x, c] of [[90, 0xff6fae], [300, 0xffd23f], [420, 0xffffff]] as [number, number][]) { g.fillStyle(c); g.fillCircle(x, top + 30, 7); }
    g.generateTexture(key, W, H);
    g.destroy();
    return key;
  }

  /* ---------------------------------------------------------------- vista */

  layout() {
    const w = this.scale.width, h = this.scale.height;
    this.S = Math.max(6, Math.min(h / 52, w / 44));
    this.px0 = w * (h > w ? 0.3 : 0.32);
    this.sky.setDisplaySize(w, h);
    // alto en px de pantalla = alto de la textura escalada (si no, la textura se repite en vertical)
    for (const l of this.layers) l.ts.setSize(w, Math.ceil(l.h * l.sc * (this.S / REF))).setTileScale((this.S / REF) * l.sc);
    this.plane.setScale((10 * this.S) / PLANE_W);
    this.hill.setScale(this.S / REF);
    this.flag.setScale(Math.max(0.5, (6 * this.S) / 150));
    this.updateCamera(1);
  }

  private sx(x: number) { return (x - this.camX) * this.S; }
  private sy(y: number) { return this.scale.height - (y - this.camB) * this.S; }

  private updateCamera(k: number) {
    const h = this.scale.height, s = this.flight.s;
    const margin = (h * 0.16) / this.S, viewH = h / this.S;
    const target = Math.max(-margin, s.y - viewH * 0.52);
    this.camB += (target - this.camB) * k;
    this.camX = s.x - this.px0 / this.S;
  }

  /* ---------------------------------------------------------------- entrada */

  private press(on: boolean) {
    if (!on) {
      if (this.holding) this.releases++;
      this.holding = false;
      this.holdLock = false;
      return;
    }
    if (!this.alive || this.paused) return;
    if (this.phase === 'launch') { this.doLaunch(); this.holdLock = true; return; }
    if (!this.holdLock) this.holding = true;
  }

  private doLaunch() {
    if (this.phase !== 'launch') return;
    const p = this.launchP;
    this.perfect = p > 0.88;
    const power = this.perfect ? 1.14 : 0.78 + 0.34 * p;
    const st = this.flight.st;
    this.flight.s.v = st.v0 * power;
    this.phase = 'fly';
    audio.tone(300, 0.35, 'sawtooth', 0.08, 1100);
    if (this.perfect) {
      [784, 988, 1319].forEach((f, j) => this.time.delayedCall(j * 60, () => audio.tone(f, 0.12, 'triangle', 0.12)));
      this.fx.spark.emitParticleAt(0, -this.h0 * this.S, 14);
      this.events.emit('perfect');
    }
    this.fx.puff.emitParticleAt(-1 * this.S, -this.h0 * this.S, 5);
  }

  /* ---------------------------------------------------------------- bucle */

  update(_t: number, dtMs: number) {
    const raw = Math.min(this.game.loop.rawDelta || dtMs, 100);
    if (!this.paused && this.alive) {
      if (this.phase === 'launch') {
        this.launchT += raw / 1000;
        this.launchP = 0.5 - 0.5 * Math.cos((this.launchT * Math.PI * 2) / 1.3);
        if (this.launchT > 7) this.doLaunch(); // nadie toca: sale solo
      } else if (this.phase === 'fly') {
        // rawDelta: tiempo real (el delta de Phaser viene suavizado y topado a 16,7 ms)
        this.acc += raw / 1000;
        let n = 0;
        while (this.acc >= DT && n < 6) {
          this.flight.step(this.holding);
          this.acc -= DT; n++;
          if (this.flight.landed) break;
        }
        if (n >= 6) this.acc = 0;
        if (this.holding) this.heldMs += raw;
        this.handleEvents();
        this.trailT -= raw;
        if (this.trailT <= 0) {
          this.trailT = 32;
          const s = this.flight.s;
          const bx = s.x - Math.cos(s.a) * 3.2, by = s.y - Math.sin(s.a) * 3.2;
          this.fx.trail.emitParticleAt(bx * this.S, -by * this.S, 1);
        }
      }
    }
    if (this.phase === 'landed' && this.skid > 0) {
      // derrape por el césped
      const d = Math.min(this.skid, raw / 1000 * this.skid * 3 + 0.02);
      this.skid -= d;
      this.skidX += d;
    }
    this.faceT = Math.max(0, this.faceT - raw / 1000);
    this.updateCamera(Math.min(1, (raw / 1000) * 5));
    this.render();
  }

  private handleEvents() {
    const ev = this.flight.events;
    if (!ev.length) return;
    for (const e of ev) {
      const it = e.item;
      if (e.type === 'coin' && it) {
        audio.tone(1046 + Math.min(10, this.flight.coins % 12) * 60, 0.09, 'triangle', 0.09);
        this.fx.spark.emitParticleAt(it.x * this.S, -it.y * this.S, 3);
        this.setFace('happy', 0.5);
      } else if (e.type === 'ring' && it) {
        audio.tone(500, 0.3, 'triangle', 0.12, 1500);
        this.fx.spark.emitParticleAt(it.x * this.S, -it.y * this.S, 12);
        this.setFace('happy', 0.9);
        this.cameras.main.flash(120, 255, 240, 160);
      } else if (e.type === 'hit' && it) {
        audio.noise(0.22, 0.3, 700);
        audio.tone(400, 0.25, 'square', 0.07, 150);
        this.fx.puff.emitParticleAt(it.x * this.S, -it.y * this.S, 6);
        this.cameras.main.shake(160, 0.006);
        this.setFace('scared', 0.9);
      } else if (e.type === 'stall') {
        audio.tone(330, 0.3, 'sine', 0.08, 180);
        this.setFace('scared', 0.6);
      } else if (e.type === 'land') {
        this.land();
      }
    }
    ev.length = 0;
  }

  private setFace(f: string, t: number) { this.face = f; this.faceT = t; }

  /* ---------------------------------------------------------------- dibujo */

  private render() {
    const w = this.scale.width, h = this.scale.height, S = this.S, f = this.flight, s = f.s;
    // paralaje: cada capa se mueve una fracción de la cámara (x) y baja menos que el suelo al subir (y)
    const groundY = this.sy(0), base = h * 0.84, k = S / REF;
    for (const l of this.layers) {
      const y = base + (groundY - base) * l.fy + l.off * k;
      const vis = y - l.h * l.sc * k < h;
      l.ts.setVisible(vis);
      if (vis) { l.ts.setPosition(0, y); l.ts.tilePositionX = (this.camX * S * l.f) / (k * l.sc); }
      if (l.fill) l.fill.setVisible(vis && y < h).setPosition(0, y - 1).setSize(w, Math.max(0, h - y + 1));
    }
    this.ground.setVisible(groundY + 30 * (S / REF) < h).setPosition(0, groundY + 30 * (S / REF) - 1).setSize(w, Math.max(0, h - groundY));
    // colina del lanzamiento
    const hx = this.sx(0.2), hy = groundY + 1 * S;
    this.hill.setVisible(hx > -10 && hy - this.hill.displayHeight < h).setPosition(hx, hy);
    // banderín del récord
    if (this.flag.visible) this.flag.setPosition(this.sx(this.prevBest), groundY + 2);
    // avión
    let ang = -s.a;
    if (this.phase === 'launch') ang = -0.3;
    if (s.stall && this.phase === 'fly') { this.wobble += 0.4; ang += Math.sin(this.wobble) * 0.12; }
    const face = this.phase === 'landed' ? 'scared' : this.faceT > 0 ? this.face : s.stall ? 'scared' : 'normal';
    const key = `plane-${face}`;
    if (this.plane.texture.key !== key) this.plane.setTexture(key);
    const py = this.phase === 'landed' ? Math.max(groundY - 0.9 * S, this.sy(s.y)) : this.sy(s.y);
    this.plane.setPosition(this.sx(s.x + this.skidX), py).setRotation(this.phase === 'landed' ? 0.12 : ang);
    // emisores de partículas en coordenadas de mundo
    for (const e of [this.fx.trail, this.fx.puff, this.fx.spark]) e.setPosition(-this.camX * S, h + this.camB * S);
    this.drawItems();
  }

  private take(key: string, depth: number) {
    const list = this.pool.get(key);
    const img = list?.pop() ?? this.add.image(0, 0, key);
    return img.setVisible(true).setDepth(depth).setAlpha(1).setAngle(0);
  }
  private give(img: Phaser.GameObjects.Image) {
    img.setVisible(false);
    const k = img.texture.key.startsWith('bird') ? 'bird0' : img.texture.key;
    if (k !== img.texture.key) img.setTexture(k);
    let list = this.pool.get(k);
    if (!list) this.pool.set(k, (list = []));
    list.push(img);
  }

  private drawItems() {
    const w = this.scale.width, h = this.scale.height, S = this.S, f = this.flight;
    const stamp = ++this.stamp;
    const t = this.time.now / 1000;
    const onScreen = (x: number, y: number, r: number) => {
      const X = this.sx(x), Y = this.sy(y);
      return X > -r * S - 40 && X < w + r * S + 40 && Y > -r * S - 60 && Y < h + r * S + 60;
    };
    // corrientes: columna translúcida + remolinos que suben
    for (const u of f.updrafts) {
      const half = u.w! / 2;
      const X = this.sx(u.x), top = this.sy(u.top! + 6), bottom = Math.min(h, this.sy(0));
      if (X + half * S < -20 || X - half * S > w + 20 || top > h || bottom < 0) { this.drop(u); continue; }
      let v = this.vis.get(u);
      if (!v) {
        v = { stamp, objs: [this.take('draft', -40).setOrigin(0.5, 0)] };
        for (let i = 0; i < 8; i++) v.objs.push(this.take('wisp', -39).setOrigin(0.5, 0.5));
        this.vis.set(u, v);
      }
      v.stamp = stamp;
      const colTop = Math.max(-10, top);
      v.objs[0].setPosition(X, colTop).setDisplaySize(u.w! * S, Math.max(1, bottom - colTop));
      const span = Math.max(1, bottom - top);
      for (let i = 1; i < v.objs.length; i++) {
        const lane = ((i * 0.37) % 1) - 0.5;
        const yy = bottom - ((t * u.str! * S * 0.9 + i * span / 8) % span);
        const fade = Math.min(1, (bottom - yy) / (S * 6), (yy - top) / (S * 6));
        v.objs[i].setPosition(X + lane * u.w! * S * 0.8, yy).setDisplaySize(5 * S, 10 * S).setAlpha(Math.max(0, fade) * 0.85);
      }
    }
    for (const it of f.items) {
      if (it.taken || !onScreen(it.x, it.y, 4)) { this.drop(it); continue; }
      let v = this.vis.get(it);
      if (!v) {
        if (it.kind === 'coin') v = { stamp, objs: [this.take('coin', 0)] };
        else if (it.kind === 'balloon') v = { stamp, objs: [this.take(`balloon${it.color}`, 1).setOrigin(0.5, 0.35)] };
        else if (it.kind === 'bird') v = { stamp, objs: [this.take('bird0', 2)] };
        else v = { stamp, objs: [this.take('ring-back', 8), this.take('ring-front', 11)] };
        this.vis.set(it, v);
      }
      v.stamp = stamp;
      const X = this.sx(it.x), Y = this.sy(it.y);
      const o = v.objs[0];
      if (it.kind === 'coin') o.setPosition(X, Y).setDisplaySize(2.5 * S * (0.25 + 0.75 * Math.abs(Math.cos(t * 3 + it.x))), 2.5 * S);
      else if (it.kind === 'balloon') o.setPosition(X, Y + Math.sin(t * 2 + it.x) * 0.3 * S).setDisplaySize(4.6 * S, 7.7 * S);
      else if (it.kind === 'bird') {
        const fr = Math.sin(it.ph!) > 0 ? 'bird0' : 'bird1';
        if (o.texture.key !== fr) o.setTexture(fr);
        o.setPosition(X, Y).setDisplaySize(4.8 * S, 3.6 * S);
      } else {
        const sc = (it.r * 2 * S) / 124;
        v.objs[0].setPosition(X, Y).setScale(sc * 0.9, sc);
        v.objs[1].setPosition(X, Y).setScale(sc * 0.9, sc);
      }
    }
    // lo que ya no está en el mundo (borrado o recogido)
    for (const [it, v] of this.vis) if (v.stamp !== stamp) this.drop(it);
  }

  private drop(it: Item) {
    const v = this.vis.get(it);
    if (!v) return;
    for (const o of v.objs) this.give(o);
    this.vis.delete(it);
  }

  /* ---------------------------------------------------------------- fin, revivir, ×2 */

  private land() {
    if (!this.alive) return;
    this.alive = false;
    this.phase = 'landed';
    this.holding = false;
    portal.gameplayStop();
    const f = this.flight;
    f.landed = true;
    this.skid = Math.min(6, f.s.v * 0.25);
    audio.noise(0.35, 0.35, 500);
    this.cameras.main.shake(180, 0.008);
    this.fx.puff.emitParticleAt(f.s.x * this.S, 0, 10);
    const dist = f.dist;
    const total = flightCoins(dist, f.coins);
    const earned = Math.max(0, total - this.credited);
    this.credited = total;
    save.set('coins', save.get('coins') + earned);
    const best = save.get('best');
    const newBest = dist > best;
    if (newBest) save.set('best', dist);
    const run = this.runId;
    setTimeout(() => {
      if (run !== this.runId || this.alive) return;
      this.events.emit('over', {
        score: dist, best: Math.max(best, dist), newBest, canRevive: portal.hasRewarded && !this.revived,
        coins: this.credited, picked: f.coins, canDouble: !this.doubled,
      });
    }, 750);
  }

  /** ×2 monedas con anuncio (una vez por partida). Devuelve lo que suma. */
  doubleCoins() {
    if (this.doubled) return 0;
    this.doubled = true;
    save.set('coins', save.get('coins') + this.credited);
    return this.credited;
  }

  /** Alias para scripts/sdk-test.mjs (que llama a breakEgg() en todos los juegos): aterriza ya. */
  breakEgg() {
    if (!this.alive) return;
    if (this.phase === 'launch') this.phase = 'fly';
    this.flight.s.y = 0;
    this.land();
  }

  /** Revivir (anuncio con recompensa ya visto): relanza desde donde aterrizó. */
  revive() {
    if (this.alive || this.revived) return;
    this.revived = true;
    this.flight.relaunch(1);
    this.flight.events.length = 0;
    this.phase = 'fly';
    this.alive = true;
    this.skid = 0;
    this.skidX = 0;
    this.holding = false;
    this.holdLock = false;
    this.acc = 0;
    this.prevBest = Math.max(this.prevBest, save.get('best'));
    this.flag.setVisible(this.prevBest > 50);
    audio.tone(300, 0.35, 'sawtooth', 0.08, 1100);
    this.fx.spark.emitParticleAt(this.flight.s.x * this.S, -this.flight.s.y * this.S, 16);
    portal.gameplayStart();
  }
}
