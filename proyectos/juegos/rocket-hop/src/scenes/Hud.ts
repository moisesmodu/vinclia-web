import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { tutorialHand, gameOverScreen, uiScale } from '@comun/pantallas';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import { K } from './Boot';
import type { Play } from './Play';

type OverInfo = { score: number; best: number; newBest: boolean; canRevive: boolean; perfects: number; canDouble: boolean };

/**
 * Capa de interfaz sobre la partida (sin zoom): puntuación, récord, barra de combustible, viento, sonido,
 * tutorial de 10 s y pantalla final. También recoge la pulsación de "mantener".
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private holdPointers = new Set<number>();
  private tutorial?: { done: () => void; container: Phaser.GameObjects.Container };
  private tutorialHeld = 0;
  over?: Phaser.GameObjects.Container;
  /** Botón ×2 del panel final (también lo pulsa la prueba automática). */
  dbl: ReturnType<typeof doubleButton> = null;
  private layoutFns: (() => void)[] = [];
  private busy = false;
  private pulseT: Phaser.Tweens.Tween | null = null;
  private lowFuel = () => {};

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.holdPointers.clear();
    this.layoutFns = [];
    this.over = undefined;
    this.tutorial = undefined;
    this.tutorialHeld = 0;
    this.busy = false;
    this.pulseT = null;

    const score = bigNumber(this, 0, 0, 64, '0');
    const bestMark = this.add.image(0, 0, 'ic-trophy');
    const bestTxt = bigNumber(this, 0, 0, 26, `${save.get('best')}`).setOrigin(0, 0.5);
    // barra de combustible (arriba a la izquierda) con la llama del cohete como icono
    const flame = this.add.image(0, 0, 'flame').setOrigin(0.5);
    const barBg = this.add.rectangle(0, 0, 220, 26, 0x2b2340, 0.6).setOrigin(0, 0.5).setStrokeStyle(5, PALETTE.ink);
    const bar = this.add.rectangle(0, 0, 210, 16, 0xffd23f).setOrigin(0, 0.5);
    const barShine = this.add.rectangle(0, 0, 210, 4, 0xffffff, 0.45).setOrigin(0, 0.5);
    // viento: flecha (icono común "play") que apunta hacia donde sopla
    const windIc = this.add.image(0, 0, 'ic-play').setTint(0x9be3ff).setVisible(false);
    const streaks = this.add.particles(0, 0, 'streak', {
      x: { min: 0, max: 1 }, y: { min: 0, max: 1 }, lifespan: 700, speedX: 0, alpha: { start: 0.55, end: 0 }, scaleX: { min: 0.6, max: 1.4 },
      frequency: 60, emitting: false,
    }).setDepth(-1);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    let barW = 220;
    let shownFuel = -1;
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      score.setPosition(w / 2, 50 * s).setScale(s);
      bestMark.setPosition(w / 2 - 20 * s, 100 * s).setDisplaySize(30 * s, 30 * s);
      bestTxt.setPosition(w / 2, 101 * s).setScale(s);
      flame.setPosition(34 * s, 44 * s).setScale(0.62 / K * s).setRotation(Math.PI);
      // en pantallas estrechas la barra se acorta para no chocar con la puntuación
      barW = Phaser.Math.Clamp((w / 2 - 56 * s - 80 * s) / s, 90, 220);
      barBg.setPosition(56 * s, 44 * s).setSize(barW * s, 26 * s).setStrokeStyle(5 * s, PALETTE.ink);
      shownFuel = -1;
      bar.setPosition(61 * s, 44 * s).setScale(s);
      barShine.setPosition(61 * s, 39 * s).setScale(s);
      windIc.setPosition(w / 2, 150 * s).setDisplaySize(56 * s, 56 * s);
      sound.setPosition(w - 46 * s, 46 * s).setScale(s);
    });
    // barra (la geometría del rectángulo se ajusta en anchura; la escala solo con la pantalla)
    this.play.events.on('fuel', (f: number) => {
      const v = Math.round(f);
      if (v === shownFuel) return;
      shownFuel = v;
      bar.width = (barW - 10) * (v / 100); barShine.width = Math.max(0, (barW - 10) * (v / 100) - 10);
      bar.setFillStyle(v > 50 ? 0x3ddc84 : v > 25 ? 0xffd23f : 0xff5d5d);
    });
    this.lowFuel = () => {
      const low = shownFuel <= 25 && shownFuel >= 0 && this.play.alive;
      if (low && !this.pulseT) this.pulseT = this.tweens.add({ targets: [bar, flame], alpha: 0.35, duration: 220, yoyo: true, repeat: -1 });
      if (!low && this.pulseT) { this.pulseT.stop(); this.pulseT = null; bar.setAlpha(1); flame.setAlpha(1); }
    };
    this.play.events.on('score', (n: number, perfect: boolean) => {
      score.setText(`${n}`);
      const s = this.ui();
      this.tweens.killTweensOf(score);
      score.setScale(s);
      this.tweens.add({ targets: score, scale: s * (perfect ? 1.45 : 1.2), duration: 110, yoyo: true });
      if (perfect) {
        const star = this.add.image(this.scale.width / 2, this.scale.height * 0.36, 'ic-star').setScale(0.2);
        this.tweens.add({ targets: star, scale: 0.75 * s, angle: 30, duration: 260, ease: 'Back.out' });
        this.tweens.add({ targets: star, alpha: 0, y: '-=50', delay: 600, duration: 350, onComplete: () => star.destroy() });
        this.tweens.add({ targets: [bar, barBg], scaleY: 1.4, duration: 120, yoyo: true, onComplete: () => { bar.setScale(s); barBg.setScale(1); } });
      }
    });
    this.play.events.on('wind', (dir: number) => {
      windIc.setVisible(dir !== 0).setFlipX(dir < 0);
      this.tweens.killTweensOf(windIc);
      if (dir) {
        const s = this.ui();
        this.tweens.add({ targets: windIc, x: { from: this.scale.width / 2 - 14 * s * dir, to: this.scale.width / 2 + 14 * s * dir }, duration: 300, yoyo: true, repeat: -1 });
        streaks.setPosition(dir > 0 ? -100 : this.scale.width + 100, 0);
        streaks.updateConfig({ x: 0, y: { min: 0, max: this.scale.height }, speedX: { min: 900 * dir, max: 1500 * dir } });
        streaks.emitting = true;
      } else streaks.emitting = false;
    });
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
      for (const ev of ['fuel', 'score', 'wind', 'over']) this.play.events.off(ev);
    });

    if (!save.get('tutorialDone') || save.get('runs') <= 2) this.tutorial = tutorialHand(this, { gesture: 'hold', y: this.scale.height * 0.66 });
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1100, this.scale.height / 640), 0.6, 1.4); }
  private layout() { for (const f of this.layoutFns) f(); }
  private clearHold() { this.holdPointers.clear(); this.sync(); }
  private sync() { this.registry.set('hold', this.holdPointers.size > 0); }

  update(_t: number, dt: number) {
    this.lowFuel();
    if (!this.tutorial) return;
    if (this.play.hold) this.tutorialHeld += Math.min(this.game.loop.rawDelta || dt, 100);
    this.tutorial.container.setAlpha(this.play.hold ? 0.35 : 1);
    if (this.tutorialHeld > 1500) {
      this.tutorial.done();
      this.tutorial = undefined;
      save.set('tutorialDone', true);
    }
  }

  /* -------------------------------------------------------------- final de partida */

  private showOver(r: OverInfo) {
    this.clearHold();
    if (this.tutorial) { this.tutorial.done(); this.tutorial = undefined; }
    this.over = gameOverScreen(this, {
      score: r.score, best: r.best, newBest: r.newBest, canRevive: r.canRevive, icon: 'rocket-ic',
      onReplay: () => this.restart(),
      onHome: () => this.home(),
      onRevive: () => { this.over = undefined; this.play.revive(); },
    });
    // ×2 aterrizajes perfectos con anuncio (una vez por partida), sobre el borde de arriba del panel común
    this.dbl = null;
    if (r.canDouble) {
      const w = this.scale.width, h = this.scale.height, s = uiScale(this);
      this.dbl = doubleButton(this, {
        x: w / 2, y: h / 2 - 200 * s, s, currencyIcon: 'ic-star', earned: r.perfects,
        onDoubled: () => {
          const extra = this.play.doublePerfects();
          const ic = this.add.image(w / 2 + 150 * s, h / 2 + 30 * s, 'ic-star').setDisplaySize(50 * s, 50 * s);
          const n = bigNumber(this, ic.x + 32 * s, ic.y + 2 * s, 44 * s, `+${extra * 2}`).setOrigin(0, 0.5);
          this.over?.add([ic, n]);
          this.tweens.add({ targets: [ic, n], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (this.dbl) this.over.add(this.dbl);
    }
  }

  /** Reiniciar en un clic (el intersticial se pide al empezar la partida, nunca en la primera). */
  restart() {
    if (this.busy) return;
    this.busy = true;
    this.play.scene.restart();
  }

  /** Revivir con anuncio con recompensa (una vez por partida). */
  async revive() {
    if (this.busy || this.play.alive || this.play.revived) return;
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
