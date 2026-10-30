import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';
import { K } from './scenes/Boot';

const INK = PALETTE.ink;

type Paint = { body: number; nose: number; fins: number };
/** Pinturas del cohete: cuerpo, morro y franja, aletas. */
const PAINTS: Record<string, Paint> = {
  classic: { body: 0xffffff, nose: 0xff4d5e, fins: 0xffc21a },
  ocean: { body: 0xffffff, nose: 0x4aa8ff, fins: 0x3fd8c4 },
  lime: { body: 0xf2ffe8, nose: 0x3ddc84, fins: 0xff9f43 },
  grape: { body: 0xf3ecff, nose: 0x9b6bff, fins: 0xff6fae },
  night: { body: 0x4a4560, nose: 0xffd23f, fins: 0xff4d5e },
};
/** Estelas: [exterior, medio, núcleo] de la llama y colores del humo. */
const TRAILS: Record<string, { flame: [number, number, number]; puff: number[] }> = {
  fire: { flame: [0xff7a1a, 0xffd23f, 0xfff6c8], puff: [0xffd23f, 0xff9f43, 0xcfd3e6] },
  plasma: { flame: [0x2f86ff, 0x6ff3ff, 0xe8ffff], puff: [0x6ff3ff, 0x4aa8ff, 0xcfd3e6] },
  toxic: { flame: [0x22b267, 0x8be04e, 0xf0ffd0], puff: [0x8be04e, 0x3ddc84, 0xcfd3e6] },
  candy: { flame: [0xd9488c, 0xff9fd0, 0xfff0f8], puff: [0xff6fae, 0xa67bff, 0xffffff] },
};

/** Tienda de Rocket Hop: pintura del cohete y color de la estela. Se paga con aterrizajes perfectos. */
export const ITEMS: ShopItem[] = [
  { id: 'classic', slot: 'paint', price: 0, icon: 'rocket-pv-classic', bg: 0x211a78 },
  { id: 'ocean', slot: 'paint', price: 8, icon: 'rocket-pv-ocean', bg: 0x211a78 },
  { id: 'lime', slot: 'paint', price: 15, icon: 'rocket-pv-lime', bg: 0x211a78 },
  { id: 'grape', slot: 'paint', price: 25, icon: 'rocket-pv-grape', bg: 0x211a78 },
  { id: 'night', slot: 'paint', price: 40, icon: 'rocket-pv-night', bg: 0x211a78 },
  { id: 'fire', slot: 'trail', price: 0, icon: 'flame-pv-fire', bg: 0x211a78 },
  { id: 'plasma', slot: 'trail', price: 12, icon: 'flame-pv-plasma', bg: 0x211a78 },
  { id: 'toxic', slot: 'trail', price: 20, icon: 'flame-pv-toxic', bg: 0x211a78 },
  { id: 'candy', slot: 'trail', price: 35, icon: 'flame-pv-candy', bg: 0x211a78 },
];
export const DEFAULTS = { paint: 'classic', trail: 'fire' };
/** Recompensa diaria (aterrizajes perfectos) del día 1 al 7. */
export const DAILY = [2, 3, 4, 5, 6, 8, 12];

/** Colores del humo del propulsor con la estela equipada. */
export const puffTint = () => (TRAILS[equippedId(save, 'trail', DEFAULTS.trail, ITEMS)] ?? TRAILS.fire).puff;

