import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { TEAMS, type Species } from './logic';

/**
 * Everything drawn by code in the Nuvolet style (thick ink outlines, flat bright colours), baked once into textures:
 * animal heads (front, back, profile), keeper and shooter bodies per kit, team badges, balls, kits, icons and the
 * stadium (stands, pitch in true perspective, net and goal frame).
 */
const INK = PALETTE.ink, W = 0xffffff;
type G = Phaser.GameObjects.Graphics;

export function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void, replace = false) {
  if (scene.textures.exists(key)) { if (!replace) return key; scene.textures.remove(key); }
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
  return key;
}
const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
const hex = (c: number) => c.toString(16).padStart(6, '0');
function shade(c: number, k: number) {
  const r = (c >> 16) & 255, gg = (c >> 8) & 255, b = c & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1))));
  return (f(r) << 16) | (f(gg) << 8) | f(b);
}

/* ------------------------------------------------------------------ species looks */
type Ear = 'point' | 'round' | 'long' | 'none' | 'floppy' | 'tuft' | 'cow';
type Look = { fur: number; muzzle: number; ear: Ear; earIn?: number; extra?: 'mane' | 'stripes' | 'panda' | 'mask' | 'spots' | 'owl' | 'penguin' | 'frog' | 'pig' | 'koala'; tail: number; tailTip?: number };
export const LOOKS: Record<Species, Look> = {
  fox: { fur: 0xff8a3d, muzzle: 0xfff1e0, ear: 'point', earIn: INK, tail: 0xff8a3d, tailTip: W },
  bear: { fur: 0xa8693a, muzzle: 0xe8c39a, ear: 'round', earIn: 0xe8c39a, tail: 0xa8693a },
  cat: { fur: 0xb5b3c8, muzzle: W, ear: 'point', earIn: 0xff9ec0, tail: 0xb5b3c8, tailTip: W },
  rabbit: { fur: 0xf4f1fa, muzzle: W, ear: 'long', earIn: 0xff9ec0, tail: W },
  frog: { fur: 0x6fd36a, muzzle: 0xd9f7c0, ear: 'none', extra: 'frog', tail: 0x6fd36a },
  panda: { fur: W, muzzle: W, ear: 'round', earIn: 0x2b2a35, extra: 'panda', tail: W },
  pig: { fur: 0xffb3c7, muzzle: 0xff8fae, ear: 'floppy', earIn: 0xff8fae, extra: 'pig', tail: 0xffb3c7 },
  lion: { fur: 0xffc857, muzzle: 0xfff1d0, ear: 'round', earIn: 0xd9822b, extra: 'mane', tail: 0xffc857, tailTip: 0xd9822b },
  koala: { fur: 0xa7aebd, muzzle: 0xdfe3ea, ear: 'round', earIn: W, extra: 'koala', tail: 0xa7aebd },
  dog: { fur: 0xe2a865, muzzle: 0xfff1e0, ear: 'floppy', earIn: 0x8b5a2b, tail: 0xe2a865 },
  mouse: { fur: 0xb8b8c8, muzzle: 0xf2f2f7, ear: 'round', earIn: 0xff9ec0, tail: 0xff9ec0 },
  owl: { fur: 0x9c6b3d, muzzle: 0xf0d9b5, ear: 'tuft', extra: 'owl', tail: 0x9c6b3d },
  penguin: { fur: 0x34314a, muzzle: W, ear: 'none', extra: 'penguin', tail: 0x34314a },
  tiger: { fur: 0xff8f2a, muzzle: W, ear: 'round', earIn: W, extra: 'stripes', tail: 0xff8f2a, tailTip: INK },
  raccoon: { fur: 0x8f93a3, muzzle: W, ear: 'point', earIn: 0x3c3a4a, extra: 'mask', tail: 0x8f93a3, tailTip: 0x3c3a4a },
  cow: { fur: W, muzzle: 0xffb3c7, ear: 'cow', earIn: 0xffb3c7, extra: 'spots', tail: W },
};

/** Ears behind the head. cx, cy: head centre, r: radius. side = 1 draws both, used by front and back views. */
function ears(g: G, L: Look, cx: number, cy: number, r: number) {
  const lw = r * 0.12;
  g.lineStyle(lw, INK);
  for (const s of [-1, 1]) {
    const ex = cx + s * r * 0.62, ey = cy - r * 0.7;
    switch (L.ear) {
      case 'point': {
        const p = [V(ex - s * r * 0.42, ey + r * 0.25), V(ex + s * r * 0.12, ey - r * 0.62), V(ex + s * r * 0.38, ey + r * 0.32)];
        g.fillStyle(L.fur); g.fillPoints(p, true); g.strokePoints(p, true, true);
        if (L.earIn !== undefined) { g.fillStyle(L.earIn); g.fillTriangle(ex - s * r * 0.18, ey + r * 0.1, ex + s * r * 0.1, ey - r * 0.36, ex + s * r * 0.22, ey + r * 0.16); }
        break;
      }
      case 'round': case 'tuft': {
        const rr = L.ear === 'tuft' ? r * 0.26 : L.extra === 'koala' ? r * 0.46 : r * 0.34;
        if (L.ear === 'tuft') {
          const p = [V(ex - s * r * 0.3, ey + r * 0.3), V(ex + s * r * 0.15, ey - r * 0.45), V(ex + s * r * 0.3, ey + r * 0.3)];
          g.fillStyle(L.fur); g.fillPoints(p, true); g.strokePoints(p, true, true);
        } else {
          g.fillStyle(L.extra === 'panda' ? 0x2b2a35 : L.fur); g.fillCircle(ex + s * r * 0.05, ey + r * 0.05, rr); g.strokeCircle(ex + s * r * 0.05, ey + r * 0.05, rr);
          if (L.earIn !== undefined && L.extra !== 'panda') { g.fillStyle(L.earIn); g.fillCircle(ex + s * r * 0.05, ey + r * 0.1, rr * 0.55); }
        }
        break;
      }
      case 'long': {
        g.fillStyle(L.fur); g.fillEllipse(ex - s * r * 0.15, ey - r * 0.38, r * 0.42, r * 1.05); g.strokeEllipse(ex - s * r * 0.15, ey - r * 0.38, r * 0.42, r * 1.05);
        g.fillStyle(L.earIn!); g.fillEllipse(ex - s * r * 0.15, ey - r * 0.34, r * 0.2, r * 0.72);
        break;
      }
      case 'floppy': case 'cow': {
        const fx = cx + s * r * 0.9, fy = cy - r * 0.35;
        g.fillStyle(L.ear === 'cow' ? L.fur : L.earIn ?? L.fur);
        g.fillEllipse(fx, fy + r * 0.15, r * 0.45, r * 0.75); g.strokeEllipse(fx, fy + r * 0.15, r * 0.45, r * 0.75);
        if (L.ear === 'cow') {
          g.fillStyle(0xfff1c0); const hx = cx + s * r * 0.45, hy = cy - r * 0.95;
          g.fillTriangle(hx - r * 0.12, hy + r * 0.2, hx + r * 0.12, hy + r * 0.2, hx + s * r * 0.08, hy - r * 0.25);
          g.strokeTriangle(hx - r * 0.12, hy + r * 0.2, hx + r * 0.12, hy + r * 0.2, hx + s * r * 0.08, hy - r * 0.25);
        }
        break;
      }
      default: break;
    }
  }
}

