/**
 * Los 20 niveles de Bike Flip, escritos como datos: una lista de tramos en metros (1 m = 50 px).
 *   F(len)          llano
 *   H(len, dy)      cuesta suave (coseno); dy > 0 baja, dy < 0 sube
 *   B(len, amp, wl) baches (altura y longitud de onda)
 *   R(len, h)       rampa que sube h y acaba a 36° (h ≤ 0,72·len): lanza la moto
 *   W(len, h)       joroba (sube y baja h): a velocidad, salto corto
 *   G(len, dy)      hueco sin suelo; se aterriza dy metros más abajo (o más arriba si es negativo)
 * El nivel empieza con un llano de salida y termina con la bandera de meta y un llano de frenado.
 * t3 / t2: segundos para 3 y 2 estrellas (1 estrella por llegar). Calibrados con el piloto automático
 * de bike-flip/test-niveles.mjs.
 */

export type Seg =
  | ['F', number]
  | ['H', number, number]
  | ['B', number, number, number]
  | ['R', number, number]
  | ['W', number, number]
  | ['G', number, number];

export type Level = { segs: Seg[]; t3: number; t2: number; sky?: number };

const F = (l: number): Seg => ['F', l];
const H = (l: number, dy: number): Seg => ['H', l, dy];
const B = (l: number, a: number, wl = 2): Seg => ['B', l, a, wl];
const R = (l: number, h: number): Seg => ['R', l, h];
const W = (l: number, h: number): Seg => ['W', l, h];
const G = (l: number, dy: number): Seg => ['G', l, dy];

/** Atajos de tramos repetidos: salto con hueco (rampa + hueco + bajada de aterrizaje) y salto de voltereta. */
const jump = (h: number, gap: number, dy: number): Seg[] => [R(Math.max(5, h * 2.2), h), G(gap, dy), H(8, Math.max(1, dy))];
const flipRamp = (h: number, drop: number): Seg[] => [R(h * 2.2, h), H(drop * 3.2, drop)];

