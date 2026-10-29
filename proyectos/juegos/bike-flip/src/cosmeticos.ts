import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';
import { COL } from './scenes/Boot';

const INK = PALETTE.ink;

/** Pinturas de la moto: [color, sombra]. */
const PAINTS: Record<string, [number, number]> = {
  teal: [0x19c9b4, 0x0f9486],
  red: [0xff4f5e, 0xd12f45],
  blue: [0x4aa8ff, 0x2f78d9],
  pink: [0xff6fae, 0xd9488c],
  black: [0x4a4560, 0x2f2a3d],
};
/** Colores del casco. */
const HELMETS: Record<string, number> = { yellow: 0xffd23f, white: 0xf4f4fa, green: 0x3ddc84, red: 0xff4f5e };

/** Tienda de Bike Flip: pintura de la moto y color del casco. Se paga con monedas (se ganan al llegar a la meta). */
export const ITEMS: ShopItem[] = [
  { id: 'teal', slot: 'paint', price: 0, icon: 'bike-pv-teal' },
  { id: 'red', slot: 'paint', price: 15, icon: 'bike-pv-red' },
  { id: 'blue', slot: 'paint', price: 30, icon: 'bike-pv-blue' },
  { id: 'pink', slot: 'paint', price: 50, icon: 'bike-pv-pink' },
  { id: 'black', slot: 'paint', price: 80, icon: 'bike-pv-black' },
  { id: 'yellow', slot: 'helmet', price: 0, icon: 'helmet-yellow' },
  { id: 'white', slot: 'helmet', price: 20, icon: 'helmet-white' },
  { id: 'green', slot: 'helmet', price: 40, icon: 'helmet-green' },
  { id: 'red-h', slot: 'helmet', price: 60, icon: 'helmet-red' },
];
export const DEFAULTS = { paint: 'teal', helmet: 'yellow' };
/** Recompensa diaria (monedas) del día 1 al 7. */
export const DAILY = [3, 5, 8, 10, 12, 15, 25];

const helmetColor = (id: string) => HELMETS[id.replace(/-h$/, '')] ?? HELMETS.yellow;

/** Vistas previas de la tienda (una moto por pintura, un casco por color). */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, [paint, dark]] of Object.entries(PAINTS)) {
    if (scene.textures.exists(`bike-pv-${id}`)) continue;
    // vista previa con ruedas (en la partida las ruedas son sprites aparte)
    redrawTexture(scene, '__bike-tmp', 180, 150, (g) => drawBike(g, { paint, dark, helmet: HELMETS.yellow }));
    const rt = scene.make.renderTexture({ x: 0, y: 0, width: 180, height: 150 }, false);
    rt.draw('__bike-tmp', 0, 0).draw('wheel', 22, 98).draw('wheel', 110, 98);
    rt.saveTexture(`bike-pv-${id}`);
    scene.textures.remove('__bike-tmp');
  }
  for (const [id, col] of Object.entries(HELMETS)) {
    if (scene.textures.exists(`helmet-${id}`)) continue;
    redrawTexture(scene, `helmet-${id}`, 80, 64, (g) => {
      g.fillStyle(col); g.fillCircle(36, 34, 26); g.lineStyle(6, INK); g.strokeCircle(36, 34, 26);
      g.fillStyle(INK); g.fillRoundedRect(40, 24, 30, 18, 7);
      g.fillStyle(0x9be3ff); g.fillRoundedRect(45, 28, 20, 9, 4);
      g.fillStyle(0xff5d5d); g.fillRect(12, 26, 22, 7);
      g.fillStyle(0xffffff, 0.6); g.fillCircle(25, 20, 7);
    });
  }
}

