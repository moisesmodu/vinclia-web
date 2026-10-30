import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { modalPanel, setModal, modalOpen } from '@comun/tienda';
import { save, season, squad } from '../state';
import {
  table, opponentOf, teamRating, TEAMS, ROUNDS, SHOOTERS, KEEPER, MAX_LEVEL, upgrade, upgradeCost, statLevel, nextSeason, DIVISIONS,
  type Stat, type Season,
} from '../logic';
import { kit } from '../cosmeticos';

const INK = PALETTE.ink;
export const NUMBERS = [9, 10, 7, 11, 8];

/** Season screen: league table (icons and numbers only), next opponent, morale, squad upgrades and the season end. */
export class Hub extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private going = false;
  private squadOpen = false;
  private endOpen = false;
  private endRoot?: Phaser.GameObjects.Container;
  constructor() { super('Hub'); }

  create() {
    this.going = false; this.squadOpen = false; this.endOpen = false; this.root = undefined; this.endRoot = undefined; this.squadRoot = undefined;
    portal.gameplayStop();
    this.cameras.main.fadeIn(160, 127, 208, 255);
    this.build();
    this.scale.on('resize', this.build, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.build, this));
    this.input.keyboard?.on('keydown-SPACE', () => { if (!modalOpen(this)) this.go(); });
    this.input.keyboard?.on('keydown-ENTER', () => { if (!modalOpen(this)) this.go(); });
    if (save.get('seasonEnd')) this.showSeasonEnd();
  }

  /** Design is 1280×720 (landscape) or 720×1280 (portrait), scaled to fit and centred. */
  private build() {
    this.tweens.killAll(); // the old layout's looping tweens go with it
    this.root?.destroy();
    const w = this.scale.width, h = this.scale.height, portrait = h > w;
    const DW = portrait ? 720 : 1280, DH = portrait ? 1280 : 720;
    const s = Math.min(w / DW, h / DH);
    const bg = this.add.image(w / 2, h / 2, 'menu-bg');
    bg.setScale(Math.max(w / bg.width, h / bg.height));
    const dim = this.add.rectangle(0, 0, w, h, 0x2b2340, 0.5).setOrigin(0);
    const c = this.add.container(w / 2 - (DW * s) / 2, h / 2 - (DH * s) / 2).setScale(s);
    const root = this.add.container(0, 0, [bg, dim, c]);
    this.root = root;
    const se = season();

    // top bar: home · division cup + matchday dots · coins · sound
    c.add(iconButton(this, 60, 60, 'home', PALETTE.purple, 36, () => this.home()));
    c.add(iconButton(this, DW - 60, 60, audio.muted ? 'mute' : 'sound', PALETTE.blue, 32, () => { const m = audio.toggle(); save.set('muted', m); this.build(); }));
    c.add(this.add.image(DW - 250, 60, 'ic-coin').setDisplaySize(50, 50));
    c.add(bigNumber(this, DW - 218, 62, 42, `${save.get('coins')}`).setOrigin(0, 0.5));
    const dotsW = ROUNDS * 34;
    const cupX = portrait ? 150 : DW / 2 - dotsW / 2 - 50;
    c.add(this.add.image(cupX, 60, `div-${se.div}`).setDisplaySize(66, 66));
    const mine = se.results.filter((r) => r.home === 0 || r.away === 0);
    for (let i = 0; i < ROUNDS; i++) {
      const r = mine[i];
      const x = (portrait ? 200 : DW / 2 - dotsW / 2) + 17 + i * (portrait ? 30 : 34), y = 60;
      const won = r && ((r.home === 0 && r.hg > r.ag) || (r.away === 0 && r.ag > r.hg));
      const dot = this.add.image(x, y, r ? (won ? 'dot-g' : 'dot-r') : 'dot-e').setDisplaySize(portrait ? 26 : 30, portrait ? 26 : 30);
      if (i === se.round) dot.setDisplaySize(38, 38);
      c.add(dot);
    }

    // panels
    const P = portrait ? { tx: 30, ty: 590, tw: 660, th: 660, cx: 30, cy: 120, cw: 660, ch: 440 }
      : { tx: 30, ty: 120, tw: 680, th: 570, cx: 740, cy: 120, cw: 510, ch: 570 };
    const g = this.add.graphics();
    for (const [x, y, ww, hh] of [[P.tx, P.ty, P.tw, P.th], [P.cx, P.cy, P.cw, P.ch]]) {
      g.fillStyle(0x000000, 0.25).fillRoundedRect(x, y + 8, ww, hh, 26);
      g.fillStyle(0xfff6e8).fillRoundedRect(x, y, ww, hh, 26);
      g.lineStyle(7, INK).strokeRoundedRect(x, y, ww, hh, 26);
    }
    c.add(g);
    this.drawTable(c, se, P.tx, P.ty, P.tw, P.th);
    this.drawNext(c, se, P.cx, P.cy, P.cw, P.ch);
    if (this.squadOpen) this.openSquad();
  }

  private drawTable(c: Phaser.GameObjects.Container, se: Season, x: number, y: number, w: number, h: number) {
    const rows = table(se.teams, se.results);
    const rh = (h - 70) / 6;
    const col = { rank: x + 46, badge: x + 120, w: x + w * 0.42, l: x + w * 0.56, gd: x + w * 0.72, pts: x + w * 0.88 };
    // header: icons only
    const hy = y + 38;
    c.add(this.add.image(col.w, hy, 'dot-g').setDisplaySize(36, 36));
    c.add(this.add.image(col.l, hy, 'dot-r').setDisplaySize(36, 36));
    const gd = this.add.circle(col.gd, hy, 18, PALETTE.blue).setStrokeStyle(4, INK);
    c.add([gd, this.add.image(col.gd, hy, 'ic-ballw').setDisplaySize(30, 30)]);
    c.add(this.add.image(col.pts, hy, 'ic-star').setDisplaySize(42, 42));
    rows.forEach((r, i) => {
      const ry = y + 70 + rh * i + rh / 2;
      const me = r.id === 0;
      const band = this.add.graphics();
      band.fillStyle(me ? 0xffd23f : i % 2 ? 0xffffff : 0xf3e9d6, me ? 0.9 : 1).fillRoundedRect(x + 14, ry - rh / 2 + 4, w - 28, rh - 8, 14);
      if (me) band.lineStyle(4, INK).strokeRoundedRect(x + 14, ry - rh / 2 + 4, w - 28, rh - 8, 14);
      c.add(band);
      c.add(bigNumber(this, col.rank, ry, 38, `${i + 1}`));
      if (i === 0) {
        const top = se.div < DIVISIONS - 1;
        const mark = this.add.circle(col.rank - 34, ry - 18, 15, top ? PALETTE.green : PALETTE.yellow).setStrokeStyle(3, INK);
        c.add([mark, this.add.image(mark.x, mark.y, top ? 'ic-up' : 'ic-trophy').setDisplaySize(22, 22)]);
      }
      c.add(this.add.image(col.badge, ry, `bd-${r.id}`).setDisplaySize(rh * 0.72, rh * 0.83));
      if (r.id !== 0) this.stars(c, col.badge + 50, ry + rh * 0.28, teamRating(r.id, save.get('best')), 12, true);
      c.add(bigNumber(this, col.w, ry, 34, `${r.w}`));
      c.add(bigNumber(this, col.l, ry, 34, `${r.l}`));
      const d = r.gf - r.ga;
      c.add(bigNumber(this, col.gd, ry, 30, `${d > 0 ? '+' : ''}${d}`));
      c.add(bigNumber(this, col.pts, ry, 40, `${r.pts}`).setColor('#ffd23f'));
    });
  }

  /** Small strength stars (1..5). */
  private stars(c: Phaser.GameObjects.Container, x: number, y: number, rating: number, size: number, left = false) {
    const n = Math.max(1, Math.min(5, Math.round(rating)));
    for (let i = 0; i < 5; i++) {
      const st = this.add.image(left ? x + i * size * 1.6 : x + (i - 2) * size * 2.1, y, 'ic-star').setDisplaySize(size * 2, size * 2);
      if (i >= n) st.setTint(0x8a8296).setAlpha(0.5);
      c.add(st);
    }
  }

  private drawNext(c: Phaser.GameObjects.Container, se: Season, x: number, y: number, w: number, h: number) {
    const cx = x + w / 2;
    if (se.round >= ROUNDS) return;
    const { opp } = opponentOf(se);
    const portrait = h < 500;
    const by = y + (portrait ? 100 : 110);
    c.add(bigNumber(this, cx, y + 30, 30, `${se.round + 1} / ${ROUNDS}`));
    const mine = this.add.image(cx - w * 0.28, by, 'bd-0').setDisplaySize(130, 150);
    const vs = this.add.image(cx, by, 'ic-vs').setDisplaySize(64, 64).setTint(PALETTE.red);
    const them = this.add.image(cx + w * 0.28, by, `bd-${opp}`).setDisplaySize(130, 150);
    c.add([mine, vs, them]);
    this.tweens.add({ targets: vs, scale: vs.scale * 1.15, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.stars(c, them.x, by + 96, teamRating(opp, save.get('best')), 13);
    // morale
    const m = save.get('morale');
    const my = portrait ? by + 96 : y + 275;
    const face = this.add.image(cx - w * 0.28 - 70, my, `mood-${m < 45 ? 0 : m < 75 ? 1 : 2}`).setDisplaySize(52, 52);
    const barX = face.x + 40, barW = 150;
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.15).fillRoundedRect(barX, my - 12, barW, 24, 12);
    bar.fillStyle(m < 45 ? PALETTE.red : m < 75 ? PALETTE.yellow : PALETTE.green).fillRoundedRect(barX, my - 12, Math.max(24, (barW * m) / 100), 24, 12);
    bar.lineStyle(4, INK).strokeRoundedRect(barX, my - 12, barW, 24, 12);
    c.add([face, bar]);
    if (portrait) { face.setPosition(cx - 300 + 60, by + 150); bar.setPosition(face.x + 40 - barX, by + 150 - my); }
    // buttons: squad, play
    const py = portrait ? y + h - 90 : y + h - 95;
    const play = iconButton(this, portrait ? cx + 150 : cx + 60, py, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);
    const sq = squad(), coins = save.get('coins');
    const canUp = [...SHOOTERS.flatMap((_, i) => (['pow', 'acc'] as Stat[]).map((st) => statLevel(sq, st, i))), sq.ref].some((lv) => lv < MAX_LEVEL && upgradeCost(lv) <= coins);
    const team = iconButton(this, portrait ? cx - 150 : cx - 140, py + 10, 'shirt', PALETTE.blue, 52, () => { this.squadOpen = true; this.openSquad(); });
    if (canUp) {
      const dot = this.add.circle(36, -36, 13, PALETTE.red).setStrokeStyle(5, PALETTE.white);
      team.add(dot);
      this.tweens.add({ targets: dot, scale: 1.25, duration: 500, yoyo: true, repeat: -1 });
    }
    c.add([team, play]);
    // squad faces under the badges (landscape: a row of the five shooters and the keeper)
    if (!portrait) {
      const k = kit();
      [...SHOOTERS, KEEPER].forEach((sp, i) => {
        const fx = x + 60 + i * ((w - 120) / 5), fy = y + 360;
        const ring = this.add.circle(fx, fy, 34, i === 5 ? 0x22b267 : k.c1).setStrokeStyle(5, INK);
        const hd = this.add.image(fx, fy - 4, `hf-${sp}`).setDisplaySize(76, 76);
        c.add([ring, hd]);
      });
    }
  }

  /* ---------------------------------------------------------------- squad and upgrades */
  private squadRoot?: Phaser.GameObjects.Container;
  private openSquad() {
    this.squadRoot?.destroy();
    setModal(this, true);
    const w = this.scale.width, h = this.scale.height, portrait = h > w;
    const cols = portrait ? 2 : 3, rows = 6 / cols;
    const CW = 420, CH = 210;
    const DW = cols * CW + 40, DH = rows * CH + 130;
    const s = Math.min((w - 20) / DW, (h - 20) / DH, 1.3);
    const root = modalPanel(this, DW * s, DH * s, 0xfff6e8, 60);
    this.squadRoot = root;
    const c = this.add.container(w / 2 - (DW * s) / 2, h / 2 - (DH * s) / 2).setScale(s);
    root.add(c);
    const sq = squad();
    const coins = save.get('coins');
    c.add(this.add.image(DW / 2 - 50, 54, 'ic-coin').setDisplaySize(52, 52));
    c.add(bigNumber(this, DW / 2 - 18, 56, 46, `${coins}`).setOrigin(0, 0.5));
    c.add(iconButton(this, DW - 56, 54, 'x', PALETTE.red, 32, () => this.closeSquad()));
    const m = save.get('morale');
    c.add(this.add.image(60, 54, `mood-${m < 45 ? 0 : m < 75 ? 1 : 2}`).setDisplaySize(56, 56));
    c.add(bigNumber(this, 96, 56, 34, `${m}`).setOrigin(0, 0.5));
    const k = kit();
    const players = [...SHOOTERS.map((sp, i) => ({ sp, i, keeper: false })), { sp: KEEPER, i: 0, keeper: true }];
    players.forEach((p, n) => {
      const x0 = 20 + (n % cols) * CW, y0 = 110 + Math.floor(n / cols) * CH;
      const g = this.add.graphics();
      g.fillStyle(0xffffff).fillRoundedRect(x0 + 8, y0 + 6, CW - 16, CH - 12, 20);
      g.lineStyle(5, INK).strokeRoundedRect(x0 + 8, y0 + 6, CW - 16, CH - 12, 20);
      c.add(g);
      const ring = this.add.circle(x0 + 76, y0 + 88, 54, p.keeper ? 0x22b267 : k.c1).setStrokeStyle(6, INK);
      const head = this.add.image(x0 + 76, y0 + 80, `hf-${p.sp}`).setDisplaySize(118, 118);
      const num = bigNumber(this, x0 + 76, y0 + 160, 32, `${p.keeper ? 1 : NUMBERS[p.i]}`);
      c.add([ring, head, num]);
      const stats: Stat[] = p.keeper ? ['ref'] : ['pow', 'acc'];
      stats.forEach((st, j) => {
        const ry = y0 + (p.keeper ? 104 : 62 + j * 84);
        const icBg = this.add.circle(x0 + 168, ry, 24, st === 'pow' ? PALETTE.red : st === 'acc' ? PALETTE.blue : PALETTE.green).setStrokeStyle(4, INK);
        const ic = this.add.image(icBg.x, ry, st === 'pow' ? 'ic-bolt' : st === 'acc' ? 'ic-target' : 'ic-glove').setDisplaySize(34, 34);
        c.add([icBg, ic]);
        const lv = statLevel(sq, st, p.i);
        const pips = this.add.graphics();
        for (let q = 0; q < MAX_LEVEL; q++) {
          const px = x0 + 202 + q * 13, on = q < lv;
          pips.fillStyle(on ? (st === 'pow' ? PALETTE.red : st === 'acc' ? PALETTE.blue : PALETTE.green) : 0xd9d2e6).fillRoundedRect(px, ry - 14, 10, 28, 4);
        }
        pips.lineStyle(2, INK, 0.6).strokeRoundedRect(x0 + 199, ry - 17, MAX_LEVEL * 13 + 3, 34, 6);
        c.add(pips);
        if (lv < MAX_LEVEL) {
          const cost = upgradeCost(lv), ok = cost <= coins;
          const b = iconButton(this, x0 + CW - 46, ry - 8, 'plus', ok ? PALETTE.green : 0x8a8296, 22, () => this.buy(st, p.i));
          const pc = this.add.image(x0 + CW - 64, ry + 26, 'ic-coin').setDisplaySize(20, 20);
          const pn = bigNumber(this, x0 + CW - 52, ry + 27, 18, `${cost}`).setOrigin(0, 0.5);
          if (!ok) pn.setColor('#ff8a8a');
          b.setData('stat', `${st}${p.i}`);
          c.add([b, pc, pn]);
        } else c.add(this.add.image(x0 + CW - 46, ry, 'ic-star').setDisplaySize(40, 40));
      });
    });
    this.input.keyboard?.once('keydown-ESC', () => this.closeSquad());
  }
  /** Upgrade (also used by the tests). */
  buy(stat: Stat, i = 0) {
    const r = upgrade(squad(), save.get('coins'), stat, i);
    if (!r.ok) { audio.tone(180, 0.18, 'square', 0.08, 120); this.cameras.main.shake(120, 0.004); return false; }
    save.set('squad', r.squad); save.set('coins', r.coins);
    [784, 988, 1319].forEach((f, j) => this.time.delayedCall(j * 60, () => audio.tone(f, 0.14, 'triangle', 0.12)));
    this.build();
    return true;
  }
  private closeSquad() {
    this.squadOpen = false;
    this.squadRoot?.destroy(); this.squadRoot = undefined;
    this.time.delayedCall(50, () => setModal(this, false));
    this.build();
  }

  /* ---------------------------------------------------------------- season end */
  private showSeasonEnd() {
    const e = save.get('seasonEnd');
    if (!e || this.endOpen) return;
    this.endOpen = true;
    setModal(this, true);
    const w = this.scale.width, h = this.scale.height;
    const s = Math.min((w - 20) / 640, (h - 20) / 520, 1.3);
    const root = modalPanel(this, 640 * s, 520 * s, 0xfff6e8, 70);
    this.endRoot = root;
    const c = this.add.container(w / 2 - 320 * s, h / 2 - 260 * s).setScale(s);
    root.add(c);
    const rays = this.add.graphics({ x: 320, y: 150 });
    rays.fillStyle(PALETTE.yellow, 0.4);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; rays.fillTriangle(0, 0, Math.cos(a - 0.13) * 160, Math.sin(a - 0.13) * 160, Math.cos(a + 0.13) * 160, Math.sin(a + 0.13) * 160); }
    this.tweens.add({ targets: rays, angle: 360, duration: 9000, repeat: -1 });
    c.add(rays);
    const first = e.rank === 1;
    c.add(this.add.image(first ? 250 : 320, 150, first ? 'ic-trophy' : `div-${e.div}`).setDisplaySize(170, 170));
    if (first) {
      if (e.promoted) {
        c.add(this.add.circle(410, 150, 34, PALETTE.green).setStrokeStyle(5, INK));
        c.add(this.add.image(410, 150, 'ic-up').setDisplaySize(44, 44));
        c.add(this.add.image(490, 150, `div-${e.div + 1}`).setDisplaySize(100, 100));
      } else c.add(this.add.image(440, 150, `div-${e.div}`).setDisplaySize(110, 110));
      const burst = this.add.particles(320, 150, 'px', { speed: { min: 200, max: 520 }, lifespan: 1400, gravityY: 500, rotate: { min: 0, max: 360 }, tint: [0xff5d5d, 0xffd23f, 0x4aa8ff, 0x3ddc84, 0xff6fae], emitting: false });
      burst.explode(60);
      c.add(burst);
      portal.happyTime();
    }
    c.add(bigNumber(this, 320, 300, 90, `${e.rank}`));
    c.add(this.add.image(270, 390, 'ic-coin').setDisplaySize(60, 60));
    c.add(bigNumber(this, 306, 392, 56, `+${e.coins}`).setOrigin(0, 0.5));
    const ok = iconButton(this, 320, 470, 'ok', PALETTE.green, 44, () => this.claimSeason());
    pulse(this, ok, 0.06);
    c.add(ok);
  }
  /** Collects the season reward and starts the next season (also used by the tests). */
  claimSeason() {
    const e = save.get('seasonEnd');
    if (!e) return;
    save.set('coins', save.get('coins') + e.coins);
    if (e.rank === 1) save.set('best', save.get('best') + 1);
    save.set('season', nextSeason(season(), (Math.random() * 1e9) | 0));
    save.set('seasonEnd', null);
    [659, 784, 988, 1319].forEach((f, j) => this.time.delayedCall(j * 80, () => audio.tone(f, 0.18, 'triangle', 0.13)));
    this.endRoot?.destroy(); this.endRoot = undefined;
    this.endOpen = false;
    this.time.delayedCall(50, () => setModal(this, false));
    this.build();
  }

  /** Next match (also called by the automatic tests). */
  go() {
    if (this.going || save.get('seasonEnd')) return;
    this.going = true;
    this.cameras.main.fadeOut(160, 127, 208, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Play'); this.going = false; });
  }
  home() { this.scene.start('Menu'); }
}

export function teamColours(id: number) { return id === 0 ? kit() : TEAMS[id]; }
