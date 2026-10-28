/** Tuning of Jelly Stack (world units; the camera zoom fits them to any screen). */
export const BH = 96;              // block height
export const TEX_W = 64;           // width of the 3-slice source texture
export const SLICE = 24;           // fixed left/right corner width of the 3-slice
export const MIN_W = 2 * SLICE + 4; // narrowest block the 3-slice can draw (narrower = miss)
export const BASE_W = 420;         // starting block width
export const MAX_W = 460;          // perfect combos can grow the block up to here
export const VIEW_W = 1360;        // world width that always fits on screen
export const VIEW_ROWS = 11;       // rows of blocks that always fit on screen
export const RANGE = 250;          // slider travel from the centre = half its width + this (a full miss is always possible)
export const PERFECT = 10;         // drop within this many units = perfect
export const GROW = 18;            // width gained per perfect after 5 in a row
export const SPEED0 = 330;         // slider speed at the start (units/s)
export const SPEED_STEP = 9;       // + per block
export const SPEED_MAX = 900;
export const GRAVITY = 2600;

/** Candy palette (flat colours, Nuvolet style): pink, orange, lemon, lime, mint, sky, grape. */
export const JELLY = [0xff6fae, 0xff9f43, 0xffd23f, 0x8be04e, 0x3fd8c4, 0x4aa8ff, 0xa67bff];

/** Sky gradient (top, bottom) by height: day → candy → sunset → night → space. */
export const SKY: [number, number, number][] = [
  [0, 0x6cc8ff, 0xd4f3ff],
  [15, 0xff8fcf, 0xffe0f0],
  [30, 0x9b6bff, 0xffa6d6],
  [45, 0x2f2a7a, 0x8a5fd6],
  [65, 0x0f0c2e, 0x2f2a7a],
];
