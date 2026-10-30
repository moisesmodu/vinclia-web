import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { gameOverScreen, uiScale } from '@comun/pantallas';
import { doubleButton } from '@comun/doble';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { flightCoins } from '../vuelo';
import { openUpgrades, upgradeButton } from '../mejoras';
import type { Play } from './Play';

type OverInfo = { score: number; best: number; newBest: boolean; canRevive: boolean; coins: number; canDouble: boolean };
const INK = PALETTE.ink;

/**
 * Capa de interfaz: distancia, monedas del vuelo, sonido, medidor de lanzamiento, tutorial sin texto (empieza a
 * contar en el primer fotograma de juego, 10 s como máximo) y pantalla de aterrizaje con ×2 y mejoras.
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  over?: Phaser.GameObjects.Container;
  private busy = false;
  private shownScore = -1;
  private shownCoins = -1;
  private score!: Phaser.GameObjects.Text;
  private unit!: Phaser.GameObjects.Text;
  private coins!: Phaser.GameObjects.Text;
  private coinIc!: Phaser.GameObjects.Image;
  private soundBtn!: ReturnType<typeof iconButton>;
  private gauge!: Phaser.GameObjects.Container;
  private needle!: Phaser.GameObjects.Image;
  private tut?: Phaser.GameObjects.Container;
  private tutKind: '' | 'tap' | 'hold' = '';
  private tutStart = -1;
  private tutDone = false;
  private tapShown = false;
  private holdShown = false;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.over = undefined; this.busy = false; this.dbl = null; this.upBtn = null;
    this.shownScore = -1; this.shownCoins = -1;
    this.tut = undefined; this.tutKind = ''; this.tutStart = -1; this.tapShown = false; this.holdShown = false;
    this.tutDone = save.get('tutorialDone') && save.get('runs') > 2;

    this.score = bigNumber(this, 0, 0, 60, '0');
    this.unit = bigNumber(this, 0, 0, 30, 'm').setOrigin(0, 0.5);
    this.coinIc = this.add.image(0, 0, 'coin');
    this.coins = bigNumber(this, 0, 0, 40, '0').setOrigin(0, 0.5);
    this.soundBtn = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle();
      save.set('muted', m);
      this.soundBtn.setIcon(m ? 'mute' : 'sound');
    });
    this.makeGauge();

    this.play.events.on('over', (r: OverInfo) => this.showOver(r));
    this.play.events.on('perfect', () => {
      const s = this.ui();
      const t = bigNumber(this, this.gauge.x, this.gauge.y - 90 * s, 54 * s, '×1.14').setColor('#ffd23f');
      this.tweens.add({ targets: t, y: t.y - 60 * s, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    });
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['over', 'perfect']) this.play.events.off(ev);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1100, this.scale.height / 640), 0.6, 1.4); }

  private layout() {
    const w = this.scale.width, s = this.ui();
    this.score.setPosition(w / 2 - 14 * s, 46 * s).setScale(s);
    this.unit.setPosition(this.score.x + this.score.displayWidth / 2 + 4 * s, 54 * s).setScale(s);
    this.coinIc.setPosition(36 * s, 40 * s).setDisplaySize(44 * s, 44 * s);
    this.coins.setPosition(64 * s, 42 * s).setScale(s);
    this.soundBtn.setPosition(w - 44 * s, 44 * s).setScale(s);
  }

  /** Medidor de lanzamiento: arco rojo → amarillo → verde (arriba = perfecto) y aguja. */
  private makeGauge() {
    if (!this.textures.exists('gauge')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const cx = 110, cy = 110, R = 92;
      const seg = (a0: number, a1: number, col: number) => { g.lineStyle(30, col); g.beginPath(); g.arc(cx, cy, R, a0, a1, false); g.strokePath(); };
      g.lineStyle(44, INK); g.beginPath(); g.arc(cx, cy, R, Math.PI, Math.PI * 2, false); g.strokePath();
      seg(Math.PI, Math.PI * 1.45, 0xff5d5d); seg(Math.PI * 1.45, Math.PI * 1.8, 0xffd23f); seg(Math.PI * 1.8, Math.PI * 2, 0x3ddc84);
      g.fillStyle(INK); g.fillCircle(cx, cy, 16);
      g.generateTexture('gauge', 220, 130);
      g.clear();
      g.fillStyle(0xffffff); g.lineStyle(5, INK);
      g.fillTriangle(10, 6, 10, 22, 96, 14); g.strokeTriangle(10, 6, 10, 22, 96, 14);
      g.generateTexture('needle', 100, 28);
      g.destroy();
    }
    this.gauge = this.add.container(0, 0).setDepth(5);
    const face = this.add.image(0, 0, 'gauge').setOrigin(0.5, 110 / 130);
    this.needle = this.add.image(0, 0, 'needle').setOrigin(0.1, 0.5);
    const cap = this.add.circle(0, 0, 12, 0xffffff).setStrokeStyle(4, INK);
    this.gauge.add([face, this.needle, cap]);
    this.gauge.setVisible(false);
  }

  private makeTutorial(kind: 'tap' | 'hold') {
    this.tut?.destroy();
    const c = this.add.container(0, 0).setDepth(20).setAlpha(0);
    const ring = this.add.circle(0, 0, 50, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.9);
    const hand = this.add.image(10, -6, 'ic-hand').setDisplaySize(118, 118).setOrigin(0.45, 0.05);
    c.add([ring, hand]);
    if (kind === 'tap') {
      this.tweens.add({ targets: hand, y: 6, duration: 220, yoyo: true, repeat: -1, ease: 'Sine.inOut', repeatDelay: 300 });
      this.tweens.add({ targets: ring, scale: 1.35, alpha: 0.2, duration: 520, repeat: -1 });
    } else {
      // mantener = el avión sube; soltar = baja (flecha que cambia con la mano)
      const plane = this.add.image(150, 0, 'plane-happy').setDisplaySize(130, 73);
      const arrow = this.add.image(150, -78, 'ic-play').setDisplaySize(54, 54).setTint(0x3ddc84).setAngle(-90);
      c.add([plane, arrow]);
      let down = false;
      const tick = () => {
        if (!c.active) return;
        down = !down;
        this.tweens.add({ targets: hand, y: down ? 8 : -26, duration: 200 });
        ring.setVisible(down);
        arrow.setAngle(down ? -90 : 90).setTint(down ? 0x3ddc84 : 0xff9f43).setY(down ? -78 : 78);
        this.tweens.add({ targets: plane, angle: down ? -25 : 25, duration: 380, ease: 'Sine.out' });
        this.time.delayedCall(1100, tick);
      };
      tick();
    }
    this.tut = c;
    this.tutKind = kind;
    this.tutStart = -1;
    this.tweens.add({ targets: c, alpha: 1, duration: 250 });
  }

  private endTutorial(final: boolean) {
    const c = this.tut;
    this.tut = undefined;
    this.tutKind = '';
    if (final) { this.tutDone = true; save.set('tutorialDone', true); }
    if (c) this.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => { this.tweens.killTweensOf(c.list); c.destroy(); } });
  }

  update(time: number) {
    const p = this.play, w = this.scale.width, h = this.scale.height, s = this.ui();
    const portrait = h > w;
    // medidor de lanzamiento junto a la colina
    const showGauge = p.phase === 'launch' && !p.paused && p.alive;
    this.gauge.setVisible(showGauge);
    if (showGauge) {
      const gx = Phaser.Math.Clamp(p.plane.x + (portrait ? 40 : 150) * s, 120 * s, w - 120 * s);
      const gy = Phaser.Math.Clamp(p.plane.y - 120 * s, 150 * s, h - 60 * s);
      this.gauge.setPosition(gx, gy).setScale(s);
      this.needle.setRotation(Math.PI + p.launchP * Math.PI);
    }
    // tutorial: tocar en el lanzamiento, mantener/soltar en el vuelo (cuenta desde el primer fotograma de juego)
    if (!this.tutDone && !p.paused && p.alive) {
      if (p.phase === 'launch' && !this.tapShown) { this.tapShown = true; this.makeTutorial('tap'); }
      if (p.phase === 'fly' && this.tutKind === 'tap') this.endTutorial(false);
      if (p.phase === 'fly' && !this.holdShown) { this.holdShown = true; this.makeTutorial('hold'); }
      if (this.tut && this.tutStart < 0) this.tutStart = time;
      if (this.tut) {
        const tap = this.tutKind === 'tap';
        this.tut.setPosition(tap ? this.gauge.x : w * (portrait ? 0.36 : 0.5), tap ? this.gauge.y + 70 * s : h * (portrait ? 0.62 : 0.6)).setScale(Math.max(0.6, s * 0.9));
        if (!tap && (time - this.tutStart > 10000 || (p.heldMs > 600 && p.releases >= 2))) this.endTutorial(true);
      }
    }
    // contadores
    const dist = p.flight.dist;
    if (dist !== this.shownScore) {
      this.shownScore = dist;
      this.score.setText(`${dist}`);
      this.unit.setX(this.score.x + this.score.displayWidth / 2 + 4 * s);
    }
    const c = Math.max(0, flightCoins(dist, p.flight.coins));
    if (c !== this.shownCoins) {
      this.shownCoins = c; this.coins.setText(`${c}`);
      this.coinIc.setDisplaySize(52 * s, 52 * s);
      this.tweens.add({ targets: this.coinIc, displayWidth: 44 * s, displayHeight: 44 * s, duration: 120 });
    }
  }

  /* -------------------------------------------------------------- aterrizaje */

  /** Botón ×2 del panel final (también lo pulsa la prueba automática). */
  dbl: ReturnType<typeof doubleButton> = null;
  /** Botón de mejoras del panel final. */
  upBtn: ReturnType<typeof upgradeButton> | null = null;

  private showOver(r: OverInfo) {
    if (this.tut) this.endTutorial(false);
    this.over = gameOverScreen(this, {
      score: r.score, best: r.best, newBest: r.newBest, canRevive: r.canRevive, icon: 'plane-scared', unit: 'm',
      onReplay: () => this.restart(),
      onHome: () => this.home(),
      onRevive: () => { this.over = undefined; this.play.revive(); },
    });
    const w = this.scale.width, h = this.scale.height, s = uiScale(this);
    this.dbl = null;
    // monedas del vuelo (el récord del panel común se corre a la izquierda para dejar sitio)
    const list = this.over.list, ti = list.findIndex((o) => (o as Phaser.GameObjects.Image).texture?.key === 'ic-trophy');
    for (const o of list.slice(ti, ti + 2)) (o as Phaser.GameObjects.Image).x -= 70 * s;
    const ic = this.add.image(w / 2 + 122 * s, h / 2 + 30 * s, 'coin').setDisplaySize(44 * s, 44 * s);
    const n = bigNumber(this, ic.x + 28 * s, ic.y + 2 * s, 40 * s, `+${r.coins}`).setOrigin(0, 0.5);
    this.over.add([ic, n]);
    if (r.canDouble && r.coins > 0) {
      this.dbl = doubleButton(this, {
        x: w / 2, y: h / 2 - 200 * s, s, currencyIcon: 'coin', earned: r.coins,
        onDoubled: () => {
          const extra = this.play.doubleCoins();
          n.setText(`+${r.coins + extra}`);
          this.upBtn?.refresh();
          this.tweens.add({ targets: [ic, n], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (this.dbl) this.over.add(this.dbl);
    }
    // mejoras: a la derecha del panel (en vertical, encima del panel a la derecha)
    const portrait = h > w;
    const ux = portrait ? w / 2 : w / 2 + 330 * s, uy = portrait ? h / 2 + 345 * s : h / 2 - 20 * s;
    this.upBtn = upgradeButton(this, 46 * s, () => {
      if (modalOpen(this)) return;
      openUpgrades(this, { depth: 80, onWallet: () => this.upBtn?.refresh() });
    });
    this.upBtn.setPosition(Math.min(ux, w - 52 * s), uy);
    if (this.upBtn.list[0]) this.tweens.add({ targets: this.upBtn, angle: { from: -6, to: 6 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.over.add(this.upBtn);
  }

  /** Reiniciar en un clic (el intersticial se pide al empezar el vuelo, nunca en el primero). */
  restart() {
    if (this.busy || modalOpen(this)) return;
    this.busy = true;
    this.play.scene.restart();
  }

  /** Revivir con anuncio con recompensa (una vez por partida): relanza desde donde aterrizó. */
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