function headBase(g: G, L: Look, cx: number, cy: number, r: number) {
  const lw = r * 0.12;
  if (L.extra === 'mane') {
    g.fillStyle(0xd9822b); g.lineStyle(lw, INK);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillCircle(cx + Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 1.02, r * 0.36); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.strokeCircle(cx + Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 1.02, r * 0.36); }
    g.fillStyle(0xd9822b); g.fillCircle(cx, cy, r * 1.12);
  }
  ears(g, L, cx, cy, r);
  if (L.extra === 'frog') {
    g.lineStyle(lw, INK); g.fillStyle(L.fur);
    for (const s of [-1, 1]) { g.fillCircle(cx + s * r * 0.48, cy - r * 0.72, r * 0.36); g.strokeCircle(cx + s * r * 0.48, cy - r * 0.72, r * 0.36); }
  }
  g.lineStyle(lw, INK); g.fillStyle(L.fur);
  g.fillCircle(cx, cy, r); g.strokeCircle(cx, cy, r);
  if (L.extra === 'frog') { g.fillStyle(L.fur); for (const s of [-1, 1]) g.fillCircle(cx + s * r * 0.48, cy - r * 0.68, r * 0.3); }
}

/** Front head. eyes = false leaves the eyes out (portraits draw movable eye sprites on top). */
export function drawHeadFront(g: G, sp: Species, cx: number, cy: number, r: number, eyes = true) {
  const L = LOOKS[sp], lw = r * 0.12;
  headBase(g, L, cx, cy, r);
  if (L.extra === 'spots') { g.fillStyle(0x2b2a35); g.fillEllipse(cx - r * 0.45, cy - r * 0.45, r * 0.6, r * 0.45); g.fillEllipse(cx + r * 0.62, cy - r * 0.1, r * 0.3, r * 0.4); }
  if (L.extra === 'stripes') { g.lineStyle(lw * 0.9, INK); for (const dx of [-0.25, 0, 0.25]) g.lineBetween(cx + dx * r, cy - r * 0.95, cx + dx * r * 0.8, cy - r * 0.6); for (const s of [-1, 1]) { g.lineBetween(cx + s * r * 0.98, cy, cx + s * r * 0.7, cy + r * 0.05); } }
  if (L.extra === 'penguin') { g.fillStyle(W); g.fillEllipse(cx, cy + r * 0.12, r * 1.5, r * 1.4); }
  if (L.extra === 'owl') { g.fillStyle(L.muzzle); g.fillCircle(cx - r * 0.36, cy - r * 0.05, r * 0.38); g.fillCircle(cx + r * 0.36, cy - r * 0.05, r * 0.38); }
  if (L.extra === 'panda') { g.fillStyle(0x2b2a35); for (const s of [-1, 1]) g.fillEllipse(cx + s * r * 0.36, cy - r * 0.02, r * 0.42, r * 0.55); }
  if (L.extra === 'mask') { g.fillStyle(0x3c3a4a); g.fillEllipse(cx - r * 0.38, cy - r * 0.08, r * 0.62, r * 0.42); g.fillEllipse(cx + r * 0.38, cy - r * 0.08, r * 0.62, r * 0.42); }
  // muzzle
  if (!['owl', 'penguin', 'frog', 'pig'].includes(L.extra ?? '')) { g.fillStyle(L.muzzle); g.fillEllipse(cx, cy + r * 0.38, r * 1.0, r * 0.66); }
  if (L.extra === 'pig') { g.fillStyle(L.muzzle); g.lineStyle(lw * 0.7, INK); g.fillEllipse(cx, cy + r * 0.32, r * 0.62, r * 0.42); g.strokeEllipse(cx, cy + r * 0.32, r * 0.62, r * 0.42); g.fillStyle(INK); g.fillEllipse(cx - r * 0.12, cy + r * 0.32, r * 0.1, r * 0.16); g.fillEllipse(cx + r * 0.12, cy + r * 0.32, r * 0.1, r * 0.16); }
  // cheeks
  g.fillStyle(0xff7aa8, 0.45); g.fillCircle(cx - r * 0.62, cy + r * 0.3, r * 0.16); g.fillCircle(cx + r * 0.62, cy + r * 0.3, r * 0.16);
  if (eyes) for (const s of [-1, 1]) drawEye(g, cx + s * r * 0.36, cy - r * 0.04 + (L.extra === 'frog' ? -r * 0.6 : 0), r);
  // nose / beak / mouth
  g.fillStyle(INK);
  if (L.extra === 'owl' || L.extra === 'penguin') {
    g.fillStyle(0xffa62b); g.lineStyle(lw * 0.6, INK);
    g.fillTriangle(cx - r * 0.16, cy + r * 0.18, cx + r * 0.16, cy + r * 0.18, cx, cy + r * 0.48); g.strokeTriangle(cx - r * 0.16, cy + r * 0.18, cx + r * 0.16, cy + r * 0.18, cx, cy + r * 0.48);
  } else if (L.extra !== 'pig') {
    if (L.extra === 'koala') g.fillEllipse(cx, cy + r * 0.22, r * 0.36, r * 0.5);
    else if (L.extra !== 'frog') g.fillEllipse(cx, cy + r * 0.2, r * 0.26, r * 0.18);
    g.lineStyle(lw * 0.6, INK);
    g.beginPath(); g.arc(cx - r * 0.12, cy + r * 0.42, r * 0.13, 0.2, Math.PI - 0.2); g.strokePath();
    g.beginPath(); g.arc(cx + r * 0.12, cy + r * 0.42, r * 0.13, 0.2, Math.PI - 0.2); g.strokePath();
  } else {
    g.lineStyle(lw * 0.6, INK); g.beginPath(); g.arc(cx, cy + r * 0.62, r * 0.14, 0.3, Math.PI - 0.3); g.strokePath();
  }
}
export function drawEye(g: G, x: number, y: number, r: number) {
  g.fillStyle(INK); g.fillEllipse(x, y, r * 0.2, r * 0.27);
  g.fillStyle(W); g.fillCircle(x + r * 0.04, y - r * 0.06, r * 0.05);
}

