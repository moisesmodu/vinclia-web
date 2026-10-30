import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { doubleButton } from '@comun/doble';
import { save } from '../state';
import { bake, drawEye } from '../art';
import { KICKS, type Pt } from '../logic';
import type { Play } from './Play';

const INK = PALETTE.ink;
type Turn = { me: boolean; idx: number; sp: string; num: number; c1: number; pow: number; acc: number; ref: number };
type Over = { won: boolean; gf: number; ga: number; sd: boolean; coins: number; seasonOver: boolean; canDouble: boolean; opp: number };

/**
 * Interface over the match (no zoom): scoreboard with kick dots, the current shooter's card (his eyes give the tell),
 * swipe trail, the retake offer (rewarded ad), tutorial hands and the end-of-match panel. It also collects the input.
 */
export class Hud extends Phaser.Scene {
  private play!: Play;
  private layoutFns: (() => void)[] = [];
  private pts: Pt[] = [];
  private recording = false;
  private trailG!: Phaser.GameObjects.Graphics;
  private board!: Phaser.GameObjects.Container;
  private dotsMe: Phaser.GameObjects.Image[] = [];
  private dotsThem: Phaser.GameObjects.Image[] = [];
  private scoreMe!: Phaser.GameObjects.Text;
  private scoreThem!: Phaser.GameObjects.Text;
  private card!: Phaser.GameObjects.Container;
  private cardRing!: Phaser.GameObjects.Image;
  private cardHead!: Phaser.GameObjects.Image;
  private eyes: Phaser.GameObjects.Image[] = [];
  private cardNum!: Phaser.GameObjects.Text;
  private cardRole!: Phaser.GameObjects.Image;
  private cardStats!: Phaser.GameObjects.Container;
  private retakeBox?: Phaser.GameObjects.Container;
  private retakeRing?: Phaser.GameObjects.Graphics;
  private tutorial?: Phaser.GameObjects.Container;
  private tutorialKind: 'shoot' | 'save' | null = null;
  private tutorialStart = -1;
  over?: Phaser.GameObjects.Container;
  dbl: ReturnType<typeof doubleButton> = null;
  private overInfo?: Over;
  private busy = false;

  constructor() { super('Hud'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.layoutFns = []; this.pts = []; this.recording = false; this.over = undefined; this.dbl = null; this.overInfo = undefined;
    this.retakeBox = undefined; this.retakeRing = undefined; this.tutorial = undefined; this.tutorialKind = null; this.tutorialStart = -1; this.busy = false;
    this.dotsMe = []; this.dotsThem = []; this.eyes = [];
    bake(this, 'eye', 24, 30, (g) => drawEye(g, 12, 15, 40));
    // circles baked once and tinted (stroked shapes are re-tessellated every frame)
    bake(this, 'disc', 132, 132, (g) => { g.fillStyle(0xffffff).fillCircle(66, 66, 60); g.lineStyle(7, INK).strokeCircle(66, 66, 60); });
    bake(this, 'ring-w', 100, 100, (g) => { g.fillStyle(0xffffff, 0.25).fillCircle(50, 50, 44); g.lineStyle(6, 0xffffff, 0.9).strokeCircle(50, 50, 44); });

    this.trailG = this.add.graphics().setDepth(5);
    this.makeBoard();
    this.makeCard();
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle(); save.set('muted', m); sound.setIcon(m ? 'mute' : 'sound');
    });
    this.layoutFns.push(() => { const s = this.ui(); sound.setPosition(this.scale.width - 44 * s, 44 * s).setScale(s); });

    const P = this.play.events;
    P.on('turn', this.onTurn, this);
    P.on('score', this.onScore, this);
    P.on('kick', this.onKick, this);
    P.on('tell', this.onTell, this);
    P.on('retake', this.onRetake, this);
    P.on('over', this.showOver, this);
    P.on('phase', this.onPhase, this);
    P.on('dove', this.tutorialDone, this);

