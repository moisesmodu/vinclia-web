import Phaser from 'phaser';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { bigNumber } from '@comun/ui';
import { Sim, GRID, type Painter } from '../sim';
import { save, CELL, ROUND_SECS } from '../state';
import { COLORS, COLOR_KEYS, RAINBOW, shade, skinColor, trailId, playerSkinKey } from '../cosmeticos';

const STEP = 1 / 60;
/** Territorio en mosaicos de lienzo: 4×4 mosaicos de 24×24 celdas, 2 px por celda (cada uno 48×48 px). */
const TILE = 24, CPX = 2, TPX = TILE * CPX, NT = GRID / TILE;

type Look = {
  body: Phaser.GameObjects.Image; face: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image;
  trail: Phaser.GameObjects.Graphics; color: number; drawn: boolean;
};
type Tile = { tex: Phaser.Textures.CanvasTexture; data: ImageData; px: Uint32Array };

export type OverInfo = {
  kind: 'over' | 'round'; pct: number; best: number; newBest: boolean; rank: number; of: number; round: number;
  drops: number; canRevive: boolean; canDouble: boolean;
};

/**
 * La partida: rondas de 2 minutos en el patio contra 5–7 bots. Arrastra para girar (o flechas/WASD); fuera de tu
 * color dejas estela; vuelve a tu color para quedarte con todo lo encerrado. Si alguien toca tu estela, pierdes.
 * Se sigue de ronda en ronda (bots más rápidos y listos) hasta que te eliminan.
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  sim!: Sim;
  alive = false;
  paused = false;
  revived = false;
  doubled = false;
  round = 1;
  runDrops = 0;
  timeLeft = ROUND_SECS;
  /** Piloto automático (pruebas de rendimiento y capturas). */
  autopilot = false;
  roundAwarded = 0;
  private acc = 0;
  private looks: Look[] = [];
  private tiles: Tile[] = [];
  private fill = new Uint32Array(10);
  private edge = new Uint32Array(10);
  private side = new Uint32Array(10);
  private colors: number[] = [];
  private pending: { t: number; fn: () => void }[] = [];
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailKind = 'plain';
  private clock = 0;
  private closed = false;
  private stars: Phaser.GameObjects.Image[] = [];
  private tileDirty = new Int16Array(NT * NT * 4).fill(-1);
  private queue: number[] = [];

  constructor() { super('Play'); }

  async create(data: { round?: number; runDrops?: number; doubled?: boolean; revived?: boolean }) {
    // la instancia se reutiliza al reiniciar: todo lo de la partida anterior se pone a cero aquí
    this.round = data?.round ?? 1;
    this.runDrops = data?.runDrops ?? 0;
    this.doubled = data?.doubled ?? false;
    this.revived = data?.revived ?? false;
    this.alive = false; this.paused = false; this.acc = 0; this.roundAwarded = 0; this.timeLeft = ROUND_SECS;
    this.looks = []; this.tiles = []; this.pending = []; this.clock = 0; this.stars = [];
    this.autopilot = !!(window as any).__autopilot;
    this.trailKind = trailId();

    const bots = 5 + Math.min(2, this.round - 1);
    this.sim = new Sim({ round: this.round, bots });
    if (this.autopilot) this.sim.player.ai = 'greedy';
    // colores: el del jugador según su pintor; los bots, los demás
    const mine = skinColor();
    const rest = COLOR_KEYS.filter((k) => k !== mine);
    this.colors = [COLORS[mine], ...Phaser.Utils.Array.Shuffle(rest.slice()).slice(0, bots).map((k) => COLORS[k])];
    this.colors.forEach((c, id) => {
      this.fill[id + 1] = abgr(shade(c, 1.18), 250);
      this.edge[id + 1] = abgr(shade(c, 0.86), 255);
      this.side[id + 1] = abgr(shade(c, 0.62), 255);
    });

    const world = GRID * CELL;
    this.cameras.main.setBackgroundColor('#7fd36b');
    this.makeGround(world);
    this.makeTiles();
    this.redrawAll();
    this.sim.painters.forEach((p, id) => this.looks.push(this.makeLook(p, id)));
    this.burst = this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 220 }, lifespan: 600, scale: { start: 0.7, end: 0 }, emitting: false,
    }).setDepth(30);

    const cam = this.cameras.main;
    cam.setBounds(-CELL * 4, -CELL * 4, world + CELL * 8, world + CELL * 8);
    cam.startFollow(this.looks[0].body, true, 0.14, 0.14);
    cam.centerOn(this.looks[0].body.x, this.looks[0].body.y);
    this.layout();
    this.scale.on('resize', this.layout, this);

    const kb = this.input.keyboard!;
    for (const k of ['UP', 'DOWN', 'LEFT', 'RIGHT', 'W', 'A', 'S', 'D']) this.keys[k] = kb.addKey(k);

    this.scene.launch('Hud');
    this.closed = false;
    this.events.once('shutdown', () => {
      this.closed = true;
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      this.scene.stop('Hud');
    });

    if (this.round === 1) save.set('runs', save.get('runs') + 1);
    // Anuncio intersticial en pausa natural: antes de cada partida o ronda salvo la primera de la sesión.
    if (!Play.firstRun) {
      this.paused = true;
      await portal.commercialBreak();
      this.paused = false;
    }
    Play.firstRun = false;
    if (this.closed) return; // se cerró durante el anuncio
    this.alive = true;
    portal.gameplayStart();
  }

  private layout() {
    const w = this.scale.width, h = this.scale.height;
    // celdas visibles en el lado corto: 24 en un móvil, hasta 34 en un monitor grande
    const m = Math.min(w, h), cells = 24 + Phaser.Math.Clamp((m - 360) / 720, 0, 1) * 10;
    this.cameras.main.setZoom(Phaser.Math.Clamp(m / (cells * CELL), 0.75, 2.4));
  }

  /* ------------------------------------------------------------------ escenario */

  private makeGround(world: number) {
    this.add.image(0, 0, 'yard').setOrigin(0).setScale(2).setDepth(0);
    // bordillo del patio (blanco con contorno grueso) y matas de hierba: imágenes de texturas horneadas, sin
    // Graphics (Phaser vuelve a triangular cada círculo de un Graphics en cada fotograma)
    const T = CELL * 1.2, t = CELL * 0.6;
    for (const [x, y, w, h] of [[-T, -T, world + 2 * T, T], [-T, world, world + 2 * T, T], [-T, 0, T, world], [world, 0, T, world]]) {
      this.add.image(x, y, '__WHITE').setOrigin(0).setDisplaySize(w, h).setTint(0x2b2340).setDepth(1);
    }
    for (const [x, y, w, h] of [[-t * 1.5, -t * 1.5, world + 3 * t, t], [-t * 1.5, world + t * 0.5, world + 3 * t, t], [-t * 1.5, -t * 1.5, t, world + 3 * t], [world + t * 0.5, -t * 1.5, t, world + 3 * t]]) {
      this.add.image(x, y, '__WHITE').setOrigin(0).setDisplaySize(w, h).setTint(0xf4f1e8).setDepth(1);
    }
    const rnd = new Phaser.Math.RandomDataGenerator(['bush']);
    for (let i = 0; i < 60; i++) {
      const k = rnd.realInRange(0, 4), off = rnd.realInRange(CELL * 2.5, CELL * 4.5);
      const s = world * (k % 1);
      const [x, y] = k < 1 ? [s, -off] : k < 2 ? [world + off, s] : k < 3 ? [s, world + off] : [-off, s];
      this.add.image(x, y, 'bush').setScale(rnd.realInRange(0.5, 1)).setDepth(1);
    }
  }

  private makeTiles() {
    for (let ty = 0; ty < NT; ty++) for (let tx = 0; tx < NT; tx++) {
      const key = `terr-${tx}-${ty}`;
      const tex = (this.textures.exists(key) ? this.textures.get(key) : this.textures.createCanvas(key, TPX, TPX)) as Phaser.Textures.CanvasTexture;
      tex.setFilter(Phaser.Textures.FilterMode.NEAREST); // bordes nítidos y sin costuras entre mosaicos
      const data = tex.context.createImageData(TPX, TPX);
      this.tiles.push({ tex, data, px: new Uint32Array(data.data.buffer) });
      this.add.image(tx * TILE * CELL, ty * TILE * CELL, key).setOrigin(0).setScale(CELL / CPX).setDepth(2);
    }
  }

  private redrawAll() {
    for (let t = 0; t < NT * NT; t++) this.drawTile(t % NT, Math.floor(t / NT), 0, 0, TILE - 1, TILE - 1);
    this.sim.yard.takeDirty();
    this.tileDirty.fill(-1); this.queue.length = 0;
  }

  /** Reparte la zona cambiada de la rejilla entre los mosaicos afectados (cada uno guarda su rectángulo sucio). */
  private markTiles() {
    const d = this.sim.yard.takeDirty();
    if (!d) return;
    // +1 celda alrededor: el borde oscuro de las celdas vecinas también cambia
    const x0 = Math.max(0, d.x0 - 1), y0 = Math.max(0, d.y0 - 1), x1 = Math.min(GRID - 1, d.x1 + 1), y1 = Math.min(GRID - 1, d.y1 + 1);
    for (let ty = Math.floor(y0 / TILE); ty <= Math.floor(y1 / TILE); ty++) for (let tx = Math.floor(x0 / TILE); tx <= Math.floor(x1 / TILE); tx++) {
      const t = ty * NT + tx, k = t * 4, td = this.tileDirty;
      const lx0 = Math.max(x0 - tx * TILE, 0), ly0 = Math.max(y0 - ty * TILE, 0), lx1 = Math.min(x1 - tx * TILE, TILE - 1), ly1 = Math.min(y1 - ty * TILE, TILE - 1);
      if (td[k] < 0) { td[k] = lx0; td[k + 1] = ly0; td[k + 2] = lx1; td[k + 3] = ly1; this.queue.push(t); }
      else { td[k] = Math.min(td[k], lx0); td[k + 1] = Math.min(td[k + 1], ly0); td[k + 2] = Math.max(td[k + 2], lx1); td[k + 3] = Math.max(td[k + 3], ly1); }
    }
  }

  /** Redibuja como mucho 3 mosaicos por fotograma (una captura enorme se ve pintarse en unos pocos fotogramas). */
  private flushDirty() {
    this.markTiles();
    for (let n = 0; n < 3 && this.queue.length; n++) {
      const t = this.queue.shift()!, k = t * 4, td = this.tileDirty;
      this.drawTile(t % NT, Math.floor(t / NT), td[k], td[k + 1], td[k + 2], td[k + 3]);
      td[k] = -1;
    }
  }

  /** Pinta un rectángulo de un mosaico: color de relleno, borde más oscuro y "canto" inferior (pintura con grosor). */
  private drawTile(tx: number, ty: number, cx0: number, cy0: number, cx1: number, cy1: number) {
    const t = this.tiles[ty * NT + tx], px = t.px, own = this.sim.yard.owner, W = GRID;
    const fill = this.fill, edge = this.edge, side = this.side;
    for (let cy = cy0; cy <= cy1; cy++) {
      const gy = ty * TILE + cy;
      for (let cx = cx0; cx <= cx1; cx++) {
        const gx = tx * TILE + cx, i = gy * W + gx, o = own[i];
        const base = cy * CPX * TPX + cx * CPX;
        if (!o) { px[base] = 0; px[base + 1] = 0; px[base + TPX] = 0; px[base + TPX + 1] = 0; continue; }
        // relleno plano y "canto" inferior más oscuro (la pintura tiene grosor, como una losa)
        const f = fill[o];
        px[base] = f; px[base + 1] = f;
        const lo = gy === W - 1 || own[i + W] !== o ? side[o] : f;
        px[base + TPX] = lo; px[base + TPX + 1] = lo;
        if (gy === 0 || own[i - W] !== o) { px[base] = edge[o]; px[base + 1] = edge[o]; }
      }
    }
    t.tex.context.putImageData(t.data, 0, 0, cx0 * CPX, cy0 * CPX, (cx1 - cx0 + 1) * CPX, (cy1 - cy0 + 1) * CPX);
    t.tex.refresh();
  }

  private makeLook(p: Painter, id: number): Look {
    const key = id === 0 ? playerSkinKey() : `pb-${COLOR_KEYS.find((k) => COLORS[k] === this.colors[id])}`;
    const shadow = this.add.image(0, 0, 'pshadow').setScale(0.42).setDepth(8);
    const body = this.add.image(0, 0, key).setScale(0.36).setDepth(10);
    const face = this.add.image(0, 0, 'face-happy').setScale(0.36).setDepth(10.5);
    const trail = this.add.graphics().setDepth(5);
    const l = { body, face, shadow, trail, color: this.colors[id], drawn: false };
    this.place(l, p);
    return l;
  }

  /* ------------------------------------------------------------------ bucle */

  update() {
    // tiempo real (no el suavizado de Phaser) y con tope: tras una pestaña oculta no hay saltos
    const dt = Math.min(0.1, this.game.loop.rawDelta / 1000);
    this.clock += dt;
    for (let k = this.pending.length - 1; k >= 0; k--) {
      const q = this.pending[k];
      q.t -= dt;
      if (q.t <= 0) { this.pending.splice(k, 1); q.fn(); }
    }
    if (this.alive && !this.paused) {
      this.readKeys();
      this.acc += dt;
      while (this.acc >= STEP && this.alive) {
        this.acc -= STEP;
        this.sim.step(STEP);
        if (this.sim.yard.dirty) this.markTiles();
        this.timeLeft -= STEP;
        this.handleEvents();
        if (this.alive && this.timeLeft <= 0) { this.timeLeft = 0; this.endRound(); }
      }
    }
    this.flushDirty();
    this.render();
  }

  private readKeys() {
    if (this.autopilot) return;
    const k = this.keys;
    const dx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    const dy = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
    if (dx || dy) { this.sim.steer(Math.atan2(dy, dx)); this.registry.set('steered', (this.registry.get('steered') || 0) + 1); }
  }

  /** Dirección pedida desde el arrastre del dedo o del ratón (Hud). */
  steerTo(angle: number) { if (this.alive && !this.autopilot) this.sim.steer(angle); }

  private handleEvents() {
    const ev = this.sim.events;
    for (const e of ev) {
      if (e.t === 'capture') this.onCapture(e.id, e.gained);
      else if (e.t === 'kill') this.onKill(e.victim, e.killer);
      else if (e.t === 'respawn') { const l = this.looks[e.id]; l.body.setScale(0); this.tweens.add({ targets: l.body, scale: 0.36, duration: 300, ease: 'Back.out' }); }
    }
    ev.length = 0;
  }

  private onCapture(id: number, gained: number) {
    const p = this.sim.painters[id], l = this.looks[id];
    if (id !== 0) {
      if (this.visible(p) && gained > 20) { this.burst.setParticleTint(l.color); this.burst.emitParticleAt(p.x * CELL, p.y * CELL, 8); }
      return;
    }
    const pct = (gained * 100) / this.sim.yard.total;
    this.burst.setParticleTint(l.color);
    this.burst.emitParticleAt(p.x * CELL, p.y * CELL, Math.min(40, 8 + Math.floor(gained / 6)));
    const notes = gained > 120 ? [523, 659, 784, 1047, 1319] : gained > 30 ? [523, 659, 784] : [659, 880];
    notes.forEach((f, j) => this.pending.push({ t: j * 0.07, fn: () => audio.tone(f, 0.14, 'triangle', 0.12) }));
    if (pct >= 0.2) this.floatNumber(p.x * CELL, p.y * CELL - CELL, `+${pct.toFixed(1)}%`, gained > 120 ? '#ffd23f' : '#ffffff', gained > 120 ? 1.4 : 1);
    if (gained > 120) this.cameras.main.shake(160, 0.004);
    this.events.emit('capture', gained);
  }

  private onKill(victim: number, killer: number) {
    const v = this.sim.painters[victim], l = this.looks[victim];
    const x = v.x * CELL, y = v.y * CELL;
    if (this.visible(v)) {
      const s = this.add.image(x, y, 'splat').setTint(l.color).setDepth(20).setScale(0.1).setAngle(Math.random() * 360);
      this.tweens.add({ targets: s, scale: 0.5, duration: 160, ease: 'Back.out' });
      this.tweens.add({ targets: s, alpha: 0, delay: 500, duration: 500, onComplete: () => s.destroy() });
      this.burst.setParticleTint(l.color); this.burst.emitParticleAt(x, y, 16);
      audio.noise(0.25, 0.25, 1200);
    }
    l.trail.clear(); l.drawn = false;
    if (victim === 0) { this.playerDown(); return; }
    l.body.setVisible(false); l.face.setVisible(false); l.shadow.setVisible(false);
    if (killer === 0) {
      audio.tone(330, 0.1, 'square', 0.1, 660); this.pending.push({ t: 0.1, fn: () => audio.tone(880, 0.16, 'square', 0.1) });
      this.floatNumber(x, y - CELL, '+1', '#ff8a8a', 1.2);
      this.events.emit('kill');
    }
  }

  private visible(p: Painter) {
    return this.cameras.main.worldView.contains(p.x * CELL, p.y * CELL);
  }

  private floatNumber(x: number, y: number, txt: string, color: string, k: number) {
    const z = this.cameras.main.zoom;
    const t = bigNumber(this, x, y, 34, txt).setColor(color).setDepth(40).setScale((0.4 * k) / z);
    this.tweens.add({ targets: t, scale: k / z, duration: 220, ease: 'Back.out' });
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, delay: 600, duration: 500, onComplete: () => t.destroy() });
  }

  /* ------------------------------------------------------------------ dibujo */

  private place(l: Look, p: Painter) {
    const x = p.x * CELL, y = p.y * CELL;
    const bob = Math.sin(this.clock * 14 + p.id) * 0.025;
    l.shadow.setPosition(x, y + 8);
    l.body.setPosition(x, y - 4).setScale(0.36 * (1 - bob), 0.36 * (1 + bob));
    l.face.setPosition(x + Math.cos(p.heading) * 3.2, y - 3 + Math.sin(p.heading) * 2.2);
    const d = 10 + p.y * 0.01;
    l.body.setDepth(d); l.face.setDepth(d + 0.005);
  }

  private render() {
    const ps = this.sim.painters;
    for (let id = 0; id < ps.length; id++) {
      const p = ps[id], l = this.looks[id];
      if (!p.alive && id !== 0) continue;
      if (p.alive && !l.body.visible) { l.body.setVisible(true); l.face.setVisible(true); l.shadow.setVisible(true); }
      this.place(l, p);
      if (id === 0) {
        l.body.setAlpha(p.invuln > 0 && p.invuln < 2.5 ? (Math.floor(this.clock * 10) % 2 ? 0.45 : 1) : 1);
        const mood = !p.alive ? 'face-sad' : p.outside && p.trail.length > 25 ? 'face-wow' : 'face-happy';
        if (l.face.texture.key !== mood) l.face.setTexture(mood);
      } else {
        const mood = p.outside && this.nearPlayer(p) ? 'face-wow' : 'face-happy';
        if (l.face.texture.key !== mood) l.face.setTexture(mood);
      }
      if (p.pts.length && this.trailOnScreen(p)) { this.drawTrail(l, p, id === 0 ? this.trailKind : 'plain'); l.drawn = true; }
      else if (l.drawn) { l.trail.clear(); l.drawn = false; }
      if (id === 0 && this.trailKind === 'stars') this.placeStars(p);
    }
  }

  /** Estrellas de la estela "stars": imágenes reutilizadas (una cada 3 puntos), no formas redibujadas. */
  private placeStars(p: Painter) {
    const n = p.pts.length / 2;
    let used = 0;
    for (let k = 2; k < n; k += 3) {
      let st = this.stars[used];
      if (!st) { st = this.add.image(0, 0, 'trstar').setDepth(6).setScale(0.5); this.stars.push(st); }
      st.setVisible(true).setPosition(p.pts[2 * k] * CELL, p.pts[2 * k + 1] * CELL).setAngle(k * 37 + this.clock * 90);
      used++;
    }
    for (let k = used; k < this.stars.length; k++) if (this.stars[k].visible) this.stars[k].setVisible(false);
  }

  /** La estela toca la vista de la cámara (las de fuera no se dibujan). */
  private trailOnScreen(p: Painter) {
    const v = this.cameras.main.worldView, m = CELL * 2, pts = p.pts;
    let x0 = p.x, x1 = p.x, y0 = p.y, y1 = p.y;
    for (let k = 0; k < pts.length; k += 2) {
      const x = pts[k], y = pts[k + 1];
      if (x < x0) x0 = x; else if (x > x1) x1 = x;
      if (y < y0) y0 = y; else if (y > y1) y1 = y;
    }
    return x1 * CELL + m >= v.x && x0 * CELL - m <= v.right && y1 * CELL + m >= v.y && y0 * CELL - m <= v.bottom;
  }

  private nearPlayer(p: Painter) { const q = this.sim.player; return Math.abs(q.x - p.x) < 5 && Math.abs(q.y - p.y) < 5; }

  /** Estela: contorno oscuro + color (o arcoíris, estrellas o tiza en las estelas de la tienda). */
  private drawTrail(l: Look, p: Painter, kind: string) {
    const g = l.trail, pts = p.pts, n = pts.length / 2;
    g.clear();
    const hx = p.x * CELL, hy = p.y * CELL;
    g.lineStyle(CELL * 0.78, 0x2b2340);
    g.beginPath(); g.moveTo(pts[0] * CELL, pts[1] * CELL);
    for (let k = 1; k < n; k++) g.lineTo(pts[2 * k] * CELL, pts[2 * k + 1] * CELL);
    g.lineTo(hx, hy); g.strokePath();
    if (kind === 'rainbow') {
      let px = pts[0] * CELL, py = pts[1] * CELL;
      for (let k = 1; k <= n; k++) {
        const x = k < n ? pts[2 * k] * CELL : hx, y = k < n ? pts[2 * k + 1] * CELL : hy;
        g.lineStyle(CELL * 0.5, RAINBOW[Math.floor(k / 2) % RAINBOW.length]); g.lineBetween(px, py, x, y);
        px = x; py = y;
      }
    } else {
      g.lineStyle(CELL * 0.5, l.color);
      g.beginPath(); g.moveTo(pts[0] * CELL, pts[1] * CELL);
      for (let k = 1; k < n; k++) g.lineTo(pts[2 * k] * CELL, pts[2 * k + 1] * CELL);
      g.lineTo(hx, hy); g.strokePath();
      if (kind === 'chalk') {
        g.lineStyle(CELL * 0.14, 0xffffff, 0.85);
        for (let k = 1; k < n; k += 2) g.lineBetween(pts[2 * k - 2] * CELL, pts[2 * k - 1] * CELL - 2, pts[2 * k] * CELL, pts[2 * k + 1] * CELL - 2);
      }
    }
  }

  /* ------------------------------------------------------------------ fin de ronda y de partida */

  /** Gotas de la ronda: 0,6 por cada 1 % del patio (+ premio por puesto al acabar la ronda). Suma solo lo nuevo. */
  private award(final: boolean, rank: number) {
    const pct = this.sim.yard.pct(0);
    const earned = Math.round(pct * 0.6) + (final ? ([12, 7, 4][rank - 1] ?? 0) : 0);
    const add = Math.max(0, earned - this.roundAwarded);
    this.roundAwarded = Math.max(this.roundAwarded, earned);
    this.runDrops += add;
    save.set('drops', save.get('drops') + add);
    const p1 = Math.round(pct * 10) / 10, best = save.get('best'), newBest = p1 > best;
    if (newBest) save.set('best', p1);
    return { pct: p1, best: Math.max(best, p1), newBest };
  }

  private info(kind: 'over' | 'round'): OverInfo {
    const rank = this.sim.rank(0);
    const a = this.award(kind === 'round', rank);
    return {
      kind, ...a, rank, of: this.sim.painters.length, round: this.round, drops: this.runDrops,
      canRevive: kind === 'over' && portal.hasRewarded && !this.revived, canDouble: !this.doubled,
    };
  }

  private playerDown() {
    if (!this.alive) return;
    this.alive = false;
    portal.gameplayStop();
    audio.noise(0.35, 0.45, 900);
    audio.tone(420, 0.45, 'sawtooth', 0.12, 90);
    this.cameras.main.shake(220, 0.01);
    this.looks[0].face.setTexture('face-sad');
    const r = this.info('over');
    if (r.newBest) portal.happyTime();
    // el panel sale a los 0,8 s de tiempo real (aunque el reloj de la escena vaya a otra velocidad)
    this.pending.push({ t: 0.8, fn: () => this.events.emit('over', r) });
  }

  private endRound() {
    this.alive = false;
    portal.gameplayStop();
    const r = this.info('round');
    save.set('bestRound', Math.max(save.get('bestRound'), this.round));
    if (r.rank === 1 || r.newBest) portal.happyTime();
    [523, 659, 784, 1047].forEach((f, j) => this.pending.push({ t: j * 0.1, fn: () => audio.tone(f, 0.18, 'square', 0.1) }));
    this.pending.push({ t: 0.6, fn: () => this.events.emit('over', r) });
  }

  /** Para las pruebas automáticas (scripts/sdk-test-espera.mjs): eliminar al jugador ya. */
  breakEgg() {
    if (!this.alive) return;
    this.sim.kill(this.sim.player, this.sim.player, 'self');
    this.handleEvents();
  }

  /** Siguiente ronda (más bots, más rápidos y más listos), con anuncio en la pausa natural. */
  nextRound() {
    this.scene.restart({ round: this.round + 1, runDrops: this.runDrops, doubled: this.doubled, revived: this.revived });
  }

  /** Partida nueva desde la ronda 1. */
  restartRun() { this.scene.restart({ round: 1 }); }

  /** ×2 con anuncio con recompensa: vuelve a sumar las gotas de toda la partida (una vez por partida). */
  doubleDrops() {
    if (this.doubled) return 0;
    this.doubled = true;
    save.set('drops', save.get('drops') + this.runDrops);
    return this.runDrops;
  }

  /** Revivir tras anuncio con recompensa: sin estela, en tu color más cercano, 2 s de protección. */
  revive() {
    this.revived = true;
    this.sim.revivePlayer();
    this.sim.events.length = 0;
    this.looks[0].face.setTexture('face-happy');
    this.alive = true;
    this.acc = 0;
    portal.gameplayStart();
  }

  /** Color de un pintor (para el marcador del Hud). */
  colorOf(id: number) { return this.colors[id]; }
}

/** Color en el orden de bytes de ImageData (little-endian: A B G R). */
function abgr(c: number, a: number) {
  return ((a << 24) | ((c & 255) << 16) | (((c >> 8) & 255) << 8) | ((c >> 16) & 255)) >>> 0;
}
