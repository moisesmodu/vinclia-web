import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;

/** Pinturas de la grúa: [carrocería, tono oscuro]. */
const PAINTS: Record<string, [number, number]> = {
  teal: [0x2ec4b6, 0x1f978c],
  orange: [0xff8a2a, 0xd9692b],
  blue: [0x4aa8ff, 0x2f78d9],
  purple: [0x9b6bff, 0x7a4bdf],
  pink: [0xff6fae, 0xe04f8f],
};
/** Remolques: [tablas, listón, detalle]. */
const TRAILERS: Record<string, [number, number, number]> = {
  wood: [0xd9483b, 0xf06a52, 0xffe0b0],
  steel: [0x8fa3b8, 0xb9c8d8, 0x56657a],
  farm: [0x46b85a, 0x6fd47e, 0xffd23f],
  gold: [0xffc93c, 0xffe27a, 0xff8a2a],
};
/** Carga: [caja, listones de la caja, barril, aros del barril]. */
const CARGO: Record<string, [number, number, number, number]> = {
  classic: [0xd9a25f, 0xa86e35, 0xc0582c, 0x6b7080],
  candy: [0xff8ad8, 0xffffff, 0x5fe0c0, 0xffffff],
  gift: [0xff4f5e, 0xffd23f, 0xffd23f, 0xff4f5e],
};

/** Tienda de Tow Truck: pintura de la grúa, remolque y aspecto de la carga. Se paga con monedas (1 por carga entregada). */
export const ITEMS: ShopItem[] = [
  { id: 'teal', slot: 'paint', price: 0, icon: 'truck-pv-teal' },
  { id: 'orange', slot: 'paint', price: 25, icon: 'truck-pv-orange' },
  { id: 'blue', slot: 'paint', price: 50, icon: 'truck-pv-blue' },
  { id: 'purple', slot: 'paint', price: 100, icon: 'truck-pv-purple' },
  { id: 'pink', slot: 'paint', price: 160, icon: 'truck-pv-pink' },
  { id: 'wood', slot: 'trailer', price: 0, icon: 'trailer-pv-wood' },
  { id: 'steel', slot: 'trailer', price: 40, icon: 'trailer-pv-steel' },
  { id: 'farm', slot: 'trailer', price: 80, icon: 'trailer-pv-farm' },
  { id: 'gold', slot: 'trailer', price: 250, icon: 'trailer-pv-gold' },
  { id: 'classic', slot: 'cargo', price: 0, icon: 'cargo-pv-classic' },
  { id: 'candy', slot: 'cargo', price: 60, icon: 'cargo-pv-candy' },
  { id: 'gift', slot: 'cargo', price: 140, icon: 'cargo-pv-gift' },
];
export const DEFAULTS = { paint: 'teal', trailer: 'wood', cargo: 'classic' };
/** Recompensa diaria (monedas) del día 1 al 7. */
export const DAILY = [5, 8, 10, 15, 20, 25, 40];

/** Lienzos y orígenes de diseño (Play coloca los sprites con estos números). */
export const TRUCK_TEX = { w: 240, h: 150, ox: 120, oy: 92 };
export const TRAILER_TEX = { w: 270, h: 84, ox: 120, oy: 50 };

/** Vistas previas de la tienda (una por objeto). */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, [body, dark]] of Object.entries(PAINTS)) {
    if (!scene.textures.exists(`truck-pv-${id}`)) redrawTexture(scene, `truck-pv-${id}`, TRUCK_TEX.w, TRUCK_TEX.h, (g) => drawTruck(g, body, dark));
  }
  for (const [id, c] of Object.entries(TRAILERS)) {
    if (!scene.textures.exists(`trailer-pv-${id}`)) redrawTexture(scene, `trailer-pv-${id}`, TRAILER_TEX.w, 110, (g) => { drawTrailer(g, c); drawWheel(g, TRAILER_TEX.ox - 6, TRAILER_TEX.oy + 30, 20); });
  }
  for (const [id, c] of Object.entries(CARGO)) {
    if (scene.textures.exists(`cargo-pv-${id}`)) continue;
    redrawTexture(scene, `cargo-pv-${id}`, 170, 100, (g) => {
      drawCrate(g, 6, 22, 72, c);
      drawBarrel(g, 92, 14, 70, 82, c);
    });
  }
}

/** Vuelve a dibujar 'truck', 'trailer', 'crate' y 'barrel' con lo equipado. */
export function applyLook(scene: Phaser.Scene) {
  const [body, dark] = PAINTS[equippedId(save, 'paint', DEFAULTS.paint, ITEMS)] ?? PAINTS.teal;
  redrawTexture(scene, 'truck', TRUCK_TEX.w, TRUCK_TEX.h, (g) => drawTruck(g, body, dark));
  const tr = TRAILERS[equippedId(save, 'trailer', DEFAULTS.trailer, ITEMS)] ?? TRAILERS.wood;
  redrawTexture(scene, 'trailer', TRAILER_TEX.w, TRAILER_TEX.h, (g) => drawTrailer(g, tr));
  const cg = CARGO[equippedId(save, 'cargo', DEFAULTS.cargo, ITEMS)] ?? CARGO.classic;
  redrawTexture(scene, 'crate', 64, 64, (g) => drawCrate(g, 2, 2, 60, cg));
  redrawTexture(scene, 'barrel', 56, 64, (g) => drawBarrel(g, 2, 2, 52, 60, cg));
}

