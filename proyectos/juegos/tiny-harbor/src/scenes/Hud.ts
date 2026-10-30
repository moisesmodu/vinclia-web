import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { modalPanel } from '@comun/tienda';
import { save } from '../state';
import type { Play } from './Play';

const BOOST_S = 60;
const BOOST_CD = 45;

/**
 * Interfaz sobre el puerto (sin zoom): monedas, estrellas, progreso del puerto, sonido, menú, anuncio con recompensa
 * opcional (barco doble: cada barco paga ×2 durante 60 s), ganancias sin conexión con ×2, panel de puerto terminado
 * con ×2 y tutorial de la mano (arrastrar el barco a la grúa, 10 s, sin texto).
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private layoutFns: (() => void)[] = [];
  private cashT!: Phaser.GameObjects.Text;
  private starT!: Phaser.GameObjects.Text;
  private shownCash = -1;
  private shownStars = -1;
  private bar!: Phaser.GameObjects.Rectangle;
  private boostBtn!: Phaser.GameObjects.Container;
  private boostT!: Phaser.GameObjects.Text;
  private boostRing!: Phaser.GameObjects.Arc;
  private boostCd = 0;
  private busy = false;
  private tutorial?: Phaser.GameObjects.Container;
  private tutHand?: Phaser.GameObjects.Image;
  private tutStart = -1;
  /** Ventana abierta (ganancias sin conexión o puerto terminado; también la usan las pruebas). */
  offlinePanel: Phaser.GameObjects.Container | null = null;
  portPanel: Phaser.GameObjects.Container | null = null;
  dbl: ReturnType<typeof doubleButton> = null;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.layoutFns = []; this.shownCash = -1; this.shownStars = -1; this.boostCd = 20; this.busy = false;
    this.tutorial = undefined; this.tutHand = undefined; this.tutStart = -1; this.tutPhase = 'done'; this.sailHinted = false; this.offlinePanel = null; this.portPanel = null; this.dbl = null;

    // barra de arriba: monedas y estrellas a la izquierda, puerto y progreso en el centro, menú y sonido a la derecha
    const strip = this.add.rectangle(0, 0, 10, 10, 0x2b2340, 0.28).setOrigin(0);
    const coin = this.add.image(0, 0, 'ic-coin');
    this.cashT = bigNumber(this, 0, 0, 44, '0').setOrigin(0, 0.5);
    const star = this.add.image(0, 0, 'ic-star');
    this.starT = bigNumber(this, 0, 0, 32, '0').setOrigin(0, 0.5);
    const barBg = this.add.rectangle(0, 0, 220, 22, 0x2b2340, 0.35).setStrokeStyle(4, PALETTE.ink).setOrigin(0, 0.5);
    this.bar = this.add.rectangle(0, 0, 212, 14, PALETTE.green).setOrigin(0, 0.5);
    const badge = this.add.circle(0, 0, 24, PALETTE.yellow).setStrokeStyle(5, PALETTE.ink);
    const portN = bigNumber(this, 0, 0, 30, `${this.play.sim.port + 1}`);
    const lh = this.add.image(0, 0, 'pi-gate');
    const pres = this.play.sim.prestige;
    const presT = pres ? bigNumber(this, 0, 0, 24, `×${this.play.sim.mult}`).setOrigin(0, 0.5) : null;
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle(); save.set('muted', m); sound.setIcon(m ? 'mute' : 'sound');
    });
    const home = iconButton(this, 0, 0, 'home', PALETTE.purple, 30, () => this.home());
    // anuncio con recompensa (siempre opcional): barco doble 60 s
    this.boostBtn = this.rewardButton();
    this.boostRing = this.add.circle(0, 0, 46).setStrokeStyle(8, 0xff8a4c).setVisible(false);
    this.boostT = bigNumber(this, 0, 0, 30, '').setVisible(false);
    this.boostBtn.setVisible(false);

    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      coin.setPosition(34 * s, 35 * s).setDisplaySize(48 * s, 48 * s);
      this.cashT.setPosition(64 * s, 37 * s).setScale(s);
      const narrow = w < 640;
      strip.setSize(w, (narrow ? 112 : 70) * s);
      star.setPosition(narrow ? 34 * s : Math.max(230 * s, this.cashT.x + this.cashT.width * s + 40 * s), narrow ? 86 * s : 35 * s).setDisplaySize(38 * s, 38 * s);
      this.starT.setPosition(star.x + 26 * s, star.y + 2 * s).setScale(s);
      const row = narrow ? 86 * s : 35 * s;
      const bx = narrow ? w - 270 * s : w / 2 - 110 * s;
      badge.setPosition(bx, row).setScale(s);
      portN.setPosition(bx, row + 1 * s).setScale(s);
      barBg.setPosition(bx + 26 * s, row).setScale(s * 0.9, s);
      this.bar.setPosition(bx + 30 * s, row);
      lh.setPosition(bx + 226 * s * 0.9 + 18 * s, row - 3 * s).setDisplaySize(44 * s, 44 * s);
      presT?.setPosition(lh.x + 24 * s, row + 1 * s).setScale(s);
      sound.setPosition(w - 38 * s, 35 * s).setScale(s * 0.9);
      home.setPosition(w - 104 * s, 35 * s).setScale(s * 0.9);
      const h = this.scale.height;
      const by = h > w ? h - 70 * s : h * 0.5;
      this.boostBtn.setPosition(w - 58 * s, by).setScale(s);
      this.boostRing.setPosition(w - 58 * s, by).setScale(s);
      this.boostT.setPosition(w - 58 * s, by).setScale(s);
    });

    if (!save.get('tutorialDone')) this.showTutorial();
    this.play.events.on('ready', this.onReady, this);
    this.play.events.on('wallet', this.bounceCash, this);
    this.play.events.on('portDone', this.showPortDone, this);
    // primera partida de la sesión: sin anuncio, Play ya está lista antes de que se cree el HUD
    if (this.play.ready) this.onReady(this.play.offline);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      this.play.events.off('ready', this.onReady, this);
      this.play.events.off('wallet', this.bounceCash, this);
      this.play.events.off('portDone', this.showPortDone, this);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1000, this.scale.height / 600), 0.62, 1.4); }
  private layout() { for (const f of this.layoutFns) f(); }

  /** Botón del barco doble: barco con ×2 y el icono de vídeo pequeño en la esquina. */
  private rewardButton() {
    const b = iconButton(this, 0, 0, 'video', 0xff8a4c, 46, () => this.boost());
    const ic = b.list[2] as Phaser.GameObjects.Image;
    ic.setTexture('boat0').setDisplaySize(30, 55).setAngle(90).setY(-4);
    const v = this.add.circle(32, -32, 18, PALETTE.purple).setStrokeStyle(4, PALETTE.white);
    const vi = this.add.image(32, -32, 'ic-video').setDisplaySize(26, 26);
    b.add([v, vi, bigNumber(this, 0, 28, 28, '×2')]);
    pulse(this, b, 0.05);
    return b;
  }

  private onReady(offline: number) {
    if (offline > 0 && !this.offlinePanel) { this.play.offline = 0; this.showOffline(offline); }
  }

  private bounceCash() {
    this.tweens.killTweensOf(this.cashT);
    const s = this.ui();
    this.cashT.setScale(s);
    this.tweens.add({ targets: this.cashT, scale: s * 1.2, duration: 90, yoyo: true });
  }

  update() {
    const dt = Math.min(this.game.loop.rawDelta || 16.7, 100) / 1000;
    const sim = this.play.sim;
    if (!sim) return;
    const cash = Math.floor(sim.cash);
    if (cash !== this.shownCash) {
      const grew = `${cash}`.length !== `${this.shownCash}`.length;
      this.shownCash = cash; this.cashT.setText(`${cash}`);
      if (grew) this.layout(); // la estrella se aparta si la cifra crece
    }
    if (sim.stars !== this.shownStars) { this.shownStars = sim.stars; this.starT.setText(`${sim.stars}`); }
    this.bar.setScale(this.ui() * 0.9 * sim.progress(), this.ui());
    // barco doble: solo si el portal tiene anuncios con recompensa, con el tutorial hecho y sin ventanas abiertas
    const can = portal.hasRewarded && !this.play.paused && !this.play.leaving && !this.offlinePanel && !this.portPanel && save.get('tutorialDone');
    if (sim.boost > 0) {
      this.boostCd = BOOST_CD;
      this.boostRing.setVisible(true);
      this.boostT.setVisible(true).setText(`${Math.ceil(sim.boost)}`);
    } else {
      this.boostRing.setVisible(false); this.boostT.setVisible(false);
      if (!this.play.paused) this.boostCd = Math.max(0, this.boostCd - dt);
    }
    this.boostBtn.setVisible(can && sim.boost <= 0 && this.boostCd <= 0);
    this.updateTutorial();
  }

  /* ---------------------------------------------------------------- tutorial: mano que arrastra (10 s cada paso, sin texto)
   * Paso 1: del barco que espera a la grúa libre. Paso 2 (la primera vez que hay un barco cargado): del barco al mar
   * abierto. Cada paso dura como mucho 10 s desde su primer update() o hasta que el jugador lo hace. */
  private tutPhase: 'dock' | 'sail' | 'done' = 'done';
  private showTutorial(phase: 'dock' | 'sail' = 'dock') {
    const c = this.add.container(0, 0).setDepth(20);
    const ring = this.add.circle(0, 0, 40, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.9);
    const hand = this.add.image(0, 0, 'ic-hand').setDisplaySize(110, 110).setOrigin(0.45, 0.05);
    c.add([ring, hand]);
    this.tutorial = c; this.tutHand = hand; this.tutPhase = phase;
    this.tutStart = -1; // el reloj se fija en el primer update()
  }

  private updateTutorial() {
    const sim = this.play.sim;
    if (!this.tutorial) {
      // segundo paso: el primer barco cargado de la partida (sin práctico)
      if (this.tutPhase === 'done' && !this.sailHinted && sim.sailed === 0 && sim.prestige === 0 && sim.port === 0 && !sim.pilot && sim.readyBoats().length) {
        this.sailHinted = true;
        this.showTutorial('sail');
      }
      return;
    }
    if (this.tutStart < 0) this.tutStart = this.time.now;
    const el = this.time.now - this.tutStart;
    const done = this.tutPhase === 'dock' ? save.get('tutorialDone') : sim.sailed > 0;
    if (done || el > 10000 || this.play.leaving) {
      const t = this.tutorial;
      this.tutorial = undefined;
      this.tutPhase = 'done';
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
      return;
    }
    let from: { x: number; y: number } | null = null, to: { x: number; y: number } | null = null;
    if (this.tutPhase === 'dock') {
      const b = sim.waiting()[0];
      const i = b ? sim.nearestFreeBerth(b.x, b.y, 1e9) : -1;
      if (b && i >= 0) { from = b; to = sim.L.berths[i]; }
    } else {
      const b = sim.readyBoats()[0], e = sim.L.exit;
      if (b) { from = b; to = { x: (e.x0 + e.x1) / 2, y: (e.y0 + e.y1) / 2 }; }
    }
    if (!from || !to) { this.tutorial.setVisible(false); return; }
    const a = this.play.toScreen(from.x, from.y), z = this.play.toScreen(to.x, to.y);
    const k = Phaser.Math.Clamp(((el % 1600) / 1600) * 1.4 - 0.2, 0, 1);
    const e = Phaser.Math.Easing.Sine.InOut(k);
    this.tutorial.setVisible(sim.finger.boat === 0).setPosition(a.x + (z.x - a.x) * e, a.y + (z.y - a.y) * e).setScale(this.ui());
    this.tutorial.setAlpha(k <= 0 || k >= 1 ? 0.6 : 1);
  }
  private sailHinted = false;

  /* ---------------------------------------------------------------- anuncios con recompensa */
  private async rewarded(): Promise<boolean> {
    if (this.busy) return false;
    this.busy = true;
    this.play.paused = true;
    portal.gameplayStop();
    const ok = await portal.rewardedBreak();
    this.busy = false;
    if (!this.sys.isActive()) return false;
    this.play.paused = false;
    portal.gameplayStart();
    return ok;
  }

  /** Barco doble: cada barco que zarpa paga ×2 durante 60 s. */
  async boost() {
    if (!(await this.rewarded())) return;
    this.play.sim.boost = BOOST_S;
    [660, 880, 1100].forEach((f, j) => setTimeout(() => audio.tone(f, 0.12, 'square', 0.08), j * 70));
  }

  /* ---------------------------------------------------------------- ganancias sin conexión */
  showOffline(amount: number) {
    this.play.paused = true;
    const w = this.scale.width, h = this.scale.height;
    const s = Phaser.Math.Clamp(Math.min((w - 24) / 560, (h - 24) / 420), 0.45, 1.1);
    const c = modalPanel(this, 560 * s, 380 * s, 0xfff6e8, 40);
    this.offlinePanel = c;
    const cy = h / 2;
    // el remolcador saluda: trabajó mientras no estabas
    const tug = this.add.image(w / 2 - 160 * s, cy - 40 * s, 'tug').setScale(1.3 * s);
    this.tweens.add({ targets: tug, angle: { from: -8, to: 8 }, duration: 300, yoyo: true, repeat: -1 });
    const coin = this.add.image(w / 2 + 170 * s, cy - 40 * s, 'ic-coin').setDisplaySize(70 * s, 70 * s);
    const n = bigNumber(this, w / 2 + 10 * s, cy - 36 * s, 70 * s, `+${amount}`);
    let total = amount;
    const ok = iconButton(this, w / 2, cy + 110 * s, 'ok', PALETTE.green, 48 * s, () => close());
    pulse(this, ok, 0.06);
    c.add([tug, coin, n, ok]);
    this.dbl = this.wrapDouble(doubleButton(this, {
      x: w / 2, y: cy - 190 * s, s, currencyIcon: 'ic-coin', earned: amount,
      onDoubled: () => { total = amount * 2; n.setText(`+${total}`); this.tweens.add({ targets: n, scale: '*=1.25', duration: 150, yoyo: true }); },
    }), true);
    if (this.dbl) c.add(this.dbl);
    const close = () => {
      if (this.offlinePanel !== c) return;
      this.offlinePanel = null;
      this.dbl = null;
      this.play.sim.cash += total;
      this.play.sim.earned += total;
      this.play.persist();
      this.play.events.emit('wallet');
      [988, 1319, 1568].forEach((f, j) => setTimeout(() => audio.tone(f, 0.12, 'square', 0.06), j * 70));
      c.destroy();
      this.play.paused = false;
    };
    (c as any).close = close;
  }

  /** El ×2 pide el anuncio con el juego parado (gameplayStop) y lo reanuda después. */
  private wrapDouble(d: ReturnType<typeof doubleButton>, resume: boolean) {
    if (!d) return d;
    const press = d.press;
    // resume: tras el anuncio se vuelve al juego (ganancias sin conexión); en el panel del puerto terminado, no
    d.press = async () => { portal.gameplayStop(); const r = await press(); if (resume) portal.gameplayStart(); return r; };
    d.removeAllListeners('pointerup');
    d.on('pointerup', () => { void d.press(); });
    return d;
  }

  /* ---------------------------------------------------------------- puerto terminado */
  showPortDone(reward: number) {
    if (this.portPanel) return;
    const w = this.scale.width, h = this.scale.height;
    const s = Phaser.Math.Clamp(Math.min((w - 24) / 560, (h - 24) / 420), 0.45, 1.1);
    const c = modalPanel(this, 560 * s, 380 * s, 0xfff6e8, 40);
    this.portPanel = c;
    const cy = h / 2;
    const lh = this.add.image(w / 2 - 160 * s, cy - 40 * s, 'pi-gate').setScale(1.6 * s);
    this.tweens.add({ targets: lh, angle: { from: -6, to: 6 }, duration: 400, yoyo: true, repeat: -1 });
    const st = this.add.image(w / 2 + 170 * s, cy - 40 * s, 'ic-star').setDisplaySize(72 * s, 72 * s);
    const n = bigNumber(this, w / 2 + 10 * s, cy - 36 * s, 70 * s, `+${reward}`);
    let watched = false;
    const ok = iconButton(this, w / 2, cy + 110 * s, 'play', PALETTE.green, 50 * s, () => close());
    pulse(this, ok, 0.06);
    c.add([lh, st, n, ok]);
    this.dbl = this.wrapDouble(doubleButton(this, {
      x: w / 2, y: cy - 190 * s, s, currencyIcon: 'ic-star', earned: reward,
      onDoubled: () => {
        watched = true;
        n.setText(`+${reward * 2}`);
        this.tweens.add({ targets: n, scale: '*=1.25', duration: 150, yoyo: true });
      },
    }), false);
    if (this.dbl) c.add(this.dbl);
    const burst = this.add.particles(st.x, st.y, 'ic-star', { speed: { min: 200, max: 520 }, lifespan: 1000, scale: { start: 0.35 * s, end: 0 }, gravityY: 500, emitting: false });
    c.add(burst); burst.explode(24);
    portal.happyTime();
    let closing = false;
    const close = () => {
      if (closing) return;
      closing = true;
      this.dbl = null;
      void this.play.nextPort(watched, reward);
    };
    (c as any).close = close;
    this.input.keyboard?.once('keydown-SPACE', close);
  }

  /** Volver al menú (guarda; al volver a jugar habrá pausa natural con anuncio si toca). */
  home() {
    if (this.play.leaving) return;
    this.play.persist();
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}