/** Back of the head (the shooter is seen from behind). */
function drawHeadBack(g: G, sp: Species, cx: number, cy: number, r: number) {
  const L = LOOKS[sp];
  headBase(g, L, cx, cy, r);
  if (L.extra === 'spots') { g.fillStyle(0x2b2a35); g.fillEllipse(cx + r * 0.3, cy - r * 0.3, r * 0.6, r * 0.5); }
  if (L.extra === 'stripes') { g.lineStyle(r * 0.12, INK); for (const dx of [-0.35, 0, 0.35]) g.lineBetween(cx + dx * r, cy - r * 0.9, cx + dx * r, cy - r * 0.3); }
  g.fillStyle(0x000000, 0.08); g.fillEllipse(cx, cy + r * 0.45, r * 1.4, r * 0.7);
}
/** Profile looking right (the glance before the kick). */
function drawHeadSide(g: G, sp: Species, cx: number, cy: number, r: number) {
  const L = LOOKS[sp], lw = r * 0.12;
  headBase(g, L, cx, cy, r);
  g.lineStyle(lw, INK);
  if (L.extra === 'owl' || L.extra === 'penguin') {
    if (L.extra === 'penguin') { g.fillStyle(W); g.fillEllipse(cx + r * 0.45, cy + r * 0.1, r * 0.9, r * 1.2); }
    g.fillStyle(0xffa62b); g.fillTriangle(cx + r * 0.8, cy, cx + r * 0.8, cy + r * 0.3, cx + r * 1.25, cy + r * 0.15); g.strokeTriangle(cx + r * 0.8, cy, cx + r * 0.8, cy + r * 0.3, cx + r * 1.25, cy + r * 0.15);
  } else if (L.extra !== 'frog') {
    g.fillStyle(L.extra === 'pig' ? L.muzzle : L.muzzle); g.fillEllipse(cx + r * 0.78, cy + r * 0.3, r * 0.7, r * 0.55); g.strokeEllipse(cx + r * 0.78, cy + r * 0.3, r * 0.7, r * 0.55);
    g.fillStyle(L.fur); g.fillCircle(cx + r * 0.2, cy + r * 0.05, r * 0.72);
    g.fillStyle(INK); g.fillEllipse(cx + r * 1.08, cy + r * 0.2, r * 0.18, r * 0.16);
  }
  if (L.extra === 'mask' || L.extra === 'panda') { g.fillStyle(0x2b2a35); g.fillEllipse(cx + r * 0.5, cy - r * 0.05, r * 0.5, r * 0.45); }
  drawEye(g, cx + r * 0.55, cy - r * 0.08 + (L.extra === 'frog' ? -r * 0.55 : 0), r);
  g.fillStyle(0xff7aa8, 0.45); g.fillCircle(cx + r * 0.35, cy + r * 0.38, r * 0.16);
}

export const HEAD = 128;
/** Heads: hf (front with eyes), he (front, no eyes), hb (back), hs (profile right). Origin centre, radius 46. */
export function makeHeads(scene: Phaser.Scene, sp: Species) {
  bake(scene, `hf-${sp}`, HEAD, HEAD, (g) => drawHeadFront(g, sp, 64, 70, 40, true));
  bake(scene, `he-${sp}`, HEAD, HEAD, (g) => drawHeadFront(g, sp, 64, 70, 40, false));
  bake(scene, `hb-${sp}`, HEAD, HEAD, (g) => drawHeadBack(g, sp, 64, 70, 40));
  bake(scene, `hs-${sp}`, HEAD, HEAD, (g) => drawHeadSide(g, sp, 64, 70, 40));
}

