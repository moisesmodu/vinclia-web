import Phaser from 'phaser';
import { equippedId, type ShopItem } from '@comun/tienda';
import { save } from './state';
import { tex, drawBoat, drawFlag, makeBoats, HULLS, BOAT_W, BOAT_H } from './art';

/** Tienda de Tiny Harbor: colores del casco de los barcos y banderas. Precios en estrellas. */
export const ITEMS: ShopItem[] = [
  { id: 'red', slot: 'hull', price: 0, icon: 'hull-red' },
  { id: 'blue', slot: 'hull', price: 20, icon: 'hull-blue' },
  { id: 'green', slot: 'hull', price: 40, icon: 'hull-green' },
  { id: 'yellow', slot: 'hull', price: 60, icon: 'hull-yellow' },
  { id: 'purple', slot: 'hull', price: 90, icon: 'hull-purple' },
  { id: 'pirate', slot: 'hull', price: 140, icon: 'hull-pirate' },
  { id: 'gold', slot: 'hull', price: 250, icon: 'hull-gold' },
  { id: 'star', slot: 'flag', price: 15, icon: 'flag-star', bg: 0xdff3ff },
  { id: 'heart', slot: 'flag', price: 30, icon: 'flag-heart', bg: 0xdff3ff },
  { id: 'checker', slot: 'flag', price: 50, icon: 'flag-checker', bg: 0xdff3ff },
  { id: 'rainbow', slot: 'flag', price: 80, icon: 'flag-rainbow', bg: 0xdff3ff },
  { id: 'pirate', slot: 'flag', price: 120, icon: 'flag-pirate', bg: 0xdff3ff },
];
// los ids se repiten entre huecos (pirate): la tienda los distingue por id, así que se prefijan
for (const it of ITEMS) it.id = `${it.slot}-${it.id}`;
export const DEFAULTS = { hull: 'hull-red', flag: '' };
/** Recompensa diaria (estrellas) del día 1 al 7. */
export const DAILY = [5, 8, 10, 15, 20, 25, 40];

const bare = (id: string) => id.slice(id.indexOf('-') + 1);
export const hullId = () => bare(equippedId(save, 'hull', DEFAULTS.hull, ITEMS));
export const flagId = () => { const f = equippedId(save, 'flag', DEFAULTS.flag, ITEMS); return f ? bare(f) : ''; };

export function makeCosmetics(scene: Phaser.Scene) {
  for (const [id, c] of Object.entries(HULLS)) tex(scene, `hull-${id}`, BOAT_W, BOAT_H, (g) => drawBoat(g, c, 0xff8a4c, ''));
  for (const id of ['star', 'heart', 'checker', 'rainbow', 'pirate']) tex(scene, `flag-${id}`, 80, 80, (g) => drawFlag(g, id, 22, 74, 1.1));
  applyCosmetics(scene);
}

/** Tras equipar en la tienda: los barcos cambian de casco y bandera. */
export function applyCosmetics(scene: Phaser.Scene) { makeBoats(scene, hullId(), flagId()); }
