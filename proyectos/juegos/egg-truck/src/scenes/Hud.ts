import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import type { Play } from './Play';

/**
 * Capa de interfaz sobre la partida (sin zoom): distancia, estrellas, sonido, tutorial de 10 s
 * y pantalla final con reinicio en un clic. También recoge la pulsación de "mantener".
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private holdPointers = new Set<number>();
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialHeld = 0;
  private tutorialStart = 0;
  private over?: Phaser.GameObjects.Container;
  private layoutFns: (() => void)[] = [];

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.holdPointers.clear();
    this.layoutFns = [];
    this.over = undefined;
    this.tutorial = undefined;
    this.dbl = null;

    // distancia (arriba, centro) y estrellas (arriba, izquierda)
    const dist = bigNumber(this, 0, 0, 64, '0');
    const unit = bigNumber(this, 0, 0, 30, 'm').setOrigin(0, 0.5);
    const bestMark = this.add.image(0, 0, 'ic-trophy').setDisplaySize(34, 34).setAlpha(0.9);
    const bestTxt = bigNumber(this, 0, 0, 26, `${save.get('best')}`).setOrigin(0, 0.5);
    const starIc = this.add.image(0, 0, 'ic-star').setDisplaySize(46, 46);
    const stars = bigNumber(this, 0, 0, 40, '0').setOrigin(0, 0.5);
    const eggIc = this.add.image(0, 0, 'egg0').setDisplaySize(40, 48);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      dist.setPosition(w / 2 - 10 * s, 50 * s).setScale(s);
      unit.setPosition(dist.x + dist.displayWidth / 2 + 4 * s, 58 * s).setScale(s);
      bestMark.setPosition(w / 2 - 22 * s, 100 * s).setDisplaySize(30 * s, 30 * s);
      bestTxt.setPosition(w / 2 - 2 * s, 101 * s).setScale(s);
      starIc.setPosition(44 * s, 44 * s).setDisplaySize(46 * s, 46 * s);
      stars.setPosition(74 * s, 46 * s).setScale(s);
      eggIc.setPosition(44 * s, 104 * s).setDisplaySize(36 * s, 44 * s);
      sound.setPosition(w - 46 * s, 46 * s).setScale(s);
    });

    this.play.events.on('dist', (d: number) => {
      if (dist.text !== `${d}`) { dist.setText(`${d}`); unit.setX(dist.x + dist.displayWidth / 2 + 4 * this.ui()); }
    });
    this.play.events.on('stars', (n: number) => {
      stars.setText(`${n}`);
      // rebote sobre la escala base (no sobre la actual: con estrellas seguidas crecería sin fin)
      const base = (46 * this.ui()) / starIc.width;
      this.tweens.killTweensOf(starIc);
      starIc.setScale(base);
      this.tweens.add({ targets: starIc, scale: base * 1.3, duration: 90, yoyo: true });
    });
    this.play.events.on('crack', (c: number) => {
      eggIc.setTexture(`egg${c}`);
      this.tweens.add({ targets: eggIc, angle: { from: -20, to: 20 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => eggIc.setAngle(0) });
    });
    this.play.events.on('milestone', (m: number) => this.toast(m));
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
      for (const ev of ['dist', 'stars', 'crack', 'milestone', 'over']) this.play.events.off(ev);
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
    // flecha "hacia delante" junto a la mano: mantener = avanzar
    const arrow = this.add.image(110, 0, 'ic-play').setDisplaySize(70, 70).setTint(PALETTE.yellow);
    c.add([ring, hand, arrow]);
    this.tutorial = c;
    // el reloj de la escena aún no está al día en create(): se fija en el primer update()
    this.tutorialStart = -1;
    this.tweens.add({ targets: hand, y: 4, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut', hold: 500 });
    this.tweens.add({ targets: ring, scale: 1.35, alpha: 0.2, duration: 840, repeat: -1, hold: 100 });
    this.tweens.add({ targets: arrow, x: 140, duration: 420, yoyo: true, repeat: -1, hold: 500 });
    this.layoutFns.push(() => c.setPosition(this.scale.width / 2, this.scale.height * 0.62).setScale(this.ui()));
  }

  update(_t: number, dt: number) {
    if (!this.tutorial) return;
    if (this.holdPointers.size > 0 || this.registry.get('hold')) this.tutorialHeld += dt;
    if (this.tutorialStart < 0) this.tutorialStart = this.time.now;
    const done = this.tutorialHeld > 1500 || this.time.now - this.tutorialStart > 10000;
    this.tutorial.setAlpha(this.holdPointers.size > 0 ? 0.35 : 1);
    if (done) {
      const t = this.tutorial;
      this.tutorial = undefined;
      save.set('tutorialDone', true);
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    }
  }

  private toast(m: number) {
    const s = this.ui();
    const t = bigNumber(this, this.scale.width / 2, this.scale.height * 0.3, 90 * s, `${m}`).setColor('#ffd23f').setScale(0.2);
    const flag = this.add.image(t.x - 110 * s, t.y, 'flag').setScale(0.2 * s);
    this.tweens.add({ targets: [t], scale: 1, duration: 260, ease: 'Back.out' });
    this.tweens.add({ targets: [flag], scale: s, duration: 260, ease: 'Back.out' });
    this.tweens.add({ targets: [t, flag], alpha: 0, y: '-=40', delay: 900, duration: 400, onComplete: () => { t.destroy(); flag.destroy(); } });
  }

  /* -------------------------------------------------------------- final de partida */

  private showOver(r: OverInfo) {
    this.clearHold();
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    const w = this.scale.width, h = this.scale.height, s = this.ui();
    const c = this.add.container(0, 0).setDepth(30);
    this.over = c;
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.45).setInteractive();
    const panel = this.add.rectangle(w / 2, h / 2 - 20 * s, 520 * s, 300 * s, 0xffffff, 0.96)
      .setStrokeStyle(8 * s, PALETTE.ink).setOrigin(0.5);
    const egg = this.add.image(w / 2 - 165 * s, h / 2 - 72 * s, 'egg-broken').setScale(1.3 * s);
    const dist = bigNumber(this, w / 2 + 40 * s, h / 2 - 78 * s, 96 * s, `${r.dist}`);
    const m = bigNumber(this, dist.x + dist.displayWidth / 2 + 26 * s, h / 2 - 66 * s, 40 * s, 'm');
    const trophy = this.add.image(w / 2 - 150 * s, h / 2 + 30 * s, 'ic-trophy').setDisplaySize(52 * s, 52 * s);
    const best = bigNumber(this, w / 2 - 116 * s, h / 2 + 32 * s, 46 * s, `${r.best}`).setOrigin(0, 0.5);
    const starIc = this.add.image(w / 2 + 70 * s, h / 2 + 30 * s, 'ic-star').setDisplaySize(50 * s, 50 * s);
    const starN = bigNumber(this, w / 2 + 104 * s, h / 2 + 32 * s, 46 * s, `+${r.stars}`).setOrigin(0, 0.5);
    c.add([shade, panel, egg, dist, m, trophy, best, starIc, starN]);
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
      const mini = this.add.image(rev.x + 34 * s, rev.y - 34 * s, 'egg0').setDisplaySize(30 * s, 36 * s);
      c.add([rev, mini]);
    }
    // ×2 estrellas con anuncio (una vez por partida), sobre el borde de arriba del panel
    if (r.canDouble) {
      const dbl = doubleButton(this, {
        x: w / 2, y: h / 2 - 200 * s, s, currencyIcon: 'ic-star', earned: r.stars,
        onDoubled: () => {
          const extra = this.play.doubleStars();
          starN.setText(`+${r.stars + extra}`);
          this.tweens.add({ targets: [starIc, starN], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (dbl) c.add(dbl);
      this.dbl = dbl;
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  /** Botón ×2 del panel final (también lo pulsa la prueba automática). */
  dbl: ReturnType<typeof doubleButton> = null;

  private busy = false;
  private restart() {
    if (this.busy) return;
    this.busy = true;
    this.scene.get('Play').scene.restart(); // el anuncio intersticial se pide al empezar la partida
    this.busy = false;
  }

  private async revive() {
    if (this.busy) return;
    this.busy = true;
    const ok = await portal.rewardedBreak();
    this.busy = false;
    if (!ok) return;
    this.over?.destroy();
    this.over = undefined;
    this.play.revive();
  }

  private home() {
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}

type OverInfo = { dist: number; best: number; newBest: boolean; canRevive: boolean; canDouble: boolean; stars: number };
