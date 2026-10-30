import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { gameOverScreen, tutorialHand, uiScale } from '@comun/pantallas';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import type { Play } from './Play';

type OverInfo = { score: number; best: number; newBest: boolean; canRevive: boolean; coins: number; canDouble: boolean };

/**
 * Capa de interfaz sobre la partida: puntos, combo con fuego, vidas (golpes en el aro), monedas, barra de la
 * pelota dorada, sonido, tutorial de tocar (10 s como máximo desde el primer fotograma de juego) y pantalla final.
 * También recoge los toques de la pantalla (los que no caen en un botón) y se los pasa a Play.
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  over?: Phaser.GameObjects.Container;
  private busy = false;
  private tut?: { done: () => void };
  private tutPending = false;
  private shownScore = -1;
  private shownCoins = -1;
  private shownCombo = -1;
  private score!: Phaser.GameObjects.Text;
  private coins!: Phaser.GameObjects.Text;
  private coinIc!: Phaser.GameObjects.Image;
  private pill!: Phaser.GameObjects.Graphics;
  private comboBox!: Phaser.GameObjects.Container;
  private comboTxt!: Phaser.GameObjects.Text;
  private lifeIc: Phaser.GameObjects.Image[] = [];
  private goldIc!: Phaser.GameObjects.Image;
  private barBg!: Phaser.GameObjects.Rectangle;
  private bar!: Phaser.GameObjects.Rectangle;
  private soundBtn!: ReturnType<typeof iconButton>;
  /** Botón ×2 del panel final (también lo pulsa la prueba automática). */
  dbl: ReturnType<typeof doubleButton> = null;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.over = undefined; this.busy = false; this.tut = undefined; this.dbl = null;
    this.shownScore = -1; this.shownCoins = -1; this.shownCombo = -1; this.lifeIc = [];
    this.tutPending = !save.get('tutorialDone') || save.get('runs') <= 2;

    this.score = bigNumber(this, 0, 0, 72, '0');
    // fondo oscuro detrás de monedas y vidas: se leen sobre cualquier pista (gradas, cielo, estrellas)
    this.pill = this.add.graphics();
    this.coinIc = this.add.image(0, 0, 'coin');
    this.coins = bigNumber(this, 0, 0, 40, '0').setOrigin(0, 0.5);
    for (let i = 0; i < 3; i++) this.lifeIc.push(this.add.image(0, 0, 'life'));
    const fire = this.add.image(-34, 0, 'fire-ic').setDisplaySize(44, 53);
    this.comboTxt = bigNumber(this, 6, 4, 46, '×2').setOrigin(0, 0.5).setColor('#ffd23f');
    this.comboBox = this.add.container(0, 0, [fire, this.comboTxt]).setVisible(false);
    this.goldIc = this.add.image(0, 0, 'gold-orb').setVisible(false);
    this.barBg = this.add.rectangle(0, 0, 160, 22, 0x2b2340, 0.55).setOrigin(0, 0.5).setStrokeStyle(4, PALETTE.ink).setVisible(false);
    this.bar = this.add.rectangle(0, 0, 150, 12, 0xffd23f).setOrigin(0, 0.5).setVisible(false);
    this.soundBtn = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      this.soundBtn.setIcon(m ? 'mute' : 'sound');
    });

    this.play.events.on('over', (r: OverInfo) => this.showOver(r));
    this.play.events.on('life', () => this.lifeBump());
    this.play.events.on('score', (e: { clean: boolean }) => {
      const s = this.ui();
      this.tweens.add({ targets: this.score, scale: { from: s * (e.clean ? 1.5 : 1.3), to: s }, duration: 280, ease: 'Back.out' });
      if (this.tut && this.play.baskets >= 1) this.endTutorial();
    });
    this.play.events.on('gold', () => {
      const s = this.ui();
      this.tweens.add({ targets: this.goldIc, displayWidth: { from: 90 * s, to: 52 * s }, displayHeight: { from: 90 * s, to: 52 * s }, duration: 260 });
    });

    // toque en cualquier sitio que no sea un botón = rebote
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, hit: unknown[]) => {
      if (hit.length || this.over) return;
      this.play.tap();
    });

    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['over', 'life', 'score', 'gold']) this.play.events.off(ev);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return uiScale(this); }

  private layout() {
    const w = this.scale.width, s = this.ui();
    this.score.setPosition(w / 2, 52 * s).setScale(s);
    this.pill.clear().fillStyle(0x2b2340, 0.55).fillRoundedRect(8 * s, 10 * s, 158 * s, 106 * s, 22 * s);
    this.coinIc.setPosition(36 * s, 40 * s).setDisplaySize(44 * s, 44 * s);
    this.coins.setPosition(64 * s, 42 * s).setScale(s);
    this.lifeIc.forEach((l, i) => l.setPosition(34 * s + i * 40 * s, 92 * s).setDisplaySize(34 * s, 34 * s));
    this.comboBox.setPosition(w / 2 - 6 * s, 118 * s).setScale(s);
    this.goldIc.setPosition(w / 2 - 92 * s, 170 * s).setDisplaySize(52 * s, 52 * s);
    this.barBg.setPosition(w / 2 - 54 * s, 170 * s).setSize(160 * s, 22 * s).setStrokeStyle(4 * s, PALETTE.ink);
    this.bar.setPosition(w / 2 - 49 * s, 170 * s);
    this.soundBtn.setPosition(w - 44 * s, 44 * s).setScale(s);
    this.lifeBump(false);
  }

  private lifeBump(anim = true) {
    const n = this.play.lives, s = this.ui();
    this.lifeIc.forEach((l, i) => {
      const on = i < n;
      const key = on ? 'life' : 'life-off';
      if (l.texture.key !== key) {
        l.setTexture(key).setDisplaySize(34 * s, 34 * s);
        if (anim) this.tweens.add({ targets: l, displayWidth: { from: 56 * s, to: 34 * s }, displayHeight: { from: 56 * s, to: 34 * s }, duration: 300, ease: 'Back.out' });
      }
    });
  }

  private endTutorial() {
    const t = this.tut;
    if (!t) return;
    this.tut = undefined;
    save.set('tutorialDone', true);
    t.done();
  }

  update() {
    const p = this.play;
    // el tutorial empieza en el primer fotograma de juego (no durante el anuncio) y dura 10 s como máximo
    if (this.tutPending && !p.paused) {
      this.tutPending = false;
      const h = this.scale.height;
      this.tut = tutorialHand(this, { gesture: 'tap', y: h * (h > this.scale.width ? 0.78 : 0.8), maxMs: 10000 });
      this.time.delayedCall(10050, () => { if (this.tut) { this.tut = undefined; save.set('tutorialDone', true); } });
    }
    if (p.score !== this.shownScore) { this.shownScore = p.score; this.score.setText(`${p.score}`); }
    if (p.coins !== this.shownCoins) {
      this.shownCoins = p.coins; this.coins.setText(`${p.coins}`);
      const s = this.ui();
      this.coinIc.setDisplaySize(54 * s, 54 * s);
      this.tweens.add({ targets: this.coinIc, displayWidth: 44 * s, displayHeight: 44 * s, duration: 140 });
    }
    const combo = p.alive ? p.combo : 1;
    if (combo !== this.shownCombo) {
      this.shownCombo = combo;
      this.comboBox.setVisible(combo >= 2);
      this.comboTxt.setText(`×${combo}`);
      if (combo >= 2) this.tweens.add({ targets: this.comboBox, angle: { from: -12, to: 0 }, duration: 260, ease: 'Back.out' });
    }
    const on = p.goldT > 0 && p.alive;
    this.goldIc.setVisible(on); this.barBg.setVisible(on); this.bar.setVisible(on);
    if (on) this.bar.setSize(150 * this.ui() * (p.goldT / 8), 12 * this.ui());
  }

  /* -------------------------------------------------------------- final de partida */

  private showOver(r: OverInfo) {
    if (this.tut) this.endTutorial();
    this.over = gameOverScreen(this, {
      score: r.score, best: r.best, newBest: r.newBest, canRevive: r.canRevive, icon: 'ball-over',
      onReplay: () => this.restart(),
      onHome: () => this.home(),
      onRevive: () => { this.over = undefined; this.play.revive(); },
    });
    this.dbl = null;
    const w = this.scale.width, h = this.scale.height, s = uiScale(this);
    if (r.coins > 0) {
      const list = this.over.list, ti = list.findIndex((o) => (o as Phaser.GameObjects.Image).texture?.key === 'ic-trophy');
      for (const o of list.slice(ti, ti + 2)) (o as Phaser.GameObjects.Image).x -= 70 * s;
      const ic = this.add.image(w / 2 + 122 * s, h / 2 + 30 * s, 'coin').setDisplaySize(44 * s, 44 * s);
      const n = bigNumber(this, ic.x + 28 * s, ic.y + 2 * s, 40 * s, `+${r.coins}`).setOrigin(0, 0.5);
      this.over.add([ic, n]);
      if (r.canDouble) {
        this.dbl = doubleButton(this, {
          x: w / 2, y: h / 2 - 200 * s, s, currencyIcon: 'coin', earned: r.coins,
          onDoubled: () => {
            const extra = this.play.doubleCoins();
            n.setText(`+${r.coins + extra}`);
            this.tweens.add({ targets: [ic, n], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
          },
        });
        if (this.dbl) this.over.add(this.dbl);
      }
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
