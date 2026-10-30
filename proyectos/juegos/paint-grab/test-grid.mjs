// Pruebas del módulo puro del patio (src/grid.ts) y de la simulación (src/sim.ts), sin navegador.
// Uso (desde proyectos/juegos): node paint-grab/test-grid.mjs
// Compara el relleno rápido (solo la caja del territorio, colas tipadas) con un relleno de referencia evidente
// (inundación de toda la rejilla desde el borde) en miles de casos aleatorios, más casos concretos y tiempos.
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'pg-test-'));
await build({
  stdin: { contents: "export * from './src/grid.ts'; export * from './src/sim.ts';", resolveDir: here, loader: 'ts' },
  bundle: true, format: 'esm', outfile: join(dir, 'm.mjs'), logLevel: 'error',
});
const { Yard, Sim, rng } = await import(pathToFileURL(join(dir, 'm.mjs')).href);

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };

/** Referencia: estela a territorio y luego inundación de TODA la rejilla desde el borde. */
function reference(owner, w, h, id, trail) {
  const o = owner.slice();
  for (const i of trail) o[i] = id + 1;
  const seen = new Uint8Array(w * h), st = [];
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) st.push(y * w + x);
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) st.push(y * w + x);
  while (st.length) {
    const i = st.pop();
    if (seen[i] || o[i] === id + 1) continue;
    seen[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w);
  }
  for (let i = 0; i < w * h; i++) if (o[i] !== id + 1 && !seen[i]) o[i] = id + 1;
  return o;
}

const countsOk = (y) => {
  const c = new Int32Array(y.counts.length);
  for (const v of y.owner) if (v) c[v - 1]++;
  return c.every((v, k) => v === y.counts[k]);
};

/* 1. Rectángulo a mano: lazo desde un bloque 3×3 */
{
  const y = new Yard(20, 20, 2);
  for (let yy = 5; yy <= 7; yy++) for (let x = 5; x <= 7; x++) y.setOwner(y.idx(x, yy), 0);
  const path = [];
  for (let x = 8; x <= 12; x++) path.push(y.idx(x, 6));
  for (let yy = 7; yy <= 10; yy++) path.push(y.idx(12, yy));
  for (let x = 11; x >= 5; x--) path.push(y.idx(x, 10));
  for (let yy = 9; yy >= 8; yy--) path.push(y.idx(5, yy));
  const r = y.capture(0, path);
  // territorio final: x 5..12 de y 5..10 salvo la fila y=5 en x 8..12 (5 celdas) = 8*6 - 5 = 43
  ok(y.counts[0] === 43, `rectángulo: 43 celdas (${y.counts[0]})`);
  ok(r.gained === 43 - 9, 'rectángulo: ganadas = 34');
  ok(y.owner[y.idx(9, 8)] === 1 && y.owner[y.idx(9, 5)] === 0 && y.owner[y.idx(13, 8)] === 0, 'rectángulo: dentro sí, fuera no');
  ok(countsOk(y), 'rectángulo: cuentas');
}

/* 2. Línea de pared a pared: no encierra nada (el borde del patio cuenta como exterior) */
{
  const y = new Yard(16, 16, 2);
  y.setOwner(y.idx(0, 8), 0);
  const path = []; for (let x = 1; x < 16; x++) path.push(y.idx(x, 8));
  const r = y.capture(0, path);
  ok(r.gained === 15 && y.counts[0] === 16, 'pared a pared: solo la línea');
}

/* 3. Robar territorio ajeno y dejar a un rival sin nada (eliminado) */
{
  const y = new Yard(20, 20, 3);
  y.claimDisc(0, 4.5, 4.5, 2.5);
  y.setOwner(y.idx(10, 10), 1); y.setOwner(y.idx(11, 10), 1);  // rival pequeño en medio
  y.setOwner(y.idx(16, 16), 2);                                 // otro rival fuera del lazo
  const path = [];
  for (let x = 7; x <= 14; x++) path.push(y.idx(x, 4));
  for (let yy = 5; yy <= 13; yy++) path.push(y.idx(14, yy));
  for (let x = 13; x >= 4; x--) path.push(y.idx(x, 13));
  for (let yy = 12; yy >= 7; yy--) path.push(y.idx(4, yy));
  const r = y.capture(0, path);
  ok(y.owner[y.idx(10, 10)] === 1 && y.counts[1] === 0, 'robo: el rival encerrado pierde sus celdas');
  ok(r.wiped.length === 1 && r.wiped[0] === 1, 'robo: rival 1 eliminado');
  ok(y.counts[2] === 1, 'robo: el rival de fuera conserva lo suyo');
  ok(countsOk(y), 'robo: cuentas');
}