/* ------------------------------------------------------------------ bodies */
/** Keeper body seen from the front (no head): 220×170, neck at (110, 40). Arms up, big gloves. */
export function keeperBody(scene: Phaser.Scene, sp: Species, c1: number, c2: number) {
  const key = `kb-${sp}-${hex(c1)}-${hex(c2)}`;
  const fur = LOOKS[sp].fur;
  return bake(scene, key, 220, 170, (g) => {
    g.lineStyle(6, INK);
    // legs, socks and boots
    for (const s of [-1, 1]) {
      g.fillStyle(fur); g.fillRoundedRect(110 + s * 26 - 12, 118, 24, 22, 6); g.strokeRoundedRect(110 + s * 26 - 12, 118, 24, 22, 6);
      g.fillStyle(c1); g.fillRoundedRect(110 + s * 26 - 13, 134, 26, 18, 5); g.strokeRoundedRect(110 + s * 26 - 13, 134, 26, 18, 5);
      g.fillStyle(INK); g.fillRoundedRect(110 + s * 30 - 17, 150, 34, 16, 7);
    }
    g.fillStyle(c2); g.fillRoundedRect(68, 100, 84, 30, 10); g.strokeRoundedRect(68, 100, 84, 30, 10);
    // arms (sleeves) raised outward
    for (const s of [-1, 1]) {
      g.lineStyle(26, INK); g.lineBetween(110 + s * 34, 52, 110 + s * 80, 22);
      g.lineStyle(16, c1); g.lineBetween(110 + s * 34, 52, 110 + s * 80, 22);
    }
    g.lineStyle(6, INK);
    g.fillStyle(c1); g.fillRoundedRect(64, 36, 92, 76, 22); g.strokeRoundedRect(64, 36, 92, 76, 22);
    g.fillStyle(c2); g.fillRect(70, 70, 80, 10);
    g.fillStyle(W, 0.25); g.fillRoundedRect(76, 44, 20, 50, 8);
    // gloves
    for (const s of [-1, 1]) {
      g.fillStyle(0xfff3a8); g.fillCircle(110 + s * 88, 18, 17); g.strokeCircle(110 + s * 88, 18, 17);
      g.fillStyle(0xffffff, 0.6); g.fillCircle(110 + s * 88 - 5, 12, 5);
    }
  });
}

/** Shooter body seen from behind (no head): 170×210, neck at (85, 40), feet at the bottom. */
export function shooterBody(scene: Phaser.Scene, sp: Species, c1: number, c2: number) {
  const key = `sb-${sp}-${hex(c1)}-${hex(c2)}`;
  const L = LOOKS[sp];
  return bake(scene, key, 170, 210, (g) => {
    g.lineStyle(6, INK);
    // tail
    const big = sp === 'fox' || sp === 'raccoon' || sp === 'lion' || sp === 'tiger' || sp === 'cat' || sp === 'mouse';
    if (big) {
      g.fillStyle(L.tail);
      if (sp === 'fox' || sp === 'raccoon') { g.fillEllipse(36, 126, 40, 78); g.strokeEllipse(36, 126, 40, 78); if (L.tailTip !== undefined) { g.fillStyle(L.tailTip); g.fillEllipse(30, 98, 26, 26); } }
      else { g.lineStyle(14, INK); g.lineBetween(52, 128, 22, 96); g.lineStyle(7, L.tail); g.lineBetween(52, 128, 22, 96); if (L.tailTip !== undefined) { g.fillStyle(L.tailTip); g.fillCircle(22, 96, 9); } }
    } else { g.fillStyle(L.tail); g.lineStyle(6, INK); g.fillCircle(54, 132, 12); g.strokeCircle(54, 132, 12); }
    g.lineStyle(6, INK);
    // legs, socks, boots
    for (const s of [-1, 1]) {
      g.fillStyle(L.fur); g.fillRoundedRect(85 + s * 20 - 11, 140, 22, 22, 5); g.strokeRoundedRect(85 + s * 20 - 11, 140, 22, 22, 5);
      g.fillStyle(c1); g.fillRoundedRect(85 + s * 20 - 12, 158, 24, 30, 5); g.strokeRoundedRect(85 + s * 20 - 12, 158, 24, 30, 5);
      g.fillStyle(c2); g.fillRect(85 + s * 20 - 9, 166, 18, 5);
      g.fillStyle(INK); g.fillRoundedRect(85 + s * 20 - 14, 188, 30, 16, 7);
    }
    g.fillStyle(c2); g.fillRoundedRect(50, 116, 70, 32, 9); g.strokeRoundedRect(50, 116, 70, 32, 9);
    // arms
    for (const s of [-1, 1]) {
      g.fillStyle(L.fur); g.fillRoundedRect(85 + s * 44 - 10, 62, 20, 56, 9); g.strokeRoundedRect(85 + s * 44 - 10, 62, 20, 56, 9);
      g.fillStyle(c1); g.fillRoundedRect(85 + s * 42 - 13, 50, 26, 30, 9); g.strokeRoundedRect(85 + s * 42 - 13, 50, 26, 30, 9);
    }
    g.fillStyle(c1); g.fillRoundedRect(46, 40, 78, 84, 20); g.strokeRoundedRect(46, 40, 78, 84, 20);
    g.fillStyle(c2); g.fillRoundedRect(72, 38, 26, 10, 4);
    g.fillStyle(W, 0.2); g.fillRoundedRect(54, 50, 14, 60, 6);
  });
}

/* ------------------------------------------------------------------ badges, kits, balls */
/** Team badge: shield in the club colours with the animal's face. */
export function badge(scene: Phaser.Scene, key: string, sp: Species, c1: number, c2: number, replace = false) {
  return bake(scene, key, 104, 120, (g) => {
    const pts = [V(8, 10), V(96, 10), V(96, 60), V(52, 112), V(8, 60)];
    g.fillStyle(c1); g.fillPoints(pts, true);
    g.fillStyle(c2); g.fillTriangle(8, 60, 8, 92, 52, 112); g.fillTriangle(96, 60, 96, 92, 52, 112);
    g.fillStyle(c2); g.fillRect(8, 10, 88, 12);
    g.lineStyle(7, INK); g.strokePoints(pts, true, true);
    drawHeadFront(g, sp, 52, 56, 24, true);
  }, replace);
}
export function makeBadges(scene: Phaser.Scene) {
  for (const t of TEAMS) if (t.id > 0) badge(scene, `bd-${t.id}`, t.species, t.c1, t.c2);
}

