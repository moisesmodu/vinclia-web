import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { bigNumber } from '@comun/ui';
import { save } from '../state';
import { BT, BR, FLOOR_Y, drawCourt, equippedFloor, type Face } from '../cosmeticos';

/**
 * Hoop Bounce: un toque = la pelota rebota hacia arriba y un poco hacia el aro. Hay que meterla por arriba.
 * Mundo: alto fijo de 1200 unidades (suelo en FLOOR_Y), ancho entre 680 y 1400 según la pantalla; la cámara
 * escala el mundo entero a la pantalla. Física a mano a 120 Hz fijos (rawDelta acumulado): la pelota es un
 * círculo, el aro dos puntos de choque, el tablero un rectángulo. Fondo horneado en una textura por tamaño.
 */

const STEP = 1 / 120;
const G = 2500;            // gravedad (u/s²)
const TAP_V = 1150;        // velocidad hacia arriba de cada toque
const R = 46;              // radio de la pelota
const RIM_R = 8;           // radio de los extremos del aro
const NET_H = 80;          // la red bloquea desde abajo a esta profundidad
const LIVES = 3;
const GOLD_T = 8;          // segundos de pelota dorada
const WH = 1200;

export class Play extends Phaser.Scene {
  private static firstRun = true;
  // estado de la partida (todo se reinicia en create: la instancia se reutiliza)
  alive = false;
  revived = false;
  doubled = false;
  paused = true;
  /** La pelota flota quieta hasta el primer toque (al empezar y al revivir). */
  waiting = true;
  score = 0;
  coins = 0;
  baskets = 0;
  combo = 1;
  lives = LIVES;
  goldT = 0;
  time0 = 0;
  taps = 0;
  // pelota
  bx = 0; by = 0; vx = 0; vy = 0; spin = 0; ang = 0;
  // aro
  side = 1;
  hx = 0; hy = 0; hw = 212;
  baseY = 520;
  private phase = 0;
  private trans = 1;
  private fromX = 0; private fromY = 0;
  private switchT = -1;
  private lock = false;
  private touched = false;
  /** La pelota ha estado entera por encima del aro (solo así cuenta la canasta). */
  private armed = false;
  private rimCd = 0;
  private faceT = 0;
  private face: Face = 'normal';
  private orbT = 0;
  private nextOrb = 14;
  orbX = 0; orbY = 0;
  private acc = 0;
  private hoverT = 0;
  worldW = 720;
  private zoom = 1;
  private runId = 0;
  private bgKey = '';
  private bgN = 0;
  private rnd!: Phaser.Math.RandomDataGenerator;
  // imágenes
  private bg!: Phaser.GameObjects.Image;
  private armW!: Phaser.GameObjects.Image;
  private armR!: Phaser.GameObjects.Image;
  private board!: Phaser.GameObjects.Image;
  private rimBack!: Phaser.GameObjects.Image;
  private rimFront!: Phaser.GameObjects.Image;
  private net!: Phaser.GameObjects.Image;
  ball!: Phaser.GameObjects.Image;
  private faceImg!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private orb!: Phaser.GameObjects.Image;
  private halo!: Phaser.GameObjects.Arc;
  private fire!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private pops: Phaser.GameObjects.Text[] = [];
  private netK = 1;

  constructor() { super('Play'); }

