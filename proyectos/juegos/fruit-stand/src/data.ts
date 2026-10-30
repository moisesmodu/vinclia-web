/**
 * Datos de Fruit Stand (sin Phaser: los usa también la prueba de progresión en Node).
 * Mundo de 1400×1000 unidades visto desde arriba: huerto a la izquierda, estantes en el centro, mostrador a la
 * derecha, alfombrillas de mejoras abajo a la izquierda y la puerta al siguiente puesto arriba.
 */

export type Fruit = 'apple' | 'banana' | 'orange' | 'melon';
export type Item = Fruit | 'juice';
export const FRUITS: Fruit[] = ['apple', 'banana', 'orange', 'melon'];

/** Precio de venta de cada unidad (antes del multiplicador de prestigio). */
export const PRICE: Record<Item, number> = { apple: 3, banana: 5, orange: 8, melon: 15, juice: 16 };
/** Frutas por árbol y segundos que tarda en volver a salir cada una. */
export const TREE: Record<Fruit, { max: number; regrow: number }> = {
  apple: { max: 3, regrow: 2.4 },
  banana: { max: 3, regrow: 3 },
  orange: { max: 3, regrow: 3.4 },
  melon: { max: 2, regrow: 4.5 },
};

export const WORLD = { w: 1400, h: 1000 };
export const SHELF_CAP = 8;
export const MACHINE = { cap: 6, inputCap: 8, secs: 1.6 };
export const COUNTER = { x: 1230, y: 330 };
export const CASHIER_SPOT = { x: COUNTER.x, y: COUNTER.y - 62 };
export const PILE = { x: COUNTER.x - 120, y: COUNTER.y - 40 };
export const ENTRY = { x: 1080, y: WORLD.h + 50 };
export const EXIT = { x: 1360, y: WORLD.h + 50 };
export const SPAWN = { x: 820, y: 640 };
export const HELPER_HOME = { x: 470, y: 880 };
export const BASE = { cap: 3, capStep: 2, speed: 230, speedMul: 1.18, helperSpeed: 150, helperCap: 3 };

export type PadKind = 'tree' | 'shelf' | 'machine' | 'cap' | 'speed' | 'helper' | 'cashier' | 'gate';
export type PadDef = { id: string; kind: PadKind; cost: number; x: number; y: number; fruit?: Fruit; item?: Item };
export type StandDef = { theme: 'orchard' | 'village' | 'city'; prebuilt: PadDef[]; pads: PadDef[] };

const treePos = (col: number, row: number) => ({ x: 120 + col * 132, y: 210 + row * 158 });
const shelfPos = (i: number) => ({ x: 680 + (i % 3) * 150, y: 300 + Math.floor(i / 3) * 200 });
const MATS = [{ x: 150, y: 880 }, { x: 300, y: 880 }, { x: 610, y: 880 }];
const GATE = { x: 700, y: 110 };

const tree = (fruit: Fruit, col: number, row: number, cost = 0): PadDef => ({ id: `t-${fruit}-${row}`, kind: 'tree', fruit, cost, ...treePos(col, row) });
const shelf = (item: Item, i: number, cost = 0): PadDef => ({ id: `s-${i}`, kind: item === 'juice' ? 'machine' : 'shelf', item, fruit: item === 'juice' ? undefined : item, cost, ...shelfPos(i) });
const cap = (n: number, cost: number): PadDef => ({ id: `cap${n}`, kind: 'cap', cost, ...MATS[0] });
const speed = (n: number, cost: number): PadDef => ({ id: `spd${n}`, kind: 'speed', cost, ...MATS[1] });
const helper = (n: number, cost: number): PadDef => ({ id: `hlp${n}`, kind: 'helper', cost, ...MATS[2] });
const cashier = (cost: number): PadDef => ({ id: 'cashier', kind: 'cashier', cost, x: COUNTER.x - 150, y: COUNTER.y + 110 });
const gate = (cost: number): PadDef => ({ id: 'gate', kind: 'gate', cost, ...GATE });

/** Los tres puestos (capítulos). Las alfombrillas salen en este orden, de tres en tres. */
export const STANDS: StandDef[] = [
  {
    theme: 'orchard',
    prebuilt: [tree('apple', 0, 0), tree('apple', 0, 1), shelf('apple', 0)],
    pads: [
      tree('apple', 0, 2, 10), cap(1, 20), shelf('banana', 1, 40), tree('banana', 1, 0, 50), speed(1, 60),
      helper(1, 90), tree('banana', 1, 1, 110), shelf('apple', 3, 130), cap(2, 150), tree('apple', 0, 3, 170),
      cashier(220), speed(2, 260), tree('banana', 1, 2, 300), helper(2, 350), gate(450),
    ],
  },
  {
    theme: 'village',
    prebuilt: [tree('apple', 0, 0), tree('apple', 0, 1), shelf('apple', 0)],
    pads: [
      tree('apple', 0, 2, 15), shelf('banana', 1, 40), tree('banana', 1, 0, 50), cap(1, 60), tree('banana', 1, 1, 90),
      speed(1, 110), helper(1, 140), shelf('orange', 2, 180), tree('orange', 2, 0, 200), tree('orange', 2, 1, 260),
      cap(2, 300), shelf('juice', 5, 380), cashier(450), tree('orange', 2, 2, 500), helper(2, 560), shelf('banana', 4, 620),
      speed(2, 700), cap(3, 800), tree('banana', 1, 2, 850), helper(3, 950), gate(1200),
    ],
  },
  {
    theme: 'city',
    prebuilt: [tree('apple', 0, 0), tree('apple', 0, 1), shelf('apple', 0), tree('banana', 1, 0), shelf('banana', 1)],
    pads: [
      tree('apple', 0, 2, 20), tree('banana', 1, 1, 40), cap(1, 70), shelf('orange', 2, 110), tree('orange', 2, 0, 130),
      speed(1, 160), helper(1, 200), tree('orange', 2, 1, 240), shelf('melon', 4, 300), tree('melon', 3, 0, 330),
      cashier(400), shelf('juice', 5, 480), cap(2, 560), tree('melon', 3, 1, 640), helper(2, 720), shelf('apple', 3, 800),
      tree('orange', 2, 2, 880), speed(2, 960), tree('melon', 3, 2, 1050), helper(3, 1150), cap(3, 1250),
      tree('banana', 1, 2, 1350), helper(4, 1600), gate(2200),
    ],
  },
];

// ajuste de ritmo (prueba de progresión): primer puesto en unos 12-15 min, el resto más largos
const PACE = [0.75, 0.8, 0.85];
STANDS.forEach((st, i) => { for (const p of st.pads) p.cost = Math.max(10, Math.round((p.cost * PACE[i]) / 5) * 5); });

/** Multiplicador permanente de ventas por prestigio. */
export const prestigeMult = (p: number) => 1 + 0.5 * p;
/** Tope de las ganancias sin conexión: 2 horas. */
export const OFFLINE_CAP_S = 2 * 3600;