/** Rueda (también la usan las vistas previas). */
export function drawWheel(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
  g.fillStyle(0x2b2b33); g.fillCircle(x, y, r);
  g.lineStyle(4, INK); g.strokeCircle(x, y, r - 1);
  g.fillStyle(0xffd23f); g.fillCircle(x, y, r * 0.45);
  g.lineStyle(3, INK); g.strokeCircle(x, y, r * 0.45);
  g.fillStyle(0xd9a21f);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.fillCircle(x + Math.cos(a) * r * 0.24, y + Math.sin(a) * r * 0.24, r * 0.09); }
  g.fillStyle(0x15151a);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillCircle(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, r * 0.1); }
}

/** Grúa vista de lado, mirando a la derecha. Origen de diseño (centro del chasis) en (120, 92). */
function drawTruck(g: Phaser.GameObjects.Graphics, body: number, dark: number) {
  const ox = TRUCK_TEX.ox, oy = TRUCK_TEX.oy;
  // pluma de la grúa con cable y gancho (detrás de todo)
  g.lineStyle(14, INK); g.lineBetween(ox - 26, oy - 18, ox - 66, oy - 60);
  g.lineStyle(8, 0xffd23f); g.lineBetween(ox - 26, oy - 18, ox - 66, oy - 60);
  g.lineStyle(3, INK); g.lineBetween(ox - 68, oy - 58, ox - 68, oy - 30);
  g.lineStyle(5, INK);
  g.beginPath(); g.arc(ox - 64, oy - 26, 6, Math.PI * 0.95, Math.PI * 0.2, true); g.strokePath();
  g.fillStyle(INK); g.fillCircle(ox - 66, oy - 60, 6);
  // base de la grúa
  g.fillStyle(dark); g.fillRoundedRect(ox - 42, oy - 30, 30, 20, 5);
  g.lineStyle(4, INK); g.strokeRoundedRect(ox - 42, oy - 30, 30, 20, 5);
  // enganche trasero
  g.fillStyle(0x6b7080); g.fillRect(ox - 92, oy + 2, 16, 8); g.fillCircle(ox - 92, oy + 6, 6);
  g.lineStyle(3, INK); g.strokeRect(ox - 92, oy + 2, 16, 8); g.strokeCircle(ox - 92, oy + 6, 6);
  // chasis
  g.fillStyle(body);
  g.fillRoundedRect(ox - 80, oy - 12, 160, 26, 8);
  g.lineStyle(5, INK); g.strokeRoundedRect(ox - 80, oy - 12, 160, 26, 8);
  // franja
  g.fillStyle(0xffffff, 0.9); g.fillRect(ox - 74, oy + 2, 140, 5);
  // cabina
  g.fillStyle(body);
  g.fillRoundedRect(ox + 10, oy - 58, 56, 48, { tl: 8, tr: 18, bl: 0, br: 0 });
  g.lineStyle(5, INK); g.strokeRoundedRect(ox + 10, oy - 58, 56, 48, { tl: 8, tr: 18, bl: 0, br: 0 });
  // capó
  g.fillStyle(body);
  g.fillRoundedRect(ox + 62, oy - 30, 26, 20, { tl: 4, tr: 10, bl: 0, br: 0 });
  g.strokeRoundedRect(ox + 62, oy - 30, 26, 20, { tl: 4, tr: 10, bl: 0, br: 0 });
  // luz naranja en el techo
  g.fillStyle(0xff8a2a); g.fillRoundedRect(ox + 26, oy - 70, 20, 13, { tl: 7, tr: 7, bl: 0, br: 0 });
  g.lineStyle(3, INK); g.strokeRoundedRect(ox + 26, oy - 70, 20, 13, { tl: 7, tr: 7, bl: 0, br: 0 });
  // ventana
  g.fillStyle(0xffe3b8);
  g.fillRoundedRect(ox + 22, oy - 50, 36, 22, { tl: 4, tr: 12, bl: 2, br: 2 });
  g.lineStyle(3, INK); g.strokeRoundedRect(ox + 22, oy - 50, 36, 22, { tl: 4, tr: 12, bl: 2, br: 2 });
  g.fillStyle(0xffffff, 0.7); g.fillTriangle(ox + 28, oy - 30, ox + 38, oy - 48, ox + 45, oy - 48);
  // faro y parachoques
  g.fillStyle(0xfff3a0); g.fillCircle(ox + 84, oy - 2, 6); g.lineStyle(3, INK); g.strokeCircle(ox + 84, oy - 2, 6);
  g.fillStyle(0xc9ccd6); g.fillRoundedRect(ox + 72, oy + 8, 18, 8, 3); g.lineStyle(3, INK); g.strokeRoundedRect(ox + 72, oy + 8, 18, 8, 3);
  // guardabarros
  g.fillStyle(dark);
  g.slice(ox - 50, oy + 14, 30, Math.PI, 0, false); g.fillPath();
  g.slice(ox + 50, oy + 14, 30, Math.PI, 0, false); g.fillPath();
  // brillo
  g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(ox - 70, oy - 8, 70, 4, 2);
}