/** Vuelve a dibujar la textura 'bike' de la partida con la pintura y el casco equipados. */
export function applyBike(scene: Phaser.Scene) {
  const [paint, dark] = PAINTS[equippedId(save, 'paint', DEFAULTS.paint, ITEMS)] ?? PAINTS.teal;
  const helmet = helmetColor(equippedId(save, 'helmet', DEFAULTS.helmet, ITEMS));
  redrawTexture(scene, 'bike', 180, 150, (g) => drawBike(g, { paint, dark, helmet }));
}

/**
 * Moto y piloto vistos de lado (un solo dibujo). Origen de diseño en (90, 100) del lienzo de 180×150:
 * coincide con el centro del chasis en Play.ts (ruedas en ±44, +22; casco en -2, -66).
 */
function drawBike(g: Phaser.GameObjects.Graphics, c: { paint: number; dark: number; helmet: number }) {
    const L = (w: number, c: number, x1: number, y1: number, x2: number, y2: number) => { g.lineStyle(w, c); g.lineBetween(x1, y1, x2, y2); };
    const fx = (pts: number[][], fill: number, line = 5) => {
      const v = pts.map(([x, y]) => new Phaser.Math.Vector2(x, y));
      g.fillStyle(fill); g.fillPoints(v, true); g.lineStyle(line, INK); g.strokePoints(v, true, true);
    };
    // basculante y horquilla
    L(11, INK, 46, 122, 84, 104); L(5, 0xc9ccd6, 46, 122, 84, 104);
    L(11, INK, 134, 122, 116, 70); L(5, 0xc9ccd6, 134, 122, 116, 70);
    // tubo de escape
    L(10, INK, 92, 110, 52, 98); L(5, 0xdfe3ea, 92, 110, 52, 98);
    // motor
    g.fillStyle(0x4a4f5e); g.fillRoundedRect(78, 96, 30, 20, 5); g.lineStyle(4, INK); g.strokeRoundedRect(78, 96, 30, 20, 5);
    // guardabarros trasero, depósito y placa delantera
    fx([[40, 90], [86, 86], [84, 96], [52, 98]], c.paint);
    fx([[70, 84], [116, 78], [124, 92], [96, 100], [74, 98]], c.paint);
    fx([[108, 70], [128, 66], [130, 90], [118, 92]], c.dark);
    fx([[122, 102], [154, 98], [146, 108]], c.paint, 4);
    // número blanco de la placa (adorno)
    g.fillStyle(0xffffff); g.fillCircle(121, 79, 6); g.lineStyle(3, INK); g.strokeCircle(121, 79, 6);
    // sillín
    g.fillStyle(0x2f2a3d); g.fillRoundedRect(58, 80, 40, 9, 4);
    // brillo
    g.fillStyle(0xffffff, 0.45); g.fillRoundedRect(80, 85, 26, 4, 2);
    // piloto: pierna, cuerpo, brazo y casco
    L(16, INK, 80, 78, 102, 86); L(10, COL.riderDark, 80, 78, 102, 86);
    L(14, INK, 102, 86, 98, 104); L(8, COL.riderDark, 102, 86, 98, 104);
    g.fillStyle(0x2f2a3d); g.fillRoundedRect(92, 100, 16, 8, 3);
    fx([[74, 80], [86, 46], [100, 48], [92, 82]], COL.rider);
    L(13, INK, 94, 54, 114, 70); L(7, COL.rider, 94, 54, 114, 70);
    g.fillStyle(0x2f2a3d); g.fillCircle(115, 70, 5);
    L(6, INK, 110, 64, 120, 62);
    // casco
    g.fillStyle(c.helmet); g.fillCircle(88, 34, 15); g.lineStyle(5, INK); g.strokeCircle(88, 34, 15);
    g.fillStyle(INK); g.fillRoundedRect(90, 28, 14, 10, 4);
    g.fillStyle(0x9be3ff); g.fillRoundedRect(93, 30, 9, 5, 2);
    g.fillStyle(0xff5d5d); g.fillRect(74, 30, 12, 4);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(82, 27, 4);
}
