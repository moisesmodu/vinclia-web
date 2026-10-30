import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';
import { K } from './scenes/Boot';

const INK = PALETTE.ink;

type Fur = { fur: number; dark: number; cream: number };
/** Pelajes del mono: pelo, cola y cara/barriga. */
const FURS: Record<string, Fur> = {
  brown: { fur: 0x9a5b34, dark: 0x7a4426, cream: 0xffe2b0 },
  golden: { fur: 0xe8a33a, dark: 0xb9761c, cream: 0xfff1c9 },
  grey: { fur: 0x8f93a6, dark: 0x676b7e, cream: 0xf2eff7 },
  snow: { fur: 0xf2efe8, dark: 0xc9c1b2, cream: 0xffd6c4 },
  pink: { fur: 0xff7eb6, dark: 0xd94a8c, cream: 0xffe3ef },
  night: { fur: 0x4a4560, dark: 0x2f2a3d, cream: 0xd9ccff },
};
const HATS = ['cap', 'party', 'crown'] as const;

/** Tienda de Hook Hop: pelaje del mono y gorros. Se paga con plátanos. */
export const ITEMS: ShopItem[] = [
  { id: 'brown', slot: 'fur', price: 0, icon: 'mk-pv-brown' },
  { id: 'golden', slot: 'fur', price: 40, icon: 'mk-pv-golden' },
  { id: 'grey', slot: 'fur', price: 80, icon: 'mk-pv-grey' },
  { id: 'snow', slot: 'fur', price: 150, icon: 'mk-pv-snow' },
  { id: 'pink', slot: 'fur', price: 250, icon: 'mk-pv-pink' },
  { id: 'night', slot: 'fur', price: 400, icon: 'mk-pv-night' },
  { id: 'cap', slot: 'hat', price: 60, icon: 'hat-pv-cap' },
  { id: 'party', slot: 'hat', price: 120, icon: 'hat-pv-party' },
  { id: 'crown', slot: 'hat', price: 300, icon: 'hat-pv-crown' },
];
export const DEFAULTS = { fur: 'brown', hat: '' };
/** Recompensa diaria (plátanos) del día 1 al 7. */
export const DAILY = [5, 8, 10, 15, 20, 25, 40];

