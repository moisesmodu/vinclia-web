import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { bigNumber } from '@comun/ui';
import { save } from '../state';
import { Sim, type Customer, type Helper, type Ev } from '../sim';
import { botThink, pickTarget } from '../bot';
import { WORLD, COUNTER, PILE, SHELF_CAP, type PadDef } from '../data';
import { makeGround, THEME_BG, FRUIT_SPOTS } from '../art';
import { heroKey, hatKey } from '../cosmeticos';

type Body = { body: Phaser.GameObjects.Image; stack: Phaser.GameObjects.Image[]; bubble?: Phaser.GameObjects.Image; want?: Phaser.GameObjects.Image };
type PadView = { c: Phaser.GameObjects.Container; bar: Phaser.GameObjects.Rectangle; cost: Phaser.GameObjects.Text; shown: number; poor: boolean | null; pad: PadDef };

const SHELF_SPOTS: [number, number][] = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) SHELF_SPOTS.push([-48 + i * 32, -16 + r * 30]);
const JUICE_SPOTS: [number, number][] = [-55, -33, -11, 11, 33, 55].map((x) => [x, 14]);

/**
 * El puesto. La lógica está en Sim (src/sim.ts); aquí solo se dibuja, se oye y se guarda.
 * Pausas naturales con anuncio: al volver desde el menú (nunca en la primera partida de la sesión) y al abrir un
 * puesto nuevo. Anuncios con recompensa opcionales en el HUD (turbo ×2 y cosecha al instante).
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  /** El anuncio del puesto nuevo ya se ha pedido al comprar la puerta: no repetirlo al reiniciar la escena. */
  private static skipAd = false;
  sim!: Sim;
  paused = true;
  /** Piloto automático (pruebas y capturas). */
  autopilot = false;
  offline = 0;
  /** Ya ha pasado la pausa inicial (el HUD puede crearse antes o después). */
  ready = false;
  private player!: Body & { hat: Phaser.GameObjects.Image };
  private trees = new Map<string, { img: Phaser.GameObjects.Image; fruits: Phaser.GameObjects.Image[] }>();
  private shelves = new Map<string, { img: Phaser.GameObjects.Image; items: Phaser.GameObjects.Image[]; inp?: Phaser.GameObjects.Text }>();
  private custs = new Map<number, Body>();
  private custPool: Body[] = [];
  private helpers = new Map<number, Body>();
  private pads = new Map<string, PadView>();
  private padKey = '';
  private pileCoins: Phaser.GameObjects.Image[] = [];
  private pileStar!: Phaser.GameObjects.Image;
  private shownPile = -1;
  private guide!: Phaser.GameObjects.Image;
  private guideRing!: Phaser.GameObjects.Image;
  private saveT = 0;
  private thinkT = 0;
  private payBeep = 0;
  private walkT = 0;
  private leaving = false;

  constructor() { super('Play'); }

  async create() {
    // la instancia se reutiliza (reinicio al abrir un puesto): nada de antes puede sobrevivir
    this.trees = new Map(); this.shelves = new Map(); this.custs = new Map(); this.custPool = []; this.helpers = new Map();
    this.pads = new Map(); this.padKey = ''; this.pileCoins = []; this.shownPile = -1; this.saveT = 0; this.thinkT = 0;
    this.payBeep = 0; this.walkT = 0; this.leaving = false; this.ff = false; this.paused = true; this.ready = false; this.autopilot = !!(window as any).__fsAutopilot;

    const data = save.get('game');
    this.sim = new Sim(data);
    this.sim.stars = save.get('stars');
    this.offline = Play.skipAd ? 0 : this.sim.offlineGain(Date.now(), data.savedAt);

    const theme = this.sim.def.theme;
    this.cameras.main.setBackgroundColor(THEME_BG[theme]);
    this.add.image(0, 0, makeGround(this, theme)).setOrigin(0).setScale(2).setDepth(-1000);
    this.buildStatic();
    this.buildPlayer();
    this.syncPads();

    const cam = this.cameras.main;
    cam.startFollow(this.player.body, true, 0.12, 0.12);
    cam.setBounds(-60, -40, WORLD.w + 120, WORLD.h + 80);
    this.layout();
    this.scale.on('resize', this.layout, this);
    const onHide = () => { if (document.hidden) this.persist(); };
    document.addEventListener('visibilitychange', onHide);

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
    // Anuncio intersticial en pausa natural: al volver del menú, nunca en la primera partida de la sesión
    if (!Play.firstRun && !Play.skipAd) await portal.commercialBreak();
    Play.firstRun = false;
    Play.skipAd = false;
    if (gone) return;
    this.paused = false;
    portal.gameplayStart();
    this.ready = true;
    this.events.emit('ready', this.offline);
  }

  private layout() {
    const w = this.scale.width, h = this.scale.height;
    // apaisado: unas 1400×800 unidades a la vista; vertical: unas 560×1100 (huerto o tienda, y lo de alrededor)
    const z = h > w ? Math.min(w / 560, h / 1100) : Math.min(w / 1400, h / 800);
    this.cameras.main.setZoom(Phaser.Math.Clamp(z, 0.5, 1.2));
  }

  /* ---------------------------------------------------------------- montaje */

  private buildStatic() {
    for (const t of this.sim.trees) this.addTree(t.id);
    for (const s of this.sim.shelves) this.addShelf(s.id);
    this.add.image(COUNTER.x, COUNTER.y, 'counter').setOrigin(0.5, 135 / 190).setDepth(COUNTER.y + 35);
    this.add.image(COUNTER.x + 52, COUNTER.y - 18, 'register').setDepth(COUNTER.y + 36);
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4, r = 6 + i * 2.2;
      this.pileCoins.push(this.add.image(PILE.x + Math.cos(a) * r, PILE.y + Math.sin(a) * r * 0.6 - i * 2, 'coin').setDepth(PILE.y + i).setVisible(false));
    }
    this.pileStar = this.add.image(PILE.x + 26, PILE.y - 30, 'ic-star').setDisplaySize(40, 40).setDepth(PILE.y + 20).setVisible(false);
    this.tweens.add({ targets: this.pileStar, angle: { from: -12, to: 12 }, duration: 400, yoyo: true, repeat: -1 });
    this.guideRing = this.add.image(0, 0, 'ring').setDepth(-50).setVisible(false);
    this.guide = this.add.image(0, 0, 'arrow').setDepth(5000).setVisible(false);
    this.tweens.add({ targets: this.guideRing, scale: { from: 0.8, to: 1.2 }, alpha: { from: 1, to: 0.3 }, duration: 600, repeat: -1 });
  }

  private addTree(id: string) {
    const t = this.sim.trees.find((x) => x.id === id)!;
    const img = this.add.image(t.x, t.y, `tree-${t.fruit}`).setOrigin(0.5, 0.7).setDepth(t.y + 30);
    const fruits = FRUIT_SPOTS[t.fruit].map(([dx, dy]) => this.add.image(t.x + dx, t.y - 34 + dy, `f-${t.fruit}`).setDepth(t.y + 31).setScale(t.fruit === 'melon' ? 0.9 : 0.8));
    this.trees.set(id, { img, fruits });
    return img;
  }

  private addShelf(id: string) {
    const s = this.sim.shelves.find((x) => x.id === id)!;
    const img = this.add.image(s.x, s.y, s.machine ? 'machine' : 'shelf').setOrigin(0.5, s.machine ? 0.6 : 0.45).setDepth(s.y + 40);
    const spots = s.machine ? JUICE_SPOTS : SHELF_SPOTS;
    const items = spots.slice(0, s.machine ? s.cap : SHELF_CAP).map(([dx, dy]) => this.add.image(s.x + dx, s.y + dy, `f-${s.item}`).setDepth(s.y + 41).setScale(0.72).setVisible(false));
    let inp: Phaser.GameObjects.Text | undefined;
    if (s.machine) {
      this.add.image(s.x - 60, s.y - 56, 'f-orange').setDepth(s.y + 42).setScale(0.8);
      inp = bigNumber(this, s.x - 30, s.y - 54, 26, '0').setDepth(s.y + 42);
    }
    this.shelves.set(id, { img, items, inp });
    return img;
  }

  private buildPlayer() {
    const p = this.sim.player;
    const body = this.add.image(p.x, p.y, heroKey()).setOrigin(0.5, 80 / 88);
    const hk = hatKey();
    const hat = this.add.image(p.x, p.y, hk || 'dot').setOrigin(0.5, 1).setVisible(!!hk);
    const stack: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 16; i++) stack.push(this.add.image(0, 0, 'f-apple').setScale(0.75).setVisible(false));
    this.player = { body, hat, stack };
  }

  private makeBody(tex: string, stackN: number): Body {
    const body = this.add.image(0, 0, tex).setOrigin(0.5, 80 / 88);
    const stack: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < stackN; i++) stack.push(this.add.image(0, 0, 'f-apple').setScale(0.6).setVisible(false));
    return { body, stack };
  }

  /* ---------------------------------------------------------------- bucle */

  update() {
    // tiempo real (el delta de Phaser viene suavizado); tope de 100 ms tras una pestaña oculta
    const dt = Math.min(this.game.loop.rawDelta || 16.7, 100) / 1000;
    if (this.paused || this.leaving) return;
    if (this.autopilot && (this.thinkT -= dt) <= 0) { botThink(this.sim); this.thinkT = 0.1; }
    this.sim.update(dt);
    for (const e of this.sim.events) this.onEvent(e);
    this.sim.events.length = 0;
    this.draw(dt);
    this.saveT += dt;
    if (this.saveT > 5) { this.saveT = 0; this.persist(); }
  }

  /** Pruebas y capturas: avanza secs de juego con el piloto automático, sin efectos. Se para en la puerta. */
  fastForward(secs: number) {
    this.ff = true;
    for (let t = 0; t < secs && !this.leaving; t += 0.1) {
      botThink(this.sim);
      this.sim.update(0.1);
      for (const e of this.sim.events) if (e.k === 'build' || e.k === 'gate') this.onEvent(e);
      this.sim.events.length = 0;
    }
    this.ff = false;
  }
  private ff = false;

  private onEvent(e: Ev) {
    if (this.ff && e.k === 'build') {
      if (e.pad.kind === 'tree') this.addTree(e.pad.id);
      if (e.pad.kind === 'shelf' || e.pad.kind === 'machine') this.addShelf(e.pad.id);
      if (!save.get('tutorialDone')) save.set('tutorialDone', true);
      this.syncPads();
      return;
    }
    const p = this.sim.player;
    switch (e.k) {
      case 'pick': audio.tone(500 + p.carry.length * 40, 0.06, 'triangle', 0.08); break;
      case 'drop': audio.tone(700, 0.05, 'sine', 0.08, 900); break;
      case 'sell': {
        audio.tone(1320, 0.08, 'square', 0.05); setTimeout(() => audio.tone(1760, 0.12, 'square', 0.05), 70);
        const t = bigNumber(this, e.x, e.y - 30, 34, `+${e.v}`).setColor('#ffd23f').setDepth(6000);
        this.tweens.add({ targets: t, y: t.y - 70, alpha: 0, duration: 900, onComplete: () => t.destroy() });
        break;
      }
      case 'star': audio.tone(1568, 0.15, 'triangle', 0.1); break;
      case 'collect': this.flyCoins(e.v, e.stars); break;
      case 'pay': if ((this.payBeep++ & 3) === 0) audio.tone(880 + Math.random() * 200, 0.04, 'square', 0.04); break;
      case 'build': this.onBuild(e.pad); break;
      case 'gate': this.openNextStand(); break;
    }
  }

  private flyCoins(v: number, stars: number) {
    const p = this.sim.player;
    const n = Math.min(8, 2 + Math.floor(v / 5));
    for (let i = 0; i < n; i++) {
      const c = this.add.image(PILE.x + (Math.random() - 0.5) * 30, PILE.y - 10, 'coin').setDepth(6000);
      this.tweens.add({ targets: c, x: p.x, y: p.y - 60, delay: i * 35, duration: 260, ease: 'Quad.in', onComplete: () => c.destroy() });
    }
    for (let i = 0; i < n; i++) setTimeout(() => audio.tone(1200 + i * 60, 0.05, 'square', 0.04), i * 40);
    if (stars) setTimeout(() => audio.tone(1568, 0.2, 'triangle', 0.1), 200);
    this.events.emit('wallet');
  }

  private onBuild(pad: PadDef) {
    [523, 659, 784, 1047].forEach((f, j) => setTimeout(() => audio.tone(f, 0.14, 'triangle', 0.1), j * 70));
    let obj: Phaser.GameObjects.Image | null = null;
    if (pad.kind === 'tree') obj = this.addTree(pad.id);
    if (pad.kind === 'shelf' || pad.kind === 'machine') obj = this.addShelf(pad.id);
    if (obj) { const s = obj.scale; obj.setScale(0.2); this.tweens.add({ targets: obj, scale: s, duration: 380, ease: 'Back.out' }); }
    const burst = this.add.particles(pad.x, pad.y, 'dot', {
      speed: { min: 120, max: 360 }, lifespan: 700, scale: { start: 1.4, end: 0 }, tint: [0xffd23f, 0xff6fae, 0x3ddc84, 0x4aa8ff], emitting: false,
    }).setDepth(6000);
    burst.explode(28);
    setTimeout(() => burst.destroy(), 900);
    if (!save.get('tutorialDone')) save.set('tutorialDone', true);
    this.syncPads();
    this.persist();
  }

  /** Puerta comprada: fiesta, pausa natural (anuncio) y puesto nuevo. */
  private openNextStand() {
    this.leaving = true;
    portal.gameplayStop();
    [523, 659, 784, 1047, 1319].forEach((f, j) => setTimeout(() => audio.tone(f, 0.2, 'square', 0.08), j * 110));
    const cam = this.cameras.main;
    const confetti = this.add.particles(cam.midPoint.x, cam.worldView.y - 20, 'dot', {
      x: { min: -cam.worldView.width / 2, max: cam.worldView.width / 2 }, speedY: { min: 200, max: 420 }, speedX: { min: -80, max: 80 },
      lifespan: 2400, scale: { start: 1.6, end: 0.6 }, tint: [0xffd23f, 0xff6fae, 0x3ddc84, 0x4aa8ff, 0xff8a4c], frequency: 20,
    }).setDepth(7000);
    this.sim.nextStand();
    this.persist();
    // tiempo real: el reloj de la escena va más lento si bajan los FPS
    setTimeout(async () => {
      confetti.stop();
      cam.fadeOut(300, 255, 255, 255);
      await new Promise((r) => setTimeout(r, 320));
      await portal.commercialBreak();
      Play.skipAd = true;
      if (this.sys.isActive()) this.scene.restart();
    }, 1600);
  }

  /** Guarda la partida (cada 5 s, al comprar, al ocultar la pestaña y al salir). */
  persist() {
    if (!this.sim) return;
    save.set('stars', this.sim.stars);
    save.set('best', Math.max(save.get('best'), this.sim.earned));
    save.set('game', this.sim.serialize());
  }

  private syncPads() {
    const act = this.sim.activePads();
    const key = act.map((p) => p.id).join();
    if (key === this.padKey) return;
    this.padKey = key;
    for (const [id, v] of this.pads) if (!act.some((p) => p.id === id)) { v.c.destroy(); this.pads.delete(id); }
    for (const pad of act) if (!this.pads.has(pad.id)) this.pads.set(pad.id, this.makePad(pad));
  }

  private makePad(pad: PadDef): PadView {
    const c = this.add.container(pad.x, pad.y).setDepth(-100);
    c.add(this.add.image(0, 0, 'pad'));
    const icon = (k: string, s: number, y = -14) => c.add(this.add.image(0, y, k).setScale(s));
    switch (pad.kind) {
      case 'tree': icon(`tree-${pad.fruit}`, 0.38, -18); icon(`f-${pad.fruit}`, 0.7, -8); break;
      case 'shelf': icon('pi-shelf', 0.9); icon(`f-${pad.item}`, 0.8, -22); break;
      case 'machine': icon('machine', 0.42); break;
      case 'cap': icon('pi-cap', 0.9); break;
      case 'speed': icon('pi-speed', 0.9); break;
      case 'helper': icon('pi-helper', 0.9); break;
      case 'cashier': icon('pi-cashier', 0.9); break;
      case 'gate': icon(this.sim.stand === 2 ? 'pi-star' : 'pi-gate', 1); break;
    }
    const bar = this.add.rectangle(-46, 46, 92, 8, 0x3ddc84).setOrigin(0, 0.5).setScale(0, 1);
    const coin = this.add.image(-22, 26, 'coin').setScale(0.75);
    const cost = bigNumber(this, -6, 27, 26, '0').setOrigin(0, 0.5);
    c.add([bar, coin, cost]);
    if (pad.kind === 'gate') this.tweens.add({ targets: c, scale: 1.12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    c.setScale(0.2);
    this.tweens.add({ targets: c, scale: pad.kind === 'gate' ? 1.05 : 1, duration: 300, ease: 'Back.out' });
    return { c, bar, cost, shown: -1, poor: null, pad };
  }

  private draw(dt: number) {
    const s = this.sim, p = s.player;
    // jugador: rebote al andar y pila de fruta sobre la cabeza
    this.walkT += dt * (p.moving ? 14 : 4);
    const bob = p.moving ? Math.abs(Math.sin(this.walkT)) * -5 : Math.sin(this.walkT) * 1.2;
    const pb = this.player.body;
    pb.setPosition(p.x, p.y + bob).setDepth(p.y).setFlipX(p.face < 0).setAngle(p.moving ? Math.sin(this.walkT) * 5 : 0);
    const hatOn = this.player.hat.visible;
    this.player.hat.setPosition(p.x, p.y + bob - 63).setDepth(p.y + 0.2).setFlipX(p.face < 0);
    this.drawStack(this.player.stack, p.carry, p.x, p.y + bob - (hatOn ? 98 : 88), p.y + 0.5, 15);

    for (const t of s.trees) {
      const v = this.trees.get(t.id);
      if (v) for (let i = 0; i < v.fruits.length; i++) v.fruits[i].setVisible(i < t.n);
    }
    for (const sh of s.shelves) {
      const v = this.shelves.get(sh.id);
      if (!v) continue;
      for (let i = 0; i < v.items.length; i++) v.items[i].setVisible(i < sh.n);
      if (v.inp && v.inp.text !== `${sh.inp}`) v.inp.setText(`${sh.inp}`);
    }
    // clientes
    for (const [id, b] of this.custs) if (!s.customers.some((c) => c.id === id)) { this.hideBody(b); this.custPool.push(b); this.custs.delete(id); }
    for (const c of s.customers) {
      let b = this.custs.get(c.id);
      if (!b) { b = this.custPool.pop() ?? this.makeCustomer(); this.custs.set(c.id, b); }
      this.drawCustomer(b, c);
    }
    // ayudantes
    for (const h of s.helpers) {
      let b = this.helpers.get(h.id);
      if (!b) { b = this.makeBody(h.cashier ? 'cashier' : 'helper', 3); this.helpers.set(h.id, b); }
      this.drawHelper(b, h);
    }
    // montón de monedas
    const coins = s.pile > 0 ? Math.min(12, 1 + Math.floor(s.pile / 6)) : 0;
    if (coins !== this.shownPile) { this.shownPile = coins; this.pileCoins.forEach((c, i) => c.setVisible(i < coins)); }
    this.pileStar.setVisible(s.pileStars > 0);
    // alfombrillas
    this.syncPads();
    for (const v of this.pads.values()) {
      const paid = s.paid[v.pad.id] || 0, left = v.pad.cost - paid;
      if (left !== v.shown) { v.shown = left; v.cost.setText(`${left}`); v.bar.setScale(paid / v.pad.cost, 1); }
      const poor = s.cash < 1;
      if (poor !== v.poor) { v.poor = poor; v.cost.setColor(poor ? '#ffb3b3' : '#ffffff'); }
    }
    // flecha guía hasta la primera compra (tutorial sin texto)
    if (!save.get('tutorialDone')) {
      const t = pickTarget(s);
      if (t) {
        const gy = t.y - 70 + Math.sin(this.time.now / 160) * 8;
        this.guide.setVisible(true).setPosition(t.x, gy);
        this.guideRing.setVisible(true).setPosition(t.x, t.y);
      }
    } else if (this.guide.visible) { this.guide.setVisible(false); this.guideRing.setVisible(false); }
  }

  private drawStack(stack: Phaser.GameObjects.Image[], items: string[], x: number, y: number, depth: number, step: number) {
    for (let i = 0; i < stack.length; i++) {
      const it = items[i];
      if (!it) { if (stack[i].visible) stack[i].setVisible(false); continue; }
      const key = `f-${it}`;
      if (stack[i].texture.key !== key) stack[i].setTexture(key);
      stack[i].setVisible(true).setPosition(x + Math.sin(i * 1.3) * 2, y - i * step).setDepth(depth + i * 0.01);
    }
  }

  private makeCustomer(): Body {
    const b = this.makeBody('cust0', 3);
    b.bubble = this.add.image(0, 0, 'bubble').setScale(0.9);
    b.want = this.add.image(0, 0, 'f-apple').setScale(0.8);
    return b;
  }

  private hideBody(b: Body) {
    b.body.setVisible(false);
    b.stack.forEach((s) => s.setVisible(false));
    b.bubble?.setVisible(false); b.want?.setVisible(false);
  }

  private drawCustomer(b: Body, c: Customer) {
    const key = `cust${c.look}`;
    if (b.body.texture.key !== key) b.body.setTexture(key);
    const moving = c.state === 'in' || c.state === 'out' || (c.state === 'queue' && Math.abs(c.y - (COUNTER.y + 74)) > 1 && this.sim.queue[0] !== c);
    const bob = moving ? Math.abs(Math.sin(this.time.now / 70 + c.id)) * -4 : 0;
    b.body.setVisible(true).setPosition(c.x, c.y + bob).setDepth(c.y).setFlipX(c.face < 0);
    const wait = c.state === 'shop' || c.state === 'in';
    b.bubble!.setVisible(wait).setPosition(c.x + 26, c.y - 104).setDepth(c.y + 0.3);
    if (wait) {
      const k = `f-${c.want}`;
      if (b.want!.texture.key !== k) b.want!.setTexture(k);
      b.want!.setVisible(true).setPosition(c.x + 26, c.y - 106).setDepth(c.y + 0.4);
    } else b.want!.setVisible(false);
    const carried = c.state === 'out' ? [] : Array(c.got).fill(c.want);
    this.drawStack(b.stack, carried, c.x, c.y + bob - 84, c.y + 0.5, 12);
  }

  private drawHelper(b: Body, h: Helper) {
    const moving = Math.hypot(h.tx - h.x, h.ty - h.y) > 2 || h.state !== 'idle';
    const bob = moving && !h.cashier ? Math.abs(Math.sin(this.time.now / 70 + h.id)) * -4 : Math.sin(this.time.now / 300 + h.id) * 1.5;
    b.body.setPosition(h.x, h.y + bob).setDepth(h.y).setFlipX(h.face < 0);
    this.drawStack(b.stack, h.carry, h.x, h.y + bob - 84, h.y + 0.5, 12);
  }
}
