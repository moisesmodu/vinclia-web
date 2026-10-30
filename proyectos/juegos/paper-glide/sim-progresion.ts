// Simulación de progresión de Paper Glide (sin navegador): el mismo módulo puro que usa el juego (src/vuelo.ts).
// Un jugador "piloto automático" vuela, cobra y compra la mejora más barata tras cada vuelo.
// Uso (desde proyectos/juegos): node --experimental-strip-types paper-glide/sim-progresion.ts [vuelos=40] [semillas=5]
import { Flight, autopilot, price, zeroLevels, flightCoins, UP_IDS, MAX_LVL, bestGlide, stats, type Levels } from './src/vuelo.ts';

const FLIGHTS = +(process.argv[2] || 40), SEEDS = +(process.argv[3] || 5);

function fly(levels: Levels, seed: number, power: number) {
  const f = new Flight(levels, seed, power);
  while (!f.landed && f.t < 400) f.step(autopilot(f));
  return { dist: f.dist, t: f.t, picked: f.coins, coins: flightCoins(f.dist, f.coins) };
}

const rows: { n: number; dist: number; t: number; coins: number; lv: number }[][] = [];
let firstBuy: number[] = [];
for (let sd = 0; sd < SEEDS; sd++) {
  const lv = zeroLevels();
  let wallet = 0, first = 0;
  const r: (typeof rows)[0] = [];
  for (let n = 1; n <= FLIGHTS; n++) {
    const power = 0.85 + ((sd * 7 + n * 13) % 10) / 40; // lanzamientos entre regulares y perfectos
    const res = fly(lv, 1000 * sd + n, power);
    wallet += res.coins;
    r.push({ n, dist: res.dist, t: res.t, coins: res.coins, lv: UP_IDS.reduce((a, k) => a + lv[k], 0) });
    // compra: la más barata que alcance, repetidamente
    for (;;) {
      const opts = UP_IDS.filter((k) => lv[k] < MAX_LVL).sort((a, b) => price(a, lv[a]) - price(b, lv[b]));
      if (!opts.length || price(opts[0], lv[opts[0]]) > wallet) break;
      wallet -= price(opts[0], lv[opts[0]]); lv[opts[0]]++;
      if (!first) first = n;
    }
  }
  firstBuy.push(first);
  rows.push(r);
}
const avg = (f: (i: number) => number) => rows.reduce((a, _r, i) => a + f(i), 0) / rows.length;
console.log('vuelo  distancia(m)  tiempo(s)  monedas  niveles comprados   (media de', SEEDS, 'semillas)');
for (let n = 0; n < FLIGHTS; n++) {
  if (n > 10 && n % 5 !== 4 && n !== FLIGHTS - 1) continue;
  console.log(String(n + 1).padStart(5), String(Math.round(avg((i) => rows[i][n].dist))).padStart(12),
    avg((i) => rows[i][n].t).toFixed(1).padStart(10), String(Math.round(avg((i) => rows[i][n].coins))).padStart(8),
    avg((i) => rows[i][n].lv).toFixed(1).padStart(10));
}
console.log('primera mejora comprada tras el vuelo nº:', firstBuy.join(', '));
const z = stats(zeroLevels()), m = stats({ wings: 10, tail: 10, weight: 10, launch: 10, magnet: 10 });
console.log('planeo L/D base', bestGlide(z).ld.toFixed(2), '→ máx', bestGlide(m).ld.toFixed(2), '· v mejor planeo', bestGlide(z).v.toFixed(1), '→', bestGlide(m).v.toFixed(1), 'm/s');
console.log('coste total de todas las mejoras:', UP_IDS.reduce((a, k) => a + Array.from({ length: MAX_LVL }, (_, l) => price(k, l)).reduce((x, y) => x + y, 0), 0));