/** Vistas previas de la tienda. */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, p] of Object.entries(PAINTS)) {
    const key = `rocket-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 64 * K, 100 * K, (g) => drawRocket(g, 0, p));
  }
  for (const [id, t] of Object.entries(TRAILS)) {
    const key = `flame-pv-${id}`;
    if (!scene.textures.exists(key)) redrawTexture(scene, key, 32 * K, 56 * K, (g) => drawFlame(g, t.flame));
  }
}

/** Vuelve a dibujar el cohete (3 caras), su icono y la llama con lo equipado. */
export function applyRocket(scene: Phaser.Scene) {
  const p = PAINTS[equippedId(save, 'paint', DEFAULTS.paint, ITEMS)] ?? PAINTS.classic;
  const t = TRAILS[equippedId(save, 'trail', DEFAULTS.trail, ITEMS)] ?? TRAILS.fire;
  for (let face = 0; face < 3; face++) redrawTexture(scene, `rocket${face}`, 64 * K, 100 * K, (g) => drawRocket(g, face, p));
  redrawTexture(scene, 'flame', 32 * K, 56 * K, (g) => drawFlame(g, t.flame));
  // icono cuadrado del cohete asustado (pantalla final)
  if (scene.textures.exists('rocket-ic')) scene.textures.remove('rocket-ic');
  const rt = scene.make.renderTexture({ x: 0, y: 0, width: 100 * K, height: 100 * K }, false);
  rt.draw('rocket1', 18 * K, 0);
  rt.saveTexture('rocket-ic');
}

/** Llama del propulsor (origen arriba, en la tobera). */
function drawFlame(g: Phaser.GameObjects.Graphics, [a, b, c]: [number, number, number]) {
  const k = K;
  g.fillStyle(a); g.fillEllipse(16 * k, 24 * k, 26 * k, 48 * k);
  g.lineStyle(3 * k, INK); g.strokeEllipse(16 * k, 24 * k, 26 * k, 48 * k);
  g.fillStyle(b); g.fillEllipse(16 * k, 19 * k, 16 * k, 32 * k);
  g.fillStyle(c); g.fillEllipse(16 * k, 14 * k, 8 * k, 16 * k);
}

/**
 * Cohete de 64×100 (unidades de diseño). Origen de diseño (32, 50); patas apoyadas en y = 92.
 * face: 0 normal, 1 asustado (cae rápido o se estrella), 2 feliz (aterrizaje perfecto).
 */
function drawRocket(g: Phaser.GameObjects.Graphics, face: number, c: Paint) {
  const k = K;
    // patas
    g.lineStyle(9 * k, INK); g.lineBetween(20 * k, 64 * k, 9 * k, 88 * k); g.lineBetween(44 * k, 64 * k, 55 * k, 88 * k);
    g.lineStyle(5 * k, 0xb9c2d6); g.lineBetween(20 * k, 64 * k, 9 * k, 88 * k); g.lineBetween(44 * k, 64 * k, 55 * k, 88 * k);
    g.fillStyle(0x8a93ab); g.lineStyle(3 * k, INK);
    g.fillRoundedRect(2 * k, 85 * k, 16 * k, 7 * k, 3 * k); g.strokeRoundedRect(2 * k, 85 * k, 16 * k, 7 * k, 3 * k);
    g.fillRoundedRect(46 * k, 85 * k, 16 * k, 7 * k, 3 * k); g.strokeRoundedRect(46 * k, 85 * k, 16 * k, 7 * k, 3 * k);
    // tobera
    g.fillStyle(0x8a93ab); g.lineStyle(4 * k, INK);
    const noz = [new Phaser.Math.Vector2(24 * k, 72 * k), new Phaser.Math.Vector2(40 * k, 72 * k), new Phaser.Math.Vector2(45 * k, 84 * k), new Phaser.Math.Vector2(19 * k, 84 * k)];
    g.fillPoints(noz, true); g.strokePoints(noz, true, true);
    // aletas
    g.fillStyle(c.fins);
    const finL = [new Phaser.Math.Vector2(17 * k, 44 * k), new Phaser.Math.Vector2(3 * k, 74 * k), new Phaser.Math.Vector2(4 * k, 80 * k), new Phaser.Math.Vector2(18 * k, 72 * k)];
    const finR = finL.map((p) => new Phaser.Math.Vector2(64 * k - p.x, p.y));
    g.fillPoints(finL, true); g.strokePoints(finL, true, true);
    g.fillPoints(finR, true); g.strokePoints(finR, true, true);
    // cuerpo blanco con morro y franja rojos
    g.fillStyle(c.body); g.fillRoundedRect(14 * k, 6 * k, 36 * k, 70 * k, { tl: 18 * k, tr: 18 * k, bl: 8 * k, br: 8 * k });
    g.fillStyle(c.nose); g.fillRoundedRect(14 * k, 6 * k, 36 * k, 20 * k, { tl: 18 * k, tr: 18 * k, bl: 0, br: 0 });
    g.fillRect(14 * k, 64 * k, 36 * k, 5 * k);
    g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(19 * k, 30 * k, 4 * k, 30 * k, 2 * k);
    g.lineStyle(4.5 * k, INK); g.strokeRoundedRect(14 * k, 6 * k, 36 * k, 70 * k, { tl: 18 * k, tr: 18 * k, bl: 8 * k, br: 8 * k });
    // ojo de buey con la cara
    const cx = 32 * k, cy = 44 * k;
    g.fillStyle(0xc5ccdb); g.fillCircle(cx, cy, 14.5 * k);
    g.fillStyle(0x9be3ff); g.fillCircle(cx, cy, 11 * k);
    g.lineStyle(3.5 * k, INK); g.strokeCircle(cx, cy, 14.5 * k); g.lineStyle(2.5 * k, INK); g.strokeCircle(cx, cy, 11 * k);
    g.fillStyle(INK); g.lineStyle(2.2 * k, INK);
    if (face === 0) {
      g.fillCircle(cx - 4.5 * k, cy - 1.5 * k, 2.3 * k); g.fillCircle(cx + 4.5 * k, cy - 1.5 * k, 2.3 * k);
      g.fillStyle(0xffffff); g.fillCircle(cx - 3.7 * k, cy - 2.3 * k, 0.9 * k); g.fillCircle(cx + 5.3 * k, cy - 2.3 * k, 0.9 * k);
      g.beginPath(); g.arc(cx, cy + 2.5 * k, 4 * k, 0.35, Math.PI - 0.35); g.strokePath();
    } else if (face === 1) {
      g.fillStyle(0xffffff); g.fillCircle(cx - 4.5 * k, cy - 2.5 * k, 3.4 * k); g.fillCircle(cx + 4.5 * k, cy - 2.5 * k, 3.4 * k);
      g.strokeCircle(cx - 4.5 * k, cy - 2.5 * k, 3.4 * k); g.strokeCircle(cx + 4.5 * k, cy - 2.5 * k, 3.4 * k);
      g.fillStyle(INK); g.fillCircle(cx - 4.5 * k, cy - 2.5 * k, 1.4 * k); g.fillCircle(cx + 4.5 * k, cy - 2.5 * k, 1.4 * k);
      g.fillEllipse(cx, cy + 5 * k, 4.5 * k, 5.5 * k);
    } else {
      g.lineStyle(2.4 * k, INK);
      g.beginPath(); g.arc(cx - 4.5 * k, cy, 2.6 * k, Math.PI + 0.3, -0.3); g.strokePath();
      g.beginPath(); g.arc(cx + 4.5 * k, cy, 2.6 * k, Math.PI + 0.3, -0.3); g.strokePath();
      g.fillStyle(INK); g.beginPath(); g.arc(cx, cy + 2 * k, 5 * k, 0, Math.PI); g.closePath(); g.fillPath();
      g.fillStyle(0xff8fb1, 0.8); g.fillCircle(cx - 8 * k, cy + 3 * k, 2 * k); g.fillCircle(cx + 8 * k, cy + 3 * k, 2 * k);
    }
}
