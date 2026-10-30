import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import { playerSkinKey } from '../cosmeticos';
import type { Play, OverInfo } from './Play';

/**
 * Capa de interfaz sobre la partida (sin zoom): porcentaje del patio, reloj de la ronda, gotas, ronda, marcador de
 * los 3 primeros, tutorial de 10 s y paneles de fin de ronda y de partida. También recoge el arrastre para girar
 * (joystick flotante: el punto donde se apoya el dedo es el centro y la dirección es hacia donde se arrastra).
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private layoutFns: (() => void)[] = [];
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialStart = -1;
  private steerTime = 0;
  /** Panel de fin de ronda o de partida abierto (lo esperan las pruebas automáticas). */
  over?: Phaser.GameObjects.Container;
  /** Botón ×2 del panel (también lo pulsa la prueba automática). */
  dbl: ReturnType<typeof doubleButton> = null;
  private kind: 'over' | 'round' = 'over';
  private drag: { id: number; ax: number; ay: number; x: number; y: number; moved: boolean } | null = null;
  private ring!: Phaser.GameObjects.Image;
  private knob!: Phaser.GameObjects.Image;
  private pctTxt!: Phaser.GameObjects.Text;
  private timeTxt!: Phaser.GameObjects.Text;
  private dropTxt!: Phaser.GameObjects.Text;
  private rankTxt!: Phaser.GameObjects.Text;
  private rows: { dot: Phaser.GameObjects.Image; n: Phaser.GameObjects.Text }[] = [];
  private boardT = 0;
  private busy = false;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.layoutFns = []; this.rows = []; this.over = undefined; this.tutorial = undefined; this.dbl = null;
    this.drag = null; this.steerTime = 0; this.tutorialStart = -1; this.boardT = 0; this.busy = false;
    this.registry.set('steered', 0);

    // porcentaje (arriba, centro) con medalla del puesto al lado
    this.pctTxt = bigNumber(this, 0, 0, 60, '0.0%');
    const medal = this.add.image(0, 0, 'ic-medal');
    this.rankTxt = bigNumber(this, 0, 0, 30, '1');
    const clock = this.add.image(0, 0, 'ic-clock');
    this.timeTxt = bigNumber(this, 0, 0, 32, '2:00').setOrigin(0, 0.5);
    // gotas y ronda (arriba, izquierda)
    const drop = this.add.image(0, 0, 'ic-drop');
    this.dropTxt = bigNumber(this, 0, 0, 38, `${this.play.runDrops}`).setOrigin(0, 0.5);
    const flag = this.add.image(0, 0, 'ic-flag');
    const roundTxt = bigNumber(this, 0, 0, 32, `${this.play.round}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle(); save.set('muted', m); sound.setIcon(m ? 'mute' : 'sound');
    });
    // marcador: 3 filas (pintor + %)
    const board = this.add.image(0, 0, 'board').setOrigin(0);
    for (let k = 0; k < 3; k++) this.rows.push({ dot: this.add.image(0, 0, 'pb-pink'), n: bigNumber(this, 0, 0, 24, '0').setOrigin(0, 0.5) });
    this.ring = this.add.image(0, 0, 'stick-ring').setDepth(5).setVisible(false);
    this.knob = this.add.image(0, 0, 'stick-knob').setDepth(5).setVisible(false);

    this.layoutFns.push(() => {
      const w = this.scale.width, s = this.ui();
      this.pctTxt.setPosition(w / 2, 44 * s).setScale(s);
      medal.setPosition(w / 2 - this.pctTxt.displayWidth / 2 - 34 * s, 40 * s).setDisplaySize(52 * s, 52 * s);
      this.rankTxt.setPosition(medal.x, medal.y + 9 * s).setScale(s);
      clock.setPosition(w / 2 - 40 * s, 92 * s).setDisplaySize(34 * s, 34 * s);
      this.timeTxt.setPosition(w / 2 - 18 * s, 93 * s).setScale(s);
      drop.setPosition(36 * s, 38 * s).setDisplaySize(46 * s, 46 * s);
      this.dropTxt.setPosition(64 * s, 40 * s).setScale(s);
      flag.setPosition(36 * s, 90 * s).setDisplaySize(40 * s, 40 * s);
      roundTxt.setPosition(62 * s, 92 * s).setScale(s);
      sound.setPosition(w - 44 * s, 44 * s).setScale(s);
      const bx = w - 112 * s, by = 84 * s;
      board.setPosition(bx, by).setScale(s);
      this.rows.forEach((r, k) => {
        r.dot.setPosition(bx + 22 * s, by + 20 * s + k * 36 * s).setDisplaySize(30 * s, 30 * s);
        r.n.setPosition(bx + 42 * s, by + 20 * s + k * 36 * s).setScale(s);
      });
    });

    this.play.events.on('over', (r: OverInfo) => this.showOver(r));
    this.play.events.on('capture', () => this.tweens.add({ targets: this.pctTxt, scale: this.ui() * 1.2, duration: 90, yoyo: true }));

    // arrastre = girar (en cualquier sitio que no sea un botón)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.over || this.drag) return;
      this.drag = { id: p.id, ax: p.x, ay: p.y, x: p.x, y: p.y, moved: false };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const d = this.drag;
      if (!d || d.id !== p.id) return;
      d.x = p.x; d.y = p.y;
      const dx = p.x - d.ax, dy = p.y - d.ay, len = Math.hypot(dx, dy), dead = 8 * this.ui(), max = 64 * this.ui();
      if (len > dead) { this.play.steerTo(Math.atan2(dy, dx)); d.moved = true; }
      // el centro sigue al dedo si se aleja mucho: siempre se puede corregir con un gesto corto
      if (len > max) { d.ax = p.x - (dx / len) * max; d.ay = p.y - (dy / len) * max; }
    });
    const up = (p: Phaser.Input.Pointer) => { if (this.drag?.id === p.id) { this.drag = null; this.ring.setVisible(false); this.knob.setVisible(false); } };
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['over', 'capture', 'kill']) this.play.events.off(ev);
    });

    if (!save.get('tutorialDone') || save.get('runs') <= 2) this.showTutorial();
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() { return Phaser.Math.Clamp(Math.min(this.scale.width / 1000, this.scale.height / 600), 0.62, 1.4); }
  private layout() { for (const f of this.layoutFns) f(); }

  /* -------------------------------------------------------------- tutorial (10 s, sin texto) */

  private showTutorial() {
    const c = this.add.container(0, 0).setDepth(20);
    // mano que arrastra en curva: "arrastra para girar"
    const path = this.add.graphics();
    path.lineStyle(10, 0xffffff, 0.7);
    path.beginPath(); path.arc(0, 40, 110, Math.PI * 1.15, Math.PI * 1.85); path.strokePath();
    const arrow = this.add.image(0, 0, 'ic-play').setDisplaySize(56, 56).setTint(PALETTE.yellow);
    const ring = this.add.circle(0, 0, 34, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.9);
    const hand = this.add.image(0, 0, 'ic-hand').setDisplaySize(100, 100).setOrigin(0.45, 0.05);
    c.add([path, ring, arrow, hand]);
    this.tutorial = c;
    this.tutorialStart = -1; // el reloj se fija en el primer update()
    const t = { a: Math.PI * 1.15 };
    this.tweens.add({
      targets: t, a: Math.PI * 1.85, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut', hold: 200,
      onUpdate: () => {
        const x = Math.cos(t.a) * 110, y = 40 + Math.sin(t.a) * 110;
        hand.setPosition(x, y); ring.setPosition(x, y);
        arrow.setPosition(Math.cos(t.a + 0.35) * 110, 40 + Math.sin(t.a + 0.35) * 110).setRotation(t.a + Math.PI / 2);
      },
    });
    this.layoutFns.push(() => c.setPosition(this.scale.width / 2, this.scale.height * 0.66).setScale(this.ui()));
  }

  update() {
    const dt = Math.min(0.1, this.game.loop.rawDelta / 1000);
    this.drawStick();
    if (this.play.sim) this.refresh(dt);
    if (!this.tutorial) return;
    if (this.tutorialStart < 0) this.tutorialStart = 0;
    this.tutorialStart += dt;
    if (this.drag?.moved || (this.registry.get('steered') || 0) > 0) { this.steerTime += dt; this.registry.set('steered', 0); }
    this.tutorial.setAlpha(this.drag ? 0.35 : 1);
    if (this.steerTime > 1.2 || this.tutorialStart > 10) {
      const t = this.tutorial;
      this.tutorial = undefined;
      save.set('tutorialDone', true);
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    }
  }

  private drawStick() {
    const d = this.drag;
    if (!d || !d.moved) return;
    const s = this.ui(), max = 64 * s;
    let dx = d.x - d.ax, dy = d.y - d.ay;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    this.ring.setVisible(true).setPosition(d.ax, d.ay).setScale(s);
    this.knob.setVisible(true).setPosition(d.ax + dx, d.ay + dy).setScale(s);
  }

  private refresh(dt: number) {
    const p = this.play, y = p.sim.yard;
    const pct = `${y.pct(0).toFixed(1)}%`;
    if (this.pctTxt.text !== pct) this.pctTxt.setText(pct);
    const secs = Math.ceil(Math.max(0, p.timeLeft));
    const t = `${Math.floor(secs / 60)}:${`${secs % 60}`.padStart(2, '0')}`;
    if (this.timeTxt.text !== t) {
      this.timeTxt.setText(t);
      if (secs <= 10 && secs > 0 && p.alive) { this.timeTxt.setColor('#ff8a8a'); audio.tone(880, 0.05, 'square', 0.05); }
      else if (secs > 10) this.timeTxt.setColor('#ffffff');
    }
    this.boardT -= dt;
    if (this.boardT > 0) return;
    this.boardT = 0.5;
    const live = `${p.runDrops + Math.max(0, Math.round(y.pct(0) * 0.6) - p.roundAwarded)}`;
    if (this.dropTxt.text !== live) this.dropTxt.setText(live);
    const r = `${p.sim.rank(0)}`;
    if (this.rankTxt.text !== r) this.rankTxt.setText(r);
    const order = p.sim.painters.map((q) => q.id).sort((a, b) => y.counts[b] - y.counts[a]).slice(0, 3);
    order.forEach((id, k) => {
      const row = this.rows[k];
      const key = id === 0 ? playerSkinKey() : `pb-${colorKey(p.colorOf(id))}`;
      if (row.dot.texture.key !== key) row.dot.setTexture(key).setDisplaySize(30 * this.ui(), 30 * this.ui());
      row.n.setText(y.pct(id).toFixed(1)).setColor(id === 0 ? '#ffd23f' : '#ffffff');
    });
  }

  /* -------------------------------------------------------------- fin de ronda / de partida */

  private showOver(r: OverInfo) {
    this.drag = null; this.ring.setVisible(false); this.knob.setVisible(false);
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    this.kind = r.kind;
    const w = this.scale.width, h = this.scale.height;
    const s = Math.min(this.ui() * 1.1, (w - 20) / 560);
    const c = this.add.container(0, 0).setDepth(30);
    this.over = c;
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.5).setInteractive();
    const cy = h / 2 - 20 * s;
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.25).fillRoundedRect(w / 2 - 260 * s, cy - 150 * s + 10 * s, 520 * s, 300 * s, 30 * s);
    panel.fillStyle(r.kind === 'round' ? 0xfff6e8 : 0xffffff, 0.97).fillRoundedRect(w / 2 - 260 * s, cy - 150 * s, 520 * s, 300 * s, 30 * s);
    panel.lineStyle(8 * s, PALETTE.ink).strokeRoundedRect(w / 2 - 260 * s, cy - 150 * s, 520 * s, 300 * s, 30 * s);
    c.add([shade, panel]);

    // izquierda: medalla con el puesto (ronda) o el pintor triste (eliminado)
    if (r.kind === 'round') {
      const m = this.add.image(w / 2 - 160 * s, cy - 50 * s, 'ic-medal').setDisplaySize(130 * s, 130 * s);
      const n = bigNumber(this, m.x, m.y + 18 * s, 54 * s, `${r.rank}`);
      c.add([m, n]);
      this.tweens.add({ targets: [m, n], angle: { from: -6, to: 6 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    } else {
      const b = this.add.image(w / 2 - 160 * s, cy - 54 * s, playerSkinKey()).setScale(1.15 * s);
      const f = this.add.image(b.x, b.y + 6 * s, 'face-sad').setScale(1.15 * s);
      const sp = this.add.image(b.x, b.y + 40 * s, 'splat').setTint(0x9aa3b4).setScale(0.9 * s).setAlpha(0.7);
      c.add([sp, b, f]);
    }
    // porcentaje grande, récord y gotas
    const pct = bigNumber(this, w / 2 + 60 * s, cy - 60 * s, 84 * s, `${r.pct.toFixed(1)}%`);
    const trophy = this.add.image(w / 2 - 170 * s, cy + 60 * s, 'ic-trophy').setDisplaySize(52 * s, 52 * s);
    const best = bigNumber(this, trophy.x + 32 * s, cy + 62 * s, 42 * s, `${r.best.toFixed(1)}`).setOrigin(0, 0.5);
    const dropIc = this.add.image(w / 2 + 70 * s, cy + 60 * s, 'ic-drop').setDisplaySize(54 * s, 54 * s);
    const drops = bigNumber(this, dropIc.x + 34 * s, cy + 62 * s, 44 * s, `+${r.drops}`).setOrigin(0, 0.5);
    c.add([pct, trophy, best, dropIc, drops]);
    if (r.kind === 'round') {
      const flag = this.add.image(w / 2 + 170 * s, cy - 118 * s, 'ic-flag').setDisplaySize(40 * s, 40 * s);
      const rn = bigNumber(this, flag.x + 30 * s, cy - 116 * s, 30 * s, `${r.round}`).setOrigin(0, 0.5);
      c.add([flag, rn]);
    }
    if (r.newBest || r.kind === 'round') {
      const burst = this.add.particles(r.newBest ? trophy.x : dropIc.x, cy + 60 * s, r.newBest ? 'ic-star' : 'ic-drop', {
        speed: { min: 200, max: 520 }, lifespan: 1000, scale: { start: 0.32 * s, end: 0 }, gravityY: 500, emitting: false,
      });
      burst.explode(24);
      c.add(burst);
      if (r.newBest) this.tweens.add({ targets: [trophy, best], scale: '*=1.2', duration: 300, yoyo: true, repeat: 2 });
    }

    // botones: grande en el centro (siguiente ronda o reiniciar), menú a la izquierda, revivir a la derecha
    const by = cy + 190 * s;
    const main = r.kind === 'round'
      ? iconButton(this, w / 2, by, 'play', PALETTE.green, 62 * s, () => this.next())
      : iconButton(this, w / 2, by, 'replay', PALETTE.green, 62 * s, () => this.restart());
    pulse(this, main, 0.05);
    const home = iconButton(this, w / 2 - 150 * s, by + 10 * s, 'home', PALETTE.purple, 38 * s, () => this.home());
    c.add([main, home]);
    if (r.canRevive) {
      const rev = iconButton(this, w / 2 + 150 * s, by + 10 * s, 'video', PALETTE.yellow, 44 * s, () => this.revive());
      const mini = this.add.image(rev.x + 34 * s, rev.y - 34 * s, playerSkinKey()).setDisplaySize(36 * s, 36 * s);
      c.add([rev, mini]);
    }
    if (r.canDouble) {
      const dbl = doubleButton(this, {
        x: w / 2, y: cy - 150 * s, s, currencyIcon: 'ic-drop', earned: r.drops,
        onDoubled: () => {
          const extra = this.play.doubleDrops();
          drops.setText(`+${r.drops + extra}`);
          this.tweens.add({ targets: [dropIc, drops], scale: '*=1.3', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (dbl) c.add(dbl);
      this.dbl = dbl;
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.input.keyboard?.once('keydown-SPACE', () => (this.kind === 'round' ? this.next() : this.restart()));
  }

  /** Reiniciar en un clic (partida nueva desde la ronda 1; el anuncio se pide al empezar). */
  restart() {
    if (this.busy) return;
    this.busy = true;
    this.play.restartRun();
  }

  /** Siguiente ronda. */
  next() {
    if (this.busy) return;
    this.busy = true;
    this.play.nextRound();
  }

  async revive() {
    if (this.busy || this.kind !== 'over') return;
    this.busy = true;
    const ok = await portal.rewardedBreak();
    this.busy = false;
    if (!ok || !this.over) return;
    this.over.destroy();
    this.over = undefined;
    this.dbl = null;
    this.input.keyboard?.removeAllListeners('keydown-SPACE');
    this.play.revive();
  }

  home() {
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}

function colorKey(c: number) {
  const m: Record<number, string> = { 0xff5fa8: 'pink', 0x4aa8ff: 'blue', 0x3ddc84: 'green', 0xffc928: 'yellow', 0x9b6bff: 'purple', 0xff8a3d: 'orange', 0xff4f5e: 'red', 0x22cfc0: 'teal' };
  return m[c] ?? 'pink';
}
