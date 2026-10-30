import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { gameOverScreen, uiScale } from '@comun/pantallas';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import type { Play } from './Play';

type OverInfo = { score: number; best: number; newBest: boolean; canRevive: boolean; coins: number; canDouble: boolean };
type Dir = 'left' | 'right' | 'up' | 'down';

/**
 * Capa de interfaz sobre la partida: distancia, monedas, barra del poder activo, sonido, tutorial de deslizar
 * (10 s como máximo) y pantalla final. También convierte los deslizamientos del dedo o del ratón en gestos.
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  over?: Phaser.GameObjects.Container;
  private busy = false;
  private swipe: { id: number; x: number; y: number; fired: boolean } | null = null;
  private tut?: Phaser.GameObjects.Container;
  private tutStart = -1;
  private tutSeen = new Set<Dir>();
  private shownScore = -1;
  private shownCoins = -1;
  private score!: Phaser.GameObjects.Text;
  private coins!: Phaser.GameObjects.Text;
  private coinIc!: Phaser.GameObjects.Image;
  private powerIc!: Phaser.GameObjects.Image;
  private barBg!: Phaser.GameObjects.Rectangle;
  private bar!: Phaser.GameObjects.Rectangle;
  private soundBtn!: ReturnType<typeof iconButton>;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.over = undefined; this.busy = false; this.swipe = null;
    this.tut = undefined; this.tutStart = -1; this.tutSeen = new Set();
    this.shownScore = -1; this.shownCoins = -1;

    this.score = bigNumber(this, 0, 0, 60, '0');
    this.coinIc = this.add.image(0, 0, 'coin');
    this.coins = bigNumber(this, 0, 0, 40, '0').setOrigin(0, 0.5);
    this.powerIc = this.add.image(0, 0, 'tag-turbo').setVisible(false);
    this.barBg = this.add.rectangle(0, 0, 160, 22, 0x2b2340, 0.55).setOrigin(0, 0.5).setStrokeStyle(4, PALETTE.ink).setVisible(false);
    this.bar = this.add.rectangle(0, 0, 150, 12, 0xffd23f).setOrigin(0, 0.5).setVisible(false);
    this.soundBtn = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      this.soundBtn.setIcon(m ? 'mute' : 'sound');
    });

    this.play.events.on('over', (r: OverInfo) => this.showOver(r));
    this.play.events.on('gesture', (d: Dir) => this.tutSeen.add(d));
    this.play.events.on('power', () => {
      const s = this.ui();
      this.tweens.add({ targets: this.powerIc, displayWidth: { from: 100 * s, to: 62 * s }, displayHeight: { from: 74 * s, to: 46 * s }, duration: 260 });
    });

    // deslizar: un gesto por toque, en cuanto el dedo recorre el umbral
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, hit: unknown[]) => {
      if (hit.length || this.over) return;
      this.swipe = { id: p.id, x: p.x, y: p.y, fired: false };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const s = this.swipe;
      if (!s || s.fired || s.id !== p.id || !p.isDown) return;
      const dx = p.x - s.x, dy = p.y - s.y;
      const th = Math.max(22, Math.min(this.scale.width, this.scale.height) * 0.045);
      if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
      s.fired = true;
      this.play.act(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
    });
    const end = (p: Phaser.Input.Pointer) => { if (this.swipe?.id === p.id) this.swipe = null; };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);

    if (!save.get('tutorialDone') || save.get('runs') <= 2) this.makeTutorial();
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['over', 'gesture', 'power']) this.play.events.off(ev);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1100, this.scale.height / 640), 0.6, 1.4); }

  private layout() {
    const w = this.scale.width, h = this.scale.height, s = this.ui();
    this.score.setPosition(w / 2, 46 * s).setScale(s);
    this.coinIc.setPosition(36 * s, 40 * s).setDisplaySize(44 * s, 44 * s);
    this.coins.setPosition(64 * s, 42 * s).setScale(s);
    this.powerIc.setPosition(w / 2 - 92 * s, 100 * s).setDisplaySize(62 * s, 46 * s);
    this.barBg.setPosition(w / 2 - 54 * s, 100 * s).setSize(160 * s, 22 * s).setStrokeStyle(4 * s, PALETTE.ink);
    this.bar.setPosition(w / 2 - 49 * s, 100 * s);
    this.soundBtn.setPosition(w - 44 * s, 44 * s).setScale(s);
    this.tut?.setPosition(w / 2, h * (h > w ? 0.42 : 0.45)).setScale(Math.max(0.6, s * 0.85));
  }

  /** Mano que desliza a izquierda, derecha, arriba y abajo, con flecha. */
  private makeTutorial() {
    const c = this.add.container(0, 0).setDepth(20);
    const back = this.add.circle(0, 0, 135, 0x2b2340, 0.25);
    const arrow = this.add.image(0, 0, 'ic-play').setDisplaySize(90, 90).setTint(0xffd23f);
    const hand = this.add.image(0, 0, 'ic-hand').setDisplaySize(124, 124).setOrigin(0.5, 0.1);
    c.add([back, arrow, hand]);
    const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let i = 0;
    const next = () => {
      if (!c.active) return;
      const [dx, dy] = dirs[i++ % 4];
      arrow.setPosition(dx * 95, dy * 90).setRotation(Math.atan2(dy, dx));
      hand.setPosition(-dx * 55, -dy * 70).setAlpha(1);
      this.tweens.add({
        targets: hand, x: dx * 60, y: dy * 40 - 10, duration: 520, ease: 'Sine.inOut', delay: 120,
        onComplete: () => this.tweens.add({ targets: hand, alpha: 0, duration: 160, onComplete: next }),
      });
    };
    next();
    c.setAlpha(0);
    this.tut = c;
  }

  private endTutorial() {
    const c = this.tut;
    if (!c) return;
    this.tut = undefined;
    save.set('tutorialDone', true);
    this.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => { this.tweens.killTweensOf(c.list); c.destroy(); } });
  }

  update(time: number) {
    const p = this.play;
    if (this.tut) {
      // el tutorial empieza a contar en el primer fotograma de juego (no durante el anuncio)
      if (this.tutStart < 0 && !p.paused) { this.tutStart = time; this.tweens.add({ targets: this.tut, alpha: 1, duration: 250 }); }
      if (this.tutStart >= 0 && (time - this.tutStart > 10000 || this.tutSeen.size >= 3)) this.endTutorial();
    }
    const sc = Math.floor(p.dist);
    if (sc !== this.shownScore) { this.shownScore = sc; this.score.setText(`${sc}`); }
    if (p.coins !== this.shownCoins) {
      this.shownCoins = p.coins; this.coins.setText(`${p.coins}`);
      const s = this.ui();
      this.coinIc.setDisplaySize(52 * s, 52 * s);
      this.tweens.add({ targets: this.coinIc, displayWidth: 44 * s, displayHeight: 44 * s, duration: 120 });
    }
    const t = p.turboT > 0 ? p.turboT / 3.2 : p.magnetT > 0 ? p.magnetT / 7 : 0;
    const on = t > 0 && p.alive;
    this.powerIc.setVisible(on); this.barBg.setVisible(on); this.bar.setVisible(on);
    if (on) {
      const s = this.ui();
      this.powerIc.setTexture(p.turboT > 0 ? 'tag-turbo' : 'tag-magnet');
      this.bar.setSize(150 * s * t, 12 * s).setFillStyle(p.turboT > 0 ? 0xff5d5d : 0x3ddc84);
    }
  }

  /* -------------------------------------------------------------- final de partida */

  private showOver(r: OverInfo) {
    this.swipe = null;
    if (this.tut) this.endTutorial();
    this.over = gameOverScreen(this, {
      score: r.score, best: r.best, newBest: r.newBest, canRevive: r.canRevive, icon: 'cart-scared',
      onReplay: () => this.restart(),
      onHome: () => this.home(),
      onRevive: () => { this.over = undefined; this.play.revive(); },
    });
    // monedas de la partida y ×2 con anuncio (una vez por partida), sobre el borde de arriba del panel común
    this.dbl = null;
    const w = this.scale.width, h = this.scale.height, s = uiScale(this);
    if (r.coins > 0) {
      // el récord del panel común se corre a la izquierda para dejar sitio a lo ganado
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

  /** Botón ×2 del panel final (también lo pulsa la prueba automática). */
  dbl: ReturnType<typeof doubleButton> = null;

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