/** Remolque plano de bordes bajos con lanza. Origen de diseño (centro de la plataforma) en (120, 50). */
function drawTrailer(g: Phaser.GameObjects.Graphics, [plank, light, trim]: [number, number, number]) {
  const ox = TRAILER_TEX.ox, oy = TRAILER_TEX.oy;
  // lanza y anilla
  g.lineStyle(10, INK); g.lineBetween(ox + 96, oy + 2, ox + 140, oy + 6);
  g.lineStyle(5, 0x6b7080); g.lineBetween(ox + 96, oy + 2, ox + 140, oy + 6);
  g.lineStyle(4, INK); g.strokeCircle(ox + 142, oy + 6, 6);
  // bordes bajos
  // borde delantero y compuerta trasera (más baja)
  g.fillStyle(plank); g.fillRoundedRect(ox + 89, oy - 29, 12, 27, 3);
  g.lineStyle(4, INK); g.strokeRoundedRect(ox + 89, oy - 29, 12, 27, 3);
  g.fillStyle(plank); g.fillRoundedRect(ox - 101, oy - 23, 12, 21, 3);
  g.lineStyle(4, INK); g.strokeRoundedRect(ox - 101, oy - 23, 12, 21, 3);
  g.lineStyle(5, INK); g.lineBetween(ox - 95, oy - 18, ox + 95, oy - 22);
  g.lineStyle(3, trim); g.lineBetween(ox - 95, oy - 18, ox + 95, oy - 22);
  // plataforma
  g.fillStyle(plank); g.fillRoundedRect(ox - 104, oy - 8, 208, 18, 5);
  g.fillStyle(light); g.fillRect(ox - 100, oy - 6, 200, 5);
  g.lineStyle(2, INK, 0.5);
  for (let x = -80; x <= 80; x += 26) g.lineBetween(ox + x, oy - 6, ox + x, oy + 8);
  g.lineStyle(5, INK); g.strokeRoundedRect(ox - 104, oy - 8, 208, 18, 5);
  // guardabarros de la rueda
  g.fillStyle(trim); g.slice(ox - 6, oy + 12, 26, Math.PI, 0, false); g.fillPath();
  g.lineStyle(4, INK); g.beginPath(); g.arc(ox - 6, oy + 12, 26, Math.PI, 0, false); g.strokePath();
  // piloto trasero
  g.fillStyle(0xff4f5e); g.fillRoundedRect(ox - 110, oy - 4, 8, 10, 3);
}

/** Caja de madera con listones en aspa. */
function drawCrate(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number, [box, slat]: [number, number, number, number]) {
  const k = s / 60;
  g.fillStyle(box); g.fillRoundedRect(x, y, s, s, 6 * k);
  g.fillStyle(slat);
  g.fillRect(x + 4 * k, y + 4 * k, s - 8 * k, 9 * k); g.fillRect(x + 4 * k, y + s - 13 * k, s - 8 * k, 9 * k);
  g.lineStyle(9 * k, slat); g.lineBetween(x + 10 * k, y + s - 12 * k, x + s - 10 * k, y + 12 * k);
  g.lineStyle(5 * k, INK); g.strokeRoundedRect(x, y, s, s, 6 * k);
  g.lineStyle(2.5 * k, INK, 0.6);
  g.strokeRect(x + 4 * k, y + 4 * k, s - 8 * k, 9 * k); g.strokeRect(x + 4 * k, y + s - 13 * k, s - 8 * k, 9 * k);
  g.fillStyle(0xffffff, 0.25); g.fillRect(x + 8 * k, y + 16 * k, 6 * k, s - 32 * k);
}

/** Barril de pie con dos aros. */
function drawBarrel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, [, , body, band]: [number, number, number, number]) {
  const k = w / 52;
  g.fillStyle(body); g.fillRoundedRect(x, y, w, h, 14 * k);
  g.fillStyle(0x000000, 0.12); g.fillRoundedRect(x + w * 0.62, y + 4 * k, w * 0.3, h - 8 * k, 10 * k);
  g.fillStyle(band); g.fillRect(x + 1, y + h * 0.22, w - 2, 7 * k); g.fillRect(x + 1, y + h * 0.7, w - 2, 7 * k);
  g.lineStyle(2.5 * k, INK, 0.7); g.strokeRect(x + 1, y + h * 0.22, w - 2, 7 * k); g.strokeRect(x + 1, y + h * 0.7, w - 2, 7 * k);
  g.lineStyle(5 * k, INK); g.strokeRoundedRect(x, y, w, h, 14 * k);
  g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(x + 8 * k, y + 8 * k, 6 * k, h - 16 * k, 3 * k);
}
