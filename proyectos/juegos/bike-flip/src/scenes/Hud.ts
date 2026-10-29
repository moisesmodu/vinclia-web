import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import { LEVELS } from '../levels';
import type { Play } from './Play';

const fmt = (ms: number) => (ms / 1000).toFixed(1);

/**
 * Capa de interfaz sobre la partida (sin zoom): nivel, cronómetro, barra de progreso, turbo, sonido,
 * reiniciar y menú; tutorial de 10 s y pantallas de choque y de meta. También recoge el "mantener".
 * Los nombres restart()/revive()/home() y `over` los usa scripts/sdk-test.mjs.
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private holdPointers = new Set<number>();
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialHeld = 0;
  private tutorialStart = 0;
  private flipHint?: Phaser.GameObjects.Image;
  private airFrames = 0;
  over?: Phaser.GameObjects.Container;
  /** Botón ×2 del panel de meta (también lo pulsa la prueba automática). */
  dbl: ReturnType<typeof doubleButton> = null;
  private layoutFns: (() => void)[] = [];
  private turboBar!: Phaser.GameObjects.Rectangle;
  private turboIc!: Phaser.GameObjects.Image;
  private turboMax = 1;
  private turboLeft = 0;
  private busy = false;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.holdPointers.clear();
    this.layoutFns = [];
    this.over = undefined;
    this.dbl = null;
    this.tutorial = undefined;
    this.flipHint = undefined;
    this.airFrames = 0;
    this.turboLeft = 0;
    this.busy = false;
    this.registry.set('hold', false);
    const level = this.play.level;

    // nivel (arriba izquierda), tiempo y progreso (arriba centro), botones (arriba derecha)
    const flag = this.add.image(0, 0, 'ic-finish');
    const lvl = bigNumber(this, 0, 0, 44, `${level}`).setOrigin(0, 0.5);
    const clock = this.add.image(0, 0, 'ic-clock');
    const time = this.add.bitmapText(0, 0, 'digits', '0.0', 52).setOrigin(0, 0.5);
    const barBg = this.add.rectangle(0, 0, 300, 18, 0x2b2340, 0.35).setStrokeStyle(4, PALETTE.ink);
    const barFill = this.add.rectangle(0, 0, 0, 10, PALETTE.yellow).setOrigin(0, 0.5);
    const barBike = this.add.image(0, 0, 'bike');
    const barEnd = this.add.image(0, 0, 'ic-finish');
    this.turboIc = this.add.image(0, 0, 'ic-flame').setVisible(false);
    this.turboBar = this.add.rectangle(0, 0, 0, 12, 0xff7a3d).setOrigin(0, 0.5).setStrokeStyle(3, PALETTE.ink).setVisible(false);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 28, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    const again = iconButton(this, 0, 0, 'replay', PALETTE.green, 28, () => this.restart());
    const home = iconButton(this, 0, 0, 'grid', PALETTE.purple, 28, () => this.home());
    let prog = 0;
    const placeBar = () => {
      const s = this.ui();
      barFill.setSize(Math.max(0, (barBg.width - 8 * s) * prog), 10 * s);
      barBike.setX(barBg.x - barBg.width / 2 + barBg.width * prog);
    };
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui(), narrow = w < 640;
      flag.setPosition(38 * s, 40 * s).setDisplaySize(52 * s, 52 * s);
      lvl.setPosition(64 * s, 44 * s).setScale(s);
      const cx = narrow ? w / 2 - 20 * s : w / 2;
      const ty = narrow ? 100 * s : 40 * s;
      clock.setPosition(cx - 66 * s, ty).setDisplaySize(44 * s, 44 * s);
      time.setPosition(cx - 40 * s, ty + 2 * s).setScale(s);
      const bw = Math.min(narrow ? w - 80 * s : 360 * s, w - 40 * s);
      barBg.setPosition(narrow ? w / 2 : w / 2, ty + 48 * s).setSize(bw, 18 * s).setStrokeStyle(4 * s, PALETTE.ink);
      barBg.setDisplayOrigin(bw / 2, 9 * s);
      barFill.setPosition(barBg.x - bw / 2 + 4 * s, barBg.y);
      barBike.setY(barBg.y - 14 * s).setScale(0.26 * s);
      barEnd.setPosition(barBg.x + bw / 2 + 14 * s, barBg.y - 8 * s).setDisplaySize(40 * s, 40 * s);
      this.turboIc.setPosition(barBg.x - 70 * s, barBg.y + 40 * s).setDisplaySize(42 * s, 42 * s);
      this.turboBar.setPosition(barBg.x - 44 * s, barBg.y + 40 * s).setSize(this.turboBar.width, 12 * s);
      sound.setPosition(w - 40 * s, 40 * s).setScale(s);
      again.setPosition(w - 106 * s, 40 * s).setScale(s);
      home.setPosition(w - 172 * s, 40 * s).setScale(s);
      placeBar();
    });

    this.play.events.on('time', (ms: number) => { const t = fmt(ms); if (time.text !== t) time.setText(t); });
    this.play.events.on('progress', (p: number) => { prog = p; placeBar(); });
    this.play.events.on('flip', (n: number) => this.flipPop(n));
    this.play.events.on('turbo', (_n: number, ms: number) => { this.turboMax = ms; this.turboLeft = ms; });
    this.play.events.on('over', (r: OverInfo) => this.showCrash(r));
    this.play.events.on('complete', (r: DoneInfo) => this.showDone(r));

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
      for (const ev of ['time', 'progress', 'flip', 'turbo', 'over', 'complete']) this.play.events.off(ev);
    });

    if (!save.get('tutorialDone') && level === 1) this.showTutorial();
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
    const arrow = this.add.image(110, 0, 'ic-play').setDisplaySize(70, 70).setTint(PALETTE.yellow);
    c.add([ring, hand, arrow]);
    this.tutorial = c;
    this.tutorialStart = this.time.now;
    this.tweens.add({ targets: hand, y: 4, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut', hold: 500 });
    this.tweens.add({ targets: ring, scale: 1.35, alpha: 0.2, duration: 840, repeat: -1, hold: 100 });
    this.tweens.add({ targets: arrow, x: 140, duration: 420, yoyo: true, repeat: -1, hold: 500 });
    this.layoutFns.push(() => c.setPosition(this.scale.width / 2, this.scale.height * 0.62).setScale(this.ui()));
  }

  update(_t: number, dt: number) {
    // turbo restante
    if (this.turboLeft > 0 && this.play.alive) {
      this.turboLeft -= dt;
      const s = this.ui();
      this.turboIc.setVisible(true).setAngle(Math.sin(this.time.now / 60) * 8);
      this.turboBar.setVisible(true).setSize(Math.max(0, 160 * s * (this.turboLeft / this.turboMax)), 12 * s);
    } else if (this.turboIc.visible) { this.turboIc.setVisible(false); this.turboBar.setVisible(false); this.turboLeft = 0; }

    // pista de voltereta en los primeros niveles: en el aire, flecha circular "mantén para girar"
    const air = this.play.alive && this.play.started && this.play.groundedNow === 0;
    this.airFrames = air ? this.airFrames + 1 : 0;
    if (this.play.level <= 3 && save.get('flips') === 0 && this.airFrames > 12 && !this.flipHint) {
      const s = this.ui();
      this.flipHint = this.add.image(this.scale.width / 2, this.scale.height * 0.3, 'ic-flip').setDisplaySize(110 * s, 110 * s).setTint(PALETTE.yellow).setDepth(15);
      this.tweens.add({ targets: this.flipHint, angle: -360, duration: 900, repeat: -1 });
    } else if (this.flipHint && !air) { this.flipHint.destroy(); this.flipHint = undefined; }

    if (!this.tutorial) return;
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

  /** Voltereta completada en el aire: icono que gira y número de volteretas. */
  private flipPop(n: number) {
    const s = this.ui(), w = this.scale.width, h = this.scale.height;
    const ic = this.add.image(w / 2 - 50 * s, h * 0.3, 'ic-flip').setTint(PALETTE.yellow).setDisplaySize(90 * s, 90 * s).setDepth(16);
    const num = bigNumber(this, w / 2 + 40 * s, h * 0.3, 80 * s, `${n}`).setColor('#ffd23f').setDepth(16).setScale(0.3);
    this.tweens.add({ targets: ic, angle: -360, duration: 500 });
    this.tweens.add({ targets: num, scale: 1, duration: 240, ease: 'Back.out' });
    this.tweens.add({ targets: [ic, num], alpha: 0, y: '-=40', delay: 800, duration: 350, onComplete: () => { ic.destroy(); num.destroy(); } });
  }

  /* -------------------------------------------------------------- choque y meta */

  private panel(hgt: number) {
    const w = this.scale.width, h = this.scale.height, s = this.ui();
    const c = this.add.container(0, 0).setDepth(30);
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.45).setInteractive();
    const pw = Math.min(560 * s, w - 24);
    const panel = this.add.rectangle(w / 2, h / 2 - 30 * s, pw, hgt * s, 0xfff6e8, 0.97).setStrokeStyle(8 * s, PALETTE.ink);
    c.add([shade, panel]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.over = c;
    return { c, w, h, s, pw };
  }

  private showCrash(r: OverInfo) {
    this.clearHold();
    this.dropHints();
    const { c, w, h, s } = this.panel(230);
    const bike = this.add.image(w / 2 - 120 * s, h / 2 - 40 * s, 'bike').setScale(0.95 * s).setAngle(160);
    const flag = this.add.image(w / 2 + 60 * s, h / 2 - 50 * s, 'ic-finish').setDisplaySize(80 * s, 80 * s);
    const lvl = bigNumber(this, w / 2 + 140 * s, h / 2 - 46 * s, 84 * s, `${r.level}`);
    c.add([bike, flag, lvl]);
    this.tweens.add({ targets: bike, angle: 170, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const by = h / 2 + 135 * s;
    const replay = iconButton(this, w / 2, by, 'replay', PALETTE.green, 62 * s, () => this.restart());
    pulse(this, replay, 0.05);
    const levels = iconButton(this, w / 2 - 150 * s, by + 10 * s, 'grid', PALETTE.purple, 40 * s, () => this.home());
    c.add([replay, levels]);
    if (r.canRevive) {
      const rev = iconButton(this, w / 2 + 145 * s, by + 10 * s, 'video', PALETTE.yellow, 42 * s, () => this.revive());
      c.add([rev, this.add.image(rev.x + 36 * s, rev.y - 36 * s, 'bike').setScale(0.22 * s)]);
    }
    if (r.canSkip) {
      const sk = iconButton(this, w / 2 + (r.canRevive ? 250 : 145) * s, by + 10 * s, 'video', 0xff8a4c, 42 * s, () => this.skip());
      c.add([sk, this.add.image(sk.x + 34 * s, sk.y - 36 * s, 'ic-skip').setDisplaySize(36 * s, 36 * s).setTint(PALETTE.ink)]);
    }
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  private showDone(r: DoneInfo) {
    this.clearHold();
    this.dropHints();
    const flips = r.flips > 0;
    const { c, w, h, s } = this.panel(300);
    const top = h / 2 - 30 * s - (300 * s) / 2;
    const sy = top + 60 * s;
    for (let k = 0; k < 3; k++) {
      const on = r.stars > k;
      const st = this.add.image(w / 2 + (k - 1) * 110 * s, sy - (k === 1 ? 14 : 0) * s, on ? 'ic-star' : 'ic-star-off').setDisplaySize(10, 10);
      c.add(st);
      this.tweens.add({ targets: st, displayWidth: 100 * s, displayHeight: 100 * s, delay: 150 + k * 220, duration: 260, ease: 'Back.out',
        onStart: () => { if (on) audio.tone(660 + k * 180, 0.14, 'triangle', 0.14, 1200 + k * 200); } });
    }
    const ry = top + 160 * s;
    const clock = this.add.image(w / 2 - 170 * s, ry, 'ic-clock').setDisplaySize(56 * s, 56 * s).setTint(PALETTE.ink);
    const t = bigNumber(this, w / 2 - 136 * s, ry + 2 * s, 64 * s, fmt(r.ms)).setOrigin(0, 0.5);
    const trophy = this.add.image(w / 2 + 80 * s, ry, 'ic-trophy').setDisplaySize(50 * s, 50 * s).setTint(0xf2a900);
    const best = bigNumber(this, w / 2 + 110 * s, ry + 2 * s, 42 * s, fmt(r.best)).setOrigin(0, 0.5);
    c.add([clock, t, trophy, best]);
    if (flips) {
      const fi = this.add.image(w / 2 - 150 * s, ry + 66 * s, 'ic-flip').setDisplaySize(48 * s, 48 * s).setTint(0xff7a3d);
      c.add([fi, bigNumber(this, w / 2 - 120 * s, ry + 68 * s, 44 * s, `${r.flips}`).setOrigin(0, 0.5)]);
    }
    // monedas ganadas (estrellas + volteretas) y ×2 con anuncio sobre el borde de arriba del panel
    const coinIc = this.add.image(w / 2 + (flips ? 40 : -40) * s, ry + 66 * s, 'ic-coin').setDisplaySize(48 * s, 48 * s);
    const coinN = bigNumber(this, coinIc.x + 32 * s, ry + 68 * s, 44 * s, `+${r.coins}`).setOrigin(0, 0.5);
    c.add([coinIc, coinN]);
    if (r.canDouble) {
      this.dbl = doubleButton(this, {
        x: w / 2, y: top - 52 * s, s, currencyIcon: 'ic-coin', earned: r.coins,
        onDoubled: () => {
          const extra = this.play.doubleCoins();
          coinN.setText(`+${r.coins + extra}`);
          this.tweens.add({ targets: [coinIc, coinN], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (this.dbl) c.add(this.dbl);
    }
    if (r.newBest && r.stars === 3) {
      // lluvia de estrellas desde arriba de la pantalla (no tapa las cifras del panel)
      const burst = this.add.particles(0, -20, 'ic-star', {
        x: { min: 0, max: w }, speedY: { min: 80, max: 260 }, lifespan: 2200, scale: { start: 0.22 * s, end: 0.12 * s },
        rotate: { min: 0, max: 360 }, gravityY: 300, emitting: false,
      }).setDepth(31);
      burst.explode(22);
      this.time.delayedCall(2600, () => burst.destroy());
    }
    const by = h / 2 + 165 * s;
    const levels = iconButton(this, w / 2 - 150 * s, by + 10 * s, 'grid', PALETTE.purple, 40 * s, () => this.home());
    const replay = iconButton(this, r.last ? w / 2 : w / 2 + 150 * s, r.last ? by : by + 10 * s, 'replay', PALETTE.blue, (r.last ? 62 : 40) * s, () => this.restart());
    c.add([levels, replay]);
    if (!r.last) {
      const next = iconButton(this, w / 2, by, 'play', PALETTE.green, 62 * s, () => this.next());
      pulse(this, next, 0.05);
      c.add(next);
      this.input.keyboard?.once('keydown-SPACE', () => this.next());
    } else {
      pulse(this, replay, 0.05);
      this.input.keyboard?.once('keydown-SPACE', () => this.restart());
    }
  }

  private dropHints() {
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    if (this.flipHint) { this.flipHint.destroy(); this.flipHint = undefined; }
  }

  /** Reiniciar el nivel en un clic (el anuncio intersticial lo pide Play al empezar). */
  restart() {
    if (this.busy) return;
    this.busy = true;
    this.play.startLevel(this.play.level);
  }

  next() {
    if (this.busy) return;
    this.busy = true;
    this.play.startLevel(Math.min(LEVELS.length, this.play.level + 1));
  }

  async revive() {
    if (this.busy || !this.over) return;
    this.busy = true;
    const ok = await portal.rewardedBreak();
    this.busy = false;
    if (!ok) return;
    this.over?.destroy();
    this.over = undefined;
    this.play.revive();
  }

  async skip() {
    if (this.busy) return;
    this.busy = true;
    const ok = await portal.rewardedBreak();
    this.busy = false;
    if (!ok) return;
    this.busy = true;
    this.play.skip();
  }

  /** Volver al selector de niveles. */
  home() {
    if (this.busy) return;
    this.busy = true;
    this.scene.stop('Play');
    this.scene.start('Levels');
  }
}

type OverInfo = { level: number; canRevive: boolean; canSkip: boolean };
type DoneInfo = { level: number; ms: number; best: number; newBest: boolean; stars: number; flips: number; last: boolean; coins: number; canDouble: boolean };