export type KitDef = { id: string; c1: number; c2: number };
export function kitIcon(scene: Phaser.Scene, k: KitDef) {
  return bake(scene, `kit-${k.id}`, 140, 130, (g) => {
    g.lineStyle(7, INK);
    const pts = [V(40, 12), V(56, 12), V(70, 24), V(84, 12), V(100, 12), V(132, 38), V(114, 62), V(104, 54), V(104, 120), V(36, 120), V(36, 54), V(26, 62), V(8, 38)];
    g.fillStyle(k.c1); g.fillPoints(pts, true);
    g.fillStyle(k.c2); g.fillRect(36, 70, 68, 14); g.fillTriangle(56, 12, 84, 12, 70, 26);
    g.strokePoints(pts, true, true);
    g.fillStyle(W, 0.25); g.fillRoundedRect(44, 30, 12, 80, 5);
  });
}

export type BallDef = { id: string; base: number; mark: number; style: 'classic' | 'beach' | 'melon' | 'tennis' | 'star' | 'gold' };
export function ballTex(scene: Phaser.Scene, b: BallDef) {
  return bake(scene, `ball-${b.id}`, 96, 96, (g) => {
    const c = 48, r = 42;
    g.fillStyle(b.base); g.fillCircle(c, c, r);
    g.fillStyle(b.mark);
    if (b.style === 'classic' || b.style === 'gold') {
      const pent = (x: number, y: number, s: number) => g.fillPoints([0, 1, 2, 3, 4].map((i) => V(x + Math.cos(-Math.PI / 2 + i * 1.2566) * s, y + Math.sin(-Math.PI / 2 + i * 1.2566) * s)), true);
      pent(c, c, 13);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; pent(c + Math.cos(a) * 34, c + Math.sin(a) * 34, 10); }
      g.lineStyle(2.5, b.mark, 0.9);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; g.lineBetween(c + Math.cos(a) * 13, c + Math.sin(a) * 13, c + Math.cos(a) * 25, c + Math.sin(a) * 25); }
    } else if (b.style === 'beach') {
      const cols = [0xff5d5d, 0xffd23f, 0x4aa8ff, 0x3ddc84, 0xff6fae, 0xffffff];
      for (let i = 0; i < 6; i++) { g.fillStyle(cols[i]); g.slice(c, c, r, i * Math.PI / 3, (i + 1) * Math.PI / 3, false); g.fillPath(); }
      g.fillStyle(W); g.fillCircle(c, c, 9);
    } else if (b.style === 'melon') {
      g.lineStyle(7, b.mark);
      for (const dx of [-24, -8, 8, 24]) { g.beginPath(); g.arc(c + dx * 3, c, Math.abs(dx * 3) + 1, Math.PI * 0.75, Math.PI * 1.25); g.strokePath(); }
      for (const dx of [-26, -9, 9, 26]) g.lineBetween(c + dx, c - 38 + Math.abs(dx) * 0.4, c + dx, c + 38 - Math.abs(dx) * 0.4);
    } else if (b.style === 'tennis') {
      g.lineStyle(5, b.mark);
      g.beginPath(); g.arc(c - 46, c, 36, -0.9, 0.9); g.strokePath();
      g.beginPath(); g.arc(c + 46, c, 36, Math.PI - 0.9, Math.PI + 0.9); g.strokePath();
    } else if (b.style === 'star') {
      const star = (x: number, y: number, s: number) => g.fillPoints(Array.from({ length: 10 }, (_, i) => { const rr = i % 2 ? s * 0.45 : s; const a = -Math.PI / 2 + i * Math.PI / 5; return V(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }), true);
      star(c, c, 16); star(c - 24, c - 18, 8); star(c + 22, c + 20, 9); star(c + 20, c - 22, 6); star(c - 20, c + 22, 6);
    }
    g.fillStyle(W, 0.35); g.fillEllipse(c - 14, c - 18, 22, 12);
    g.lineStyle(6, INK); g.strokeCircle(c, c, r);
  });
}