/* 4. Agujeros: territorio en anillo con un hueco ajeno dentro se rellena al cerrar cualquier lazo */
{
  const y = new Yard(30, 30, 2);
  for (let yy = 5; yy <= 15; yy++) for (let x = 5; x <= 15; x++) if (yy === 5 || yy === 15 || x === 5 || x === 15) y.setOwner(y.idx(x, yy), 0);
  y.setOwner(y.idx(10, 10), 1);
  const r = y.capture(0, [y.idx(16, 10)]);
  ok(y.counts[0] === 121 + 1 && r.wiped[0] === 1, 'anillo: el interior se rellena entero');
}

/* 5. Aleatorio contra la referencia (2.000 casos con varios pintores, caminos 4-conexos y bordes) */
{
  const R = rng(12345);
  let same = 0, total = 0;
  for (let t = 0; t < 2000; t++) {
    const w = 8 + Math.floor(R() * 40), h = 8 + Math.floor(R() * 40);
    const y = new Yard(w, h, 4);
    for (let p = 0; p < 4; p++) {
      const n = 1 + Math.floor(R() * 4);
      for (let k = 0; k < n; k++) y.claimDisc(p, R() * w, R() * h, 1 + R() * 4);
    }
    const id = Math.floor(R() * 4);
    // camino aleatorio 4-conexo fuera del territorio propio
    let x = Math.floor(R() * w), yy = Math.floor(R() * h);
    const path = [], seen = new Set();
    const L = 3 + Math.floor(R() * (w + h) * 2);
    for (let k = 0; k < L; k++) {
      const i = y.idx(x, yy);
      if (y.owner[i] !== id + 1 && !seen.has(i)) { seen.add(i); path.push(i); }
      const d = Math.floor(R() * 4);
      x = Math.min(w - 1, Math.max(0, x + (d === 0) - (d === 1)));
      yy = Math.min(h - 1, Math.max(0, yy + (d === 2) - (d === 3)));
    }
    const ref = reference(y.owner, w, h, id, path);
    y.capture(id, path);
    total++;
    if (ref.every((v, i) => v === y.owner[i]) && countsOk(y)) same++;
    // segunda captura sobre el mismo patio (cajas y marcas reutilizadas)
    const extra = [y.idx(Math.floor(R() * w), Math.floor(R() * h))];
    const ref2 = reference(y.owner, w, h, id, extra);
    y.capture(id, extra);
    total++;
    if (ref2.every((v, i) => v === y.owner[i]) && countsOk(y)) same++;
  }
  ok(same === total, `aleatorio: ${same}/${total} iguales a la referencia`);
  console.log(`aleatorio: ${same}/${total} capturas idénticas a la referencia`);
}

/* 6. Borrar territorio y celda propia más cercana */
{
  const y = new Yard(40, 40, 2);
  y.claimDisc(1, 30.5, 30.5, 3);
  const i = y.nearestOwn(1, 5, 5);
  const bx = i % 40, by = (i / 40) | 0;
  ok(Math.hypot(bx - 30, by - 30) <= 3.5 && bx <= 30 && by <= 30, 'más cercana: en el lado bueno del disco');
  y.wipe(1);
  ok(y.counts[1] === 0 && y.owner.every((v) => v === 0) && y.nearestOwn(1, 5, 5) === -1, 'borrar: patio limpio');
}

/* 7. Tiempo de la captura más grande posible (96×96, territorio de un borde a otro) */
{
  const y = new Yard(96, 96, 8);
  y.claimDisc(0, 2.5, 2.5, 2);
  const path = [];
  for (let x = 3; x < 95; x++) path.push(y.idx(x, 1));
  for (let yy = 2; yy < 95; yy++) path.push(y.idx(94, yy));
  for (let x = 93; x >= 1; x--) path.push(y.idx(x, 94));
  for (let yy = 93; yy >= 4; yy--) path.push(y.idx(1, yy));
  const t0 = performance.now();
  y.capture(0, path);
  const big = performance.now() - t0;
  let worst = 0;
  for (let k = 0; k < 200; k++) { const t = performance.now(); y.capture(0, [y.idx(95, 95 - (k % 90))]); worst = Math.max(worst, performance.now() - t); }
  ok(y.pct(0) > 95, `captura grande: ${y.pct(0).toFixed(1)} %`);
  console.log(`captura grande (${y.counts[0]} celdas): ${big.toFixed(2)} ms; peor de 200 capturas sobre caja completa: ${worst.toFixed(3)} ms`);
}

