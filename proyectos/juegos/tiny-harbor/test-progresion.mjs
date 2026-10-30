// Tiny Harbor progression test (no browser): bundles the simulation with esbuild and runs it at full speed with the
// autoplay bot (which only drags boats and taps price signs, like a finger). Checks:
//  1) first purchase before 30 s;  2) a purchase every ≤ 2 min during the first 20 min (Monkey Mart rule: always
//  something to buy every 1–3 min);  3) the three ports can be finished (and prestige);  4) save/load round trip;
//  5) offline earnings are capped (2 h) and need automation (tug or pilot);  6) layout switch keeps boats sane.
// Usage (from proyectos/juegos): node tiny-harbor/test-progresion.mjs [wide|tall]   Writes tiny-harbor/progresion.json.
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = await build({
  stdin: { contents: "export { Sim, freshSave } from './src/sim.ts'; export { Bot } from './src/bot.ts'; export * as data from './src/data.ts';", resolveDir: here, loader: 'ts' },
  bundle: true, format: 'esm', write: false, platform: 'node',
});
const { Sim, freshSave, Bot, data } = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const layout = process.argv[2] || 'wide';

let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(ok ? '✔' : '✘', msg); };

function run(limitS, opts = {}) {
  const sim = new Sim(freshSave(), opts.layout || layout);
  sim.rnd = rnd;
  const bot = new Bot();
  if (process.env.SLOW) { bot.speed = 800; bot.pause = 1.2; bot.buyDelay = 2; } // jugador lento
  const DT = 1 / 30;
  let t = 0, portStart = 0;
  const buys = [], ports = [];
  while (t < limitS) {
    bot.think(sim, DT);
    sim.update(DT);
    t += DT;
    if (opts.flipAt && Math.abs(t - opts.flipAt) < DT / 2) sim.setLayout(sim.L.name === 'wide' ? 'tall' : 'wide');
    for (const e of sim.events) {
      if (e.k === 'buy') buys.push({ port: sim.port, id: e.pad.id, cost: e.pad.cost, t: +t.toFixed(1) });
      if (e.k === 'gate') {
        ports.push({ port: sim.port + 1, minutes: +((t - portStart) / 60).toFixed(1), boats: sim.sailed, tugs: sim.tugs.length, pilot: sim.pilot });
        portStart = t;
        sim.nextPort();
      }
    }
    sim.events.length = 0;
    if (sim.prestige >= 1) break;
  }
  return { sim, buys, ports, t };
}

const { sim, buys, ports, t } = run(3 * 3600);
const first = buys[0];
check(first && first.t < 30, `first purchase at ${first?.t}s (< 30 s): ${first?.id}`);
const gapsUntil = (limit) => {
  const ts = [0, ...buys.map((b) => b.t).filter((x) => x <= limit)];
  if (ts.at(-1) < limit) ts.push(limit); // tiempo sin compra hasta el límite también cuenta
  return ts.slice(1).map((x, i) => x - ts[i]);
};
const g20 = gapsUntil(20 * 60);
const max20 = Math.max(...g20);
check(max20 <= (process.env.SLOW ? 150 : 125), `first 20 min: ${buys.filter((b) => b.t <= 1200).length} purchases, longest gap ${max20.toFixed(0)} s (≤ ~2 min)`);
const allGaps = buys.slice(1).map((b, i) => b.t - buys[i].t);
const maxAll = Math.max(...allGaps);
const med = [...allGaps].sort((a, b) => a - b)[allGaps.length >> 1];
check(maxAll < 240, `whole game: longest gap ${maxAll.toFixed(0)} s, median ${med.toFixed(0)} s`);
check(ports.length >= 1, `port 1 finished in ${ports[0]?.minutes} min`);
check(ports.length >= 3 && sim.prestige === 1, `all 3 ports finished, prestige ${sim.prestige} (×${data.prestigeMult(sim.prestige)}) after ${(t / 60).toFixed(1)} min`);

// guardar y cargar
const s2 = run(200).sim;
const saved = s2.serialize(1_000_000);
const s3 = new Sim(JSON.parse(JSON.stringify(saved)), layout);
check(JSON.stringify(saved) === JSON.stringify(s3.serialize(1_000_000)), `save/load round-trip identical (port ${saved.port + 1}, cash ${saved.cash}, bought ${saved.bought.length})`);
check(s3.owned === s2.owned && s3.cap === s2.cap && s3.tugs.length === s2.tugs.length, `upgrades rebuilt from save (berths ${s3.owned}, cap ${s3.cap}, tugs ${s3.tugs.length})`);

// ganancias sin conexión
const s4 = run(15 * 60).sim;
const now = 10_000_000_000;
const g1h = s4.offlineGain(now, now - 3600e3), g2h = s4.offlineGain(now, now - 7200e3), g10h = s4.offlineGain(now, now - 36000e3);
check((s4.tugs.length > 0 || s4.pilot > 0) && g1h > 0, `offline 1 h = ${g1h} coins (rate ${s4.rate.toFixed(0)}/min, tugs ${s4.tugs.length}, pilot ${s4.pilot})`);
check(g10h === g2h && g2h > g1h, `offline cap: 2 h = ${g2h}, 10 h = ${g10h} (same)`);
check(s4.offlineGain(now, now - 30e3) === 0, 'offline < 60 s = 0');
const noAuto = new Sim(freshSave(), layout); noAuto.rate = 100;
check(noAuto.offlineGain(now, now - 3600e3) === 0, 'offline without tug or pilot = 0');

// girar la pantalla a mitad de partida no rompe nada
const flip = run(20 * 60, { flipAt: 300 });
const bad = flip.sim.boats.filter((b) => !(b.x > -400 && b.x < flip.sim.L.w + 400 && b.y > 0 && b.y < flip.sim.L.h + 400));
check(!bad.length && flip.buys.length > 8, `layout switch at 5 min: ${flip.buys.length} purchases in 20 min, boats in bounds`);

const res = {
  juego: 'tiny-harbor', fecha: new Date().toISOString().slice(0, 10), distribucion: layout,
  primeraCompraS: first?.t, comprasEn20Min: buys.filter((b) => b.t <= 1200).length, huecoMaxEn20MinS: +max20.toFixed(0),
  huecoMaxTotalS: +maxAll.toFixed(0), huecoMedianoS: +med.toFixed(0), puertos: ports, compras: buys.length,
  minutosHastaPrestigio: +(t / 60).toFixed(1), offline: { '1h': g1h, '2h': g2h, '10h': g10h },
  compras20: buys.filter((b) => b.t <= 1200).map((b) => `${b.t}s ${b.id} (${b.cost})`), fallos: fails,
};
if (!process.env.SLOW) await writeFile(resolve(here, layout === 'wide' ? 'progresion.json' : `progresion-${layout}.json`), JSON.stringify(res, null, 2) + '\n');
console.log(JSON.stringify({ ...res, compras20: undefined }, null, 1));
process.exit(fails.length ? 1 : 0);
