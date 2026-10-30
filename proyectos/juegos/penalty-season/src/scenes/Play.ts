import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { save, season, squad } from '../state';
import {
  mulberry32, swipeToShot, resolveShot, planKeeper, keeperAI, shotOutcome, keeperAt, keeperSway, ballAt, aiShot, adaptShot,
  playerDive, playerKeeper, shootoutState, opponentOf, teamRating, TEAMS, SHOOTERS, KEEPER, KICKS, KEEPER_Y, matchCoins,
  moraleAfter, playRound, seasonOver, seasonEnd,
  type Rng, type Shot, type Dive, type Outcome, type OppShot, type Species, type Pt, type ShotInput,
} from '../logic';
import { proj, makeHeads, keeperBody, shooterBody, STADIUM, SPOT_Z, GOAL_M } from '../art';
import { kit, ballKey } from '../cosmeticos';
import { NUMBERS } from './Hub';

type Phase = 'idle' | 'intro' | 'aim' | 'runup' | 'flight' | 'after' | 'retake' | 'over';
type Char = { c: Phaser.GameObjects.Container; body: Phaser.GameObjects.Image; head: Phaser.GameObjects.Image; num?: Phaser.GameObjects.Text; sp: Species };
const KZ = 0.3;            // keeper stands 0.3 m in front of the goal line
const RUN_FROM = { X: -2.3, Z: 13.8 }, RUN_TO = { X: -0.62, Z: 11.45 };
const G = 9.8;

