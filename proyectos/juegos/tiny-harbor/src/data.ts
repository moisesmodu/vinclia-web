/**
 * Datos de Tiny Harbor (sin Phaser: los usa también la prueba de progresión en Node).
 * El puerto se ve entero desde arriba (sin cámara que siga a nadie). Hay dos distribuciones del mismo puerto:
 * 'wide' (apaisado, 1600×900) y 'tall' (vertical, 900×1500). La simulación guarda los barcos por hueco (amarre o
 * fondeadero), así que al girar la pantalla solo se recolocan.
 */

export type LayoutName = 'wide' | 'tall';
export type Pt = { x: number; y: number };
export type Berth = Pt & { dockY: number };
export type Layout = {
  name: LayoutName; w: number; h: number;
  /** Borde del muelle de tierra (la tierra es y < landY). */
  landY: number;
  /** Pantalán flotante para la segunda fila de amarres (solo en vertical). */
  pier?: { y0: number; y1: number };
  berths: Berth[];
  queue: Pt[];
  /** Zona de mar abierto: soltar aquí un barco cargado = zarpar. */
  exit: { x0: number; y0: number; x1: number; y1: number };
  exitTo: Pt;
  spawn: Pt;
  tugHome: Pt;
  signs: Pt[];
  /** Faro (decoración y puerta al siguiente puerto). */
  lighthouse: Pt;
  warehouse: Pt;
};

const B = (x: number, dockY: number): Berth => ({ x, y: dockY + 130, dockY });

export const LAYOUTS: Record<LayoutName, Layout> = {
  wide: {
    name: 'wide', w: 1600, h: 900, landY: 250,
    berths: [0, 1, 2, 3, 4, 5].map((i) => B(190 + i * 180, 250)),
    queue: [0, 1, 2, 3, 4].map((q) => ({ x: 140 + q * 165, y: 770 })),
    exit: { x0: 1250, y0: 360, x1: 1600, y1: 900 },
    exitTo: { x: 1850, y: 700 },
    spawn: { x: -160, y: 770 },
    tugHome: { x: 1000, y: 600 },
    signs: [{ x: 1235, y: 120 }, { x: 1370, y: 120 }, { x: 1505, y: 120 }],
    lighthouse: { x: 1530, y: 330 },
    warehouse: { x: 90, y: 112 },
  },
  tall: {
    name: 'tall', w: 900, h: 1800, landY: 300,
    pier: { y0: 660, y1: 710 },
    berths: [...[0, 1, 2, 3].map((i) => B(125 + i * 180, 300)), B(215, 710), B(575, 710)],
    queue: [0, 1, 2, 3, 4].map((q) => ({ x: 105 + q * 172, y: 1250 })),
    exit: { x0: 0, y0: 1450, x1: 900, y1: 1800 },
    exitTo: { x: 450, y: 2060 },
    spawn: { x: -160, y: 1250 },
    tugHome: { x: 560, y: 1040 },
    signs: [{ x: 175, y: 128 }, { x: 450, y: 128 }, { x: 725, y: 128 }],
    lighthouse: { x: 830, y: 1080 },
    warehouse: { x: -1, y: -1 },
  },
};

export type Kind = 'berth' | 'crane' | 'hull' | 'cargo' | 'buoy' | 'tug' | 'pilot' | 'gate';
export type Pad = { id: string; kind: Kind; cost: number };
export type Theme = 'village' | 'tropic' | 'city';
export type PortDef = { theme: Theme; crate: number; berths: number; tugs: number; pads: Pad[] };

/** Ritmo base de la simulación. */
export const BASE = {
  cap: 3,            // cajas por barco al empezar
  craneS: 1.25,      // segundos por caja
  craneMul: 0.8,     // cada mejora de grúa
  cargoMul: 1.5,     // cada mejora de carga (cajas más valiosas)
  queue: 2,          // barcos esperando en el fondeadero
  arriveS: 5.5,      // un barco nuevo cada...
  arriveMul: 0.82,   // cada boya
  tugSpeed: 230,
  sailDelay: 0.9,    // el práctico zarpa solo tras...
  boatSpeed: 260,
  starEvery: 5,      // una estrella cada 5 barcos
};

let n = 0;
const P = (kind: Kind, cost: number): Pad => ({ id: `${kind}${++n}`, kind, cost });
const port = (theme: Theme, crate: number, berths: number, tugs: number, list: [Kind, number][]): PortDef => {
  n = 0;
  return { theme, crate, berths, tugs, pads: list.map(([k, c]) => P(k, c)) };
};

/** Los tres puertos (capítulos). Las mejoras salen en este orden, de tres en tres (la puerta sale sola al final). */
export const PORTS: PortDef[] = [
  port('village', 2, 1, 0, [
    ['crane', 12], ['berth', 25], ['hull', 40], ['buoy', 55], ['berth', 75], ['cargo', 95], ['crane', 120],
    ['tug', 150], ['hull', 185], ['berth', 225], ['buoy', 270], ['pilot', 320], ['cargo', 380], ['crane', 450],
    ['hull', 530], ['gate', 650],
  ]),
  port('tropic', 5, 2, 0, [
    ['crane', 40], ['hull', 70], ['berth', 100], ['buoy', 140], ['tug', 190], ['cargo', 240], ['crane', 300],
    ['berth', 370], ['hull', 450], ['pilot', 540], ['buoy', 640], ['cargo', 750], ['berth', 880], ['crane', 1020],
    ['tug', 1180], ['hull', 1350], ['cargo', 1550], ['gate', 1900],
  ]),
  port('city', 12, 2, 1, [
    ['crane', 120], ['hull', 200], ['berth', 290], ['buoy', 390], ['cargo', 500], ['pilot', 630], ['crane', 780],
    ['berth', 950], ['hull', 1150], ['tug', 1380], ['cargo', 1650], ['buoy', 1950], ['berth', 2300], ['crane', 2700],
    ['hull', 3150], ['cargo', 3700], ['berth', 4300], ['tug', 5000], ['gate', 6200],
  ]),
];

/** Multiplicador permanente de ventas por prestigio. */
export const prestigeMult = (p: number) => 1 + 0.5 * p;
/** Tope de las ganancias sin conexión: 2 horas. */
export const OFFLINE_CAP_S = 2 * 3600;
