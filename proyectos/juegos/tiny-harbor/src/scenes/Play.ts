import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { bigNumber } from '@comun/ui';
import { save } from '../state';
import { Sim, type Boat, type Ev } from '../sim';
import { Bot } from '../bot';
import { LAYOUTS, PORTS, type LayoutName, type Pad } from '../data';
import { makeGround, makeExit, SEA, LAND, QUAY, HOLD, padIcon } from '../art';

type BoatView = { c: Phaser.GameObjects.Container; img: Phaser.GameObjects.Image; crates: Phaser.GameObjects.Image[]; ok: Phaser.GameObjects.Image; shown: number; look: number };
type CraneView = { base: Phaser.GameObjects.Image; arm: Phaser.GameObjects.Image; hook: Phaser.GameObjects.Image; crate: Phaser.GameObjects.Image; stack: Phaser.GameObjects.Image[]; slot: Phaser.GameObjects.Image };
type SignView = { c: Phaser.GameObjects.Container; board: Phaser.GameObjects.Image; cost: Phaser.GameObjects.Text; pad: Pad; ok: boolean | null; tw?: Phaser.Tweens.Tween };

/** Separación mínima entre intersticiales (ms). Las pruebas la bajan con window.__thAdGap. */
const AD_GAP = () => ((window as any).__thAdGap ?? 180_000) as number;