/**
 * The match: a penalty shootout of five kicks each (the player shoots first) and sudden death.
 * Shooting: one swipe (Hud) → aim, power and curve. Saving: one tap on the goal → the keeper dives there.
 * All timers run on real time (game.loop.rawDelta), so the match lasts the same at 30 or 120 FPS.
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  // read by Hud and the automatic tests
  alive = false;
  paused = false;
  started = false;
  phase: Phase = 'idle';
  meShooting = true;
  mine: boolean[] = [];
  theirs: boolean[] = [];
  saves = 0;
  retakeUsed = false;
  retakeLeft = 0;
  doubled = false;
  earned = 0;
  opp = 1;
  rating = 1;
  tellSide = 0;

  private rng: Rng = Math.random;
  private clock = 0;
  private phaseT = 0;
  private kickT = 0;
  private shot: Shot | null = null;
  private oppShot: OppShot | null = null;
  private dive: Dive | null = null;
  private outcome: Outcome = 'goal';
  private divedAt: number | null = null;
  private kx = 0;
  private ball!: Phaser.GameObjects.Image;
  private ballShadow!: Phaser.GameObjects.Image;
  private bs = { X: 0, h: 0, Z: SPOT_Z, vx: 0, vh: 0, vz: 0, spin: 0, net: false };
  private keeper!: Char;
  private keeperShadow!: Phaser.GameObjects.Image;
  private kpos = { x: 0, y: KEEPER_Y, rot: 0 };
  private shooter!: Char;
  private net!: Phaser.GameObjects.Image;
  private stands!: Phaser.GameObjects.Image;
  private confetti!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private pendingShot: ShotInput | null = null;
  private gone = false;

  constructor() { super('Play'); }

  async create() {
    // the scene instance is reused on restart: reset everything from the previous match
    this.alive = false; this.paused = false; this.started = false; this.phase = 'idle'; this.meShooting = true;
    this.mine = []; this.theirs = []; this.saves = 0; this.retakeUsed = false; this.retakeLeft = 0; this.doubled = false; this.earned = 0;
    this.clock = 0; this.phaseT = 0; this.kickT = 0; this.shot = null; this.oppShot = null; this.dive = null; this.divedAt = null; this.kx = 0;
    this.tellSide = 0; this.pendingShot = null; this.gone = false;
    this.rng = mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0);

    const se = season();
    this.opp = opponentOf(se).opp;
    this.rating = teamRating(this.opp, save.get('best'));
    const o = TEAMS[this.opp];
    makeHeads(this, o.species);

    this.cameras.main.setBackgroundColor('#7fd0ff');
    const { stands, pitch, goal } = STADIUM;
    this.add.image(pitch.x0, pitch.y0, 'st-pitch').setOrigin(0).setDepth(0);
    this.stands = this.add.image(stands.x0, stands.y0, 'st-stands').setOrigin(0).setDepth(1);
    this.net = this.add.image(goal.x + goal.w / 2, goal.y + goal.h, 'net').setOrigin(0.5, 1).setDepth(2);
    this.add.image(goal.x, goal.y, 'frame').setOrigin(0).setDepth(4);
    this.keeperShadow = this.add.image(0, 0, 'shadow').setDepth(2.5);
    this.keeper = this.makeChar(true);
    this.ballShadow = this.add.image(0, 0, 'shadow').setDepth(4.8);
    this.ball = this.add.image(0, 0, ballKey()).setDepth(5);
    this.shooter = this.makeChar(false);
    this.trail = this.add.particles(0, 0, 'trail', { lifespan: 260, scale: { start: 0.5, end: 0 }, alpha: { start: 0.55, end: 0 }, frequency: 16, emitting: false }).setDepth(4.9);
    this.trail.startFollow(this.ball);
    this.confetti = this.add.particles(0, -260, 'px', {
      x: { min: -360, max: 360 }, speedY: { min: -120, max: 120 }, speedX: { min: -160, max: 160 }, gravityY: 260, lifespan: 2200,
      rotate: { min: 0, max: 360 }, scale: { min: 0.6, max: 1.2 }, tint: [0xff5d5d, 0xffd23f, 0x4aa8ff, 0x3ddc84, 0xff6fae, 0x9b6bff], emitting: false,
    }).setDepth(7);

    this.fit();
    this.scale.on('resize', this.fit, this);
    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      this.gone = true;
      portal.gameplayStop();
      this.scale.off('resize', this.fit, this);
      this.scene.stop('Hud');
    });

    this.placeBall(0, 0, SPOT_Z);
    this.setKeeper(true);
    this.setShooter(true, 0);
    this.layoutKeeper();
    this.layoutShooter(0);

    // interstitial at a natural break: before every match except the first one of the session
    if (!Play.firstRun) {
      this.paused = true;
      await portal.commercialBreak();
      this.paused = false;
    }
    Play.firstRun = false;
    if (this.gone) return; // left during the ad
    this.alive = true;
    this.started = true;
    portal.gameplayStart();
    // the first kick starts on the next update, once the Hud is listening
  }

  /** Camera: frame the goal, the spot and the shooter at any aspect ratio. */
  private fit() {
    const w = this.scale.width, h = this.scale.height, portrait = h > w;
    const z = Math.min(w / (portrait ? 690 : 900), h / (portrait ? 900 : 820));
    this.cameras.main.setZoom(z).centerOn(0, portrait ? 60 : 90);
  }

  /* ---------------------------------------------------------------- characters */
  private makeChar(keeper: boolean): Char {
    const c = this.add.container(0, 0).setDepth(keeper ? 3 : 6);
    const body = this.add.image(0, 0, '__WHITE');
    const head = this.add.image(0, 0, '__WHITE');
    c.add([body, head]);
    let num: Phaser.GameObjects.Text | undefined;
    if (!keeper) {
      num = this.add.text(0, -118, '9', { fontFamily: '"Arial Black", system-ui, sans-serif', fontSize: '44px', color: '#ffffff', stroke: '#2b2340', strokeThickness: 7 }).setOrigin(0.5);
      c.add(num);
    }
    return { c, body, head, num, sp: 'fox' };
  }
  /** mineKeeper: the player's keeper (bear) in the player's kit, else the opponent keeper. */
  private setKeeper(opponent: boolean) {
    const o = TEAMS[this.opp], k = kit();
    const sp: Species = opponent ? o.species : KEEPER;
    const c1 = opponent ? o.c2 === 0xffffff ? shadeAlt(o.c1) : o.c2 : 0x22b267, c2 = opponent ? o.c1 : k.c1;
    this.keeper.sp = sp;
    this.keeper.body.setTexture(keeperBody(this, sp, c1, c2)).setOrigin(0.5, 1).setPosition(0, 95);
    this.keeper.head.setTexture(`hf-${sp}`).setOrigin(0.5).setPosition(0, -60);
    this.kpos = { x: 0, y: KEEPER_Y, rot: 0 };
  }
  private setShooter(mine: boolean, idx: number) {
    const o = TEAMS[this.opp], k = kit();
    const sp: Species = mine ? SHOOTERS[idx % 5] : o.species;
    const c1 = mine ? k.c1 : o.c1, c2 = mine ? k.c2 : o.c2;
    this.shooter.sp = sp;
    this.shooter.body.setTexture(shooterBody(this, sp, c1, c2)).setOrigin(0.5, 1).setPosition(0, 0);
    this.shooter.head.setTexture(`hb-${sp}`).setOrigin(0.5).setPosition(0, -196).setFlipX(false);
    this.shooter.num!.setText(`${NUMBERS[idx % 5]}`).setColor(Phaser.Display.Color.IntegerToColor(c2 === c1 ? 0xffffff : c2).rgba);
    this.shooter.c.setAngle(0).setAlpha(1);
  }
  private layoutKeeper() {
    const p = proj(this.kpos.x * GOAL_M, this.kpos.y * GOAL_M, KZ);
    this.keeper.c.setPosition(p.x, p.y).setScale(0.74 * p.s).setAngle(this.kpos.rot);
    const g = proj(this.kpos.x * GOAL_M, 0, KZ);
    this.keeperShadow.setPosition(g.x, g.y).setScale(2.2 * g.s, 1.6 * g.s).setAlpha(Phaser.Math.Clamp(1.2 - this.kpos.y, 0.3, 1));
  }
  /** Shooter on the run-up line: f = 0 (start) .. 1 (at the ball). */
  private layoutShooter(f: number, bob = 0) {
    const X = Phaser.Math.Linear(RUN_FROM.X, RUN_TO.X, f), Z = Phaser.Math.Linear(RUN_FROM.Z, RUN_TO.Z, f);
    const p = proj(X, 0, Z);
    this.shooter.c.setPosition(p.x, p.y - bob * p.s).setScale(0.43 * p.s);
  }
  private placeBall(X: number, h: number, Z: number) {
    const p = proj(X, h + 0.16, Z);
    const d = (0.22 * 1.45 * 1639) / Math.max(0.5, 20 - Z);
    this.ball.setPosition(p.x, p.y).setDisplaySize(d * 1.14, d * 1.14);
    const g = proj(X, 0, Z);
    this.ballShadow.setPosition(g.x, g.y).setDisplaySize(d * 1.3, d * 0.45).setAlpha(Phaser.Math.Clamp(1 - h / 3, 0.15, 0.9));
  }

  /* ---------------------------------------------------------------- flow */
  private setPhase(p: Phase) { this.phase = p; this.phaseT = this.clock; this.events.emit('phase', p); }

  private nextKick() {
    const st = shootoutState(this.mine, this.theirs);
    if (st !== 'ongoing') return this.endMatch(st === 'won');
    this.meShooting = this.mine.length === this.theirs.length;
    const idx = (this.meShooting ? this.mine.length : this.theirs.length) % 5;
    this.shot = null; this.oppShot = null; this.dive = null; this.divedAt = null; this.pendingShot = null; this.tellSide = 0;
    this.bs = { X: 0, h: 0, Z: SPOT_Z, vx: 0, vh: 0, vz: 0, spin: 0, net: false };
    this.ball.setDepth(5).setAlpha(1).setAngle(0);
    this.placeBall(0, 0, SPOT_Z);
    this.trail.stop();
    this.setKeeper(this.meShooting);
    this.setShooter(this.meShooting, idx);
    this.layoutKeeper();
    this.layoutShooter(0);
    if (!this.meShooting) this.oppShot = aiShot(this.rating, this.rng);
    const sq = squad();
    const o = TEAMS[this.opp], k = kit();
    this.events.emit('turn', {
      me: this.meShooting, idx, sp: this.shooter.sp, num: NUMBERS[idx], c1: this.meShooting ? k.c1 : o.c1,
      pow: this.meShooting ? sq.pow[idx] : 0, acc: this.meShooting ? sq.acc[idx] : 0, ref: sq.ref,
    });
    this.events.emit('score', this.mine, this.theirs);
    audio.tone(2300, 0.09, 'sine', 0.06, 2600);
    this.setPhase('intro');
  }

  /** Swipe from the Hud (screen points). */
  onSwipe(pts: Pt[]) {
    if (!this.alive || this.paused || this.phase !== 'aim') return false;
    const inp = swipeToShot(pts, Math.min(this.scale.width, this.scale.height) * 0.5);
    if (!inp) return false;
    this.shoot(inp);
    return true;
  }
  /** For the tests and the autopilot: shoot without a swipe. */
  autoShoot(aimX: number, s: number, bulge = 0) {
    if (!this.alive || this.paused || this.phase !== 'aim') return false;
    this.shoot({ aimX, s, bulge });
    return true;
  }
  private shoot(inp: ShotInput) {
    this.pendingShot = inp;
    this.setPhase('runup');
  }
  /** Tap from the Hud (screen point) while the opponent shoots: dive there. */
  onTap(sx: number, sy: number) {
    if (!this.alive || this.paused || this.meShooting || this.divedAt !== null) return false;
    if (this.phase !== 'runup' && this.phase !== 'flight' && this.phase !== 'intro') return false;
    const wp = this.cameras.main.getWorldPoint(sx, sy);
    return this.autoDive(wp.x / 300, -wp.y / 300);
  }
  autoDive(gx: number, gy: number) {
    if (!this.alive || this.paused || this.meShooting || this.divedAt !== null || !this.oppShot) return false;
    if (this.phase !== 'runup' && this.phase !== 'flight' && this.phase !== 'intro') return false;
    const t = this.phase === 'flight' ? this.clock - this.kickT : -(this.oppShot.kickAt - (this.phase === 'runup' ? this.clock - this.phaseT : 0));
    this.divedAt = t;
    if (t < 0) this.oppShot = adaptShot(this.oppShot, gx, -t, this.rng);
    const sq = squad();
    this.dive = playerDive(gx, gy, t, playerKeeper(sq.ref, save.get('morale')));
    this.kpos.rot = Math.sign(gx) * 8; // leans to show the choice
    this.events.emit('dove');
    return true;
  }

  private kick() {
    this.kickT = this.clock;
    audio.noise(0.08, 0.5, 300);
    audio.tone(90, 0.12, 'sine', 0.25, 50);
    if (this.meShooting) {
      const sq = squad(), idx = this.mine.length % 5;
      this.shot = resolveShot(this.pendingShot!, sq.pow[idx], sq.acc[idx], save.get('morale'), this.rng);
      this.dive = planKeeper(this.shot, keeperAI(this.rating), this.kx, this.rng);
    } else {
      this.shot = this.oppShot!;
    }
    this.trail.start();
    this.setPhase('flight');
  }

  private resolve() {
    const sh = this.shot!;
    this.outcome = shotOutcome(sh, this.dive);
    const goal = this.outcome === 'goal';
    // ball velocity at the goal line (m/s), then simple physics
    const a = ballAt(sh, 0.97), b = ballAt(sh, 1);
    const dt = sh.T * 0.03;
    this.bs = { X: b.x * GOAL_M, h: b.y * GOAL_M, Z: 0, vx: ((b.x - a.x) * GOAL_M) / dt, vh: ((b.y - a.y) * GOAL_M) / dt, vz: -SPOT_Z / sh.T, spin: this.bs.spin, net: false };
    const side = Math.sign(this.bs.X) || 1;
    if (this.outcome === 'save') { this.bs.vx = side * (2 + this.rng() * 2); this.bs.vh = 2.5; this.bs.vz = 6; audio.tone(300, 0.12, 'square', 0.12, 160); }
    else if (this.outcome === 'post') { this.bs.vx = -side * 2.5; this.bs.vz = 5; this.bs.vh = Math.abs(this.bs.vh) * 0.3; audio.tone(1500, 0.3, 'triangle', 0.14, 1400); this.cameras.main.shake(120, 0.004); }
    else if (goal) { this.bs.net = true; this.ball.setDepth(2.2); }
    else this.ball.setDepth(1.5);
    if (this.meShooting) this.mine.push(goal); else { this.theirs.push(goal); if (!goal) this.saves++; }
    if (goal) {
      this.tweens.add({ targets: this.net, scaleY: 1.06, scaleX: 1.02, duration: 90, yoyo: true, repeat: 1 });
      if (this.meShooting) {
        this.confetti.explode(70);
        this.tweens.add({ targets: this.stands, y: this.stands.y - 8, duration: 120, yoyo: true, repeat: 3 });
        audio.noise(1.1, 0.25, 1400);
        [523, 659, 784, 1047].forEach((f, j) => this.time.delayedCall(j * 90, () => audio.tone(f, 0.16, 'square', 0.08)));
      } else audio.tone(330, 0.3, 'sawtooth', 0.06, 200);
    } else if (!this.meShooting) {
      this.cameras.main.shake(140, 0.005);
      [784, 988, 1175].forEach((f, j) => this.time.delayedCall(j * 80, () => audio.tone(f, 0.14, 'triangle', 0.12)));
      audio.noise(0.8, 0.2, 1400);
    } else audio.tone(220, 0.35, 'sawtooth', 0.07, 140);
    this.events.emit('kick', { me: this.meShooting, outcome: this.outcome });
    this.events.emit('score', this.mine, this.theirs);
    this.setPhase('after');
  }

  /** Rewarded ad: retake the last missed penalty (once per match). Also called by Hud.revive() and the tests. */
  async retake() {
    if (this.phase !== 'retake' || this.retakeUsed || this.paused) return false;
    this.paused = true;
    portal.gameplayStop();
    const ok = await portal.rewardedBreak();
    if (this.gone) return false;
    portal.gameplayStart();
    this.paused = false;
    if (!ok || this.phase !== 'retake') return false;
    this.retakeUsed = true;
    this.mine.pop();
    this.events.emit('retake', false);
    this.nextKick();
    return true;
  }

  update() {
    // real time (Phaser's delta is smoothed and capped)
    const dt = Math.min(this.game.loop.rawDelta || 16.7, 100) / 1000;
    if (!this.started || this.paused) return;
    this.clock += dt;
    if (this.phase === 'idle' && this.alive) this.nextKick();
    const t = this.clock - this.phaseT;
    switch (this.phase) {
      case 'intro': {
        // the shooter walks to his mark
        const f = Math.min(1, t / 0.6);
        this.layoutShooter(f * 0.25, Math.abs(Math.sin(t * 14)) * 10 * (1 - f));
        this.swayKeeper(dt);
        if (t >= 0.6) {
          if (this.meShooting) this.setPhase('aim');
          else this.setPhase('runup');
        }
        break;
      }
      case 'aim': this.swayKeeper(dt); break;
      case 'runup': {
        const dur = this.meShooting ? 0.38 : this.oppShot!.kickAt;
        const f = Math.min(1, t / dur);
        this.layoutShooter(0.25 + 0.75 * f, Math.abs(Math.sin(t * 16)) * 14);
        if (this.meShooting) this.swayKeeper(dt);
        else {
          // the tell: a glance to one side shortly before the kick (sometimes a bluff)
          const os = this.oppShot!;
          const glance = t > dur - 0.62 && t < dur - 0.18;
          const side = glance ? os.tell : 0;
          if (side !== this.tellSide) {
            this.tellSide = side;
            this.shooter.head.setTexture(side ? `hs-${this.shooter.sp}` : `hb-${this.shooter.sp}`).setFlipX(side < 0);
            this.shooter.c.setAngle(side * 4);
            this.events.emit('tell', side);
          }
          this.layoutKeeper();
        }
        if (t >= dur) { this.shooter.c.setAngle(-8); this.kick(); }
        break;
      }
      case 'flight': {
        const sh = this.shot!;
        const p = Math.min(1, t / sh.T);
        const bp = ballAt(sh, p);
        const arc = 4 * p * (1 - p) * (0.2 + sh.ty * 0.9);
        this.bs.spin += dt * 900 * (sh.bulge >= 0 ? 1 : -1);
        this.ball.setAngle(this.bs.spin);
        this.placeBall(bp.x * GOAL_M, bp.y * GOAL_M + arc, SPOT_Z * (1 - p));
        if (this.dive) { const k = keeperAt(this.dive, t); this.kpos.x = k.x; this.kpos.y = k.y; this.kpos.rot = Phaser.Math.Clamp((k.x - this.dive.fromX) * 95, -88, 88); }
        this.layoutKeeper();
        if (t > 0.25) this.shooter.c.setAngle(0);
        if (p >= 1) this.resolve();
        break;
      }
      case 'after': {
        this.stepBall(dt);
        // a keeper who dove lands on the grass
        if (Math.abs(this.kpos.rot) > 20 && this.kpos.y > 0.14) { this.kpos.y = Math.max(0.14, this.kpos.y - dt * 1.6); this.layoutKeeper(); }
        if (t >= 1.5) {
          const missed = this.meShooting && this.outcome !== 'goal';
          if (missed && !this.retakeUsed && portal.hasRewarded) {
            this.retakeLeft = 4;
            this.setPhase('retake');
            this.events.emit('retake', true);
          } else this.nextKick();
        }
        break;
      }
      case 'retake': {
        this.stepBall(dt);
        this.retakeLeft = Math.max(0, 4 - t);
        if (t >= 4) { this.events.emit('retake', false); this.nextKick(); }
        break;
      }
      default: break;
    }
  }
  /** Skip the retake offer (the Hud's "no thanks" is simply waiting, or tapping the pitch). */
  skipRetake() { if (this.phase === 'retake' && !this.paused) { this.events.emit('retake', false); this.nextKick(); } }

  private swayKeeper(dt: number) {
    if (this.meShooting) {
      this.kx = keeperSway(this.clock, this.rating);
      this.kpos.x = this.kx;
      this.kpos.y = KEEPER_Y + Math.abs(Math.sin(this.clock * 6)) * 0.015;
    } else {
      this.kpos.x *= Math.max(0, 1 - dt * 4);
      this.kpos.y = KEEPER_Y + Math.abs(Math.sin(this.clock * 5)) * 0.01;
    }
    this.layoutKeeper();
  }
  private stepBall(dt: number) {
    const b = this.bs;
    if (b.net && b.Z < -1.7) { b.Z = -1.7; b.vz = 0; b.vx *= 0.2; }
    b.X += b.vx * dt; b.Z += b.vz * dt; b.h += b.vh * dt;
    b.vh -= G * dt;
    if (b.h < 0) { b.h = 0; b.vh = Math.abs(b.vh) * 0.45; b.vx *= 0.8; b.vz *= 0.8; if (Math.abs(b.vh) < 0.5) b.vh = 0; }
    b.spin += dt * 400 * Math.hypot(b.vx, b.vz) / 5;
    this.ball.setAngle(b.spin);
    if (b.Z < -6 || b.Z > 17) { this.ball.setAlpha(0); this.ballShadow.setAlpha(0); return; }
    this.placeBall(b.X, b.h, b.Z);
    if (!b.net && this.outcome !== 'save' && this.outcome !== 'post') this.ball.setAlpha(Math.max(0, this.ball.alpha - dt * 1.2));
  }

  /* ---------------------------------------------------------------- end of the match */
  private endMatch(won: boolean, forfeit = false) {
    if (this.phase === 'over') return;
    this.setPhase('over');
    this.alive = false;
    this.trail.stop();
    portal.gameplayStop();
    const gf = this.mine.filter(Boolean).length;
    let ga = this.theirs.filter(Boolean).length;
    if (forfeit && ga <= gf) { ga = gf + 1; won = false; }
    const sd = this.mine.length > KICKS || this.theirs.length > KICKS;
    const se = season();
    const div = se.div;
    this.earned = matchCoins({ won, gf, saves: this.saves, div });
    save.set('coins', save.get('coins') + this.earned);
    save.set('morale', moraleAfter(save.get('morale'), won, sd));
    save.set('runs', save.get('runs') + 1);
    const se2 = playRound(se, { gf, ga, sd }, save.get('best'));
    save.set('season', se2);
    const over = seasonOver(se2);
    if (over) save.set('seasonEnd', seasonEnd(se2));
    if (won) {
      this.confetti.explode(120);
      [523, 659, 784, 1047, 1319].forEach((f, j) => this.time.delayedCall(j * 100, () => audio.tone(f, 0.2, 'square', 0.09)));
    }
    this.events.emit('over', { won, gf, ga, sd, coins: this.earned, seasonOver: over, canDouble: !this.doubled, opp: this.opp });
  }
  /** ×2 coins with a rewarded ad (from the Hud's doubleButton). */
  doubleCoins() {
    if (this.doubled) return 0;
    this.doubled = true;
    save.set('coins', save.get('coins') + this.earned);
    return this.earned;
  }
  /** Ends the current match right away (a forfeit). Used by the automatic tests. */
  breakEgg() {
    if (!this.started || this.phase === 'over') return;
    this.events.emit('retake', false);
    this.endMatch(false, true);
  }
}

function shadeAlt(c: number) { return c === 0xffd23f ? 0xff8a3d : 0xffd23f; }
