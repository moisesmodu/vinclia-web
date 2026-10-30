import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { modalPanel } from '@comun/tienda';
import { save } from '../state';
import type { Play } from './Play';

const BOOST_S = 60;
const BOOST_CD = 30;
const HARVEST_CD = 120;

/**
 * Interfaz sobre el puesto (sin zoom): monedas, estrellas, progreso del puesto, sonido, menú, joystick (arrastrar en
 * cualquier sitio o flechas/WASD), anuncios con recompensa opcionales (turbo ×2 durante 60 s y cosecha al instante),
 * ganancias sin conexión con ×2 y tutorial de la mano (10 s, sin texto).
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private layoutFns: (() => void)[] = [];
  private stick = { on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 };
  private base!: Phaser.GameObjects.Image;
  private knob!: Phaser.GameObjects.Image;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private cashT!: Phaser.GameObjects.Text;
  private starT!: Phaser.GameObjects.Text;
  private shownCash = -1;
  private shownStars = -1;
  private bar!: Phaser.GameObjects.Rectangle;
  private boostBtn!: Phaser.GameObjects.Container;
  private boostT!: Phaser.GameObjects.Text;
  private harvestBtn!: Phaser.GameObjects.Container;
  private boostCd = 0;
  private harvestCd = 0;
  private busy = false;
  private tutorial?: Phaser.GameObjects.Container;
  private tutStart = -1;
  private tutMoved = 0;
  /** Ventana de ganancias sin conexión abierta (también la usa la prueba). */
  offlinePanel: Phaser.GameObjects.Container | null = null;
  dbl: ReturnType<typeof doubleButton> = null;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.layoutFns = []; this.stick = { on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 };
    this.shownCash = -1; this.shownStars = -1; this.boostCd = 0; this.harvestCd = 45; this.busy = false;
    this.tutorial = undefined; this.tutStart = -1; this.tutMoved = 0; this.offlinePanel = null; this.dbl = null;

    // monedas y estrellas (arriba a la izquierda)
    const coin = this.add.image(0, 0, 'coin');
    this.cashT = bigNumber(this, 0, 0, 44, '0').setOrigin(0, 0.5);
    const star = this.add.image(0, 0, 'ic-star');
    this.starT = bigNumber(this, 0, 0, 32, '0').setOrigin(0, 0.5);
    // progreso del puesto (arriba en el centro): número del puesto y barra
    const barBg = this.add.rectangle(0, 0, 220, 22, 0x2b2340, 0.35).setStrokeStyle(4, PALETTE.ink).setOrigin(0, 0.5);
    this.bar = this.add.rectangle(0, 0, 212, 14, PALETTE.green).setOrigin(0, 0.5);
    const badge = this.add.circle(0, 0, 24, PALETTE.yellow).setStrokeStyle(5, PALETTE.ink);
    const standN = bigNumber(this, 0, 0, 30, `${this.play.sim.stand + 1}`);
    const pres = this.play.sim.prestige;
    const presIc = pres ? this.add.image(0, 0, 'ic-star') : null;
    const presT = pres ? bigNumber(this, 0, 0, 24, `×${this.play.sim.mult}`).setOrigin(0, 0.5) : null;
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle(); save.set('muted', m); sound.setIcon(m ? 'mute' : 'sound');
    });
    const home = iconButton(this, 0, 0, 'home', PALETTE.purple, 30, () => this.home());
    // anuncios con recompensa (siempre opcionales)
    this.boostBtn = this.rewardButton('ic-bolt', 0xff8a4c, () => this.boost());
    this.boostT = bigNumber(this, 0, 0, 30, '').setVisible(false);
    this.harvestBtn = this.rewardButton('pi-tree', PALETTE.green, () => this.harvest());
    this.boostBtn.setVisible(false); this.harvestBtn.setVisible(false);

    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      coin.setPosition(36 * s, 38 * s).setScale(1.25 * s);
      this.cashT.setPosition(64 * s, 40 * s).setScale(s);
      star.setPosition(36 * s, 88 * s).setDisplaySize(38 * s, 38 * s);
      this.starT.setPosition(62 * s, 90 * s).setScale(s);
      const narrow = w < 560;
      const bx = narrow ? 30 * s : w / 2 - 100 * s, by = narrow ? 134 * s : 38 * s;
      badge.setPosition(bx, by).setScale(s);
      standN.setPosition(bx, by + 1 * s).setScale(s);
      barBg.setPosition(bx + 26 * s, by).setScale(s * 0.9, s);
      this.bar.setPosition(bx + 30 * s, by).setScale(s * 0.9 * this.play.sim.progress(), s);
      presIc?.setPosition(bx + 240 * s * 0.9, by).setDisplaySize(30 * s, 30 * s);
      presT?.setPosition(bx + 256 * s * 0.9, by + 1 * s).setScale(s);
      sound.setPosition(w - 40 * s, 40 * s).setScale(s);
      home.setPosition(w - 108 * s, 40 * s).setScale(s);
      const ry = this.scale.height * 0.42;
      this.boostBtn.setPosition(w - 50 * s, ry).setScale(s);
      this.boostT.setPosition(w - 50 * s, ry).setScale(s);
      this.harvestBtn.setPosition(w - 50 * s, ry + 110 * s).setScale(s);
    });

    // joystick: arrastrar desde cualquier sitio que no sea un botón
    this.base = this.add.image(0, 0, 'stick-base').setVisible(false).setDepth(10);
    this.knob = this.add.image(0, 0, 'stick-knob').setVisible(false).setDepth(11);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => {
      if (over.length || this.offlinePanel || this.stick.on) return;
      this.stick = { on: true, id: p.id, ox: p.x, oy: p.y, x: 0, y: 0 };
      const s = this.ui();
      this.base.setVisible(true).setPosition(p.x, p.y).setScale(s);
      this.knob.setVisible(true).setPosition(p.x, p.y).setScale(s);
      ((this.sound as any).context as AudioContext | undefined)?.resume?.();
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.stick.on || p.id !== this.stick.id) return;
      const R = 56 * this.ui();
      let dx = p.x - this.stick.ox, dy = p.y - this.stick.oy;
      const d = Math.hypot(dx, dy);
      // la base sigue al dedo si se aleja mucho (se puede girar sin levantar el dedo)
      if (d > R * 1.6) { const k = (d - R * 1.6) / d; this.stick.ox += dx * k; this.stick.oy += dy * k; dx = p.x - this.stick.ox; dy = p.y - this.stick.oy; this.base.setPosition(this.stick.ox, this.stick.oy); }
      const m = Math.min(1, Math.hypot(dx, dy) / R);
      const a = Math.atan2(dy, dx);
      this.stick.x = Math.hypot(dx, dy) > 6 ? Math.cos(a) * m : 0;
      this.stick.y = Math.hypot(dx, dy) > 6 ? Math.sin(a) * m : 0;
      this.knob.setPosition(this.stick.ox + Math.cos(a) * Math.min(R, Math.hypot(dx, dy)), this.stick.oy + Math.sin(a) * Math.min(R, Math.hypot(dx, dy)));
    });
    const up = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.stick.id) return;
      this.stick = { on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 };
      this.base.setVisible(false); this.knob.setVisible(false);
    };
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    const kb = this.input.keyboard;
    this.keys = kb ? ['LEFT', 'RIGHT', 'UP', 'DOWN', 'A', 'D', 'W', 'S'].map((k) => kb.addKey(k)) : [];

    if (!save.get('tutorialDone')) this.showTutorial();
    this.play.events.on('ready', this.onReady, this);
    // primera partida de la sesión: sin anuncio, Play ya está lista antes de que se cree el HUD
    if (this.play.ready) this.onReady(this.play.offline);
    this.play.events.on('wallet', this.bounceCash, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      this.play.events.off('ready', this.onReady, this);
      this.play.events.off('wallet', this.bounceCash, this);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1000, this.scale.height / 600), 0.62, 1.4); }
  private layout() { for (const f of this.layoutFns) f(); }

  private rewardButton(icon: string, color: number, onClick: () => void) {
    const b = iconButton(this, 0, 0, 'video', color, 40, onClick);
    // icono del premio grande y el del vídeo pequeño en la esquina
    const ic = b.list[2] as Phaser.GameObjects.Image;
    ic.setTexture(icon).setDisplaySize(icon === 'pi-tree' ? 52 : 50, icon === 'pi-tree' ? 52 : 50);
    const v = this.add.circle(28, -28, 17, PALETTE.purple).setStrokeStyle(4, PALETTE.white);
    const vi = this.add.image(28, -28, 'ic-video').setDisplaySize(24, 24);
    b.add([v, vi]);
    if (icon === 'ic-bolt') b.add(bigNumber(this, -24, 28, 24, '×2'));
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
    this.tweens.add({ targets: this.cashT, scale: s * 1.25, duration: 90, yoyo: true });
  }

  update() {
    const dt = Math.min(this.game.loop.rawDelta || 16.7, 100) / 1000;
    const sim = this.play.sim;
    if (!sim) return;
    // entrada: joystick o teclado
    const k = this.keys;
    let kx = 0, ky = 0;
    if (k.length) {
      kx = (k[1].isDown || k[5].isDown ? 1 : 0) - (k[0].isDown || k[4].isDown ? 1 : 0);
      ky = (k[3].isDown || k[7].isDown ? 1 : 0) - (k[2].isDown || k[6].isDown ? 1 : 0);
    }
    if (!this.play.autopilot) {
      if (kx || ky) { const m = Math.hypot(kx, ky); sim.player.ix = kx / m; sim.player.iy = ky / m; }
      else { sim.player.ix = this.stick.x; sim.player.iy = this.stick.y; }
    }
    // cifras (solo se reescriben al cambiar)
    const cash = Math.floor(sim.cash);
    if (cash !== this.shownCash) { this.shownCash = cash; this.cashT.setText(`${cash}`); }
    if (sim.stars !== this.shownStars) { this.shownStars = sim.stars; this.starT.setText(`${sim.stars}`); }
    const s = this.ui();
    this.bar.setScale(s * 0.9 * sim.progress(), s);
    // anuncios con recompensa: solo si el portal los ofrece, nunca en los primeros 45 s
    const can = portal.hasRewarded && !this.play.paused && !this.offlinePanel;
    if (sim.boost > 0) { this.boostCd = BOOST_CD; this.boostT.setVisible(true).setText(`${Math.ceil(sim.boost)}`); }
    else { this.boostT.setVisible(false); this.boostCd = Math.max(0, this.boostCd - dt); }
    this.harvestCd = Math.max(0, this.harvestCd - dt);
    this.boostBtn.setVisible(can && sim.boost <= 0 && this.boostCd <= 0 && save.get('tutorialDone'));
    this.harvestBtn.setVisible(can && this.harvestCd <= 0 && save.get('tutorialDone'));
    this.updateTutorial(dt);
  }

  /* ---------------------------------------------------------------- tutorial (mano que arrastra, 10 s) */
  private showTutorial() {
    const c = this.add.container(0, 0).setDepth(20);
    const ring = this.add.image(0, 0, 'stick-base').setScale(0.9);
    const hand = this.add.image(0, 0, 'ic-hand').setDisplaySize(100, 100).setOrigin(0.45, 0.05);
    c.add([ring, hand]);
    this.tutorial = c;
    this.tutStart = -1; // el reloj se fija en el primer update()
    this.tweens.add({ targets: hand, x: { from: -50, to: 50 }, y: { from: 10, to: -20 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.layoutFns.push(() => c.setPosition(this.scale.width / 2, this.scale.height * 0.72).setScale(this.ui()));
  }

  private updateTutorial(dt: number) {
    if (!this.tutorial) return;
    if (this.tutStart < 0) this.tutStart = this.time.now;
    if (this.play.sim.player.moving) this.tutMoved += dt;
    this.tutorial.setAlpha(this.stick.on ? 0.3 : 1);
    if (this.tutMoved > 1.5 || this.time.now - this.tutStart > 10000) {
      const t = this.tutorial;
      this.tutorial = undefined;
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    }
  }

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

  /** Turbo: todo va al doble durante 60 s. */
  async boost() {
    if (!(await this.rewarded())) return;
    this.play.sim.boost = BOOST_S;
    [660, 880, 1100].forEach((f, j) => setTimeout(() => audio.tone(f, 0.12, 'square', 0.08), j * 70));
  }

  /** Cosecha al instante: árboles y estantes llenos. */
  async harvest() {
    if (!(await this.rewarded())) return;
    this.play.sim.instantHarvest();
    this.harvestCd = HARVEST_CD;
    [523, 784, 1047].forEach((f, j) => setTimeout(() => audio.tone(f, 0.14, 'triangle', 0.1), j * 80));
  }

  /* ---------------------------------------------------------------- ganancias sin conexión */
  showOffline(amount: number) {
    this.play.paused = true;
    const w = this.scale.width, h = this.scale.height;
    const s = Phaser.Math.Clamp(Math.min((w - 24) / 560, (h - 24) / 420), 0.45, 1.1);
    const c = modalPanel(this, 560 * s, 380 * s, 0xfff6e8, 40);
    this.offlinePanel = c;
    const cy = h / 2;
    // ayudante durmiendo no: ayudante saludando con su cesta (trabajó mientras no estabas)
    const helper = this.add.image(w / 2 - 150 * s, cy - 40 * s, 'helper').setScale(1.6 * s);
    this.tweens.add({ targets: helper, angle: { from: -6, to: 6 }, duration: 300, yoyo: true, repeat: -1 });
    const coin = this.add.image(w / 2 + 150 * s, cy - 40 * s, 'coin').setScale(2 * s);
    const n = bigNumber(this, w / 2 + 10 * s, cy - 36 * s, 70 * s, `+${amount}`);
    let total = amount;
    const ok = iconButton(this, w / 2, cy + 110 * s, 'ok', PALETTE.green, 48 * s, () => close());
    pulse(this, ok, 0.06);
    c.add([helper, coin, n, ok]);
    this.dbl = doubleButton(this, {
      x: w / 2, y: cy - 190 * s, s, currencyIcon: 'coin', earned: amount,
      onDoubled: () => { total = amount * 2; n.setText(`+${total}`); this.tweens.add({ targets: n, scale: '*=1.25', duration: 150, yoyo: true }); },
    });
    if (this.dbl) c.add(this.dbl);
    const close = () => {
      if (this.offlinePanel !== c) return;
      this.offlinePanel = null;
      this.dbl = null;
      this.play.sim.cash += total;
      this.play.sim.earned += total;
      this.play.persist();
      this.play.events.emit('wallet');
      this.bounceCash();
      [988, 1319, 1568].forEach((f, j) => setTimeout(() => audio.tone(f, 0.12, 'square', 0.06), j * 70));
      c.destroy();
      this.play.paused = false;
    };
    // el ×2 pide el anuncio con el juego parado (gameplayStop) y lo reanuda después
    if (this.dbl) {
      const press = this.dbl.press;
      this.dbl.press = async () => { portal.gameplayStop(); const r = await press(); portal.gameplayStart(); return r; };
      this.dbl.removeAllListeners('pointerup');
      this.dbl.on('pointerup', () => { void this.dbl?.press(); });
    }
    (c as any).close = close;
  }

  /** Volver al menú (guarda; al volver a jugar habrá pausa natural con anuncio). */
  home() {
    this.play.persist();
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}
