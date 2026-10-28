import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { save } from '../state';
import type { Play } from './Play';

type OverInfo = { gifts: number; best: number; newBest: boolean; dist: number; canRevive: boolean };

/**
 * Capa de interfaz sobre la partida (sin zoom): regalos entregados, regalos que quedan delante de la pala,
 * barra hasta el próximo trineo, nieve que cae, tutorial de 10 s y pantalla final con reinicio en un clic.
 * También recoge la pulsación de "mantener".
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private holdPointers = new Set<number>();
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialHeld = 0;
  private tutorialStart = 0;
  private over?: Phaser.GameObjects.Container;
  private layoutFns: (() => void)[] = [];
  private busy = false;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.holdPointers.clear();
    this.layoutFns = [];
    this.over = undefined;
    this.tutorial = undefined;
    this.tutorialHeld = 0;
    this.busy = false;

    // nieve que cae (pocas partículas y con tope: barato en móvil)
    const snow = this.add.particles(0, -12, 'flake', {
      x: { onEmit: () => Math.random() * this.scale.width }, speedY: { min: 40, max: 95 }, speedX: { min: -25, max: 15 }, lifespan: 9000,
      scale: { min: 0.25, max: 0.7 }, alpha: { min: 0.5, max: 0.95 }, frequency: 110, maxAliveParticles: 70,
    }).setDepth(-1);

    // entregados (arriba, centro), récord, barra hasta el trineo y carga (arriba, izquierda)
    const giftIc = this.add.image(0, 0, 'gift0');
    const score = bigNumber(this, 0, 0, 64, '0').setOrigin(0, 0.5);
    const bestMark = this.add.image(0, 0, 'ic-trophy').setAlpha(0.9);
    const bestTxt = bigNumber(this, 0, 0, 26, `${save.get('best')}`).setOrigin(0, 0.5);
    const barBg = this.add.rectangle(0, 0, 10, 14, 0x2b2340, 0.55).setOrigin(0, 0.5).setStrokeStyle(3, 0xffffff, 0.9);
    const bar = this.add.rectangle(0, 0, 10, 8, 0xffd23f).setOrigin(0, 0.5);
    const sleighIc = this.add.image(0, 0, 'sleigh');
    const loadIc = this.add.image(0, 0, 'gift2');
    const load = bigNumber(this, 0, 0, 40, '6').setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    let progress = 0;
    const barW = () => 200 * this.ui();
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      giftIc.setPosition(w / 2 - 34 * s, 50 * s).setDisplaySize(54 * s, 54 * s);
      score.setPosition(w / 2 + 2 * s, 52 * s).setScale(s);
      bestMark.setPosition(w / 2 - 22 * s, 102 * s).setDisplaySize(30 * s, 30 * s);
      bestTxt.setPosition(w / 2 - 2 * s, 103 * s).setScale(s);
      barBg.setPosition(w / 2 - barW() / 2 - 16 * s, 140 * s).setSize(barW(), 16 * s);
      barBg.setDisplaySize(barW(), 16 * s);
      bar.setPosition(barBg.x + 3 * s, 140 * s).setDisplaySize(Math.max(1, (barW() - 6 * s) * progress), 9 * s);
      sleighIc.setPosition(barBg.x + barW() + 26 * s, 134 * s).setDisplaySize(52 * s, 34 * s);
      loadIc.setPosition(44 * s, 44 * s).setDisplaySize(46 * s, 46 * s);
      load.setPosition(76 * s, 46 * s).setScale(s);
      sound.setPosition(w - 46 * s, 46 * s).setScale(s);
    });

    this.play.events.on('gifts', (n: number) => {
      score.setText(`${n}`);
      const base = (54 * this.ui()) / giftIc.width;
      this.tweens.killTweensOf(giftIc);
      giftIc.setScale(base);
      this.tweens.add({ targets: giftIc, scale: base * 1.3, duration: 90, yoyo: true });
    });
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
    this.play.events.on('sleigh', (r: { got: number; refill: number }) => this.toast(r.got, r.refill));
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
      for (const ev of ['gifts', 'load', 'lost', 'progress', 'sleigh', 'over']) this.play.events.off(ev);
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
    const ring = this.add.circle(0, 0, 46, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.9);
    const hand = this.add.image(12, -10, 'ic-hand').setDisplaySize(110, 110).setOrigin(0.45, 0.05);
    // flecha "hacia delante" y regalo: mantener = empujar los regalos
    const arrow = this.add.image(110, 0, 'ic-play').setDisplaySize(70, 70).setTint(PALETTE.yellow);
    const gift = this.add.image(190, 0, 'gift0').setDisplaySize(56, 56);
    c.add([ring, hand, arrow, gift]);
    this.tutorial = c;
    this.tutorialStart = -1; // el reloj de la escena aún no está al día en create(): se fija en el primer update
    this.tweens.add({ targets: hand, y: 4, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut', hold: 500 });
    this.tweens.add({ targets: ring, scale: 1.35, alpha: 0.2, duration: 840, repeat: -1, hold: 100 });
    this.tweens.add({ targets: [arrow], x: 130, duration: 420, yoyo: true, repeat: -1, hold: 500 });
    this.tweens.add({ targets: [gift], x: 210, duration: 420, yoyo: true, repeat: -1, hold: 500 });
    this.layoutFns.push(() => c.setPosition(this.scale.width / 2 - 60 * this.ui(), this.scale.height * 0.62).setScale(this.ui()));
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

  /** Llegada al trineo: regalos entregados y recarga. */
  private toast(got: number, refill: number) {
    const s = this.ui(), x = this.scale.width / 2, y = this.scale.height * 0.3;
    const c = this.add.container(x, y).setDepth(15).setScale(0.2);
    const sl = this.add.image(-120, 0, 'sleigh').setDisplaySize(130, 85);
    const n = bigNumber(this, 10, 0, 90, `${got}`).setColor('#ffd23f');
    const plus = this.add.image(120, 4, 'gift3').setDisplaySize(44, 44);
    const r = bigNumber(this, 170, 4, 48, `+${refill}`).setOrigin(0, 0.5);
    c.add([sl, n, plus, r]);
    this.tweens.add({ targets: c, scale: s, duration: 260, ease: 'Back.out' });
    this.tweens.add({ targets: c, alpha: 0, y: y - 40 * s, delay: 1100, duration: 400, onComplete: () => c.destroy() });
  }

  /* -------------------------------------------------------------- final de partida */

  private showOver(r: OverInfo) {
    this.clearHold();
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    const w = this.scale.width, h = this.scale.height, s = Math.min(this.ui(), w / 600);
    const c = this.add.container(0, 0).setDepth(30);
    this.over = c;
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x0b1640, 0.5).setInteractive();
    const panel = this.add.rectangle(w / 2, h / 2 - 20 * s, 520 * s, 300 * s, 0xffffff, 0.96)
      .setStrokeStyle(8 * s, PALETTE.ink).setOrigin(0.5);
    const sl = this.add.image(w / 2 - 150 * s, h / 2 - 76 * s, 'sleigh').setDisplaySize(150 * s, 98 * s);
    const n = bigNumber(this, w / 2 + 50 * s, h / 2 - 78 * s, 96 * s, `${r.gifts}`);
    const gi = this.add.image(n.x + n.displayWidth / 2 + 40 * s, h / 2 - 78 * s, 'gift0').setDisplaySize(52 * s, 52 * s);
    const trophy = this.add.image(w / 2 - 150 * s, h / 2 + 30 * s, 'ic-trophy').setDisplaySize(52 * s, 52 * s);
    const best = bigNumber(this, w / 2 - 116 * s, h / 2 + 32 * s, 46 * s, `${r.best}`).setOrigin(0, 0.5);
    const distN = bigNumber(this, w / 2 + 60 * s, h / 2 + 32 * s, 46 * s, `${r.dist}`).setOrigin(0, 0.5);
    const m = bigNumber(this, distN.x + distN.displayWidth + 6 * s, h / 2 + 38 * s, 28 * s, 'm').setOrigin(0, 0.5);
    const road = this.add.image(w / 2 + 34 * s, h / 2 + 30 * s, 'wheel').setDisplaySize(40 * s, 40 * s);
    c.add([shade, panel, sl, n, gi, trophy, best, road, distN, m]);
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
    const by = h / 2 + 175 * s;
    const replay = iconButton(this, w / 2, by, 'replay', PALETTE.green, 62 * s, () => this.restart());
    pulse(this, replay, 0.05);
    const home = iconButton(this, w / 2 - 150 * s, by + 10 * s, 'home', PALETTE.purple, 38 * s, () => this.home());
    c.add([replay, home]);
    if (r.canRevive) {
      const rev = iconButton(this, w / 2 + 150 * s, by + 10 * s, 'video', PALETTE.yellow, 44 * s, () => this.revive());
      const mini = this.add.image(rev.x + 34 * s, rev.y - 34 * s, 'gift1').setDisplaySize(32 * s, 32 * s);
      c.add([rev, mini]);
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

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
    this.over?.destroy();
    this.over = undefined;
    this.play.revive();
  }

  home() {
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}