export const LEVELS: Level[] = [
  // 1 · aprender a acelerar: colinas suaves y jorobas
  { t3: 23, t2: 29, segs: [F(10), H(18, -2), H(18, 3), F(8), W(8, 1), F(10), H(20, -3), H(16, 3), F(6), W(10, 1.4), F(10), H(16, -2), H(14, 2), F(8), W(8, 1.2), F(6), H(18, -3), H(18, 3), F(10)] },
  // 2 · primeros saltos: rampas pequeñas y huecos cortos
  { t3: 22, t2: 27, segs: [F(10), H(16, -2), H(14, 2), F(6), ...jump(2, 4, 1), F(10), W(8, 1.2), F(6), H(18, -3), H(12, 3), F(6), ...jump(2.2, 5, 1), F(8), H(14, -2), H(14, 2), ...jump(2, 5, 1), F(12)] },
  // 3 · primera voltereta: rampas altas sobre bajadas largas
  { t3: 24, t2: 31, segs: [F(10), H(14, -2), F(6), ...flipRamp(4, 8), F(10), W(8, 1.2), F(6), H(16, -3), F(4), ...flipRamp(4.5, 8), F(12), H(14, -2), F(6), W(9, 1.4), F(6), ...flipRamp(4, 7), F(12)] },
  // 4 · baches y huecos
  { t3: 22, t2: 28, segs: [F(10), B(14, 0.35, 2), F(6), ...jump(2.5, 6, 1.5), F(6), B(16, 0.45, 2.4), F(6), H(14, -3), ...jump(2, 6, 0.5), F(6), H(12, 3), W(8, 1.2), F(6), B(14, 0.4, 2), F(4), ...jump(2.5, 6, 1), F(12)] },
  // 5 · cuestas empinadas
  { t3: 22, t2: 28, segs: [F(10), H(14, -4), F(4), H(10, 3), H(12, -5), F(4), H(14, 6), F(6), ...flipRamp(4, 8), F(6), H(12, -5), F(4), H(10, 5), F(6), H(10, -5), F(3), H(12, 5), F(4), H(14, -4), F(12)] },
  // 6 · huecos seguidos
  { t3: 25, t2: 32, segs: [F(10), H(10, -1), ...jump(2.5, 6, 1), F(5), ...jump(1.6, 5, 1), F(5), ...jump(1.6, 5, 1), F(6), B(12, 0.4, 2), F(6), ...flipRamp(4.5, 9), F(8), H(12, -3), ...jump(2, 6, 1), F(4), ...jump(2, 6, 1), F(12)] },
  // 7 · escalones: se aterriza más alto que la rampa
  { t3: 22, t2: 28, segs: [F(12), R(6, 2.5), G(4, -0.5), F(6), R(6, 2.5), G(4, -0.5), F(6), H(14, 4), F(4), W(10, 1.6), F(6), R(7, 3), G(5, -0.5), F(8), H(16, 6), F(4), ...flipRamp(4.5, 8), F(6), R(6, 2.5), G(4, -0.5), F(6), H(14, 3), F(12)] },
  // 8 · montaña rusa de jorobas
  { t3: 29, t2: 38, segs: [F(10), W(8, 1.4), W(8, 1.6), W(8, 1.8), F(6), H(18, -4), H(14, 4), W(9, 2), W(9, 2), F(6), ...flipRamp(5, 10), F(6), B(14, 0.5, 2.2), F(6), W(9, 2), W(9, 2.2), W(9, 2.4), F(6), H(16, -3), H(16, 3), F(12)] },
  // 9 · huecos largos (hay que llegar lanzado)
  { t3: 26, t2: 33, segs: [F(10), H(20, 5), F(6), ...jump(3.5, 8, 2), F(6), H(16, -4), F(4), H(10, 3), ...jump(3, 8, 2), F(6), B(12, 0.45, 2), F(6), H(16, 4), ...jump(3.5, 8, 2.5), F(6), H(14, -3), F(4), ...jump(3, 7, 1), F(12)] },
  // 10 · el gran salto (voltereta casi obligada para la tercera estrella)
  { t3: 31, t2: 40, segs: [F(10), H(14, -3), H(14, 3), F(4), ...flipRamp(6, 12), F(6), W(8, 1.4), F(6), H(22, 6), ...jump(4, 8, 3), F(6), H(14, -3), ...jump(3, 6, 1), F(6), B(12, 0.5, 2.2), F(6), H(14, 5), ...flipRamp(6, 12), F(14)] },
  // 11 · escalones y baches duros
  { t3: 25, t2: 32, segs: [F(10), B(16, 0.6, 2.4), F(4), R(6, 2.5), G(5, -1), F(6), R(6, 2.5), G(5, -1), F(6), B(14, 0.6, 2.2), F(6), H(20, 7), ...jump(4.5, 9, 3), F(6), H(14, -3), F(4), B(14, 0.6, 2.4), F(4), R(7, 3), G(5, -1), F(6), H(16, 5), F(14)] },
  // 12 · valle profundo
  { t3: 31, t2: 40, segs: [F(10), ...flipRamp(4, 14), F(4), H(20, -10), F(4), ...jump(4, 8, 2), F(6), H(18, 8), F(4), H(16, -8), F(6), W(9, 2), F(6), ...flipRamp(5, 14), F(4), H(20, -9), F(4), W(9, 2), F(14)] },
  // 13 · islas: plataformas cortas entre huecos
  { t3: 25, t2: 32, segs: [F(10), H(10, -1), ...jump(2.5, 6, 1), F(3), R(5, 1.4), G(6, 1), F(4), R(5, 1.4), G(6, 1), F(4), R(5, 1.4), G(7, 1.5), H(10, 2), F(6), H(16, -4), F(4), ...flipRamp(6, 12), F(8), R(5, 1.5), G(6, 1), F(4), R(5, 1.5), G(6, 1), F(4), R(5, 1.5), G(6, 1), F(14)] },
  // 14 · paredes empinadas
  { t3: 28, t2: 36, segs: [F(10), H(10, -5), F(4), H(10, 5), F(2), H(10, -6), F(4), H(12, 6), F(4), ...jump(4, 9, 3), F(4), H(10, -6), F(2), H(10, 6), B(14, 0.5, 2), F(4), H(9, -6), F(3), H(9, 6), F(3), H(9, -6), F(3), H(12, 7), ...flipRamp(5, 10), F(14)] },
  // 15 · doble rampa gigante
  { t3: 33, t2: 43, segs: [F(10), H(16, 6), F(4), ...flipRamp(6, 12), F(4), H(10, -2), ...flipRamp(6, 12), F(6), B(14, 0.55, 2.2), F(6), H(16, -4), ...jump(3, 7, 1), F(6), H(16, 5), ...jump(4.5, 9, 3), F(4), ...flipRamp(6, 12), F(14)] },
  // 16 · el cañón
  { t3: 34, t2: 44, segs: [F(10), H(12, -2), ...jump(4, 9, 3), F(6), H(14, -4), R(7, 3), G(7, -0.5), F(6), ...jump(3, 8, 1), F(4), W(9, 2), W(9, 2), F(6), H(24, 10), ...flipRamp(6, 12), F(6), H(14, -3), ...jump(4, 9, 3), F(4), R(7, 3), G(6, -0.5), F(14)] },
  // 17 · baches de piedra y escalones altos
  { t3: 35, t2: 45, segs: [F(10), B(20, 0.7, 2.6), F(4), R(7, 3), G(5, -1.5), F(6), B(16, 0.7, 2.4), F(4), R(7, 3), G(5, -1.5), F(6), H(20, 8), ...jump(5, 9, 3.5), F(6), H(10, -5), F(4), H(10, 5), B(16, 0.7, 2.4), F(4), R(7, 3), G(5, -1.5), F(6), H(16, 6), ...flipRamp(6, 12), F(14)] },
  // 18 · montaña rusa final
  { t3: 38, t2: 49, segs: [F(10), W(9, 2), W(9, 2.2), W(9, 2.4), F(4), H(10, -6), F(2), H(16, 9), ...jump(4, 9, 3), F(4), H(12, -6), H(12, 6), W(10, 2.4), W(10, 2.4), F(6), ...flipRamp(6, 12), F(6), W(9, 2.2), W(9, 2.4), W(9, 2.6), F(4), H(10, -5), F(2), H(14, 6), ...jump(4, 8, 2), F(14)] },
  // 19 · islas altas
  { t3: 33, t2: 43, segs: [F(10), H(12, -2), R(7, 3), G(6, 0), F(3), R(5, 2), G(6, 0), F(3), R(5, 2), G(6, 0), F(3), R(5, 2), G(7, 2), H(10, 2), F(6), H(20, 8), ...jump(5, 9, 3.5), F(4), B(14, 0.6, 2.2), F(4), H(10, -3), R(6, 2.5), G(6, 0), F(3), R(5, 2), G(6, 0), F(3), R(5, 2), G(7, 1.5), H(10, 2), F(6), ...flipRamp(6, 12), F(14)] },
  // 20 · todo junto
  { t3: 49, t2: 64, segs: [F(10), B(14, 0.6, 2.4), F(4), R(6, 2.5), G(6, -1), F(5), R(6, 2.5), G(6, -1), F(6), H(14, 6), ...jump(5, 9, 3.5), F(4), H(10, -6), F(2), H(12, 6), W(10, 2.4), W(10, 2.4), F(4), R(6, 2), G(7, 0.5), F(3), R(5, 2), G(7, 1), H(10, 2), F(4), H(24, 10), ...flipRamp(6, 12), F(4), B(16, 0.7, 2.4), F(4), H(10, -5), F(2), H(10, 5), ...jump(4, 9, 3), F(4), R(6, 2.5), G(5, -1), F(6), ...flipRamp(6, 12), F(14)] },
];
