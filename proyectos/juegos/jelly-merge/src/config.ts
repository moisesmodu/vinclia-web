/** Tuning of Jelly Merge (world units; the camera zoom fits the jar to any screen, portrait or landscape). */
export const JAR_W = 500;          // inner width of the jar
export const JAR_H = 620;          // inner height (floor at y = 0, rim at y = -JAR_H)
export const WALL = 26;            // wall thickness (drawn and physical)
export const LINE_Y = -JAR_H;      // the top line: a settled jelly above it for OVER_S seconds ends the run
export const OVER_S = 2;           // seconds over the line before game over
export const WARN = 90;            // the line glows when the stack is this close to it
export const HOLD_Y = -JAR_H - 96; // centre of the jelly waiting to be dropped
export const VIEW_W = JAR_W + 2 * WALL + 40;
export const VIEW_TOP = -JAR_H - 250;
export const VIEW_BOTTOM = WALL + 24;
export const STEP_MS = 1000 / 60;  // fixed physics step
export const COOLDOWN = 0.55;      // seconds between drops (simulation time)
export const FRESH = 1.0;          // a jelly younger than this (s) never counts as over the line
export const TEX = 1.25;           // jelly textures are drawn this much bigger than their world size (crisp on DPR 2)

/** Radius of every tier. Two of a tier merge into the next; two of the last tier become a cloud that floats away. */
export const RADII = [24, 32, 42, 53, 65, 79, 95, 113, 133];
export const TIERS = RADII.length;
/** Points for creating each tier by a merge (index = new tier); CLOUD_PTS for a cloud. */
export const POINTS = [0, 2, 4, 7, 11, 16, 22, 30, 40];
export const CLOUD_PTS = 120;
/** Drop tiers: chance weights for tiers 0..4. */
export const SPAWN = [30, 26, 22, 14, 8];
/** After LATE_S seconds of a run the drops get a little bigger (tier 5 too), so long runs come to an end. */
export const SPAWN_LATE = [22, 22, 22, 16, 11, 7];
export const LATE_S = 180;
/** Coins of a run: one per COIN_PTS points, plus CLOUD_COINS per cloud. */
export const COIN_PTS = 40;
export const CLOUD_COINS = 5;

/** Candy palette (flat colours, Nuvolet style): one colour per tier. */
export const JELLY = [0xff6fae, 0xff9f43, 0xffd23f, 0x8be04e, 0x3fd8c4, 0x4aa8ff, 0xa67bff, 0xff5d73, 0xffb3e6];
