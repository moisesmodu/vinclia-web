import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { tutorialHand, gameOverScreen } from '@comun/pantallas';
import { save } from '../state';
import { K } from './Boot';
import type { Play } from './Play';

type OverInfo = { score: number; best: number; newBest: boolean; canRevive: boolean };

/**
 * Capa de interfaz sobre la partida (sin zoom): distancia, récord, plátanos, sonido, tutorial de 10 s y pantalla
 * final. También recoge la pulsación de "mantener" (ratón o dedo en cualquier sitio que no sea un botón).
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private holdPointers = new Set<number>();
  private tutorial?: { done: () => void; container: Phaser.GameObjects.Container };
  private tutorialWanted = false;
  over?: Phaser.GameObjects.Container;
  private layoutFns: (() => void)[] = [];
  private busy = false;
  private scoreTick = () => {};

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.holdPointers.clear();
    this.layoutFns = [];
    this.over = undefined;
    this.tutorial = undefined;
    this.busy = false;
    this.tutorialWanted = !save.get('tutorialDone') || save.get('runs') <= 2;

    const score = bigNumber(this, 0, 0, 64, '0');
    const bestMark = this.add.image(0, 0, 'ic-trophy');
    const bestTxt = bigNumber(this, 0, 0, 26, `${save.get('best')}`).setOrigin(0, 0.5);
    const banana = this.add.image(0, 0, 'banana');
    const bananas = bigNumber(this, 0, 0, 40, '0').setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });
    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      score.setPosition(w / 2, 50 * s).setScale(s);
      bestMark.setPosition(w / 2 - 20 * s, 100 * s).setDisplaySize(30 * s, 30 * s);
      bestTxt.setPosition(w / 2, 101 * s).setScale(s);
      banana.setPosition(44 * s, 46 * s).setScale(0.95 / K * s);
      bananas.setPosition(74 * s, 48 * s).setScale(s);
      sound.setPosition(w - 46 * s, 46 * s).setScale(s);
    });
    // la distancia sube ~12 veces por segundo: el texto se redibuja como mucho 5 veces por segundo
    let shown = -1, pending = 0, lastT = 0;
    this.play.events.on('score', (n: number) => { pending = n; });
    this.scoreTick = () => {
      if (pending !== shown && this.time.now - lastT > 200) { shown = pending; lastT = this.time.now; score.setText(`${shown}`); }
    };
    this.play.events.on('bananas', (n: number) => {
      bananas.setText(`${n}`);
      const s = this.ui();
      this.tweens.killTweensOf(banana);
      banana.setScale(0.95 / K * s);
      this.tweens.add({ targets: banana, scale: 1.3 / K * s, duration: 90, yoyo: true });
    });
    this.play.events.on('grab', (n: number) => {
      // el tutorial termina al primer enganche en el aire
      if (this.tutorial && n >= 1) { this.tutorial.done(); this.tutorial = undefined; save.set('tutorialDone', true); }
    });
    this.play.events.on('over', (r: OverInfo) => this.showOver(r));

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
      for (const ev of ['score', 'bananas', 'grab', 'over']) this.play.events.off(ev);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1100, this.scale.height / 640), 0.6, 1.4); }
  private layout() { for (const f of this.layoutFns) f(); }
  private clearHold() { this.holdPointers.clear(); this.sync(); }
  private sync() { this.registry.set('hold', this.holdPointers.size > 0); }

  update() {
    this.scoreTick();
    // el tutorial empieza cuando empieza a jugar (después del anuncio), no al crear la escena
    if (this.tutorialWanted && this.play.started) {
      this.tutorialWanted = false;
      this.tutorial = tutorialHand(this, { gesture: 'hold', y: this.scale.height * 0.66 });
    }
    if (this.tutorial) this.tutorial.container.setAlpha(this.play.hold ? 0.35 : 1);
  }

  /* -------------------------------------------------------------- final de partida */

  private showOver(r: OverInfo) {
    this.clearHold();
    if (this.tutorial) { this.tutorial.done(); this.tutorial = undefined; }
    this.tutorialWanted = false;
    this.over = gameOverScreen(this, {
      score: r.score, best: r.best, newBest: r.newBest, canRevive: r.canRevive, icon: 'monkey-ic',
      onReplay: () => this.restart(),
      onHome: () => this.home(),
      onRevive: () => { this.over = undefined; this.play.revive(); },
    });
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
