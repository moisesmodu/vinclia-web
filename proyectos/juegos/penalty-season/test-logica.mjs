// Pure-logic tests for Penalty Season (src/logic.ts, the same code the game runs), bundled with esbuild.
// Covers: swipe → shot, shot outcomes (goal, save, post, wide, over), curve vs keeper, shootout end rules,
// league table ordering and tiebreaks, schedule, season progression and promotion, stat upgrades, morale,
// and a Monte Carlo balance report (scoring and saving rates per division).
// Usage (from proyectos/juegos): node penalty-season/test-logica.mjs
import { build } from 'esbuild';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outfile = join(tmpdir(), `ps-logic-${process.pid}.mjs`);
await build({ entryPoints: [resolve(here, 'src/logic.ts')], bundle: true, format: 'esm', outfile, logLevel: 'warning' });
const L = await import(pathToFileURL(outfile).href);

let fails = 0, n = 0;
const ok = (label, cond, extra = '') => { n++; if (!cond) fails++; console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}${extra ? '  ' + extra : ''}`); };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

// ---------------------------------------------------------------- swipe → shot
{
  const unit = 200;
  const straight = [{ x: 0, y: 0, t: 0 }, { x: 0, y: -100, t: 0.08 }, { x: 0, y: -200, t: 0.16 }];
  const s1 = L.swipeToShot(straight, unit);
  ok('straight fast flick: aim centre, no curve', s1 && near(s1.aimX, 0) && s1.bulge === 0 && s1.s > 0.6, JSON.stringify(s1));
  const slow = [{ x: 0, y: 0, t: 0 }, { x: 0, y: -200, t: 0.9 }];
  ok('slow swipe = weak shot', L.swipeToShot(slow, unit).s < 0.15);
  const right = [{ x: 0, y: 0, t: 0 }, { x: 100, y: -200, t: 0.15 }];
  ok('swipe up-right aims right', L.swipeToShot(right, unit).aimX > 0.6);
  const pause = [{ x: 0, y: 0, t: 0 }, { x: 0, y: -10, t: 0.6 }, { x: 0, y: -110, t: 0.68 }, { x: 0, y: -210, t: 0.76 }];
  ok('a pause before the flick does not weaken it (flick speed)', Math.abs(L.swipeToShot(pause, unit).s - L.swipeToShot(straight, unit).s) < 0.05);
  const hold = [...straight, { x: 0, y: -200, t: 0.5 }];
  ok('resting the finger before lifting does not weaken it', Math.abs(L.swipeToShot(hold, unit).s - L.swipeToShot(straight, unit).s) < 0.05);
  const down = [{ x: 0, y: 0, t: 0 }, { x: 10, y: 80, t: 0.1 }];
  ok('downward swipe is not a shot', L.swipeToShot(down, unit) === null);
  const bowR = [{ x: 0, y: 0, t: 0 }, { x: 40, y: -100, t: 0.08 }, { x: 0, y: -200, t: 0.16 }];
  const bowL = [{ x: 0, y: 0, t: 0 }, { x: -40, y: -100, t: 0.08 }, { x: 0, y: -200, t: 0.16 }];
  ok('path bowing right → positive curve, left → negative', L.swipeToShot(bowR, unit).bulge > 0.3 && L.swipeToShot(bowL, unit).bulge < -0.3);
}

// ---------------------------------------------------------------- shot outcomes (deterministic)
{
  const sh = (tx, ty, T = 0.5, bulge = 0) => ({ tx, ty, T, bulge });
  ok('over the bar', L.shotOutcome(sh(0.3, 0.8), null) === 'over');
  ok('wide of the post', L.shotOutcome(sh(1.2, 0.3), null) === 'wide');
  ok('hits the post', L.shotOutcome(sh(0.99, 0.3), null) === 'post');
  ok('hits the bar', L.shotOutcome(sh(0.2, 0.66), null) === 'post');
  ok('corner, no keeper = goal', L.shotOutcome(sh(0.8, 0.4), null) === 'goal');
  const still = { startT: 99, fromX: 0, fromY: L.KEEPER_Y, toX: 0, toY: L.KEEPER_Y, speed: 2, reach: 0.25 };
  ok('straight at a keeper who does not move = save', L.shotOutcome(sh(0.05, 0.25), still) === 'save');
  ok('corner past a keeper who does not move = goal', L.shotOutcome(sh(0.8, 0.25), still) === 'goal');
  const dive = { startT: 0.1, fromX: 0, fromY: L.KEEPER_Y, toX: 0.8, toY: 0.3, speed: 3, reach: 0.25 };
  ok('keeper reaches the corner in time = save', L.shotOutcome(sh(0.8, 0.3, 0.5), dive) === 'save');
  ok('same dive but faster shot = goal', L.shotOutcome(sh(0.8, 0.3, 0.22), dive) === 'goal');
  const k = L.keeperAt(dive, 0.1 + 0.1);
  ok('keeper kinematics: 0.1 s after starting at speed 3 he moved 0.3', near(Math.hypot(k.x - 0, k.y - L.KEEPER_Y), 0.3, 1e-9));
  ok('ball path: bow peaks halfway, ends on target', near(L.ballAt(sh(0.5, 0.3, 0.5, 0.2), 1).x, 0.5) && near(L.ballAt(sh(0, 0.3, 0.5, 0.2), 0.5).x, 0.2));
}

// ---------------------------------------------------------------- shootout rules
{
  const T = true, F = false;
  ok('3-0 after 3 each is decided (they can reach 2 at most)', L.shootoutState([T, T, T], [F, F, F]) === 'won');
  ok('2-0 after 2 each is not', L.shootoutState([T, T], [F, F]) === 'ongoing');
  ok('3-0 after 4 vs 3: decided (they can reach 2 at most)', L.shootoutState([T, T, T, F], [F, F, F]) === 'won' || L.shootoutState([T, T, T], [F, F, F, F]) === 'won');
  ok('early win: 3-0 with them on 3 kicks after my 4th', L.shootoutState([T, T, T, T], [F, F, F]) === 'won');
  ok('early loss', L.shootoutState([F, F, F, F], [T, T, T, T]) === 'lost' || L.shootoutState([F, F, F], [T, T, T, T]) === 'lost');
  ok('5 each level → sudden death', L.shootoutState([T, T, F, T, T], [T, T, T, F, T]) === 'ongoing');
  ok('sudden death: I score, they miss → won', L.shootoutState([T, T, F, T, T, T], [T, T, T, F, T, F]) === 'won');
  ok('sudden death: wait for their kick', L.shootoutState([T, T, F, T, T, T], [T, T, T, F, T]) === 'ongoing');
  const rng = L.mulberry32(5);
  let sd = 0, bad = 0;
  for (let i = 0; i < 2000; i++) { const r = L.simShootout(2, 2, rng); if (r.sd) sd++; if (r.a === r.b) bad++; }
  ok('AI shootouts never end level; some go to sudden death', bad === 0 && sd > 100 && sd < 1200, `sudden death ${sd}/2000`);
}

// ---------------------------------------------------------------- league table
{
  const teams = [0, 1, 2, 3];
  const R = (home, away, hg, ag, sd = false) => ({ round: 0, home, away, hg, ag, sd });
  ok('points: 3 / 2 (sudden death win) / 1 (sudden death loss) / 0', L.points(5, 3, false) === 3 && L.points(6, 5, true) === 2 && L.points(5, 6, true) === 1 && L.points(2, 4, false) === 0);
  let t = L.table(teams, [R(0, 1, 4, 2), R(2, 3, 6, 5, true)]);
  ok('ordered by points (regulation win above sudden death win)', t.map((r) => r.id).join() === '0,2,3,1', t.map((r) => `${r.id}:${r.pts}`).join(' '));
  t = L.table(teams, [R(0, 1, 5, 2), R(2, 3, 4, 3)]);
  ok('same points → goal difference', t[0].id === 0 && t[1].id === 2);
  t = L.table(teams, [R(0, 1, 5, 3), R(2, 3, 4, 2)]);
  ok('same points and difference → goals scored', t[0].id === 0 && t[1].id === 2);
  // head to head: 1 and 2 level on everything, 2 beat 1
  t = L.table([1, 2, 3, 4], [R(1, 3, 4, 3), R(2, 4, 4, 3), R(2, 1, 3, 2), R(1, 4, 3, 2), R(3, 2, 3, 2), R(4, 3, 2, 1)]);
  const r1 = t.find((r) => r.id === 1), r2 = t.find((r) => r.id === 2);
  ok('fixture check: 1 and 2 level on pts, diff and goals', r1.pts === r2.pts && r1.gf - r1.ga === r2.gf - r2.ga && r1.gf === r2.gf, `${JSON.stringify(r1)} ${JSON.stringify(r2)}`);
  ok('still level → head-to-head (2 beat 1)', t.findIndex((r) => r.id === 2) < t.findIndex((r) => r.id === 1), t.map((r) => r.id).join());
  t = L.table([5, 3], []);
  ok('nothing played → fixed team order', t.map((r) => r.id).join() === '3,5');
}

// ---------------------------------------------------------------- schedule and season
{
  const teams = L.divisionTeams(0);
  const sc = L.schedule(teams);
  const pairs = new Map();
  let okRounds = sc.length === 10;
  for (const round of sc) {
    const seen = new Set(round.flat());
    if (seen.size !== 6) okRounds = false;
    for (const [a, b] of round) { const k = `${a}>${b}`; pairs.set(k, (pairs.get(k) || 0) + 1); }
  }
  ok('10 matchdays, every team plays once per matchday', okRounds);
  ok('double round robin: each ordered pair (home/away) exactly once', pairs.size === 30 && [...pairs.values()].every((v) => v === 1));
  let se = L.newSeason(0, 1, 1234);
  const opps = [];
  for (let r = 0; r < 10; r++) { opps.push(L.opponentOf(se).opp); se = L.playRound(se, { gf: 5, ga: 2, sd: false }); }
  ok('player meets each rival twice', [1, 2, 3, 4, 5].every((id) => opps.filter((o) => o === id).length === 2));
  ok('10 rounds → season over, 30 results', L.seasonOver(se) && se.results.length === 30);
  const end = L.seasonEnd(se);
  ok('winning every match → champion of division 1, promoted', end.rank === 1 && end.promoted && !end.champion && end.coins === 120, JSON.stringify(end));
  const s2 = L.nextSeason(se, 99);
  ok('next season: division 2, new teams, round 0', s2.div === 1 && s2.round === 0 && s2.teams.join() === '0,6,7,8,9,10' && s2.num === 2);
  let lose = L.newSeason(1, 2, 7);
  for (let r = 0; r < 10; r++) lose = L.playRound(lose, { gf: 1, ga: 4, sd: false });
  const e2 = L.seasonEnd(lose);
  ok('losing every match → last, no promotion, stays in division 2', e2.rank === 6 && !e2.promoted && L.nextSeason(lose, 1).div === 1);
  let top = L.newSeason(2, 5, 3);
  for (let r = 0; r < 10; r++) top = L.playRound(top, { gf: 5, ga: 1, sd: false });
  const e3 = L.seasonEnd(top);
  ok('top division won → champion, stays in the top division', e3.champion && !e3.promoted && L.nextSeason(top, 1).div === 2);
  ok('playRound is deterministic for the same season seed', JSON.stringify(L.playRound(L.newSeason(0, 1, 42), { gf: 3, ga: 2, sd: false })) === JSON.stringify(L.playRound(L.newSeason(0, 1, 42), { gf: 3, ga: 2, sd: false })));
  ok('playRound does not change the input season', (() => { const a = L.newSeason(0, 1, 9); L.playRound(a, { gf: 3, ga: 2, sd: false }); return a.round === 0 && a.results.length === 0; })());
}

// ---------------------------------------------------------------- squad, upgrades, morale, coins
{
  const sq = L.newSquad();
  ok('new squad: 5 shooters and a keeper at level 3', sq.pow.length === 5 && sq.acc.every((v) => v === 3) && sq.ref === 3);
  const u = L.upgrade(sq, 100, 'pow', 2);
  ok('upgrade costs 10 + 10 × level and raises one stat', u.ok && u.coins === 60 && u.squad.pow[2] === 4 && sq.pow[2] === 3);
  ok('not enough coins → no upgrade', !L.upgrade(sq, 39, 'acc', 0).ok);
  const maxed = { pow: [10, 3, 3, 3, 3], acc: [3, 3, 3, 3, 3], ref: 10 };
  ok('level 10 is the cap', !L.upgrade(maxed, 9999, 'pow', 0).ok && !L.upgrade(maxed, 9999, 'ref').ok);
  let total = 0; for (let lv = 3; lv < 10; lv++) total += L.upgradeCost(lv);
  ok('one stat from 3 to 10 costs ' + total + ' coins', total === 490);
  ok('morale: up on wins, down on losses, kept within 20..100', L.moraleAfter(95, true, false) === 100 && L.moraleAfter(25, false, false) === 20 && L.moraleAfter(60, true, true) === 68);
  ok('coins: win > loss, scale with division', L.matchCoins({ won: true, gf: 4, saves: 2, div: 0 }) === 45 && L.matchCoins({ won: false, gf: 2, saves: 1, div: 2 }) === 40);
}

// ---------------------------------------------------------------- stats matter (Monte Carlo)
{
  const rate = (r, inp, pow, acc, N = 6000) => {
    const rng = L.mulberry32(77); let g = 0;
    for (let i = 0; i < N; i++) {
      const sh = L.resolveShot(inp, pow, acc, 60, rng);
      const d = L.planKeeper(sh, L.keeperAI(r), L.keeperSway(rng() * 30, r), rng);
      if (L.shotOutcome(sh, d) === 'goal') g++;
    }
    return g / N;
  };
  const corner = { aimX: 0.75, s: 0.7, bulge: 0 }, curl = { aimX: 0.7, s: 0.7, bulge: -0.8 };
  const base1 = rate(1.5, corner, 3, 3), max1 = rate(1.5, corner, 10, 10), base3 = rate(4, corner, 3, 3), max3 = rate(4, corner, 10, 10);
  ok('upgraded shooters score more (division 1)', max1 > base1 + 0.1, `${base1.toFixed(2)} → ${max1.toFixed(2)}`);
  ok('division 3 keepers are harder', base3 < base1 - 0.15, `${base1.toFixed(2)} vs ${base3.toFixed(2)}`);
  ok('a curled shot beats the keeper more than a straight one', rate(3, curl, 5, 5) > rate(3, corner, 5, 5));
  ok('maxed squad can win the top division (> 55 % per kick)', max3 > 0.55, max3.toFixed(2));
  const save = (r, ref, delay) => {
    const rng = L.mulberry32(3); let s = 0;
    for (let i = 0; i < 6000; i++) {
      const sh = L.aiShot(r, rng);
      const d = L.playerDive(sh.tx + L.gauss(rng) * 0.2, sh.ty + L.gauss(rng) * 0.12, delay, L.playerKeeper(ref, 60));
      if (L.shotOutcome(sh, d) !== 'goal') s++;
    }
    return s / 6000;
  };
  const sv1 = save(1.5, 3, 0.35), sv10 = save(1.5, 10, 0.35), late = save(1.5, 3, 0.55);
  ok('better reflexes save more; late dives save less', sv10 > sv1 + 0.1 && late < sv1, `ref3 ${sv1.toFixed(2)} ref10 ${sv10.toFixed(2)} late ${late.toFixed(2)}`);
  const truth = (() => { const rng = L.mulberry32(8); let t = 0; for (let i = 0; i < 5000; i++) { const s = L.aiShot(1, rng); if (Math.sign(s.tx) === s.tell) t++; } return t / 5000; })();
  ok('the tell is honest most of the time in division 1', truth > 0.7 && truth < 0.95, truth.toFixed(2));
}

console.log(`\n${n - fails}/${n} checks passed`);
if (fails) process.exitCode = 1;