  async create() {
    this.alive = true; this.revived = false; this.doubled = false; this.paused = true; this.waiting = true;
    this.score = 0; this.coins = 0; this.baskets = 0; this.combo = 1; this.lives = LIVES; this.goldT = 0;
    this.time0 = 0; this.taps = 0; this.vx = 0; this.vy = 0; this.spin = 0; this.ang = 0;
    this.side = 1; this.phase = 0; this.trans = 1; this.switchT = -1; this.lock = false; this.touched = false;
    this.rimCd = 0; this.faceT = 0; this.face = 'normal'; this.orbT = 0; this.nextOrb = 14; this.acc = 0; this.hoverT = 0;
    this.hw = 212; this.baseY = 560; this.armed = false; this.pops = []; this.netK = 1; this.bgKey = '';
    this.rnd = new Phaser.Math.RandomDataGenerator([`${Date.now()}`]);

    this.bg = this.add.image(0, 0, '__WHITE').setOrigin(0, 0).setDepth(-10);
    this.armW = this.add.image(0, 0, 'arm').setOrigin(0, 0.5).setDepth(0);
    this.armR = this.add.image(0, 0, 'arm').setOrigin(0, 0.5).setDepth(0);
    this.board = this.add.image(0, 0, 'board').setDepth(1);
    this.rimBack = this.add.image(0, 0, 'rim-back').setOrigin(0.5, 18 / 40).setDepth(2);
    this.shadow = this.add.ellipse(0, FLOOR_Y + 14, 80, 18, 0x000000, 0.18).setDepth(-5);
    this.orb = this.add.image(0, 0, 'gold-orb').setDepth(3).setVisible(false);
    this.halo = this.add.circle(0, 0, R + 20, 0xffd23f, 0.5).setStrokeStyle(6, 0xffffff, 0.8).setDepth(4).setVisible(false);
    this.fire = this.add.particles(0, 0, 'flame', {
      lifespan: 420, speed: { min: 20, max: 90 }, scale: { start: 2, end: 0.2 }, alpha: { start: 0.95, end: 0 },
      tint: [0xffe56b, 0xffa23f, 0xff5d2d, 0xff5d2d], frequency: 14, emitting: false,
    }).setDepth(4);
    this.ball = this.add.image(0, 0, 'ball-skin').setDepth(5).setScale(R / BR);
    this.faceImg = this.add.image(0, 0, 'face-normal').setDepth(6).setScale(R / BR);
    this.net = this.add.image(0, 0, 'net').setOrigin(0.5, 22 / 130).setDepth(7);
    this.rimFront = this.add.image(0, 0, 'rim-front').setOrigin(0.5, 18 / 40).setDepth(8);
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 160, max: 480 }, lifespan: 600, scale: { start: 1.2, end: 0 }, gravityY: 900,
      tint: [0xffd23f, 0xffffff, 0xff6fae, 0x6cc8ff], emitting: false,
    }).setDepth(9);
    this.fire.startFollow(this.ball);

    this.layout();
    this.placeHoop(true);
    this.bx = this.worldW / 2; this.by = 760;
    this.sync();
    this.scale.on('resize', this.layout, this);

    const kb = this.input.keyboard!;
    for (const k of ['SPACE', 'UP', 'W', 'ENTER']) kb.on(`keydown-${k}`, () => this.tap());

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
    // Anuncio intersticial en pausa natural: antes de cada partida salvo la primera de la sesión.
    const run = ++this.runId;
    if (!Play.firstRun) await portal.commercialBreak();
    Play.firstRun = false;
    if (run !== this.runId) return; // la escena se cerró durante el anuncio
    this.paused = false;
    portal.gameplayStart();
  }

  /* ---------------------------------------------------------------- pantalla */

  private layout() {
    const w = this.scale.width, h = this.scale.height;
    this.worldW = Phaser.Math.Clamp((WH * w) / h, 680, 1400);
    this.zoom = Math.min(w / this.worldW, h / WH);
    const cam = this.cameras.main;
    cam.setZoom(this.zoom);
    const visW = w / this.zoom, visH = h / this.zoom;
    cam.centerOn(this.worldW / 2, WH - visH / 2);
    // fondo horneado a la resolución de la pantalla
    const x0 = this.worldW / 2 - visW / 2, y0 = WH - visH;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    drawCourt(g, equippedFloor(), { x0, y0, w: visW, h: visH, k: this.zoom, worldW: this.worldW });
    const key = `court-${++this.bgN}`;
    g.generateTexture(key, Math.ceil(w), Math.ceil(h));
    g.destroy();
    this.bg.setTexture(key).setPosition(x0, y0).setScale(1 / this.zoom);
    if (this.bgKey && this.textures.exists(this.bgKey)) this.textures.remove(this.bgKey);
    this.bgKey = key;
    this.bx = Phaser.Math.Clamp(this.bx, R, this.worldW - R);
  }

  /** Posición de reposo del aro en su lado (pegado a la pared, sin pasarse del centro en pantallas anchas). */
  private restX(side: number) {
    const W = this.worldW, off = Math.min(W / 2 - this.hw / 2 - 60, 270);
    return W / 2 + side * off;
  }

  private placeHoop(now = false) {
    const tx = this.restX(this.side);
    if (now) { this.hx = tx; this.hy = this.baseY; this.trans = 1; return; }
    this.fromX = this.hx; this.fromY = this.hy; this.trans = 0;
  }

  /** Dificultad según las canastas: movimiento (lado, alto, ambos) y velocidad. */
  private motion() {
    const n = this.baskets;
    if (n < 3) return { ax: 0, ay: 0, f: 0 };
    if (n < 8) return { ax: Math.min(110, 50 + (n - 3) * 12), ay: 0, f: 0.32 + (n - 3) * 0.02 };
    if (n < 14) return { ax: 0, ay: Math.min(130, 70 + (n - 8) * 10), f: 0.36 + (n - 8) * 0.02 };
    return { ax: 80, ay: 100, f: Math.min(0.72, 0.42 + (n - 14) * 0.015) };
  }

  /* ---------------------------------------------------------------- controles */

  /** Un toque: rebote hacia arriba y un poco hacia el aro. */
  tap() {
    if (!this.alive || this.paused) return;
    this.waiting = false;
    this.taps++;
    const dx = this.hx - this.bx;
    this.vy = -TAP_V;
    this.vx = Math.abs(dx) < 6 ? 0 : Math.sign(dx) * Phaser.Math.Clamp(Math.abs(dx) * 1.1, 60, 250);
    this.spin = this.vx * 1.6;
    audio.tone(330, 0.09, 'sine', 0.13, 620);
    this.tweens.killTweensOf(this.ball);
    this.ball.setScale((R / BR) * 1.12, (R / BR) * 0.86);
    this.tweens.add({ targets: this.ball, scaleX: R / BR, scaleY: R / BR, duration: 160, ease: 'Back.out' });
    this.events.emit('tap');
  }

  /* ---------------------------------------------------------------- bucle */

  update() {
    // paso fijo con el tiempo real entre fotogramas (no se acelera ni se frena con los FPS)
    const raw = Math.min(this.game.loop.rawDelta, 100) / 1000;
    if (!this.paused) {
      this.acc += raw;
      let n = 0;
      while (this.acc >= STEP && n++ < 14) { this.step(STEP); this.acc -= STEP; }
      if (n >= 14) this.acc = 0;
    }
    this.sync();
  }

  private step(dt: number) {
    const W = this.worldW;
    // aro
    if (this.alive) this.time0 += dt;
    const m = this.motion();
    this.phase += dt * m.f * Math.PI * 2;
    this.hw += (Math.max(150, 212 - this.baskets * 2) - this.hw) * Math.min(1, dt * 3);
    const tx = this.restX(this.side) - this.side * m.ax * (1 - Math.cos(this.phase));
    const ty = this.baseY + m.ay * Math.sin(this.phase * 0.8);
    if (this.trans < 1) {
      this.trans = Math.min(1, this.trans + dt / 0.45);
      const e = Phaser.Math.Easing.Cubic.InOut(this.trans);
      this.hx = this.fromX + (tx - this.fromX) * e;
      this.hy = this.fromY + (ty - this.fromY) * e;
      if (this.trans >= 1) this.lock = false;
    } else { this.hx = tx; this.hy = ty; }
    if (this.switchT >= 0) {
      this.switchT -= dt;
      if (this.switchT < 0) {
        this.side = -this.side;
        this.baseY = this.rnd.between(400, 620);
        this.placeHoop();
      }
    }
    this.rimCd = Math.max(0, this.rimCd - dt);
    this.faceT = Math.max(0, this.faceT - dt);
    if (this.goldT > 0) { this.goldT = Math.max(0, this.goldT - dt); }

    // pelota
    if (this.waiting && this.alive) {
      this.hoverT += dt;
      this.vx = 0; this.vy = 0;
      this.by = 760 + Math.sin(this.hoverT * 4) * 12;
      this.bx += (W / 2 - this.bx) * Math.min(1, dt * 4);
      this.orbStep(dt);
      return;
    }
    const py = this.by;
    this.vy += G * dt;
    this.bx += this.vx * dt;
    this.by += this.vy * dt;
    this.ang += this.spin * dt;
    if (this.bx < R) { this.bx = R; this.vx = Math.abs(this.vx) * 0.7; this.spin = -this.spin; this.thud(); }
    if (this.bx > W - R) { this.bx = W - R; this.vx = -Math.abs(this.vx) * 0.7; this.spin = -this.spin; this.thud(); }
    if (this.by < R + 8) { this.by = R + 8; this.vy = Math.abs(this.vy) * 0.3; }

    if (!this.alive) {
      // muerta: rebota en el suelo y se queda
      if (this.by > FLOOR_Y - R) { this.by = FLOOR_Y - R; this.vy = -Math.abs(this.vy) * 0.45; this.vx *= 0.8; this.spin *= 0.8; if (Math.abs(this.vy) < 120) this.vy = 0; }
      return;
    }

    const half = this.hw / 2;
    const inX = Math.abs(this.bx - this.hx) < half;
    // la red y el aro no dejan pasar desde abajo
    if (this.vy < 0 && inX && py - R >= this.hy + NET_H && this.by - R < this.hy + NET_H) {
      // la red la desvía hacia el centro de la pista: nunca se queda atrapada debajo del aro
      this.by = this.hy + NET_H + R; this.vy = Math.abs(this.vy) * 0.25; this.touched = true;
      this.vx = -this.side * 230; this.spin = this.vx * 1.6;
      audio.noise(0.06, 0.12, 500);
    }
    // aro (dos puntos) y tablero
    for (const s of [-1, 1]) this.hitPoint(this.hx + s * half, this.hy, RIM_R, 0.55, true);
    const bxc = this.hx + this.side * (half + RIM_R + 26);
    this.hitPoint(Phaser.Math.Clamp(this.bx, bxc - 16, bxc + 16), Phaser.Math.Clamp(this.by, this.hy - 150, this.hy + 40), 0, 0.6, false);
    if (!this.alive) return;
    // canasta: el centro cruza la línea del aro bajando y por dentro
    if (this.by + R < this.hy - 2) this.armed = true;
    if (this.armed && !this.lock && this.vy > 0 && py < this.hy && this.by >= this.hy && Math.abs(this.bx - this.hx) < half) this.basket();
    this.orbStep(dt);
    // al suelo = fin
    if (this.by + R >= FLOOR_Y + 4) this.crash('floor');
  }

  /** Choque círculo-punto con rebote. rim = cuenta como golpe en el aro. */
  private hitPoint(px: number, py: number, pr: number, e: number, rim: boolean) {
    const dx = this.bx - px, dy = this.by - py, min = R + pr;
    const d2 = dx * dx + dy * dy;
    if (d2 >= min * min || d2 < 1e-6) return;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
    this.bx = px + nx * min; this.by = py + ny * min;
    const vn = this.vx * nx + this.vy * ny;
    if (vn >= 0) return;
    this.vx -= (1 + e) * vn * nx; this.vy -= (1 + e) * vn * ny;
    this.vx *= 0.96;
    this.spin = this.vx * 1.6;
    this.touched = true;
    if (rim) {
      if (this.rimCd > 0 || vn > -90) return;
      this.rimCd = 0.5;
      this.lives--;
      this.combo = 1;
      audio.tone(880, 0.12, 'square', 0.08, 640);
      audio.noise(0.1, 0.18, 2600);
      this.cameras.main.shake(110, 0.006);
      this.setFace('scared', 0.6);
      this.events.emit('life', this.lives);
      if (this.lives <= 0) this.crash('rim');
    } else if (vn < -120) {
      audio.noise(0.07, 0.2, 400);
    }
  }

  private thud() { audio.tone(160, 0.06, 'sine', 0.08, 110); }

  private basket() {
    this.lock = true;
    this.armed = false;
    const clean = !this.touched;
    this.baskets++;
    this.combo = clean ? Math.min(this.combo + 1, 10) : 1;
    const gold = this.goldT > 0;
    const pts = this.combo * (gold ? 2 : 1);
    this.score += pts;
    this.coins += 1 + (clean ? 1 : 0) + (gold ? 2 : 0);
    // tres limpias seguidas devuelven una vida
    if (clean && (this.combo - 1) % 3 === 0 && this.lives < LIVES) { this.lives++; this.events.emit('life', this.lives); }
    this.touched = false;
    this.switchT = 0.35;
    this.setFace('happy', 0.8);
    this.vx *= 0.4;
    // red que se estira, chispas y número
    this.tweens.killTweensOf(this);
    this.netK = 1.35;
    this.tweens.add({ targets: this, netK: 1, duration: 420, ease: 'Elastic.out' });
    this.sparks.explode(clean ? 22 : 10, this.hx, this.hy + 30);
    this.popup(this.hx, this.hy - 70, `+${pts}`, clean);
    if (clean) {
      audio.noise(0.18, 0.16, 5200);
      [784, 988, 1319].forEach((f, j) => this.time.delayedCall(j * 60, () => audio.tone(f + this.combo * 20, 0.14, 'triangle', 0.11)));
    } else {
      audio.noise(0.14, 0.14, 3000);
      audio.tone(660, 0.12, 'triangle', 0.1, 990);
    }
    if (this.combo >= 3) audio.tone(200, 0.3, 'sawtooth', 0.05, 600);
    this.events.emit('score', { pts, clean, combo: this.combo });
  }

  private popup(x: number, y: number, txt: string, big: boolean) {
    let t = this.pops.find((p) => !p.visible);
    if (!t) { t = bigNumber(this, 0, 0, 64, '').setDepth(20); this.pops.push(t); }
    t.setText(txt).setPosition(x, y).setVisible(true).setAlpha(1).setScale(big ? 1.2 : 0.9);
    t.setColor(big ? '#ffd23f' : '#ffffff');
    this.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 800, ease: 'Cubic.out', onComplete: () => t!.setVisible(false) });
  }

  /** Bola dorada: aparece cada 22–30 s unos segundos; tocarla = 8 s de puntos dobles. */
  private orbStep(dt: number) {
    if (this.orbT > 0) {
      this.orbT -= dt;
      const dx = this.bx - this.orbX, dy = this.by - this.orbY;
      if (!this.waiting && dx * dx + dy * dy < (R + 40) ** 2) {
        this.orbT = 0;
        this.goldT = GOLD_T;
        this.sparks.explode(26, this.orbX, this.orbY);
        [988, 1175, 1568, 1976].forEach((f, j) => this.time.delayedCall(j * 55, () => audio.tone(f, 0.12, 'triangle', 0.1)));
        this.setFace('happy', 0.8);
        this.events.emit('gold');
      }
    } else if (this.time0 >= this.nextOrb && !this.waiting) {
      this.nextOrb = this.time0 + this.rnd.between(22, 30);
      this.orbT = 7;
      // en el centro, por encima de la pelota en reposo y lejos del aro
      this.orbX = this.worldW / 2 + this.rnd.between(-60, 60);
      this.orbY = this.rnd.between(300, 560);
    }
  }

  private setFace(f: Face, t: number) { this.face = f; this.faceT = t; }

  /** Coloca las imágenes según el estado (cada fotograma). */
  private sync() {
    const half = this.hw / 2, sx = (this.hw + 2 * RIM_R) / 200;
    const bxc = this.hx + this.side * (half + RIM_R + 26);
    this.board.setPosition(bxc, this.hy - 55).setFlipX(this.side < 0);
    this.rimBack.setPosition(this.hx, this.hy).setScale(sx, 1);
    this.rimFront.setPosition(this.hx, this.hy).setScale(sx, 1);
    this.net.setPosition(this.hx, this.hy - 2).setScale(this.hw / 176, this.netK);
    // brazo corto aro-tablero y brazo largo tablero-pared
    const re = this.hx + this.side * (half + RIM_R);
    this.armR.setPosition(Math.min(re, bxc), this.hy).setDisplaySize(Math.abs(bxc - re), 12);
    const wall = this.side > 0 ? this.worldW : 0, be = bxc + this.side * 16;
    this.armW.setPosition(Math.min(be, wall), this.hy - 110).setDisplaySize(Math.max(1, Math.abs(wall - be)), 16);
    // pelota y cara (la cara no gira)
    this.ball.setPosition(this.bx, this.by).setRotation(this.ang);
    // pelota dorada: halo que late (y parpadea los 2 últimos segundos)
    this.halo.setVisible(this.goldT > 0 && (this.goldT > 2 || Math.floor(this.goldT * 6) % 2 === 0));
    if (this.halo.visible) this.halo.setPosition(this.bx, this.by).setScale(1 + Math.sin(this.time0 * 12) * 0.08);
    const tex = this.goldT > 0 && (this.goldT > 2 || Math.floor(this.goldT * 6) % 2 === 0) ? 'ball-gold' : 'ball-skin';
    if (this.ball.texture.key !== tex) this.ball.setTexture(tex);
    let f: Face = this.face;
    if (!this.alive) f = 'dizzy';
    else if (this.faceT <= 0) f = this.vy > 300 && this.by > FLOOR_Y - 260 ? 'scared' : this.combo >= 3 ? 'fire' : 'normal';
    const fk = `face-${f}`;
    if (this.faceImg.texture.key !== fk) this.faceImg.setTexture(fk);
    this.faceImg.setPosition(this.bx + this.vx * 0.012, this.by + Phaser.Math.Clamp(this.vy * 0.006, -5, 5));
    this.faceImg.setScale(this.ball.scaleX, this.ball.scaleY);
    const hgt = Phaser.Math.Clamp((FLOOR_Y - this.by) / 900, 0, 1);
    this.shadow.setPosition(this.bx, FLOOR_Y + 12).setSize(90 - hgt * 50, 20 - hgt * 10).setAlpha(0.25 - hgt * 0.15);
    this.fire.emitting = this.alive && !this.paused && this.combo >= 3;
    // bola dorada
    const on = this.orbT > 0;
    this.orb.setVisible(on && (this.orbT > 2 || Math.floor(this.orbT * 8) % 2 === 0));
    if (on) this.orb.setPosition(this.orbX, this.orbY + Math.sin(this.time0 * 3) * 10).setScale(0.9 + Math.sin(this.time0 * 6) * 0.06).setAngle(this.time0 * 40);
  }

  /* ---------------------------------------------------------------- final y revivir */

  crash(_why: 'floor' | 'rim' | 'test' = 'test') {
    if (!this.alive || !this.sys.isActive()) return;
    this.alive = false;
    this.waiting = false;
    this.goldT = 0;
    this.orbT = 0;
    portal.gameplayStop();
    audio.tone(300, 0.45, 'sawtooth', 0.1, 70);
    audio.noise(0.25, 0.3, 500);
    this.cameras.main.shake(220, 0.012);
    const total = save.get('coins') + this.coins;
    save.set('coins', total);
    const run = this.runId;
    // panel en tiempo real (no depende del reloj de la escena)
    window.setTimeout(() => {
      if (run !== this.runId || this.alive || !this.sys.isActive()) return;
      const best = save.get('best');
      const newBest = this.score > best;
      if (newBest) save.set('best', this.score);
      this.events.emit('over', {
        score: this.score, best: Math.max(best, this.score), newBest, canRevive: portal.hasRewarded && !this.revived,
        coins: this.coins, canDouble: !this.doubled,
      });
    }, 800);
  }

  /** ×2 con anuncio con recompensa: suma otra vez las monedas de la partida (una vez por partida). */
  doubleCoins() {
    if (this.doubled || this.alive) return 0;
    this.doubled = true;
    save.set('coins', save.get('coins') + this.coins);
    return this.coins;
  }

  /** Alias para scripts/sdk-test-espera.mjs (llama a breakEgg() en todos los juegos). */
  breakEgg() { this.crash('test'); }

  /** Revivir tras anuncio con recompensa (una vez por partida): pelota flotando en el centro y dos vidas como mínimo. */
  revive() {
    if (this.alive) return;
    this.revived = true;
    // las monedas de esta partida ya se guardaron al fallar; se siguen contando desde aquí
    save.set('coins', save.get('coins') - this.coins);
    this.lives = Math.max(this.lives, 2);
    this.bx = this.worldW / 2; this.by = 760; this.vx = 0; this.vy = 0; this.spin = 0;
    this.waiting = true; this.hoverT = 0; this.touched = false; this.rimCd = 0;
    this.alive = true;
    this.events.emit('life', this.lives);
    portal.gameplayStart();
  }
}