/* ------------------------------------------------------------------ icons (white, 128, same style as comun/ui.ts) */
export function makeGameIcons(scene: Phaser.Scene) {
  const S = 128;
  const ic = (name: string, draw: (g: G, s: number) => void) => bake(scene, `ic-${name}`, S, S, (g) => { g.fillStyle(W); draw(g, S); });
  ic('bolt', (g, s) => g.fillPoints([V(s * 0.58, s * 0.1), V(s * 0.26, s * 0.56), V(s * 0.48, s * 0.56), V(s * 0.4, s * 0.9), V(s * 0.76, s * 0.42), V(s * 0.53, s * 0.42), V(s * 0.66, s * 0.1)], true));
  ic('target', (g, s) => { g.lineStyle(s * 0.08, W); g.strokeCircle(s / 2, s / 2, s * 0.36); g.strokeCircle(s / 2, s / 2, s * 0.2); g.fillCircle(s / 2, s / 2, s * 0.07); });
  ic('glove', (g, s) => {
    g.fillRoundedRect(s * 0.26, s * 0.36, s * 0.48, s * 0.46, s * 0.14);
    for (let i = 0; i < 4; i++) g.fillRoundedRect(s * (0.26 + i * 0.125), s * 0.14, s * 0.1, s * 0.34, s * 0.05);
    g.fillRoundedRect(s * 0.12, s * 0.38, s * 0.18, s * 0.12, s * 0.06);
    g.fillRect(s * 0.3, s * 0.8, s * 0.4, s * 0.08);
  });
  ic('shirt', (g, s) => g.fillPoints([V(s * 0.32, s * 0.16), V(s * 0.42, s * 0.16), V(s * 0.5, s * 0.24), V(s * 0.58, s * 0.16), V(s * 0.68, s * 0.16), V(s * 0.9, s * 0.36), V(s * 0.78, s * 0.5), V(s * 0.72, s * 0.45), V(s * 0.72, s * 0.86), V(s * 0.28, s * 0.86), V(s * 0.28, s * 0.45), V(s * 0.22, s * 0.5), V(s * 0.1, s * 0.36)], true));
  ic('table', (g, s) => { for (let i = 0; i < 4; i++) { g.fillCircle(s * 0.22, s * (0.24 + i * 0.18), s * 0.06); g.fillRoundedRect(s * 0.34, s * (0.2 + i * 0.18), s * 0.46, s * 0.08, s * 0.04); } });
  ic('up', (g, s) => { g.fillTriangle(s * 0.5, s * 0.12, s * 0.16, s * 0.52, s * 0.84, s * 0.52); g.fillRect(s * 0.38, s * 0.5, s * 0.24, s * 0.36); });
  ic('ballw', (g, s) => { g.lineStyle(s * 0.08, W); g.strokeCircle(s / 2, s / 2, s * 0.34); g.fillPoints([0, 1, 2, 3, 4].map((i) => V(s / 2 + Math.cos(-Math.PI / 2 + i * 1.2566) * s * 0.13, s / 2 + Math.sin(-Math.PI / 2 + i * 1.2566) * s * 0.13)), true); });
  ic('next', (g, s) => { g.fillTriangle(s * 0.2, s * 0.22, s * 0.2, s * 0.78, s * 0.56, s * 0.5); g.fillTriangle(s * 0.5, s * 0.22, s * 0.5, s * 0.78, s * 0.86, s * 0.5); });
  ic('plus', (g, s) => { g.fillRoundedRect(s * 0.42, s * 0.16, s * 0.16, s * 0.68, s * 0.06); g.fillRoundedRect(s * 0.16, s * 0.42, s * 0.68, s * 0.16, s * 0.06); });
  ic('vs', (g, s) => { // two crossing balls trails: a lightning-like clash mark
    g.fillPoints([V(s * 0.5, s * 0.08), V(s * 0.62, s * 0.38), V(s * 0.92, s * 0.5), V(s * 0.62, s * 0.62), V(s * 0.5, s * 0.92), V(s * 0.38, s * 0.62), V(s * 0.08, s * 0.5), V(s * 0.38, s * 0.38)], true);
  });
  // coloured: morale faces (sad, ok, happy)
  [0xff5d5d, 0xffd23f, 0x3ddc84].forEach((col, i) => bake(scene, `mood-${i}`, S, S, (g) => {
    g.fillStyle(col); g.fillCircle(64, 64, 54); g.lineStyle(8, INK); g.strokeCircle(64, 64, 54);
    g.fillStyle(INK); g.fillEllipse(46, 54, 12, 16); g.fillEllipse(82, 54, 12, 16);
    g.lineStyle(8, INK); g.beginPath();
    if (i === 0) g.arc(64, 100, 20, Math.PI + 0.5, -0.5); else if (i === 1) { g.moveTo(46, 86); g.lineTo(82, 86); } else g.arc(64, 74, 22, 0.4, Math.PI - 0.4);
    g.strokePath();
  }));
  // division cups (bronze, silver, gold)
  [0xd9915a, 0xc9d2e0, 0xffd23f].forEach((col, i) => bake(scene, `div-${i}`, S, S, (g) => {
    g.lineStyle(8, INK); g.fillStyle(col);
    g.fillRoundedRect(30, 16, 68, 52, { tl: 4, tr: 4, bl: 30, br: 30 }); g.strokeRoundedRect(30, 16, 68, 52, { tl: 4, tr: 4, bl: 30, br: 30 });
    g.lineStyle(9, INK); g.strokeCircle(26, 36, 14); g.strokeCircle(102, 36, 14);
    g.lineStyle(5, col); g.strokeCircle(26, 36, 14); g.strokeCircle(102, 36, 14);
    g.lineStyle(8, INK); g.fillStyle(col);
    g.fillRect(56, 66, 16, 22); g.strokeRect(56, 66, 16, 22);
    g.fillRoundedRect(36, 86, 56, 24, 6); g.strokeRoundedRect(36, 86, 56, 24, 6);
    g.fillStyle(W, 0.5); g.fillRoundedRect(40, 24, 10, 30, 5);
    for (let k = 0; k <= i; k++) { const x = 64 + (k - i / 2) * 16; g.fillStyle(W); g.fillCircle(x, 98, 5); }
  }));
  // kick result dots
  bake(scene, 'dot-g', 48, 48, (g) => { g.fillStyle(PALETTE.green); g.fillCircle(24, 24, 20); g.lineStyle(5, INK); g.strokeCircle(24, 24, 20); g.lineStyle(6, W); g.beginPath(); g.moveTo(14, 25); g.lineTo(21, 32); g.lineTo(34, 17); g.strokePath(); });
  bake(scene, 'dot-r', 48, 48, (g) => { g.fillStyle(PALETTE.red); g.fillCircle(24, 24, 20); g.lineStyle(5, INK); g.strokeCircle(24, 24, 20); g.lineStyle(6, W); g.lineBetween(16, 16, 32, 32); g.lineBetween(32, 16, 16, 32); });
  bake(scene, 'dot-e', 48, 48, (g) => { g.fillStyle(W, 0.85); g.fillCircle(24, 24, 20); g.lineStyle(5, INK); g.strokeCircle(24, 24, 20); });
  bake(scene, 'px', 10, 16, (g) => { g.fillStyle(W); g.fillRect(0, 0, 10, 16); });
  bake(scene, 'shadow', 64, 24, (g) => { g.fillStyle(0x000000, 0.28); g.fillEllipse(32, 12, 62, 22); });
  bake(scene, 'trail', 32, 32, (g) => { g.fillStyle(W, 0.9); g.fillCircle(16, 16, 15); });
}

/* ------------------------------------------------------------------ stadium (true perspective) */
/** Camera: 20 m from the goal line, 3.6 m high; 1 m at the goal line = 82 world units (goal half width 3.66 m = 300). */
export const PROJ = { zc: 20, hc: 3.6, k: 1639 };
/** World point of a ground position X (m, sideways), height h (m) and Z (m in front of the goal line). */
export function proj(X: number, h: number, Z: number) {
  const d = Math.max(0.5, PROJ.zc - Z);
  return { x: (PROJ.k * X) / d, y: (PROJ.k * (PROJ.hc - h)) / d - (PROJ.k * PROJ.hc) / PROJ.zc, s: PROJ.zc / d };
}
export const SPOT_Z = 11;
export const GOAL_M = 3.66;