/** Vistas previas de la tienda (una vez, en Boot). */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, f] of Object.entries(FURS)) {
    const key = `mk-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 96 * K, 112 * K, (g) => drawMonkey(g, 0, f, ''));
  }
  for (const id of HATS) {
    const key = `hat-pv-${id}`;
    if (scene.textures.exists(key)) continue;
    redrawTexture(scene, key, 48 * K, 40 * K, (g) => { g.translateCanvas(24 * K, 36 * K); drawHat(g, id); });
  }
}

/** Vuelve a dibujar el mono (3 caras) y su icono con el pelaje y el gorro equipados. */
export function applyMonkey(scene: Phaser.Scene) {
  const f = FURS[equippedId(save, 'fur', DEFAULTS.fur, ITEMS)] ?? FURS.brown;
  const hat = equippedId(save, 'hat', DEFAULTS.hat, ITEMS);
  for (let face = 0; face < 3; face++) redrawTexture(scene, `monkey${face}`, 96 * K, 112 * K, (g) => drawMonkey(g, face, f, hat));
  if (scene.textures.exists('monkey-ic')) scene.textures.remove('monkey-ic');
  const rt = scene.make.renderTexture({ x: 0, y: 0, width: 112 * K, height: 112 * K }, false);
  rt.draw('monkey1', 8 * K, 0);
  rt.saveTexture('monkey-ic');
}

/**
 * Gorro en coordenadas locales: base en (0, 0), hacia arriba (y negativa). Unidades de diseño × K.
 */
function drawHat(g: Phaser.GameObjects.Graphics, id: string) {
  const k = K;
  const V = (x: number, y: number) => new Phaser.Math.Vector2(x * k, y * k);
  if (id === 'cap') {
    // gorra azul con la visera hacia la izquierda (lejos de la mano que agarra)
    g.fillStyle(0x4aa8ff); g.lineStyle(3.5 * k, INK);
    g.beginPath(); g.arc(0, 0, 15 * k, Math.PI, 0); g.closePath(); g.fillPath(); g.strokePath();
    g.fillStyle(0x2f86d9); g.fillRoundedRect(-24 * k, -4 * k, 18 * k, 6 * k, 3 * k); g.strokeRoundedRect(-24 * k, -4 * k, 18 * k, 6 * k, 3 * k);
    g.fillStyle(0xffd23f); g.fillCircle(0, -15 * k, 3.5 * k); g.lineStyle(2.5 * k, INK); g.strokeCircle(0, -15 * k, 3.5 * k);
    g.fillStyle(0xffffff, 0.5); g.fillEllipse(5 * k, -8 * k, 8 * k, 4 * k);
  } else if (id === 'party') {
    // cucurucho de fiesta rosa con lunares y pompón
    g.fillStyle(0xff6fae); g.fillTriangle(-13 * k, 0, 13 * k, 0, 0, -28 * k);
    g.fillStyle(0xffd23f); g.fillCircle(-4 * k, -8 * k, 3 * k); g.fillCircle(5 * k, -14 * k, 2.6 * k); g.fillCircle(-1 * k, -20 * k, 2.2 * k);
    g.lineStyle(3.5 * k, INK); g.strokeTriangle(-13 * k, 0, 13 * k, 0, 0, -28 * k);
    g.fillStyle(0x3ddc84); g.fillCircle(0, -29 * k, 5 * k); g.lineStyle(2.5 * k, INK); g.strokeCircle(0, -29 * k, 5 * k);
  } else {
    // corona dorada
    const pts = [V(-16, 0), V(-16, -16), V(-8, -8), V(0, -20), V(8, -8), V(16, -16), V(16, 0)];
    g.fillStyle(0xffd23f); g.fillPoints(pts, true);
    g.lineStyle(3.5 * k, INK); g.strokePoints(pts, true, true);
    g.fillStyle(0xff4f5e); g.fillCircle(0, -6 * k, 3.2 * k);
    g.fillStyle(0x4aa8ff); g.fillCircle(-10 * k, -5 * k, 2.4 * k); g.fillCircle(10 * k, -5 * k, 2.4 * k);
    g.fillStyle(0xffffff, 0.6); g.fillRect(-13 * k, -3 * k, 6 * k, 2 * k);
  }
}

/**
 * Mono de 96×112 (unidades de diseño). Centro del cuerpo (48, 70): es el origen físico. La mano que agarra la
 * liana está en (48, 8), 62 unidades por encima. face: 0 contento, 1 emocionado (volando), 2 asustado (cayendo).
 * El gorro va ladeado a la izquierda de la cabeza (la mano que agarra se vuelve a dibujar encima).
 */
export function drawMonkey(g: Phaser.GameObjects.Graphics, face: number, P: Fur, hat: string) {
  const k = K;
  const limb = (x1: number, y1: number, x2: number, y2: number, w = 10) => {
    g.lineStyle((w + 6) * k, INK); g.lineBetween(x1 * k, y1 * k, x2 * k, y2 * k);
    g.lineStyle(w * k, P.fur); g.lineBetween(x1 * k, y1 * k, x2 * k, y2 * k);
    g.fillStyle(INK); g.fillCircle(x1 * k, y1 * k, (w + 6) / 2 * k); g.fillCircle(x2 * k, y2 * k, (w + 6) / 2 * k);
    g.fillStyle(P.fur); g.fillCircle(x1 * k, y1 * k, w / 2 * k); g.fillCircle(x2 * k, y2 * k, w / 2 * k);
  };
  const hand = () => {
    g.fillStyle(P.cream); g.lineStyle(4 * k, INK);
    g.fillCircle(48 * k, 9 * k, 7.5 * k); g.strokeCircle(48 * k, 9 * k, 7.5 * k);
  };
  // cola enroscada
  g.lineStyle(13 * k, INK); g.beginPath(); g.arc(20 * k, 86 * k, 13 * k, -0.2, Math.PI * 1.45); g.strokePath();
  g.lineStyle(7 * k, P.dark); g.beginPath(); g.arc(20 * k, 86 * k, 13 * k, -0.2, Math.PI * 1.45); g.strokePath();
  // brazo que agarra (detrás de la cabeza) y mano
  limb(58, 72, 48, 12);
  hand();
  // piernas
  limb(40, 92, 33, 105, 9); limb(56, 92, 64, 105, 9);
  g.fillStyle(P.cream); g.lineStyle(3.5 * k, INK);
  g.fillEllipse(31 * k, 106 * k, 15 * k, 9 * k); g.strokeEllipse(31 * k, 106 * k, 15 * k, 9 * k);
  g.fillEllipse(66 * k, 106 * k, 15 * k, 9 * k); g.strokeEllipse(66 * k, 106 * k, 15 * k, 9 * k);
  // cuerpo y barriga
  g.fillStyle(P.fur); g.lineStyle(4.5 * k, INK);
  g.fillEllipse(48 * k, 80 * k, 40 * k, 34 * k); g.strokeEllipse(48 * k, 80 * k, 40 * k, 34 * k);
  g.fillStyle(P.cream); g.fillEllipse(48 * k, 84 * k, 22 * k, 20 * k);
  // otro brazo (suelto, hacia fuera)
  if (face === 1) limb(34, 70, 16, 54, 9); else if (face === 2) limb(34, 72, 12, 62, 9); else limb(34, 74, 22, 88, 9);
  // orejas
  for (const ex of [22, 74]) {
    g.fillStyle(P.fur); g.lineStyle(4 * k, INK); g.fillCircle(ex * k, 48 * k, 10 * k); g.strokeCircle(ex * k, 48 * k, 10 * k);
    g.fillStyle(P.cream); g.fillCircle(ex * k, 48 * k, 5.5 * k);
  }
  // cabeza
  g.fillStyle(P.fur); g.lineStyle(4.5 * k, INK); g.fillCircle(48 * k, 46 * k, 25 * k); g.strokeCircle(48 * k, 46 * k, 25 * k);
  // pelo de punta
  g.fillStyle(P.fur); g.lineStyle(4 * k, INK);
  const tuft = [new Phaser.Math.Vector2(42 * k, 24 * k), new Phaser.Math.Vector2(47 * k, 13 * k), new Phaser.Math.Vector2(50 * k, 22 * k), new Phaser.Math.Vector2(56 * k, 15 * k), new Phaser.Math.Vector2(57 * k, 25 * k)];
  g.fillPoints(tuft, false); g.strokePoints(tuft, false);
  g.fillCircle(48 * k, 46 * k, 22 * k);
  // cara crema
  g.fillStyle(P.cream);
  g.fillCircle(39 * k, 44 * k, 10.5 * k); g.fillCircle(57 * k, 44 * k, 10.5 * k); g.fillEllipse(48 * k, 56 * k, 32 * k, 20 * k);
  // ojos
  g.fillStyle(INK);
  if (face === 1) {
    g.lineStyle(3.5 * k, INK);
    g.beginPath(); g.arc(39 * k, 46 * k, 5 * k, Math.PI * 1.1, Math.PI * 1.9); g.strokePath();
    g.beginPath(); g.arc(57 * k, 46 * k, 5 * k, Math.PI * 1.1, Math.PI * 1.9); g.strokePath();
  } else if (face === 2) {
    g.fillStyle(0xffffff); g.lineStyle(3 * k, INK);
    g.fillCircle(39 * k, 43 * k, 7 * k); g.strokeCircle(39 * k, 43 * k, 7 * k);
    g.fillCircle(57 * k, 43 * k, 7 * k); g.strokeCircle(57 * k, 43 * k, 7 * k);
    g.fillStyle(INK); g.fillCircle(39 * k, 44 * k, 3 * k); g.fillCircle(57 * k, 44 * k, 3 * k);
  } else {
    g.fillCircle(39 * k, 44 * k, 4.5 * k); g.fillCircle(57 * k, 44 * k, 4.5 * k);
    g.fillStyle(0xffffff); g.fillCircle(40.5 * k, 42.5 * k, 1.6 * k); g.fillCircle(58.5 * k, 42.5 * k, 1.6 * k);
  }
  // nariz
  g.fillStyle(INK); g.fillEllipse(45 * k, 53 * k, 3 * k, 2.4 * k); g.fillEllipse(51 * k, 53 * k, 3 * k, 2.4 * k);
  // boca
  if (face === 1) {
    g.fillStyle(INK); g.beginPath(); g.arc(48 * k, 58 * k, 8 * k, 0, Math.PI); g.closePath(); g.fillPath();
    g.fillStyle(0xff7a8a); g.fillEllipse(48 * k, 63 * k, 8 * k, 4 * k);
  } else if (face === 2) {
    g.fillStyle(INK); g.fillEllipse(48 * k, 61 * k, 7 * k, 9 * k);
  } else {
    g.lineStyle(3.5 * k, INK); g.beginPath(); g.arc(48 * k, 56 * k, 7 * k, 0.25, Math.PI - 0.25); g.strokePath();
  }
  // mejillas
  g.fillStyle(0xff9a9a, 0.6); g.fillCircle(31 * k, 54 * k, 4 * k); g.fillCircle(65 * k, 54 * k, 4 * k);
  if (hat) {
    // ladeado sobre la parte de arriba a la izquierda de la cabeza
    g.save();
    g.translateCanvas(34 * k, 30 * k);
    g.rotateCanvas(-0.5);
    g.scaleCanvas(0.85, 0.85);
    drawHat(g, hat);
    g.restore();
    // la mano que agarra, por delante del gorro
    hand();
  }
}
