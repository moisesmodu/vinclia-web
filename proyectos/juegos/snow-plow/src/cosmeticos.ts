import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { redrawTexture } from '@comun/iconos';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';

const INK = PALETTE.ink;

/** Pinturas del quitanieves: [carrocería, tolva]. */
const PAINTS: Record<string, [number, number]> = {
  orange: [0xff8a2a, 0xd9692b],
  red: [0xff4f5e, 0xd12f45],
  green: [0x35c46a, 0x23994f],
  blue: [0x4aa8ff, 0x2f78d9],
  purple: [0x9b6bff, 0x7a4bdf],
};
/** Guirnaldas de luces navideñas (colores de las bombillas, alternos). */
const LIGHTS: Record<string, number[]> = {
  rainbow: [0xff4f5e, 0xffd23f, 0x35c46a, 0x4aa8ff, 0xb34dff],
  candy: [0xff4f5e, 0xffffff],
  ice: [0x9be3ff, 0xffffff, 0x4aa8ff],
  gold: [0xffd23f, 0xffb52b],
};

/** Tienda de Snow Plow: pintura del quitanieves y luces de Navidad. Se paga con regalos entregados. */
export const ITEMS: ShopItem[] = [
  { id: 'orange', slot: 'paint', price: 0, icon: 'plow-pv-orange' },
  { id: 'red', slot: 'paint', price: 25, icon: 'plow-pv-red' },
  { id: 'green', slot: 'paint', price: 50, icon: 'plow-pv-green' },
  { id: 'blue', slot: 'paint', price: 90, icon: 'plow-pv-blue' },
  { id: 'purple', slot: 'paint', price: 160, icon: 'plow-pv-purple' },
  { id: 'rainbow', slot: 'lights', price: 40, icon: 'lights-rainbow', bg: 0x13235a },
  { id: 'candy', slot: 'lights', price: 70, icon: 'lights-candy', bg: 0x13235a },
  { id: 'ice', slot: 'lights', price: 120, icon: 'lights-ice', bg: 0x13235a },
  { id: 'gold', slot: 'lights', price: 250, icon: 'lights-gold', bg: 0x13235a },
];
export const DEFAULTS = { paint: 'orange', lights: '' };
/** Recompensa diaria (regalos) del día 1 al 7. */
export const DAILY = [5, 8, 10, 15, 20, 25, 40];

/** true si lleva luces (Play alterna 'plow' y 'plow-b' para que parpadeen). */
export const hasLights = () => !!equippedId(save, 'lights', DEFAULTS.lights, ITEMS);

/** Vistas previas de la tienda. */
export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, [body, dark]] of Object.entries(PAINTS)) {
    if (!scene.textures.exists(`plow-pv-${id}`)) redrawTexture(scene, `plow-pv-${id}`, 240, 140, (g) => drawPlow(g, { body, dark }));
  }
  for (const [id, cols] of Object.entries(LIGHTS)) {
    if (scene.textures.exists(`lights-${id}`)) continue;
    redrawTexture(scene, `lights-${id}`, 160, 80, (g) => {
      g.lineStyle(4, INK);
      g.beginPath(); g.moveTo(6, 22);
      for (let x = 6; x <= 154; x += 4) g.lineTo(x, 22 + Math.sin(((x - 6) / 148) * Math.PI * 2) * 10 + 8);
      g.strokePath();
      for (let i = 0; i < 6; i++) {
        const x = 16 + i * 26, y = 30 + Math.sin(((x - 6) / 148) * Math.PI * 2) * 10 + 8;
        bulb(g, x, y, cols[i % cols.length], 9);
      }
    });
  }
}

function bulb(g: Phaser.GameObjects.Graphics, x: number, y: number, col: number, r: number, on = true) {
  if (on) { g.fillStyle(col, 0.35); g.fillCircle(x, y + r * 0.3, r * 1.9); }
  g.fillStyle(0x6b7080); g.fillRect(x - r * 0.45, y - r * 1.1, r * 0.9, r * 0.6);
  g.fillStyle(on ? col : 0x8a8296); g.fillEllipse(x, y + r * 0.3, r * 1.5, r * 2);
  g.lineStyle(Math.max(1.5, r * 0.3), INK); g.strokeEllipse(x, y + r * 0.3, r * 1.5, r * 2);
  if (on) { g.fillStyle(0xffffff, 0.7); g.fillCircle(x - r * 0.25, y, r * 0.25); }
}

/** Vuelve a dibujar 'plow' (y 'plow-b', las luces en la otra fase) con lo equipado. */
export function applyPlow(scene: Phaser.Scene) {
  const [body, dark] = PAINTS[equippedId(save, 'paint', DEFAULTS.paint, ITEMS)] ?? PAINTS.orange;
  const lid = equippedId(save, 'lights', DEFAULTS.lights, ITEMS);
  const cols = lid ? LIGHTS[lid] : null;
  for (const [key, phase] of [['plow', 0], ['plow-b', 1]] as const) {
    redrawTexture(scene, key, 240, 140, (g) => {
      drawPlow(g, { body, dark });
      if (cols) drawLights(g, cols, phase);
    });
  }
}

