import Phaser from 'phaser';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';
import { tex, drawPerson, makeCounter, APRONS, AWNINGS, INK } from './art';

/** Tienda de Fruit Stand: delantales, gorros y colores del toldo del puesto. Precios en estrellas. */
export const ITEMS: ShopItem[] = [
  { id: 'green', slot: 'apron', price: 0, icon: 'hero-green' },
  { id: 'blue', slot: 'apron', price: 20, icon: 'hero-blue' },
  { id: 'purple', slot: 'apron', price: 45, icon: 'hero-purple' },
  { id: 'pink', slot: 'apron', price: 70, icon: 'hero-pink' },
  { id: 'gold', slot: 'apron', price: 150, icon: 'hero-gold' },
  { id: 'straw', slot: 'hat', price: 25, icon: 'hat-straw' },
  { id: 'cap', slot: 'hat', price: 35, icon: 'hat-cap' },
  { id: 'flower', slot: 'hat', price: 60, icon: 'hat-flower' },
  { id: 'chef', slot: 'hat', price: 90, icon: 'hat-chef' },
  { id: 'crown', slot: 'hat', price: 250, icon: 'hat-crown' },
  { id: 'red', slot: 'awning', price: 0, icon: 'awn-red' },
  { id: 'blue', slot: 'awning', price: 30, icon: 'awn-blue' },
  { id: 'green', slot: 'awning', price: 50, icon: 'awn-green' },
  { id: 'purple', slot: 'awning', price: 80, icon: 'awn-purple' },
  { id: 'sun', slot: 'awning', price: 120, icon: 'awn-sun' },
];
// los ids se repiten entre huecos (blue, green...): la tienda los distingue por id, así que se prefijan
for (const it of ITEMS) it.id = `${it.slot}-${it.id}`;
export const DEFAULTS = { apron: 'apron-green', hat: '', awning: 'awning-red' };
/** Recompensa diaria (estrellas) del día 1 al 7. */
export const DAILY = [5, 8, 10, 15, 20, 25, 40];

const bare = (id: string) => id.slice(id.indexOf('-') + 1);
export const heroKey = () => `hero-${bare(equippedId(save, 'apron', DEFAULTS.apron, ITEMS))}`;
export const hatKey = () => { const h = equippedId(save, 'hat', DEFAULTS.hat, ITEMS); return h ? `hat-${bare(h)}` : ''; };
export const awningId = () => bare(equippedId(save, 'awning', DEFAULTS.awning, ITEMS));

export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, c] of Object.entries(APRONS)) tex(scene, `hero-${id}`, 64, 88, (g) => drawPerson(g, { shirt: 0xffffff, apron: c, skin: 0xffd9b3, hair: 0x6b3b1e }));
  for (const id of Object.keys(AWNINGS)) makeCounter(scene, id);
  makeCounter(scene, awningId());
  // gorros: lienzo 56×40, se colocan sobre la cabeza (centro abajo)
  tex(scene, 'hat-straw', 64, 40, (g) => {
    g.lineStyle(4, INK); g.fillStyle(0xf2d27a); g.fillEllipse(32, 30, 60, 16); g.strokeEllipse(32, 30, 60, 16);
    g.fillRoundedRect(16, 8, 32, 22, 10); g.strokeRoundedRect(16, 8, 32, 22, 10);
    g.fillStyle(0xff5d5d); g.fillRect(17, 20, 30, 6);
  });
  tex(scene, 'hat-cap', 64, 40, (g) => {
    g.lineStyle(4, INK); g.fillStyle(0xff4b4b);
    g.beginPath(); g.arc(28, 32, 20, Math.PI, 0); g.closePath(); g.fillPath(); g.strokePath();
    g.fillRoundedRect(36, 26, 26, 8, 4); g.strokeRoundedRect(36, 26, 26, 8, 4);
    g.fillStyle(0xffffff); g.fillCircle(28, 14, 4);
  });
  tex(scene, 'hat-flower', 64, 40, (g) => {
    g.lineStyle(3, INK);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.fillStyle(0xff8fb8); g.fillCircle(32 + Math.cos(a) * 9, 20 + Math.sin(a) * 9, 7); g.strokeCircle(32 + Math.cos(a) * 9, 20 + Math.sin(a) * 9, 7); }
    g.fillStyle(0xffd23f); g.fillCircle(32, 20, 7); g.strokeCircle(32, 20, 7);
  });
  tex(scene, 'hat-chef', 64, 52, (g) => {
    g.lineStyle(4, INK); g.fillStyle(0xffffff);
    for (const [x, y, r] of [[19, 20, 12], [45, 20, 12], [32, 14, 14]]) { g.fillCircle(x, y, r); g.strokeCircle(x, y, r); }
    g.fillCircle(32, 24, 12); g.fillRect(18, 20, 28, 14);
    g.fillRoundedRect(14, 32, 36, 16, 4); g.strokeRoundedRect(14, 32, 36, 16, 4);
    g.lineStyle(2, 0xd9d2e6); g.lineBetween(24, 36, 24, 46); g.lineBetween(32, 36, 32, 46); g.lineBetween(40, 36, 40, 46);
  });
  tex(scene, 'hat-crown', 64, 40, (g) => {
    const pts = [[10, 36], [10, 12], [21, 22], [32, 4], [43, 22], [54, 12], [54, 36]].map(([x, y]) => new Phaser.Math.Vector2(x, y));
    g.fillStyle(0xffd23f); g.fillPoints(pts, true); g.lineStyle(4, INK); g.strokePoints(pts, true, true);
    g.fillStyle(0xff4f5e); g.fillCircle(32, 27, 4); g.fillStyle(0x4aa8ff); g.fillCircle(19, 29, 3); g.fillCircle(45, 29, 3);
  });
}

/** Tras equipar en la tienda: el mostrador cambia de toldo. */
export function applyCosmetics(scene: Phaser.Scene) { makeCounter(scene, awningId()); }