/**
 * El puerto. La lógica está en Sim (src/sim.ts); aquí se dibuja, se oye, se guarda y se recoge el dedo.
 * Pausas naturales con anuncio (como mucho uno cada 3 min): al volver desde el menú (nunca en la primera partida de la
 * sesión) y al terminar un puerto. Anuncios con recompensa opcionales en el HUD: barco doble 60 s y ×2.
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  /** Hora del último intersticial (o del inicio de la sesión). */
  static lastAd = Date.now();
  /** El anuncio del puerto nuevo ya se ha resuelto al terminar el anterior: no repetirlo al reiniciar la escena. */
  private static skipAd = false;
  sim!: Sim;
  paused = true;
  /** Piloto automático (pruebas y capturas). */
  autopilot = false;
  bot = new Bot();
  offline = 0;
  /** Ya ha pasado la pausa inicial (el HUD puede crearse antes o después). */
  ready = false;
  leaving = false;
  private world: Phaser.GameObjects.GameObject[] = [];
  private boatViews = new Map<number, BoatView>();
  private boatPool: BoatView[] = [];
  private cranes: CraneView[] = [];
  private tugViews: Phaser.GameObjects.Image[] = [];
  private signs: SignView[] = [];
  private signKey = '';
  private exitImg!: Phaser.GameObjects.Image;
  private waves!: Phaser.GameObjects.TileSprite;
  private hand!: Phaser.GameObjects.Image;
  private saveT = 0;
  private layoutName: LayoutName = 'wide';
  private ff = false;

  constructor() { super('Play'); }

  async create() {
    // la instancia se reutiliza (puerto nuevo = reinicio): nada de antes puede sobrevivir
    this.world = []; this.boatViews = new Map(); this.boatPool = []; this.cranes = []; this.tugViews = []; this.signs = []; this.signKey = '';
    this.saveT = 0; this.leaving = false; this.ff = false; this.dragId = -1; this.paused = true; this.ready = false;
    this.autopilot = !!(window as any).__thAutopilot; this.bot = new Bot();

    this.layoutName = this.pickLayout();
    const data = save.get('game');
    this.sim = new Sim(data, this.layoutName);
    this.sim.stars = save.get('stars');
    // faro comprado y la partida se cerró antes de abrir el puerto nuevo
    if (this.sim.activePads().length === 0) { this.sim.nextPort(); this.persist(); }
    this.offline = Play.skipAd ? 0 : this.sim.offlineGain(Date.now(), data.savedAt);
    this.cameras.main.setBackgroundColor(SEA[this.sim.def.theme]);
    this.buildWorld();

    this.layout();
    this.scale.on('resize', this.layout, this);
    const onHide = () => { if (document.hidden) this.persist(); };
    document.addEventListener('visibilitychange', onHide);

    // el dedo: coger, arrastrar y soltar barcos
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);

    this.scene.launch('Hud');
    let gone = false;
    this.events.once('shutdown', () => {
      gone = true;
      this.persist();
      portal.gameplayStop();
      this.scale.off('resize', this.layout, this);
      document.removeEventListener('visibilitychange', onHide);
      this.scene.stop('Hud');
    });

    save.set('runs', save.get('runs') + 1);
    // Intersticial en pausa natural: al volver del menú, nunca en la primera partida de la sesión y como mucho cada 3 min
    if (!Play.firstRun && !Play.skipAd && Date.now() - Play.lastAd >= AD_GAP()) { await portal.commercialBreak(); Play.lastAd = Date.now(); }
    Play.firstRun = false;
    Play.skipAd = false;
    if (gone) return;
    this.paused = false;
    portal.gameplayStart();
    this.ready = true;
    this.events.emit('ready', this.offline);
  }

  private pickLayout(): LayoutName { return this.scale.height > this.scale.width * 1.05 ? 'tall' : 'wide'; }

  /** Cámara: el puerto entero a la vista, debajo de la barra del HUD. */
  private layout() {
    const want = this.pickLayout();
    if (want !== this.layoutName && this.sim) {
      this.layoutName = want;
      this.sim.setLayout(want);
      this.buildWorld();
      this.events.emit('layout');
    }
    const L = LAYOUTS[this.layoutName];
    const w = this.scale.width, h = this.scale.height;
    const u = Phaser.Math.Clamp(Math.min(w / 1000, h / 600), 0.62, 1.4);
    const top = u * (w < 640 ? 112 : 70); // barra del HUD (dos filas en pantallas estrechas)
    const z = Math.min(w / L.w, (h - top) / L.h);
    const cam = this.cameras.main;
    cam.setZoom(z);
    cam.centerOn(L.w / 2, L.h / 2 - top / 2 / z);
  }

  /* ---------------------------------------------------------------- montaje */

  private buildWorld() {
    for (const o of this.world) o.destroy();
    this.world = []; this.boatViews.clear(); this.boatPool = []; this.cranes = []; this.tugViews = []; this.signs = []; this.signKey = '';
    const L = this.sim.L, theme = this.sim.def.theme;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T) => { this.world.push(o); return o; };
    this.waves = add(this.add.tileSprite(L.w / 2, L.h / 2, L.w * 4, L.h * 4, 'waves').setDepth(-1000));
    // la tierra sigue fuera del mundo a los lados (pantallas más anchas que el puerto)
    add(this.add.rectangle(L.w / 2, L.landY - 38, L.w * 6, 4000, LAND[theme]).setOrigin(0.5, 1).setDepth(-990));
    add(this.add.rectangle(L.w / 2, L.landY, L.w * 6, 38, QUAY[theme][0]).setOrigin(0.5, 1).setDepth(-990).setStrokeStyle(4, 0x2b2340));
    add(this.add.image(0, 0, makeGround(this, theme, L.name)).setOrigin(0).setDepth(-980));
    makeExit(this, L.name);
    const e = L.exit;
    this.exitImg = add(this.add.image(e.x0, e.y0, `exit-${L.name}`).setOrigin(0).setDepth(-970).setAlpha(0.45));
    for (const [x, y] of [[e.x0 + 24, e.y0 + 30], [e.x0 + 24, e.y1 - 40], ...(L.name === 'tall' ? [[e.x1 - 24, e.y0 + 30], [e.x1 - 24, e.y1 - 40]] : [])]) {
      const b = add(this.add.image(x, y, 'buoy').setDepth(-960));
      this.tweens.add({ targets: b, y: y + 5, angle: { from: -6, to: 6 }, duration: 900 + x % 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    for (let i = 0; i < L.berths.length; i++) this.cranes.push(this.makeCrane(i, add));
    for (const _ of this.sim.tugs) this.tugViews.push(add(this.add.image(0, 0, 'tug').setDepth(400)));
    this.hand = add(this.add.image(0, 0, 'ic-hand').setDisplaySize(110, 110).setOrigin(0.45, 0.05).setDepth(5000).setVisible(false));
    this.syncSigns();
  }

  private makeCrane(i: number, add: <T extends Phaser.GameObjects.GameObject>(o: T) => T): CraneView {
    const L = this.sim.L, b = L.berths[i], pier = L.pier && b.dockY > L.landY;
    const bx = b.x + 64, by = b.dockY - (pier ? 22 : 28);
    const theme = this.sim.def.theme;
    const stack: Phaser.GameObjects.Image[] = [];
    const sx = b.x - 12, sy = b.dockY - (pier ? 26 : 70);
    for (const [dx, dy] of [[-15, 6], [15, 6], [0, -16]]) stack.push(add(this.add.image(sx + dx, sy + dy, `crate-${theme}`).setDepth(300)));
    const slot = add(this.add.image(b.x, b.y, 'slot').setDepth(-900).setAlpha(0.5));
    const base = add(this.add.image(bx, by, 'crane-base').setDepth(310));
    const arm = add(this.add.image(bx, by - 2, 'crane-arm').setOrigin(0.04, 0.5).setDepth(700));
    const hook = add(this.add.image(bx, by, 'hook').setDepth(701));
    const crate = add(this.add.image(bx, by, `crate-${theme}`).setDepth(702).setVisible(false));
    const v = { base, arm, hook, crate, stack, slot };
    this.setCraneOwned(v, i < this.sim.owned);
    return v;
  }

  private setCraneOwned(v: CraneView, on: boolean) {
    for (const o of [v.base, v.arm, v.hook, ...v.stack]) o.setVisible(on);
    v.crate.setVisible(false);
    v.slot.setVisible(on);
  }

  private makeBoatView(): BoatView {
    const c = this.add.container(0, 0);
    const img = this.add.image(0, 0, 'boat0');
    const crates = HOLD.map(([x, y]) => this.add.image(x, y, `crate-${this.sim.def.theme}`).setScale(0.62).setVisible(false));
    const ok = this.add.image(0, -112, 'ready').setVisible(false);
    c.add([img, ...crates]);
    c.add(ok);
    this.world.push(c);
    return { c, img, crates, ok, shown: -1, look: -1 };
  }

  /* ---------------------------------------------------------------- el dedo */
  private worldPt(p: Phaser.Input.Pointer) { return this.cameras.main.getWorldPoint(p.x, p.y); }
  private dragId = -1;

  private onDown(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) {
    if (this.paused || this.leaving || this.autopilot || over.length || this.dragId >= 0) return;
    ((this.sound as any).context as AudioContext | undefined)?.resume?.();
    const w = this.worldPt(p);
    if (this.sim.grab(w.x, w.y)) this.dragId = p.id;
  }
  private onMove(p: Phaser.Input.Pointer) {
    if (p.id !== this.dragId) return;
    const w = this.worldPt(p);
    this.sim.moveFinger(w.x, w.y);
  }
  private onUp(p: Phaser.Input.Pointer) {
    if (p.id !== this.dragId) return;
    this.dragId = -1;
    const w = this.worldPt(p);
    this.sim.moveFinger(w.x, w.y);
    // el barco va un fotograma por detrás del dedo: se suelta donde está el dedo
    const b = this.sim.boats.find((o) => o.id === this.sim.finger.boat);
    if (b) { b.x = w.x; b.y = w.y; }
    this.sim.release();
  }

  /* ---------------------------------------------------------------- bucle */

  update() {
    // tiempo real (el delta de Phaser viene suavizado); tope de 100 ms tras una pestaña oculta
    const dt = Math.min(this.game.loop.rawDelta || 16.7, 100) / 1000;
    this.waves.tilePositionX += dt * 8; this.waves.tilePositionY += dt * 4;
    if (this.paused || this.leaving) return;
    if (this.autopilot) this.bot.think(this.sim, dt);
    this.sim.update(dt);
    for (const e of this.sim.events) this.onEvent(e);
    this.sim.events.length = 0;
    this.draw();
    this.saveT += dt;
    if (this.saveT > 5) { this.saveT = 0; this.persist(); }
  }

  /** Piloto automático (prueba del SDK, capturas y rendimiento). */
  autoplay(on = true) { this.autopilot = on; if (on && this.dragId >= 0) { this.dragId = -1; this.sim.release(); } }

  /** Pruebas y capturas: avanza secs de juego con el piloto automático, sin efectos. Se para en el faro. */
  fastForward(secs: number) {
    this.ff = true;
    for (let t = 0; t < secs && !this.leaving; t += 0.05) {
      this.bot.think(this.sim, 0.05);
      this.sim.update(0.05);
      for (const e of this.sim.events) if (e.k === 'buy' || e.k === 'gate' || e.k === 'dock') this.onEvent(e);
      this.sim.events.length = 0;
    }
    this.ff = false;
    this.draw();
  }

  private onEvent(e: Ev) {
    const ff = this.ff;
    switch (e.k) {
      case 'grab': audio.tone(520, 0.06, 'triangle', 0.08, 700); break;
      case 'drop': if (!e.ok) audio.tone(300, 0.08, 'sine', 0.06, 240); break;
      case 'dock':
        if (!save.get('tutorialDone')) save.set('tutorialDone', true);
        if (!ff) audio.tone(392, 0.12, 'triangle', 0.08, 523);
        break;
      case 'crate': audio.noise(0.06, 0.12, 380); audio.tone(180, 0.06, 'sine', 0.08); break;
      case 'ready': audio.tone(988, 0.1, 'triangle', 0.08); setTimeout(() => audio.tone(1319, 0.12, 'triangle', 0.08), 90); break;
      case 'sail': {
        audio.tone(220, 0.35, 'sawtooth', 0.04, 180); // bocina
        setTimeout(() => audio.tone(1320, 0.08, 'square', 0.05), 120); setTimeout(() => audio.tone(1760, 0.12, 'square', 0.05), 190);
        const t = bigNumber(this, e.x, e.y - 90, 44, `+${e.v}`).setColor(this.sim.boost > 0 ? '#ff8a4c' : '#ffd23f').setDepth(6000);
        this.tweens.add({ targets: t, y: t.y - 90, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
        this.events.emit('wallet');
        break;
      }
      case 'star': {
        audio.tone(1568, 0.15, 'triangle', 0.1);
        const s = this.add.image(e.x + 40, e.y - 60, 'ic-star').setDisplaySize(56, 56).setDepth(6000);
        this.tweens.add({ targets: s, y: s.y - 100, alpha: 0, angle: 180, duration: 1100, onComplete: () => s.destroy() });
        break;
      }
      case 'buy': this.onBuy(e.pad); break;
      case 'gate': this.openNextPort(); break;
    }
  }

  private onBuy(pad: Pad) {
    if (!this.ff) [523, 659, 784, 1047].forEach((f, j) => setTimeout(() => audio.tone(f, 0.14, 'triangle', 0.1), j * 70));
    let at: { x: number; y: number } | null = null;
    if (pad.kind === 'berth') {
      const i = this.sim.owned - 1, v = this.cranes[i];
      this.setCraneOwned(v, true);
      at = this.sim.L.berths[i];
      if (!this.ff) for (const o of [v.base, v.arm]) { const s = o.scaleX; o.setScale(0.2); this.tweens.add({ targets: o, scale: s, duration: 380, ease: 'Back.out' }); }
    }
    if (pad.kind === 'tug') {
      const img = this.add.image(this.sim.L.tugHome.x, this.sim.L.tugHome.y, 'tug').setDepth(400);
      this.world.push(img); this.tugViews.push(img);
      at = this.sim.L.tugHome;
    }
    const sv = this.signs.find((s) => s.pad.id === pad.id);
    if (!this.ff && sv) at = at ?? { x: sv.c.x, y: sv.c.y };
    if (!this.ff && at) {
      const burst = this.add.particles(at.x, at.y, 'dot', {
        speed: { min: 140, max: 380 }, lifespan: 700, scale: { start: 1.6, end: 0 }, tint: [0xffd23f, 0xff6fae, 0x3ddc84, 0x4aa8ff], emitting: false,
      }).setDepth(6000);
      burst.explode(28);
      setTimeout(() => burst.destroy(), 900);
    }
    this.syncSigns();
    this.events.emit('wallet');
    if (!this.ff) this.persist();
  }

  /** Faro comprado: fiesta, panel del HUD (estrellas con ×2) y, al cerrarlo, pausa natural y puerto nuevo. */
  private openNextPort() {
    this.leaving = true;
    if (this.dragId >= 0) { this.dragId = -1; this.sim.release(); }
    portal.gameplayStop();
    const reward = this.sim.port < PORTS.length - 1 ? 10 : 50;
    this.persist(); // el faro ya está comprado: si se cierra aquí, al volver se abre el puerto nuevo
    if (this.ff) { this.events.emit('portDone', reward); return; }
    [523, 659, 784, 1047, 1319].forEach((f, j) => setTimeout(() => audio.tone(f, 0.2, 'square', 0.08), j * 110));
    const cam = this.cameras.main;
    const confetti = this.add.particles(cam.midPoint.x, cam.worldView.y - 20, 'dot', {
      x: { min: -cam.worldView.width / 2, max: cam.worldView.width / 2 }, speedY: { min: 200, max: 420 }, speedX: { min: -80, max: 80 },
      lifespan: 2400, scale: { start: 1.6, end: 0.6 }, tint: [0xffd23f, 0xff6fae, 0x3ddc84, 0x4aa8ff, 0xff8a4c], frequency: 20,
    }).setDepth(7000);
    this.world.push(confetti);
    // tiempo real: el reloj de la escena va más lento si bajan los FPS
    setTimeout(() => { confetti.stop(); if (this.sys.isActive()) this.events.emit('portDone', reward); }, 1400);
  }

  /** Lo llama el HUD al cerrar el panel del puerto terminado. watched = ya vio un anuncio con recompensa ahí. */
  async nextPort(watched: boolean, reward = 0) {
    this.sim.nextPort();
    if (watched) this.sim.stars += reward;
    this.persist();
    this.cameras.main.fadeOut(300, 255, 255, 255);
    await new Promise((r) => setTimeout(r, 320));
    if (!watched && Date.now() - Play.lastAd >= AD_GAP()) { await portal.commercialBreak(); Play.lastAd = Date.now(); }
    if (watched) Play.lastAd = Math.max(Play.lastAd, Date.now() - AD_GAP() / 2);
    Play.skipAd = true;
    if (this.sys.isActive()) this.scene.restart();
  }

  /** Guarda la partida (cada 5 s, al comprar, al ocultar la pestaña y al salir). */
  persist() {
    if (!this.sim) return;
    save.set('stars', this.sim.stars);
    save.set('best', Math.max(save.get('best'), Math.floor(this.sim.earned)));
    save.set('game', this.sim.serialize());
  }

  /* ---------------------------------------------------------------- letreros de mejoras */
  private syncSigns() {
    const act = this.sim.activePads();
    const key = act.map((p) => p.id).join();
    if (key === this.signKey) return;
    this.signKey = key;
    for (const s of this.signs) s.c.destroy();
    this.signs = act.map((pad, i) => this.makeSign(pad, i));
  }

  private makeSign(pad: Pad, i: number): SignView {
    const p = this.sim.L.signs[i];
    const c = this.add.container(p.x, p.y).setDepth(800);
    const board = this.add.image(0, 0, 'sign');
    const icon = this.add.image(0, -22, padIcon(pad.kind, this.sim.port === PORTS.length - 1)).setScale(pad.kind === 'gate' ? 1.05 : 0.95);
    const coin = this.add.image(-30, 44, 'ic-coin').setDisplaySize(34, 34);
    const cost = bigNumber(this, -10, 46, 34, `${pad.cost}`).setOrigin(0, 0.5);
    // precio centrado
    const wTot = 34 + 6 + cost.displayWidth;
    coin.setX(-wTot / 2 + 17); cost.setX(coin.x + 23);
    c.add([board, icon, coin, cost]);
    c.setSize(130, 150).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.tweens.add({ targets: c, scale: 0.92, duration: 60 }));
    c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 80 }));
    c.on('pointerup', () => { c.setScale(1); this.tapSign(pad.id); });
    c.setScale(0.2);
    this.tweens.add({ targets: c, scale: 1, duration: 300, ease: 'Back.out' });
    this.world.push(c);
    return { c, board, cost, pad, ok: null };
  }

  /** Tocar un letrero: compra si alcanza; si no, tiembla. */
  tapSign(id: string) {
    if (this.paused || this.leaving) return false;
    if (this.sim.buy(id)) return true;
    const s = this.signs.find((v) => v.pad.id === id);
    audio.tone(180, 0.18, 'square', 0.08, 120);
    if (s) this.tweens.add({ targets: s.c, x: s.c.x + 8, duration: 50, yoyo: true, repeat: 3 });
    return false;
  }

  /* ---------------------------------------------------------------- dibujo */
  private draw() {
    const s = this.sim, L = s.L, now = this.time.now;
    const dragging = s.boats.find((b) => b.id === s.finger.boat);
    // barcos
    for (const [id, v] of this.boatViews) if (!s.boats.some((b) => b.id === id)) { v.c.setVisible(false); this.boatPool.push(v); this.boatViews.delete(id); }
    for (const b of s.boats) {
      let v = this.boatViews.get(b.id);
      if (!v) { v = this.boatPool.pop() ?? this.makeBoatView(); v.shown = -1; this.boatViews.set(b.id, v); }
      this.drawBoat(v, b, now, b === dragging);
    }
    // grúas: el brazo va de la pila de cajas al barco mientras carga
    for (let i = 0; i < s.owned; i++) {
      const v = this.cranes[i], r = s.berths[i];
      if (!v) continue;
      const b = r.boat ? s.boats.find((o) => o.id === r.boat) : null;
      const loading = b && b.state === 'load';
      const ph = loading ? r.t / s.craneS : 0;
      // 0-0.5: de la pila al barco con la caja; 0.5-1: vuelta vacío
      const pile = v.stack[2], bp = L.berths[i];
      const k = loading ? (ph < 0.5 ? Phaser.Math.Easing.Sine.InOut(ph * 2) : 1 - Phaser.Math.Easing.Sine.InOut((ph - 0.5) * 2)) : 0.15 + Math.sin(now / 900 + i) * 0.05;
      const tx = pile.x + (bp.x - pile.x) * k, ty = pile.y + (bp.y - 10 - pile.y) * k - Math.sin(k * Math.PI) * 30;
      const dx = tx - v.arm.x, dy = ty - v.arm.y;
      v.arm.setRotation(Math.atan2(dy, dx)).setScale(Math.max(0.4, Math.hypot(dx, dy) / 150), 1);
      v.hook.setPosition(tx, ty);
      v.crate.setVisible(!!loading && ph < 0.5).setPosition(tx, ty + 16);
      v.slot.setVisible(!r.boat).setAlpha(dragging && dragging.load < dragging.cap ? 0.6 + Math.sin(now / 120) * 0.35 : 0.4);
    }
    // remolcadores
    s.tugs.forEach((t, i) => this.tugViews[i]?.setPosition(t.x, t.y + Math.sin(now / 400 + i) * 2).setRotation(t.ang));
    // zona de mar abierto: se ilumina si hay un barco cargado que llevar
    const loaded = (dragging && dragging.load >= dragging.cap) || (!s.pilot && s.boats.some((b) => b.state === 'ready'));
    this.exitImg.setAlpha(loaded ? 0.65 + Math.sin(now / 150) * 0.3 : 0.4);
    // letreros: verdes y latiendo si alcanza
    this.syncSigns();
    for (const v of this.signs) {
      const ok = s.canBuy(v.pad);
      if (ok !== v.ok) {
        v.ok = ok;
        v.board.setTexture(ok ? 'sign-ok' : 'sign');
        v.cost.setColor(ok ? '#ffffff' : '#ffb3b3');
        v.tw?.stop(); v.tw = undefined; v.c.setAngle(0);
        if (ok) v.tw = this.tweens.add({ targets: v.c, angle: { from: -4, to: 4 }, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }
    // mano del piloto automático (capturas)
    if (this.autopilot && !this.ff) {
      const f = this.bot.state;
      this.hand.setVisible(true).setPosition(f.x, f.y).setScale(f.down ? 0.95 : 1.1);
    } else this.hand.setVisible(false);
  }

  private drawBoat(v: BoatView, b: Boat, now: number, dragged: boolean) {
    if (v.look !== b.look) { v.look = b.look; v.img.setTexture(`boat${b.look}`); }
    const bob = b.state === 'drag' ? 0 : Math.sin(now / 500 + b.id) * 2.5;
    v.c.setVisible(true).setPosition(b.x, b.y + bob).setRotation(b.ang + (b.state === 'queue' || b.state === 'float' ? Math.sin(now / 700 + b.id) * 0.03 : 0));
    v.c.setDepth(dragged ? 1000 : b.state === 'sail' ? 600 : 500 + b.y * 0.01);
    v.c.setScale(dragged ? 1.08 : 1);
    if (v.shown !== b.load) { v.shown = b.load; v.crates.forEach((c, i) => c.setVisible(i < b.load)); }
    const ready = b.load >= b.cap && b.state !== 'sail' && !this.sim.pilot;
    v.ok.setVisible(ready).setRotation(-b.ang);
    if (ready) v.ok.setScale(1 + Math.sin(now / 160) * 0.12);
  }

  /** Para el HUD (tutorial): punto del mundo en pantalla. */
  toScreen(x: number, y: number) {
    const cam = this.cameras.main;
    return { x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom };
  }
}
