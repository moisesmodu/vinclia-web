/**
 * The 25 Trick Floor levels, written as data with a tiny builder (more reliable than counting ASCII columns).
 * Every level is 12 rows tall: row 0 is the ceiling, rows 10-11 the floor, columns 0 and w-1 the walls.
 * The player stands on row 9 by default. Tile codes (see sim.ts):
 *   #  jelly block            .  empty               S  start
 *   E  exit door (final)      a b c  places the door runs away from, in that order
 *   ^  spikes (on the floor)  v  spikes (hanging from the ceiling)
 *   !  hidden spikes that pop out when you get close
 *   D  block that drops a moment after you stand on it     F  block that drops when you get close
 *   X  fake block (no collision)                            C  ceiling block that falls when you pass under it
 *   <  >  a wall block that shoots out as a dart in that direction when you are in front of it
 *   g  hidden zone that flips gravity up      n  hidden zone that sets gravity back down
 *   J  jelly spring
 * `par`: deaths allowed for 3 stars (about one per trap). Solvability is checked by trick-floor/test-niveles.mjs.
 */

export type Level = { rows: string[]; par: number };

class B {
  g: string[][];
  constructor(public w: number) {
    this.g = Array.from({ length: 12 }, (_, r) => Array.from({ length: w }, (_, c) => (r === 0 || r >= 10 || c === 0 || c === w - 1 ? '#' : '.')));
  }
  /** Fill the rectangle (inclusive) with a tile code. */
  r(c0: number, r0: number, c1: number, r1: number, ch: string) {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) this.g[r][c] = ch;
    return this;
  }
  p(c: number, r: number, ch: string) { this.g[r][c] = ch; return this; }
  /** A full-height zone column (rows 1-9). */
  z(c: number, ch: string, r0 = 1, r1 = 9) { return this.r(c, r0, c, r1, ch); }
  done(par: number): Level { return { rows: this.g.map((r) => r.join('')), par }; }
}
const mk = (w: number) => new B(w);

