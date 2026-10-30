import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;

/** Pinturas de la camioneta: [carrocería, caja trasera]. */
const PAINTS: Record<string, [number, number]> = {
  red: [0xff4747, 0xd93636],
  blue: [0x4aa8ff, 0x2f86d9],
  green: [0x3ddc84, 0x22b267],
  purple: [0x9b6bff, 0x7a4bdf],
  pink: [0xff6fae, 0xe04f8f],
  black: [0x4a4560, 0x2f2a3d],
};

/** Tienda de Egg Truck: pinturas de la camioneta y gorros para el huevo. Precios en estrellas, de menos a más. */
export const ITEMS: ShopItem[] = [
  { id: 'red', slot: 'paint', price: 0, icon: 'truck-red' },
  { id: 'blue', slot: 'paint', price: 25, icon: 'truck-blue' },
  { id: 'green', slot: 'paint', price: 50, icon: 'truck-green' },
  { id: 'purple', slot: 'paint', price: 100, icon: 'truck-purple' },
  { id: 'pink', slot: 'paint', price: 150, icon: 'truck-pink' },
  { id: 'black', slot: 'paint', price: 220, icon: 'truck-black' },
  { id: 'cap', slot: 'hat', price: 40, icon: 'hat-cap' },
  { id: 'party', slot: 'hat', price: 80, icon: 'hat-party' },
  { id: 'crown', slot: 'hat', price: 300, icon: 'hat-crown' },
];
export const DEFAULTS = { paint: 'red', hat: '' };
/** Recompensa diaria (estrellas) del día 1 al 7. */
export const DAILY = [5, 8, 10, 15, 20, 25, 40];

export const truckKey = () => `truck-${equippedId(save, 'paint', DEFAULTS.paint, ITEMS)}`;
export const hatKey = () => { const h = equippedId(save, 'hat', DEFAULTS.hat, ITEMS); return h ? `hat-${h}` : ''; };

function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Todas las variantes (una textura por pintura y por gorro): la tienda las usa de vista previa y Play las lee por clave. */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, [body, dark]] of Object.entries(PAINTS)) tex(scene, `truck-${id}`, 200, 110, (g) => drawTruck(g, body, dark));
  // gorros: origen de diseño abajo en el centro (24, 30) de un lienzo de 48×34, encima del huevo
  tex(scene, 'hat-cap', 56, 34, (g) => {
    g.lineStyle(4, INK);
    g.fillStyle(0x4aa8ff); g.fillEllipse(26, 26, 36, 22); g.strokeEllipse(26, 26, 36, 22);
    g.fillStyle(0x2f86d9); g.fillRoundedRect(30, 24, 24, 8, 4); g.strokeRoundedRect(30, 24, 24, 8, 4);
    g.fillStyle(0xffd23f); g.fillCircle(26, 15, 4); g.lineStyle(3, INK); g.strokeCircle(26, 15, 4);
    g.fillStyle(0xffffff, 0.5); g.fillEllipse(20, 21, 10, 5);
  });
  tex(scene, 'hat-party', 48, 46, (g) => {
    g.fillStyle(0xff6fae); g.fillTriangle(8, 42, 40, 42, 24, 8);
    g.fillStyle(0xffd23f); g.fillTriangle(14, 32, 34, 32, 24, 20);
    g.lineStyle(4, INK); g.strokeTriangle(8, 42, 40, 42, 24, 8);
    g.fillStyle(0x3ddc84); g.fillCircle(24, 7, 6); g.lineStyle(3, INK); g.strokeCircle(24, 7, 6);
  });
  tex(scene, 'hat-crown', 52, 36, (g) => {
    const pts = [[6, 32], [6, 10], [16, 20], [26, 4], [36, 20], [46, 10], [46, 32]].map(([x, y]) => new Phaser.Math.Vector2(x, y));
    g.fillStyle(0xffd23f); g.fillPoints(pts, true);
    g.lineStyle(4, INK); g.strokePoints(pts, true, true);
    g.fillStyle(0xff4f5e); g.fillCircle(26, 24, 4); g.fillStyle(0x4aa8ff); g.fillCircle(14, 26, 3); g.fillCircle(38, 26, 3);
    g.fillStyle(0xffffff, 0.6); g.fillRect(10, 27, 8, 3);
  });
}

/** Camioneta vista de lado. Origen de diseño (centro del chasis) en (100, 70). */
function drawTruck(g: Phaser.GameObjects.Graphics, body: number, dark: number) {
  const ox = 100, oy = 70;
  g.lineStyle(5, INK);
  // caja trasera
  g.fillStyle(dark);
  g.fillRoundedRect(ox - 78, oy - 40, 14, 40, 4);
  g.strokeRoundedRect(ox - 78, oy - 40, 14, 40, 4);
  // chasis
  g.fillStyle(body);
  g.fillRoundedRect(ox - 80, oy - 14, 160, 28, 8);
  g.strokeRoundedRect(ox - 80, oy - 14, 160, 28, 8);
  // cabina
  g.fillStyle(body);
  g.fillRoundedRect(ox + 18, oy - 52, 52, 42, { tl: 6, tr: 18, bl: 0, br: 0 });
  g.strokeRoundedRect(ox + 18, oy - 52, 52, 42, { tl: 6, tr: 18, bl: 0, br: 0 });
  // ventana
  g.fillStyle(0x9be3ff);
  g.fillRoundedRect(ox + 30, oy - 45, 32, 22, { tl: 4, tr: 12, bl: 2, br: 2 });
  g.lineStyle(3, INK);
  g.strokeRoundedRect(ox + 30, oy - 45, 32, 22, { tl: 4, tr: 12, bl: 2, br: 2 });
  // faro y parachoques
  g.fillStyle(0xffe066); g.fillCircle(ox + 76, oy - 4, 6); g.strokeCircle(ox + 76, oy - 4, 6);
  g.fillStyle(0xc9ccd6); g.fillRoundedRect(ox + 66, oy + 6, 22, 9, 3); g.strokeRoundedRect(ox + 66, oy + 6, 22, 9, 3);
  // brillo
  g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(ox - 70, oy - 10, 80, 5, 2);
}