    // input: swipe to shoot, tap to dive (anywhere that is not a button)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.over) return;
      if (this.play.meShooting) { this.recording = true; this.pts = [{ x: p.x, y: p.y, t: performance.now() / 1000 }]; }
      else if (this.play.onTap(p.x, p.y)) this.flash(p.x, p.y);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.recording || !p.isDown) return;
      const last = this.pts[this.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 6) return;
      this.pts.push({ x: p.x, y: p.y, t: performance.now() / 1000 });
      if (this.pts.length > 60) this.pts.shift();
      this.drawTrail();
    });
    const up = (p: Phaser.Input.Pointer) => {
      if (!this.recording) return;
      this.recording = false;
      this.pts.push({ x: p.x, y: p.y, t: performance.now() / 1000 });
      this.finishSwipe();
    };
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    // keyboard dives (desktop): left / right / up
    const kd = (gx: number, gy: number) => () => { if (!this.over) this.play.autoDive(gx, gy); };
    this.input.keyboard?.on('keydown-LEFT', kd(-0.7, 0.3));
    this.input.keyboard?.on('keydown-RIGHT', kd(0.7, 0.3));
    this.input.keyboard?.on('keydown-UP', kd(0, 0.5));
    this.input.keyboard?.on('keydown-A', kd(-0.7, 0.3));
    this.input.keyboard?.on('keydown-D', kd(0.7, 0.3));

    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      for (const ev of ['turn', 'score', 'kick', 'tell', 'retake', 'over', 'phase', 'dove']) P.off(ev, undefined, this);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
  }

  private ui() {
    const w = this.scale.width, h = this.scale.height;
    return Phaser.Math.Clamp(Math.min(w / (h > w ? 680 : 1100), h / 640), 0.5, 1.4);
  }
  private layout() { for (const f of this.layoutFns) f(); }

  /* ---------------------------------------------------------------- scoreboard */
  private makeBoard() {
    const c = this.add.container(0, 0).setDepth(10);
    // static panel baked once (a live Graphics is re-tessellated every frame)
    bake(this, 'board-bg', 412, 152, (g) => {
      g.fillStyle(0x000000, 0.25).fillRoundedRect(6, 14, 400, 132, 24);
      g.fillStyle(0xfff6e8, 0.95).fillRoundedRect(6, 6, 400, 132, 24);
      g.lineStyle(6, INK).strokeRoundedRect(6, 6, 400, 132, 24);
    });
    c.add(this.add.image(-206, -76, 'board-bg').setOrigin(0));
    for (const [row, me] of [[-34, true], [26, false]] as const) {
      c.add(this.add.image(-160, row, me ? 'bd-0' : `bd-${this.play.opp}`).setDisplaySize(48, 55));
      const dots = me ? this.dotsMe : this.dotsThem;
      for (let i = 0; i < KICKS; i++) { const d = this.add.image(-108 + i * 44, row, 'dot-e').setDisplaySize(38, 38); dots.push(d); c.add(d); }
    }
    this.scoreMe = bigNumber(this, 160, -34, 46, '0');
    this.scoreThem = bigNumber(this, 160, 26, 46, '0');
    c.add([this.scoreMe, this.scoreThem]);
    this.board = c;
    this.layoutFns.push(() => {
      const w = this.scale.width, h = this.scale.height, s = this.ui();
      if (h > w) c.setPosition(w / 2 - 20 * s, 84 * s).setScale(s);
      else c.setPosition(12 * s + 200 * s * 0.82, 72 * s * 0.82 + 6).setScale(s * 0.82);
    });
  }
  private onScore(mine: boolean[], theirs: boolean[]) {
    const n = Math.max(mine.length, theirs.length);
    const start = n > KICKS ? KICKS * Math.floor((n - 1) / KICKS) : 0;
    for (let i = 0; i < KICKS; i++) {
      const a = mine[start + i], b = theirs[start + i];
      this.dotsMe[i].setTexture(a === undefined ? 'dot-e' : a ? 'dot-g' : 'dot-r');
      this.dotsThem[i].setTexture(b === undefined ? 'dot-e' : b ? 'dot-g' : 'dot-r');
    }
    this.scoreMe.setText(`${mine.filter(Boolean).length}`);
    this.scoreThem.setText(`${theirs.filter(Boolean).length}`);
  }

  /* ---------------------------------------------------------------- shooter card */
  private makeCard() {
    const c = this.add.container(0, 0).setDepth(10);
    this.cardRing = this.add.image(0, 0, 'disc').setDisplaySize(132, 132).setTint(0xff8a3d);
    this.cardHead = this.add.image(0, -6, 'he-fox').setDisplaySize(128, 128);
    for (const s of [-1, 1]) this.eyes.push(this.add.image(s * 14.4, -7.6, 'eye'));
    this.cardNum = bigNumber(this, 0, 62, 34, '9');
    const roleBg = this.add.image(52, -50, 'disc').setDisplaySize(52, 52).setTint(PALETTE.yellow);
    this.cardRole = this.add.image(52, -50, 'ic-ballw').setDisplaySize(34, 34);
    this.cardStats = this.add.container(0, 0);
    c.add([this.cardRing, this.cardHead, ...this.eyes, this.cardNum, roleBg, this.cardRole, this.cardStats]);
    roleBg.setName('roleBg');
    this.card = c;
    c.setVisible(false);
    this.layoutFns.push(() => { const s = this.ui(); c.setPosition(84 * s, this.scale.height - 96 * s).setScale(s); });
  }
  private eyeBase = { y: -7.6 };
  private onTurn(t: Turn) {
    this.card.setVisible(true);
    this.cardRing.setTint(t.c1);
    this.cardHead.setTexture(`he-${t.sp}`);
    this.eyeBase.y = t.sp === 'frog' ? -7.6 - 24 : -7.6;
    this.eyes.forEach((e, i) => e.setPosition((i ? 1 : -1) * 14.4, this.eyeBase.y));
    this.cardHead.setAngle(0);
    this.cardNum.setText(`${t.num}`);
    (this.card.getByName('roleBg') as Phaser.GameObjects.Image).setTint(t.me ? PALETTE.yellow : PALETTE.green);
    this.cardRole.setTexture(t.me ? 'ic-ballw' : 'ic-glove');
    this.cardStats.removeAll(true);
    if (t.me) {
      [['ic-bolt', PALETTE.red, t.pow], ['ic-target', PALETTE.blue, t.acc]].forEach(([ic, col, lv], j) => {
        const y = -24 + j * 48;
        this.cardStats.add([this.add.image(96, y, 'disc').setDisplaySize(44, 44).setTint(col as number), this.add.image(96, y, ic as string).setDisplaySize(28, 28), bigNumber(this, 124, y + 1, 30, `${lv}`).setOrigin(0, 0.5)]);
      });
    }
    this.tweens.add({ targets: this.card, scale: this.card.scale * 1.12, duration: 120, yoyo: true });
    this.trailG.clear();
  }
  private onTell(side: number) {
    this.eyes.forEach((e, i) => e.setPosition((i ? 1 : -1) * 14.4 + side * 7, this.eyeBase.y + (side ? -2 : 0)));
    this.cardHead.setAngle(side * 8);
  }

  /* ---------------------------------------------------------------- swipe */
  private drawTrail() {
    const g = this.trailG;
    g.clear();
    if (this.pts.length < 2) return;
    const s = this.ui();
    for (let i = 1; i < this.pts.length; i++) {
      const f = i / this.pts.length;
      g.lineStyle((6 + 16 * f) * s, 0xffffff, 0.35 + 0.5 * f);
      g.lineBetween(this.pts[i - 1].x, this.pts[i - 1].y, this.pts[i].x, this.pts[i].y);
    }
  }
  private finishSwipe() {
    const ok = this.play.onSwipe(this.pts);
    if (ok) { this.tutorialDone(); this.tweens.add({ targets: this.trailG, alpha: 0, duration: 300, onComplete: () => { this.trailG.clear(); this.trailG.setAlpha(1); } }); }
    else this.trailG.clear();
    this.pts = [];
  }
  /** Synthetic swipe through the same path as a finger (used by the perf autopilot). */
  simSwipe(pts: Pt[]) { this.pts = pts; this.drawTrail(); this.finishSwipe(); }

  private flash(x: number, y: number) {
    const r = this.add.circle(x, y, 30 * this.ui(), 0xffffff, 0.5).setStrokeStyle(5, 0xffffff).setDepth(6);
    this.tweens.add({ targets: r, scale: 2, alpha: 0, duration: 300, onComplete: () => r.destroy() });
  }

  /* ---------------------------------------------------------------- kick result */
  private onKick(k: { me: boolean; outcome: string }) {
    const s = this.ui(), w = this.scale.width, h = this.scale.height;
    const goal = k.outcome === 'goal';
    const good = k.me ? goal : !goal;
    const col = good ? PALETTE.green : PALETTE.red;
    const icon = goal ? 'ic-ballw' : k.outcome === 'save' ? 'ic-glove' : 'ic-x';
    const c = this.add.container(w / 2, h * (h > w ? 0.3 : 0.24)).setDepth(12);
    const disc = this.add.circle(0, 0, 66, col).setStrokeStyle(9, PALETTE.white);
    const ic = this.add.image(0, 0, icon).setDisplaySize(90, 90);
    c.add([disc, ic]);
    if (good) for (let i = 0; i < 3; i++) { const st = this.add.image((i - 1) * 70, -78 + Math.abs(i - 1) * 22, 'ic-star').setDisplaySize(48, 48); c.add(st); }
    c.setScale(0.2 * s);
    this.tweens.add({ targets: c, scale: s, duration: 260, ease: 'Back.out' });
    this.tweens.add({ targets: c, alpha: 0, y: c.y - 40 * s, delay: 950, duration: 350, onComplete: () => c.destroy() });
  }

  /* ---------------------------------------------------------------- retake (rewarded) */
  private onRetake(on: boolean) {
    this.retakeBox?.destroy(); this.retakeBox = undefined; this.retakeRing = undefined;
    if (!on) return;
    const s = this.ui(), w = this.scale.width, h = this.scale.height;
    const c = this.add.container(w / 2, h * 0.62).setDepth(15);
    const ring = this.add.graphics();
    const b = iconButton(this, 0, 0, 'video', PALETTE.yellow, 58, () => void this.revive());
    const mini = this.add.image(44, -44, 'ic-replay').setDisplaySize(44, 44);
    const miniBg = this.add.circle(44, -44, 26, PALETTE.green).setStrokeStyle(4, PALETTE.white);
    const skip = iconButton(this, 120, 30, 'next', 0x8a8296, 30, () => this.play.skipRetake());
    c.add([ring, b, miniBg, mini, skip]);
    pulse(this, b, 0.07);
    c.setScale(s);
    this.retakeBox = c; this.retakeRing = ring;
  }

  update() {
    // retake countdown ring
    if (this.retakeRing && this.play.phase === 'retake') {
      const f = this.play.retakeLeft / 4;
      this.retakeRing.clear().lineStyle(10, PALETTE.white, 0.9).beginPath().arc(0, 0, 78, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f).strokePath();
    }
    // tutorial: its clock starts on the first update (the scene clock is not ready in create)
    if (this.tutorial) {
      if (this.tutorialStart < 0) this.tutorialStart = this.time.now;
      if (this.time.now - this.tutorialStart > 10000) this.tutorialDone();
    }
  }

  /* ---------------------------------------------------------------- tutorial (no text) */
  private onPhase(p: string) {
    if (p === 'aim' && !save.get('tutorialDone') && !this.tutorial) this.showTutorial('shoot');
    if (p === 'runup' && !this.play.meShooting && !save.get('tutorialSave') && !this.tutorial) this.showTutorial('save');
    if (p === 'flight' && this.tutorialKind === 'shoot') this.tutorialDone();
  }
  private showTutorial(kind: 'shoot' | 'save') {
    const s = this.ui(), w = this.scale.width, h = this.scale.height;
    const c = this.add.container(0, 0).setDepth(20);
    const hand = this.add.image(0, 0, 'ic-hand').setDisplaySize(110 * s, 110 * s).setOrigin(0.45, 0.05);
    const ring = this.add.image(0, 0, 'ring-w').setScale(0.9 * s);
    c.add([ring, hand]);
    if (kind === 'shoot') {
      const x0 = w / 2 - 20 * s, y0 = h * 0.86, x1 = w / 2 + 90 * s, y1 = h * 0.42;
      const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x0, y0), new Phaser.Math.Vector2(x0 - 30 * s, (y0 + y1) / 2), new Phaser.Math.Vector2(x1, y1));
      // dotted path made of images (cheap to draw, unlike a stroked Graphics curve)
      for (let i = 1; i <= 10; i++) { const q = curve.getPoint(i / 10); c.addAt(this.add.image(q.x, q.y, 'trail').setScale((0.25 + i * 0.03) * s).setAlpha(0.65), 0); }
      const o = { t: 0 };
      this.tweens.add({
        targets: o, t: 1, duration: 700, repeat: -1, repeatDelay: 350, ease: 'Cubic.in',
        onUpdate: () => { const p = curve.getPoint(o.t); hand.setPosition(p.x, p.y); ring.setPosition(x0, y0).setAlpha(1 - o.t); },
      });
    } else {
      const cam = this.play.cameras.main;
      const side = Math.random() < 0.5 ? -1 : 1;
      const sx = (side * 200 - cam.worldView.x) * cam.zoom, sy = (-80 - cam.worldView.y) * cam.zoom;
      hand.setPosition(sx, sy); ring.setPosition(sx, sy);
      this.tweens.add({ targets: hand, y: sy + 14 * s, duration: 240, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: ring, scale: 1.3 * s, alpha: 0.2, duration: 480, repeat: -1 });
    }
    this.tutorial = c; this.tutorialKind = kind; this.tutorialStart = -1;
  }
  private tutorialDone() {
    if (!this.tutorial) return;
    const t = this.tutorial;
    save.set(this.tutorialKind === 'shoot' ? 'tutorialDone' : 'tutorialSave', true);
    this.tutorial = undefined; this.tutorialKind = null;
    this.tweens.add({ targets: t, alpha: 0, duration: 250, onComplete: () => t.destroy() });
  }

  /* ---------------------------------------------------------------- end of match */
  private showOver(r: Over) {
    this.overInfo = r;
    this.recording = false; this.trailG.clear();
    this.onRetake(false);
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = undefined; }
    this.card.setVisible(false);
    const w = this.scale.width, h = this.scale.height;
    const s = Math.min(this.ui() * 1.1, (w - 20) / 600, (h - 20) / 520);
    const c = this.add.container(0, 0).setDepth(30);
    this.over = c;
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.5).setInteractive();
    const p = this.add.container(w / 2, h / 2 + 20 * s).setScale(s);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(-290, -190, 580, 400, 30);
    g.fillStyle(r.won ? 0xfff6c8 : 0xfff6e8).fillRoundedRect(-290, -200, 580, 400, 30);
    g.lineStyle(9, INK).strokeRoundedRect(-290, -200, 580, 400, 30);
    p.add(g);
    p.add(this.add.image(-190, -90, 'bd-0').setDisplaySize(110, 127));
    p.add(this.add.image(190, -90, `bd-${r.opp}`).setDisplaySize(110, 127));
    p.add(bigNumber(this, 0, -92, 92, `${r.gf} - ${r.ga}`));
    const res = this.add.image(-150, 50, r.won ? 'ic-trophy' : 'mood-0').setDisplaySize(96, 96);
    p.add(res);
    if (r.won) this.tweens.add({ targets: res, angle: { from: -10, to: 10 }, duration: 300, yoyo: true, repeat: -1 });
    const coin = this.add.image(10, 50, 'ic-coin').setDisplaySize(64, 64);
    const coinsN = bigNumber(this, 50, 52, 58, `+${r.coins}`).setOrigin(0, 0.5);
    p.add([coin, coinsN]);
    const by = 150;
    const home = iconButton(this, -190, by, 'home', PALETTE.purple, 40, () => this.home());
    const tbl = iconButton(this, -80, by, 'table', PALETTE.blue, 40, () => this.table());
    const next = iconButton(this, 120, by - 4, r.seasonOver ? 'table' : 'play', PALETTE.green, 64, () => this.restart());
    pulse(this, next, 0.05);
    p.add([home, tbl, next]);
    if (r.canDouble) {
      const dbl = doubleButton(this, {
        x: 0, y: -200, s: 1, currencyIcon: 'ic-coin', earned: r.coins,
        onDoubled: () => {
          const extra = this.play.doubleCoins();
          coinsN.setText(`+${r.coins + extra}`);
          this.tweens.add({ targets: [coin, coinsN], scale: '*=1.25', duration: 160, yoyo: true, repeat: 1 });
        },
      });
      if (dbl) p.add(dbl);
      this.dbl = dbl;
    }
    c.add([shade, p]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 200 });
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  /** Retake with a rewarded ad (the "revive" of this game). */
  async revive() {
    if (this.busy) return false;
    this.busy = true;
    const ok = await this.play.retake();
    this.busy = false;
    return ok;
  }
  /** Next match in one click (the interstitial is requested when the match starts). At the end of the season: the table. */
  restart() {
    if (this.busy) return;
    if (this.overInfo?.seasonOver) return this.table();
    this.busy = true;
    this.play.scene.restart();
    this.busy = false;
  }
  table() {
    this.scene.stop('Play');
    this.scene.start('Hub');
  }
  home() {
    this.scene.stop('Play');
    this.scene.start('Menu');
  }
}