export const LEVELS: Level[] = [
  // 1 · the floor before the door drops
  mk(28).p(2, 9, 'S').r(9, 9, 9, 9, '#').r(16, 10, 17, 11, 'D').p(20, 9, 'E').done(1),
  // 2 · spikes that pop out of nowhere
  mk(30).p(2, 9, 'S').p(7, 9, '^').r(13, 9, 14, 9, '!').p(22, 9, '!').p(26, 9, 'E').done(2),
  // 3 · the door runs away up the stairs
  mk(30).p(2, 9, 'S').p(12, 9, 'a').r(18, 8, 19, 9, '#').r(22, 6, 28, 9, '#').p(24, 5, '!').p(26, 5, 'E').done(2),
  // 4 · one of the platforms is fake
  mk(30).p(2, 9, 'S').r(9, 9, 21, 9, '^').r(11, 8, 12, 8, '#').r(14, 8, 15, 8, 'X').r(16, 6, 17, 6, '#').r(20, 8, 21, 8, '#').p(26, 9, 'E').done(1),
  // 5 · the ceiling falls, then a floor tile drops
  mk(30).r(1, 1, 28, 6, '#').p(2, 9, 'S').r(13, 6, 14, 6, 'C').r(20, 10, 20, 11, 'D').p(26, 9, 'E').done(2),
  // 6 · the floor opens in front of you, then spikes pop
  mk(32).p(2, 9, 'S').r(10, 10, 12, 11, 'F').p(18, 9, '!').p(28, 9, 'E').done(2),
  // 7 · a dart shoots out of the step
  mk(34).r(1, 1, 32, 5, '#').p(2, 9, 'S').r(12, 10, 12, 11, 'D').r(24, 8, 32, 9, '#').p(24, 9, '<').p(29, 7, 'E').done(2),
  // 8 · gravity flips: walk on the ceiling
  mk(32).p(2, 9, 'S').z(8, 'g').r(8, 1, 9, 1, 'v').r(10, 9, 21, 9, '^').r(15, 1, 16, 1, 'v').z(22, 'n').p(28, 9, 'E').done(2),
  // 9 · bounce over the wall, one platform is fake
  mk(30).p(2, 9, 'S').p(12, 9, 'J').r(14, 5, 15, 9, '#').r(16, 9, 23, 9, '^').r(17, 6, 18, 6, 'X').r(19, 7, 20, 7, '#').p(27, 9, 'E').done(1),
  // 10 · the door runs away twice
  mk(34).p(2, 9, 'S').p(10, 9, 'a').r(14, 8, 15, 9, '#').r(17, 6, 22, 6, '#').p(20, 5, 'b').r(26, 9, 27, 9, '!').p(30, 9, 'E').done(2),
  // 11 · a step that sinks, a ceiling that falls
  mk(32).p(2, 9, 'S').r(7, 8, 8, 9, '#').r(9, 9, 17, 9, '^').r(11, 7, 12, 7, 'D').r(15, 6, 16, 6, '#').r(19, 1, 24, 4, '#').r(21, 4, 22, 4, 'C').p(28, 9, 'E').done(2),
  // 12 · spike field: a fake platform and a sinking one
  mk(34).p(2, 9, 'S').r(6, 9, 28, 9, '^').r(7, 8, 8, 8, '#').r(11, 8, 12, 8, 'X').r(12, 6, 13, 6, '#').r(16, 8, 17, 8, '#').r(20, 8, 21, 8, '#').r(24, 8, 25, 8, 'D').p(31, 9, 'E').done(2),
  // 13 · darts from the front and from behind, then pop spikes
  mk(34).p(2, 9, 'S').r(16, 8, 16, 9, '#').p(16, 9, '<').r(22, 8, 22, 9, '#').p(22, 9, '>').p(28, 9, '!').p(31, 9, 'E').done(3),
  // 14 · gravity corridor with a hidden flip
  mk(34).p(2, 9, 'S').z(6, 'g').r(8, 9, 13, 9, '^').z(14, 'n').r(16, 1, 20, 1, 'v').r(23, 8, 23, 9, 'g').r(23, 1, 27, 1, 'v').p(30, 9, 'E').done(2),
  // 15 · the floor keeps opening
  mk(36).p(2, 9, 'S').r(8, 10, 9, 11, 'F').r(14, 10, 16, 11, 'F').r(22, 10, 23, 11, 'F').r(29, 10, 30, 11, 'D').p(33, 9, 'E').done(3),
  // 16 · three falling ceilings and a shy door
  mk(34).r(1, 1, 32, 6, '#').p(2, 9, 'S').p(10, 6, 'C').r(16, 6, 17, 6, 'C').p(23, 6, 'C').p(27, 9, 'a').p(31, 9, 'E').done(3),
  // 17 · do not trust the first spring
  mk(32).p(2, 9, 'S').r(6, 1, 10, 3, '#').r(6, 4, 10, 4, 'v').p(8, 9, 'J').p(12, 9, 'J').r(14, 6, 15, 9, '#').p(19, 9, '!').p(28, 9, 'E').done(2),
  // 18 · the door escapes to the ceiling
  mk(34).p(2, 9, 'S').p(12, 9, 'a').z(18, 'g').p(22, 1, 'v').p(27, 1, 'E').done(2),
  // 19 · the bridge starts with a fake
  mk(32).r(1, 6, 4, 9, '#').p(2, 5, 'S').r(5, 9, 26, 9, '^').r(5, 6, 7, 6, 'X').r(8, 6, 12, 6, '#').r(15, 6, 19, 6, '#').p(17, 5, '!').r(22, 6, 26, 6, '#').p(29, 9, 'E').done(2),
  // 20 · the door runs back to the start
  mk(36).r(1, 1, 34, 5, '#').p(2, 9, 'S').r(9, 10, 10, 11, 'D').r(16, 5, 17, 5, 'C').p(24, 9, 'a').p(30, 9, 'b').p(5, 9, 'E').done(3),
  // 21 · upside down, a dart comes along the ceiling
  mk(34).p(2, 9, 'S').z(10, 'g').r(11, 9, 24, 9, '^').z(25, 'n').r(28, 1, 32, 2, '#').p(28, 1, '<').p(31, 9, 'E').done(2),
  // 22 · open floor, falling ceiling, a dart from the step
  mk(38).r(1, 1, 36, 5, '#').p(2, 9, 'S').r(8, 10, 10, 11, 'F').r(15, 5, 16, 5, 'C').r(21, 10, 22, 11, 'F').r(30, 8, 36, 9, '#').p(30, 9, '<').p(34, 7, 'E').done(3),
  // 23 · spring up, fake platform, sinking platform
  mk(34).p(2, 9, 'S').p(5, 9, 'J').r(7, 9, 26, 9, '^').r(8, 5, 11, 5, '#').r(14, 5, 16, 5, 'X').r(14, 7, 15, 7, '#').r(19, 7, 20, 7, '#').r(23, 7, 24, 7, 'D').p(30, 9, 'E').done(2),
  // 24 · up, down and up again
  mk(36).p(2, 9, 'S').z(6, 'g').r(7, 9, 14, 9, '^').p(11, 1, '!').z(15, 'n').p(19, 9, '!').z(23, 'g').r(24, 9, 33, 9, '^').p(28, 1, 'v').p(32, 1, 'E').done(3),
  // 25 · the grand escape
  mk(38).p(2, 9, 'S').p(8, 9, 'a').r(12, 8, 13, 9, '#').r(15, 6, 16, 6, 'D').r(18, 4, 22, 4, '#').p(20, 3, 'b').r(27, 10, 29, 11, 'F').p(32, 9, '!').p(35, 9, 'E').done(4),
];
