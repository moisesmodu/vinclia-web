import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import type { Play } from './Play';

type OverInfo = { points: number; best: number; newBest: boolean; dist: number; coins: number; canRevive: boolean; canDouble: boolean };

/**
 * Capa de interfaz sobre la partida (sin zoom): puntos, carga que queda en el remolque, monedas de la partida,
 * barra hasta el próximo granero, tutorial de 10 s y pantalla final con reinicio en un clic.
 * También recoge la pulsación de "mantener".
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private holdPointers = new Set<number>();
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialHeld = 0;
  private tutorialStart = 0;
  /** Panel final (las pruebas automáticas esperan a que exista). */
  over?: Phaser.GameObjects.Container;
  private layoutFns: (() => void)[] = [];
  private busy = false;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.holdPointers.clear();
    this.layoutFns = [];
    this.over = undefined;
    this.dbl = null;
    this.tutorial = undefined;
    this.tutorialHeld = 0;
    this.busy = false;

    // puntos (arriba, centro), récord, barra hasta el granero; carga y monedas (arriba, izquierda)
    const score = bigNumber(this, 0, 0, 64, '0');
    const bestMark = this.add.image(0, 0, 'ic-trophy').setAlpha(0.9);
    const bestTxt = bigNumber(this, 0, 0, 26, `${save.get('best')}`).setOrigin(0, 0.5);
    const barBg = this.add.rectangle(0, 0, 10, 14, 0x2b2340, 0.55).setOrigin(0, 0.5).setStrokeStyle(3, 0xffffff, 0.9);
    const bar = this.add.rectangle(0, 0, 10, 8, 0xffd23f).setOrigin(0, 0.5);
    const barnIc = this.add.image(0, 0, 'barn');
    const loadIc = this.add.image(0, 0, 'crate');
    const load = bigNumber(this, 0, 0, 40, '6').setOrigin(0, 0.5);
    const coinIc = this.add.image(0, 0, 'ic-coin');
    const coins = bigNumber(this, 0, 0, 30, '0').setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    let progress = 0;
    const barW = () => 200 * this.ui();
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      score.setPosition(w / 2, 50 * s).setScale(s);
      bestMark.setPosition(w / 2 - 22 * s, 100 * s).setDisplaySize(30 * s, 30 * s);
      bestTxt.setPosition(w / 2 - 2 * s, 101 * s).setScale(s);
      barBg.setPosition(w / 2 - barW() / 2 - 18 * s, 138 * s).setDisplaySize(barW(), 16 * s);
      bar.setPosition(barBg.x + 3 * s, 138 * s).setDisplaySize(Math.max(1, (barW() - 6 * s) * progress), 9 * s);
      barnIc.setPosition(barBg.x + barW() + 26 * s, 132 * s).setDisplaySize(46 * s, 39 * s);
      loadIc.setPosition(42 * s, 44 * s).setDisplaySize(44 * s, 44 * s);
      load.setPosition(74 * s, 46 * s).setScale(s);
      coinIc.setPosition(42 * s, 98 * s).setDisplaySize(38 * s, 38 * s);
      coins.setPosition(72 * s, 100 * s).setScale(s);
      sound.setPosition(w - 46 * s, 46 * s).setScale(s);
    });

    this.play.events.on('score', (n: number) => {
      score.setText(`${n}`);
      this.tweens.killTweensOf(score);
      score.setScale(this.ui());
      this.tweens.add({ targets: score, scale: this.ui() * 1.25, duration: 110, yoyo: true });
    });
    this.play.events.on('coins', (n: number) => coins.setText(`${n}`));
    this.play.events.on('load', (n: number) => { load.setText(`${n}`); load.setColor(n <= 1 ? '#ff8080' : '#ffffff'); });
    this.play.events.on('lost', () => {
      this.tweens.killTweensOf(loadIc);
      loadIc.setAngle(0);
      this.tweens.add({ targets: loadIc, angle: { from: -20, to: 20 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => loadIc.setAngle(0) });
    });
    this.play.events.on('progress', (p: number) => {
      if (Math.abs(p - progress) < 0.004) return;
      progress = p;
      bar.setDisplaySize(Math.max(1, (barW() - 6 * this.ui()) * p), 9 * this.ui());
    });
    this.play.events.on('depot', (r: { n: number; m: number; points: number }) => this.toast(r));
    this.play.events.on('over', (r: OverInfo) => this.showOver(r));

    // entrada: mantener pulsado en cualquier sitio que no sea un botón
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0 && !this.over) { this.holdPointers.add(p.id); this.sync(); }
    });
    const release = (p: Phaser.Input.Pointer) => { this.holdPointers.delete(p.id); this.sync(); };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
    this.game.events.on('blur', this.clearHold, this);
    this.events.once('shutdown', () => {
      this.game.events.off('blur', this.clearHold, this);
      this.scale.off('resize', this.layout, this);
      for (const ev of ['score', 'coins', 'load', 'lost', 'progress', 'depot', 'over']) this.play.events.off(ev);
    });

    if (!save.get('tutorialDone') || save.get('runs') <= 2) this.showTutorial();
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1100, this.scale.height / 640), 0.6, 1.4); }
  private layout() { for (const f of this.layoutFns) f(); }
  private clearHold() { this.holdPointers.clear(); this.sync(); }
  private sync() { this.registry.set('hold', this.holdPointers.size > 0); }

  /* -------------------------------------------------------------- tutorial (10 s, sin texto) */

  private showTutorial() {
    const c = this.add.container(0, 0).setDepth(20);
    if (!this.textures.exists('tut-pill')) {
      // fondo del tutorial horneado en textura (un Graphics se volvería a dibujar en cada fotograma)
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x3a1f4a, 0.35).fillRoundedRect(0, 0, 470, 150, 40);
      g.generateTexture('tut-pill', 470, 150);
      g.destroy();
    }
    const pill = this.add.image(-80, -78, 'tut-pill').setOrigin(0, 0);
    const ring = this.add.circle(0, 0, 46, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.9);
    const hand = this.add.image(12, -10, 'ic-hand').setDisplaySize(110, 110).setOrigin(0.45, 0.05);
    // flecha "hacia delante" y la carga hasta el granero
    const arrow = this.add.image(110, 0, 'ic-play').setDisplaySize(70, 70).setTint(PALETTE.yellow);
    const crate = this.add.image(180, 0, 'crate').setDisplaySize(46, 46);
    const sheep = this.add.image(226, -4, 'sheep').setScale(0.75);
    const barn = this.add.image(320, -10, 'barn').setDisplaySize(96, 81);
    c.add([pill, ring, hand, arrow, crate, sheep, barn]);
    this.tutorial = c;
    this.tutorialStart = -1; // el reloj de la escena aún no está al día en create(): se fija en el primer update
    this.tweens.add({ targets: hand, y: 4, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut', hold: 500 });
    this.tweens.add({ targets: ring, scale: 1.35, alpha: 0.2, duration: 840, repeat: -1, hold: 100 });
    this.tweens.add({ targets: [arrow], x: 130, duration: 420, yoyo: true, repeat: -1, hold: 500 });
    this.tweens.add({ targets: [crate, sheep], x: '+=22', duration: 420, yoyo: true, repeat: -1, hold: 500 });
    this.layoutFns.push(() => {
      const s = Math.min(this.ui(), (this.scale.width - 20) / 420);
      c.setPosition(this.scale.width / 2 - 155 * s, this.scale.height * (this.scale.height > this.scale.width ? 0.3 : 0.4)).setScale(s);
    });
  }

  update(_t: number, dt: number) {
    if (!this.tutorial) return;
    if (this.tutorialStart < 0) this.tutorialStart = this.time.now;
    if (this.holdPointers.size > 0 || this.registry.get('hold')) this.tutorialHeld += dt;
    const done = this.tutorialHeld > 1500 || this.time.now - this.tutorialStart > 10000;
    this.tutorial.setAlpha(this.holdPointers.size > 0 ? 0.35 : 1);
    if (done) {
      const t = this.tutorial;
      this.tutorial = undefined;
      save.set('tutorialDone', true);
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    }
  }

  /** Llegada al granero: cargas entregadas × metros = puntos. */
  private toast(r: { n: number; m: number; points: number }) {
    const s = this.ui(), x = this.scale.width / 2, y = this.scale.height * 0.3;
    const c = this.add.container(x, y).setDepth(15).setScale(0.2);
    // fila: [caja] n × metros = +puntos, colocada de izquierda a derecha según el ancho de cada cifra
    const crate = this.add.image(0, 0, 'crate').setDisplaySize(56, 56).setOrigin(0, 0.5);
    const n = bigNumber(this, 0, 2, 60, `${r.n}`).setOrigin(0, 0.5);
    const xx = bigNumber(this, 0, 2, 44, '×').setOrigin(0, 0.5);
    const m = bigNumber(this, 0, 2, 60, `${r.m}`).setOrigin(0, 0.5);
    const eq = bigNumber(this, 0, 2, 44, '=').setOrigin(0, 0.5);
    const pts = bigNumber(this, 0, 2, 84, `+${r.points}`).setOrigin(0, 0.5).setColor('#ffd23f');
    const row = [crate, n, xx, m, eq, pts];
    const gap = 14, total = row.reduce((t, o) => t + o.displayWidth, 0) + gap * (row.length - 1);
    let cx = -total / 2;
    for (const o of row) { o.setX(cx); cx += o.displayWidth + gap; }
    const coin = this.add.image(-30, 70, 'ic-coin').setDisplaySize(42, 42);
    const cn = bigNumber(this, -2, 72, 40, `+${r.n}`).setOrigin(0, 0.5);
    c.add([crate, n, xx, m, eq, pts, coin, cn]);
    this.tweens.add({ targets: c, scale: Math.min(s, (this.scale.width - 20) / 620), duration: 260, ease: 'Back.out' });
    this.tweens.add({ targets: c, alpha: 0, y: y - 40 * s, delay: 1500, duration: 400, onComplete: () => c.destroy() });
  }

  /* -------------------------------------------------------------- final de partida */

  private showOver(r: OverInfo) {
    this.clearHold();
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    const w = this.scale.width, h = this.scale.height, s = Math.min(this.ui(), w / 600);
    const c = this.add.container(0, 0).setDepth(30);
    this.over = c;
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x3a1f4a, 0.5).setInteractive();
    const panel = this.add.rectangle(w / 2, h / 2 - 20 * s, 520 * s, 300 * s, 0xfff6e8, 0.97)
      .setStrokeStyle(8 * s, PALETTE.ink).setOrigin(0.5);
    const barn = this.add.image(w / 2 - 160 * s, h / 2 - 80 * s, 'barn').setDisplaySize(118 * s, 100 * s);
    const n = bigNumber(this, w / 2 + 50 * s, h / 2 - 82 * s, 96 * s, `${r.points}`);
    const trophy = this.add.image(w / 2 - 190 * s, h / 2 + 22 * s, 'ic-trophy').setDisplaySize(48 * s, 48 * s);
    const best = bigNumber(this, w / 2 - 160 * s, h / 2 + 24 * s, 42 * s, `${r.best}`).setOrigin(0, 0.5);
    const road = this.add.image(w / 2 + 50 * s, h / 2 + 22 * s, 'wheel').setDisplaySize(40 * s, 40 * s);
    const distN = bigNumber(this, w / 2 + 76 * s, h / 2 + 24 * s, 42 * s, `${r.dist}`).setOrigin(0, 0.5);
    const m = bigNumber(this, distN.x + distN.displayWidth + 6 * s, h / 2 + 30 * s, 26 * s, 'm').setOrigin(0, 0.5);
    const ci = this.add.image(w / 2 - 30 * s, h / 2 + 82 * s, 'ic-coin').setDisplaySize(44 * s, 44 * s);
    const cn = bigNumber(this, w / 2 - 2 * s, h / 2 + 84 * s, 42 * s, `+${r.coins}`).setOrigin(0, 0.5);
    c.add([shade, panel, barn, n, trophy, best, road, distN, m, ci, cn]);
    if (r.newBest) {
      const burst = this.add.particles(w / 2, h / 2 - 80 * s, 'ic-star', {
        speed: { min: 200, max: 520 }, lifespan: 1000, scale: { start: 0.35 * s, end: 0 }, gravityY: 500, emitting: false,
      });
      burst.explode(26);
      c.add(burst);
      this.tweens.add({ targets: trophy, scale: trophy.scale * 1.2, duration: 300, yoyo: true, repeat: 2 });
      this.tweens.add({ targets: best, scale: best.scale * 1.2, duration: 300, yoyo: true, repeat: 2 });
      audio.tone(523, 0.12, 'square', 0.1); this.time.delayedCall(120, () => audio.tone(659, 0.12, 'square', 0.1));
      this.time.delayedCall(240, () => audio.tone(784, 0.25, 'square', 0.1));
    }

    // reiniciar en un clic (botón grande), revivir con anuncio (si el portal lo ofrece), volver al menú
    const by = h / 2 + 185 * s;
    const replay = iconButton(this, w / 2, by, 'replay', PALETTE.green, 62 * s, () => this.restart());
    pulse(this, replay, 0.05);
    const home = iconButton(this, w / 2 - 150 * s, by + 10 * s, 'home', PALETTE.purple, 38 * s, () => this.home());
    c.add([replay, home]);
    if (r.canRevive) {
      const rev = iconButton(this, w / 2 + 150 * s, by + 10 * s, 'video', PALETTE.yellow, 44 * s, () => this.revive());
      const mini = this.add.image(rev.x + 34 * s, rev.y - 34 * s, 'crate').setDisplaySize(32 * s, 32 * s);
      c.add([rev, mini]);
    }
    // ×2 monedas con anuncio (una vez por partida), sobre el borde de arriba del panel
    if (r.canDouble) {
      this.dbl = doubleButton(this, {
        x: w / 2, y: h / 2 - 200 * s, s, currencyIcon: 'ic-coin', earned: r.coins,
        onDoubled: () => {
          const extra = this.play.doubleCoins();
          cn.setText(`+${r.coins + extra}`);
          this.tweens.add({ targets: [ci, cn], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (this.dbl) c.add(this.dbl);
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.input.keyboard?.once('keydown-SPACE', this.restart, this);
  }

  /** Botón ×2 del panel final (también lo pulsa la prueba automática). */
  dbl: ReturnType<typeof doubleButton> = null;

  restart() {
    if (this.busy) return;
    this.busy = true;
    this.scene.get('Play').scene.restart(); // el anuncio intersticial se pide al empezar la partida
    this.busy = false;
  }

  async revive() {
    if (this.busy) return;
    this.busy = true;
    const ok = await portal.rewardedBreak();
    this.busy = false;
    if (!ok) return;
    this.input.keyboard?.off('keydown-SPACE', this.restart, this);
    this.over?.destroy();
    this.over = undefined;
    this.dbl = null;
    this.play.revive();
  }

  home() {
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}
