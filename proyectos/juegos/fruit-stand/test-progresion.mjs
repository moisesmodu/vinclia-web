// Prueba de progresión de Fruit Stand (sin navegador): compila la simulación con esbuild y la avanza a toda velocidad
// con el piloto automático (que solo mueve al personaje, como el dedo). Comprueba:
//  1) la primera compra llega antes de 30 s;  2) los tres puestos se pueden terminar (y el prestigio);
//  3) guardar y cargar devuelve el mismo estado;  4) las ganancias sin conexión tienen tope (2 h).
// Uso (desde proyectos/juegos): node fruit-stand/test-progresion.mjs   Escribe fruit-stand/progresion.json.
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = await build({
  stdin: { contents: "export { Sim, freshSave } from './src/sim.ts'; export { botThink } from './src/bot.ts'; export * as data from './src/data.ts';", resolveDir: here, loader: 'ts' },
  bundle: true, format: 'esm', write: false, platform: 'node',
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const { Sim, freshSave, botThink, data } = mod;

// azar con semilla: la prueba da siempre lo mismo
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(ok ? '✔' : '✘', msg); };

const sim = new Sim(freshSave());
sim.rnd = rnd;
const DT = 1 / 30;
let t = 0, think = 0;
const buys = [];
const stands = [];
let standStart = 0;
const LIMIT = 3 * 3600;
while (t < LIMIT) {
  if ((think -= DT) <= 0) { botThink(sim); think = 0.1; }
  sim.update(DT);
  t += DT;
  for (const e of sim.events) {
    if (e.k === 'build') buys.push({ stand: sim.stand, id: e.pad.id, cost: e.pad.cost, t: +t.toFixed(1) });
    if (e.k === 'gate') {
      stands.push({ stand: sim.stand, minutes: +((t - standStart) / 60).toFixed(1), served: sim.served, helpers: sim.helpers.length });
      standStart = t;
      sim.nextStand();
    }
  }
  sim.events.length = 0;
  if (process.env.DEBUG && Math.abs(t % 30) < DT) console.log(t.toFixed(0), sim.stand, Math.round(sim.player.x), Math.round(sim.player.y), sim.player.carry.join(), sim.cash, sim.pile, sim.queue.length, sim.customers.length, [...sim.bought].length);
  if (sim.prestige >= 1) break;
}
const first = buys[0];
check(first && first.t < 30, `first purchase at ${first?.t}s (< 30 s): ${first?.id}`);
check(stands.length >= 1, `stand 1 completed in ${stands[0]?.minutes} min`);
check(stands.length >= 3 && sim.prestige === 1, `all 3 stands completed, prestige ${sim.prestige} (×${data.prestigeMult(sim.prestige)})`);
// tiempo entre compras (algo que comprar cada 1–3 min)
const gaps = buys.slice(1).map((b, i) => b.t - buys[i].t);
const maxGap = Math.max(...gaps);
check(maxGap < 240, `longest gap between purchases ${maxGap.toFixed(0)} s; median ${gaps.sort((a, b) => a - b)[gaps.length >> 1].toFixed(0)} s`);

// guardar y cargar
const s2 = new Sim(freshSave());
s2.rnd = rnd;
for (let i = 0; i < 30 * 200; i++) { if (i % 3 === 0) botThink(s2); s2.update(DT); s2.events.length = 0; }
const saved = s2.serialize(1_000_000);
const s3 = new Sim(JSON.parse(JSON.stringify(saved)));
const again = s3.serialize(1_000_000);
check(JSON.stringify(saved) === JSON.stringify({ ...again, carry: saved.carry }) && JSON.stringify(again.carry) === JSON.stringify(saved.carry),
  `save/load round-trip identical (stand ${saved.stand}, cash ${saved.cash}, bought ${saved.bought.length})`);

// ganancias sin conexión con tope de 2 horas
const s4 = new Sim(freshSave());
s4.rnd = rnd;
for (let i = 0; i < 30 * 900; i++) { if (i % 3 === 0) botThink(s4); s4.update(DT); s4.events.length = 0; }
const now = 10_000_000_000;
const g1h = s4.offlineGain(now, now - 3600e3), g2h = s4.offlineGain(now, now - 7200e3), g10h = s4.offlineGain(now, now - 36000e3);
const g30s = s4.offlineGain(now, now - 30e3);
check(s4.helpers.length > 0 && g1h > 0, `offline 1 h = ${g1h} coins (rate ${s4.rate.toFixed(0)}/min, helpers ${s4.helpers.length})`);
check(g10h === g2h && g2h > g1h, `offline cap: 2 h = ${g2h}, 10 h = ${g10h} (same)`);
check(g30s === 0, 'offline < 60 s = 0');
const noHelp = new Sim(freshSave());
noHelp.rate = 100;
check(noHelp.offlineGain(now, now - 3600e3) === 0, 'offline without helpers = 0');

const res = {
  juego: 'fruit-stand', fecha: new Date().toISOString().slice(0, 10),
  primeraCompraS: first?.t, puestos: stands, compras: buys.length, huecoMaxEntreComprasS: +maxGap.toFixed(0),
  minutosHastaPrestigio: +(t / 60).toFixed(1), offline: { '1h': g1h, '2h': g2h, '10h': g10h }, fallos: fails,
};
await writeFile(resolve(here, 'progresion.json'), JSON.stringify(res, null, 2) + '\n');
console.log(JSON.stringify({ ...res }, null, 1));
process.exit(fails.length ? 1 : 0);