const STANDS = { x0: -1100, y0: -900, w: 2200, h: 880 };
const PITCH = { x0: -1100, y0: -130, w: 2200, h: 1200 };

export function makeStadium(scene: Phaser.Scene) {
  const rnd = new Phaser.Math.RandomDataGenerator(['penalty']);
  // stands behind the goal: roof, two tiers of fans, ad boards (no text)
  bake(scene, 'st-stands', STANDS.w, STANDS.h, (g) => {
    const ox = -STANDS.x0, oy = -STANDS.y0; // world → texture
    g.fillStyle(0x3a3f78); g.fillRect(0, 0, STANDS.w, STANDS.h);
    g.fillStyle(0x2b2f5c); g.fillRect(0, 0, STANDS.w, 70);
    g.fillStyle(0x4a4f8f); g.fillRect(0, 70, STANDS.w, 10);
    const cols = [0xff5d5d, 0xffd23f, 0x4aa8ff, 0x3ddc84, 0xff6fae, 0x9b6bff, 0xff8a3d, 0xffffff, 0x6fe0ff];
    const furs = [0xff8a3d, 0xa8693a, 0xb5b3c8, 0xf4f1fa, 0x6fd36a, 0xffb3c7, 0xffc857, 0xe2a865];
    const tier = (yTop: number, yBot: number, size: number) => {
      g.fillStyle(0x30346a); g.fillRect(0, yTop, STANDS.w, yBot - yTop);
      for (let y = yTop + size * 1.2; y < yBot; y += size * 1.35) {
        g.fillStyle(0x262a55); g.fillRect(0, y + size * 0.55, STANDS.w, size * 0.25);
        for (let x = (y / size) % 2 ? size * 0.5 : 0; x < STANDS.w; x += size * 1.15) {
          if (rnd.frac() < 0.06) continue;
          const jx = x + rnd.between(-2, 2);
          g.fillStyle(rnd.pick(cols)); g.fillRoundedRect(jx - size * 0.45, y - size * 0.1, size * 0.9, size * 0.7, size * 0.25);
          g.fillStyle(rnd.pick(furs)); g.fillCircle(jx, y - size * 0.35, size * 0.36);
          if (rnd.frac() < 0.12) { g.fillStyle(rnd.pick(cols)); g.fillRect(jx + size * 0.3, y - size * 1.0, size * 0.12, size * 0.8); g.fillTriangle(jx + size * 0.42, y - size * 1.0, jx + size * 0.42, y - size * 0.6, jx + size * 0.95, y - size * 0.8); }
        }
      }
    };
    tier(80, 420, 22);
    g.fillStyle(0xff5d5d); g.fillRect(0, 420, STANDS.w, 18);
    for (let x = 0; x < STANDS.w; x += 60) { g.fillStyle(x % 120 ? 0xffd23f : 0x4aa8ff); g.fillTriangle(x, 438, x + 60, 438, x + 30, 466); }
    g.lineStyle(4, INK, 0.6); g.lineBetween(0, 420, STANDS.w, 420); g.lineBetween(0, 438, STANDS.w, 438);
    tier(438, oy - 120, 26);
    // ad boards along the touchline behind the goal: Z = -4 m, 1 m high
    const b0 = proj(0, 1, -4), b1 = proj(0, 0, -4);
    const by0 = b0.y + oy, by1 = b1.y + oy;
    g.fillStyle(INK); g.fillRect(0, by0 - 4, STANDS.w, by1 - by0 + 8);
    const bcols = [0x4aa8ff, 0xffd23f, 0xff5d5d, 0x3ddc84, 0x9b6bff, 0xff8a3d];
    let i = 0;
    for (let x = 0; x < STANDS.w; x += 180, i++) {
      g.fillStyle(bcols[i % bcols.length]); g.fillRect(x + 3, by0, 174, by1 - by0);
      g.fillStyle(W, 0.85);
      const cx = x + 90, cy = (by0 + by1) / 2, hh = (by1 - by0) * 0.3;
      if (i % 3 === 0) g.fillCircle(cx, cy, hh);
      else if (i % 3 === 1) g.fillTriangle(cx - hh * 1.4, cy + hh, cx, cy - hh, cx + hh * 1.4, cy + hh);
      else g.fillRoundedRect(cx - hh * 2, cy - hh * 0.6, hh * 4, hh * 1.2, hh * 0.5);
    }
    // grass strip under the boards (the pitch texture starts below)
    g.fillStyle(0x4cb34a); g.fillRect(0, by1, STANDS.w, STANDS.h - by1);
    // floodlights on the roof
    for (const fx of [ox - 760, ox + 760]) {
      g.fillStyle(0x555a8a); g.fillRect(fx - 6, 20, 12, 60);
      g.fillStyle(0x2b2340); g.fillRoundedRect(fx - 60, 0, 120, 44, 8);
      g.fillStyle(0xfff6c0); for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) g.fillCircle(fx - 42 + k * 28, 12 + j * 20, 8);
    }
  });

  // pitch: mown stripes every 2.5 m, goal line, six-yard box and penalty spot (projected)
  bake(scene, 'st-pitch', PITCH.w, PITCH.h, (g) => {
    const ox = -PITCH.x0, oy = -PITCH.y0;
    g.fillStyle(0x4cb34a); g.fillRect(0, 0, PITCH.w, PITCH.h);
    for (let z = -5, i = 0; z < 18; z += 2.5, i++) {
      const a = proj(0, 0, z).y + oy, b = proj(0, 0, z + 2.5).y + oy;
      g.fillStyle(i % 2 ? 0x58c556 : 0x4cb34a); g.fillRect(0, a, PITCH.w, b - a);
    }
    const quad = (x0: number, z0: number, x1: number, z1: number) => {
      const p = [proj(x0, 0, z0), proj(x1, 0, z0), proj(x1, 0, z1), proj(x0, 0, z1)].map((q) => V(q.x + ox, q.y + oy));
      g.fillPoints(p, true);
    };
    g.fillStyle(W, 0.92);
    const lw = 0.12;
    quad(-30, -lw / 2, 30, lw / 2);                // goal line
    quad(-9.16 - lw, 0, -9.16, 5.5);               // six-yard box
    quad(9.16, 0, 9.16 + lw, 5.5);
    quad(-9.16 - lw, 5.5, 9.16 + lw, 5.5 + lw);
    quad(-20.16 - lw, 0, -20.16, 16.5);            // penalty area sides
    quad(20.16, 0, 20.16 + lw, 16.5);
    const sp = proj(0, 0, SPOT_Z);
    g.fillEllipse(sp.x + ox, sp.y + oy, 26 * sp.s, 12 * sp.s);
    // grass texture: little tufts
    g.fillStyle(0x3f9e3f, 0.5);
    for (let k = 0; k < 500; k++) {
      const z = rnd.realInRange(-4, 16), x = rnd.realInRange(-14, 14), q = proj(x, 0, z);
      const s = 6 * q.s;
      g.fillTriangle(q.x + ox - s, q.y + oy, q.x + ox, q.y + oy - s * 1.6, q.x + ox + s * 0.3, q.y + oy);
    }
  });

  // goal: net (behind the keeper) and frame (in front of him)
  const G0 = { x: -340, y: -240, w: 680, h: 260 };
  bake(scene, 'net', G0.w, G0.h, (g) => {
    const t = (X: number, h: number, Z: number) => { const q = proj(X, h, Z); return V(q.x - G0.x, q.y - G0.y); };
    const D = -2.0, HB = 2.0; // back of the net: 2 m deep, 2 m high at the back
    const F = [t(-GOAL_M, 2.44, 0), t(GOAL_M, 2.44, 0), t(GOAL_M, 0, 0), t(-GOAL_M, 0, 0)];
    const B = [t(-GOAL_M + 0.2, HB, D), t(GOAL_M - 0.2, HB, D), t(GOAL_M - 0.2, 0, D), t(-GOAL_M + 0.2, 0, D)];
    g.fillStyle(0x000000, 0.12); g.fillPoints(B, true);
    g.fillStyle(W, 0.1); g.fillPoints([F[0], F[1], B[1], B[0]], true); g.fillPoints([F[0], B[0], B[3], F[3]], true); g.fillPoints([F[1], B[1], B[2], F[2]], true);
    g.lineStyle(2, W, 0.75);
    const N = 14;
    for (let i = 0; i <= N; i++) { // back: vertical and horizontal
      const a = Phaser.Math.Interpolation.Linear([B[0].x, B[1].x], i / N);
      g.lineBetween(a, B[0].y, a, B[3].y);
    }
    for (let j = 0; j <= 6; j++) { const y = B[0].y + (B[3].y - B[0].y) * (j / 6); g.lineBetween(B[0].x, y, B[1].x, y); }
    for (let i = 0; i <= N; i++) { const f = i / N; g.lineBetween(F[0].x + (F[1].x - F[0].x) * f, F[0].y, B[0].x + (B[1].x - B[0].x) * f, B[0].y); }
    for (const [fa, fb, ba, bb] of [[F[0], F[3], B[0], B[3]], [F[1], F[2], B[1], B[2]]]) {
      for (let j = 0; j <= 6; j++) { const f = j / 6; g.lineBetween(fa.x + (fb.x - fa.x) * f, fa.y + (fb.y - fa.y) * f, ba.x + (bb.x - ba.x) * f, ba.y + (bb.y - ba.y) * f); }
      for (let i = 1; i <= 3; i++) { const f = i / 4; g.lineBetween(fa.x + (ba.x - fa.x) * f, fa.y + (ba.y - fa.y) * f, fb.x + (bb.x - fb.x) * f, fb.y + (bb.y - fb.y) * f); }
    }
    g.lineStyle(5, 0xdfe6f0); g.lineBetween(B[0].x, B[0].y, B[3].x, B[3].y); g.lineBetween(B[1].x, B[1].y, B[2].x, B[2].y); g.lineBetween(B[0].x, B[0].y, B[1].x, B[1].y);
  });
  bake(scene, 'frame', G0.w, G0.h, (g) => {
    const t = (X: number, h: number) => { const q = proj(X, h, 0); return V(q.x - G0.x, q.y - G0.y); };
    const L0 = t(-GOAL_M, 0), L1 = t(-GOAL_M, 2.44), R0 = t(GOAL_M, 0), R1 = t(GOAL_M, 2.44);
    const pw = 12;
    g.fillStyle(0x000000, 0.2); g.fillEllipse(L0.x, L0.y, 30, 10); g.fillEllipse(R0.x, R0.y, 30, 10);
    g.lineStyle(5, INK); g.fillStyle(W);
    g.fillRect(L1.x - pw / 2, L1.y - pw / 2, R1.x - L1.x + pw, pw); g.strokeRect(L1.x - pw / 2, L1.y - pw / 2, R1.x - L1.x + pw, pw);
    for (const P of [L0, R0]) { g.fillRect(P.x - pw / 2, L1.y - pw / 2, pw, P.y - L1.y + pw / 2); g.strokeRect(P.x - pw / 2, L1.y - pw / 2, pw, P.y - L1.y + pw / 2); }
    g.fillRect(L1.x - pw / 2 + 2.5, L1.y - pw / 2 + 2.5, R1.x - L1.x + pw - 5, pw - 5);
    g.fillStyle(0xdfe6f0); g.fillRect(L1.x + pw / 2 - 2, L1.y + 1, 4, L0.y - L1.y - 2);
  });
  return { stands: STANDS, pitch: PITCH, goal: G0 };
}
export const STADIUM = { stands: STANDS, pitch: PITCH, goal: { x: -340, y: -240, w: 680, h: 260 } };