/** Guirnalda por la tolva, el techo de la cabina y el capó (origen de diseño (110, 84)). */
function drawLights(g: Phaser.GameObjects.Graphics, cols: number[], phase: number) {
  const ox = 110, oy = 84;
  const runs: [number, number, number][] = [[ox - 76, ox - 40, oy - 40], [ox - 32, ox + 22, oy - 64], [ox + 26, ox + 68, oy - 30]];
  let n = 0;
  for (const [x0, x1, y] of runs) {
    g.lineStyle(2, INK);
    g.beginPath(); g.moveTo(x0, y);
    for (let x = x0; x <= x1; x += 3) g.lineTo(x, y + Math.sin(((x - x0) / 9) * Math.PI) * 2.5);
    g.strokePath();
    for (let x = x0 + 4; x <= x1 - 2; x += 9) {
      bulb(g, x, y + 3, cols[n % cols.length], 3.2, (n + phase) % 2 === 0);
      n++;
    }
  }
}

/** Quitanieves con pala amarilla delante. Origen de diseño (centro del chasis) en (110, 84). */
function drawPlow(g: Phaser.GameObjects.Graphics, c: { body: number; dark: number }) {
    const ox = 110, oy = 84;
    g.lineStyle(5, INK);
    // caja trasera con sal (tolva)
    g.fillStyle(c.dark);
    g.fillRoundedRect(ox - 78, oy - 34, 40, 26, 5); g.strokeRoundedRect(ox - 78, oy - 34, 40, 26, 5);
    g.fillStyle(0xffffff); g.fillRoundedRect(ox - 76, oy - 40, 36, 10, 5);
    // chasis
    g.fillStyle(c.body);
    g.fillRoundedRect(ox - 78, oy - 12, 156, 26, 8); g.strokeRoundedRect(ox - 78, oy - 12, 156, 26, 8);
    // franjas de aviso
    g.fillStyle(INK);
    for (let i = 0; i < 5; i++) g.fillTriangle(ox - 60 + i * 22, oy + 12, ox - 50 + i * 22, oy - 10, ox - 44 + i * 22, oy - 10);
    g.fillStyle(0xffe066);
    for (let i = 0; i < 5; i++) g.fillTriangle(ox - 54 + i * 22, oy + 12, ox - 44 + i * 22, oy - 10, ox - 38 + i * 22, oy - 10);
    g.lineStyle(5, INK); g.strokeRoundedRect(ox - 78, oy - 12, 156, 26, 8);
    // cabina
    g.fillStyle(c.body);
    g.fillRoundedRect(ox - 34, oy - 58, 60, 48, { tl: 8, tr: 16, bl: 0, br: 0 });
    g.strokeRoundedRect(ox - 34, oy - 58, 60, 48, { tl: 8, tr: 16, bl: 0, br: 0 });
    // capó
    g.fillStyle(c.body);
    g.fillRoundedRect(ox + 22, oy - 30, 50, 22, { tl: 4, tr: 10, bl: 0, br: 0 });
    g.strokeRoundedRect(ox + 22, oy - 30, 50, 22, { tl: 4, tr: 10, bl: 0, br: 0 });
    // nieve en el techo
    g.fillStyle(0xffffff); g.fillRoundedRect(ox - 36, oy - 64, 64, 10, 5);
    // luz giratoria
    g.fillStyle(0xffc21a); g.fillRoundedRect(ox - 12, oy - 76, 18, 14, { tl: 7, tr: 7, bl: 0, br: 0 });
    g.lineStyle(3, INK); g.strokeRoundedRect(ox - 12, oy - 76, 18, 14, { tl: 7, tr: 7, bl: 0, br: 0 });
    // ventana
    g.fillStyle(0x9be3ff);
    g.fillRoundedRect(ox - 22, oy - 50, 40, 24, { tl: 4, tr: 10, bl: 2, br: 2 });
    g.lineStyle(3, INK); g.strokeRoundedRect(ox - 22, oy - 50, 40, 24, { tl: 4, tr: 10, bl: 2, br: 2 });
    g.fillStyle(0xffffff, 0.6); g.fillTriangle(ox - 16, oy - 30, ox - 6, oy - 48, ox + 2, oy - 48);
    // faro
    g.fillStyle(0xfff3a0); g.fillCircle(ox + 70, oy - 18, 6); g.lineStyle(3, INK); g.strokeCircle(ox + 70, oy - 18, 6);
    // brazos de la pala
    g.lineStyle(7, 0x6b7080); g.lineBetween(ox + 70, oy + 2, ox + 84, oy - 10); g.lineBetween(ox + 70, oy + 6, ox + 84, oy + 22);
    // pala amarilla (cuerpo físico: x 82..94, y -54..44)
    g.fillStyle(0xffd23f);
    g.fillRoundedRect(ox + 80, oy - 56, 16, 100, { tl: 6, tr: 2, bl: 10, br: 2 });
    g.lineStyle(5, INK); g.strokeRoundedRect(ox + 80, oy - 56, 16, 100, { tl: 6, tr: 2, bl: 10, br: 2 });
    g.fillStyle(0xffffff, 0.45); g.fillRect(ox + 85, oy - 48, 4, 76);
    g.fillStyle(INK); g.fillRect(ox + 80, oy + 37, 16, 6);
    // brillo
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(ox - 70, oy - 8, 60, 4, 2);
}