/* 8. Simulación: estela 4-conexa en diagonal, captura al volver, cortar estela ajena y la propia */
{
  const s = new Sim({ round: 1, bots: 1, rand: rng(7), w: 40 });
  const p = s.player, bot = s.painters[1];
  bot.ai = null; bot.speed = 0; // rival quieto
  s.yard.wipe(1); s.yard.claimDisc(1, 35.5, 35.5, 2);
  bot.x = 35.5; bot.y = 35.5;
  p.target = p.heading = Math.PI / 4; // diagonal
  for (let k = 0; k < 60; k++) s.step(1 / 60);
  let conn = p.trail.length > 3;
  for (let k = 1; k < p.trail.length; k++) {
    const a = p.trail[k - 1], b = p.trail[k];
    if (Math.abs((a % 40) - (b % 40)) + Math.abs(((a / 40) | 0) - ((b / 40) | 0)) !== 1) conn = false;
  }
  ok(conn, `sim: estela diagonal 4-conexa (${p.trail.length} celdas)`);
  ok(p.alive, 'sim: sigue vivo tras la diagonal');
}
const fresh = () => {
  const s = new Sim({ round: 1, bots: 1, rand: rng(7), w: 40 });
  const bot = s.painters[1];
  bot.ai = null; bot.speed = 0;
  s.yard.wipe(1); s.yard.claimDisc(1, 35.5, 35.5, 2); bot.x = bot.y = 35.5; bot.cell = s.yard.idx(35, 35);
  const drive = (a, secs) => { s.player.target = s.player.heading = a; for (let k = 0; k < Math.round(secs * 60) && s.player.alive; k++) s.step(1 / 60); };
  return { s, p: s.player, bot, drive };
};
{
  // lazo rectangular: derecha, abajo, izquierda, arriba hasta volver a casa
  const { s, p, drive } = fresh();
  const before = s.yard.counts[0];
  drive(0, 1); drive(Math.PI / 2, 1); drive(Math.PI, 1);
  for (let k = 0; k < 120 && p.trail.length; k++) drive(-Math.PI / 2, 1 / 60);
  // territorio esperado ≈ rectángulo de unos 7×7 celdas más el disco inicial
  ok(p.alive && p.trail.length === 0 && s.yard.counts[0] > before + 30 && s.events.some((e) => e.t === 'capture'),
    `sim: captura al volver (${before} → ${s.yard.counts[0]})`);
}
{
  const { s, p, bot, drive } = fresh();
  const ci = s.yard.idx(20, 25);
  s.yard.trail[ci] = 2; bot.trail = [ci]; bot.outside = true;
  drive(Math.PI / 2, 1);
  ok(!bot.alive && s.events.some((e) => e.t === 'kill' && e.victim === 1 && e.reason === 'cut'), 'sim: cortar la estela ajena elimina al rival');
  ok(s.yard.counts[1] === 0 && p.alive, 'sim: el eliminado pierde su territorio, el jugador sigue');
}
{
  const { s, p, drive } = fresh();
  drive(0, 1);
  drive(Math.PI, 0.5); // media vuelta seca sobre la propia estela
  ok(!p.alive && s.events.some((e) => e.t === 'kill' && e.victim === 0 && e.reason === 'self'), 'sim: pisar tu estela te elimina');
}
{
  // choque de cabezas: dentro de casa estás a salvo
  const { s, p, bot } = fresh();
  bot.outside = true; bot.trail = [s.yard.idx(21, 20)]; bot.x = 20.6; bot.y = 20.5;
  s.step(1 / 60);
  ok(p.alive && !bot.alive && s.events.some((e) => e.reason === 'head'), 'sim: choque de cabezas, pierde el que está fuera');
}

/* 9. Simulación larga con 7 bots: sin errores, cuentas coherentes, alguien captura */
{
  const s = new Sim({ round: 3, bots: 7, rand: rng(99) });
  s.player.ai = 'greedy';
  let caps = 0, kills = 0, steps = 0;
  const t0 = performance.now();
  for (let k = 0; k < 60 * 120; k++) {
    s.step(1 / 60); steps++;
    for (const e of s.events) { if (e.t === 'capture') caps++; if (e.t === 'kill') kills++; }
    s.events.length = 0;
    if (!s.player.alive) s.revivePlayer();
  }
  const ms = (performance.now() - t0) / steps;
  ok(countsOk(s.yard), 'sim larga: cuentas coherentes');
  ok(caps > 20, `sim larga: ${caps} capturas, ${kills} eliminaciones`);
  console.log(`sim 2 min, 8 pintores: ${caps} capturas, ${kills} eliminaciones, ${(ms * 1000).toFixed(1)} µs por paso`);
}

rmSync(dir, { recursive: true, force: true });
console.log(`\n${pass} correctas, ${fail} fallidas`);
process.exit(fail ? 1 : 0);
