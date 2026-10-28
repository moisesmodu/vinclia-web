#!/usr/bin/env node
// Lot de 50 ítems per a revisió humana per mostreig estratificat (nivell × tipus), prioritzant els de revisio "ia" i els del diagnòstic.
// Escriu contenido/revisio/lot-<data>.json amb estat "pendent" i camps per al veredicte de la persona filòloga.
// Ús: node motor/lot-revisio.mjs [--n=50]
import fs from 'node:fs';
import path from 'node:path';
import { cargarTodo, RAIZ } from './comun.mjs';

const n = Number((process.argv.find((a) => a.startsWith('--n=')) ?? '').split('=')[1] || 50);
const { items } = cargarTodo();
const jaRevisats = new Set();
const dir = path.join(RAIZ, 'contenido', 'revisio');
fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('lot-'))) for (const e of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).items ?? []) if (e.estat !== 'pendent') jaRevisats.add(e.id);
const grups = new Map();
for (const it of items) { if (jaRevisats.has(it.id) || it.revisio === 'huma') continue; const k = `${it.nivell}|${it.tipus}`; grups.set(k, [...(grups.get(k) ?? []), it]); }
let h = 7; const r = () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
const tria = [];
const claus = [...grups.keys()];
const perGrup = Math.max(1, Math.floor(n / claus.length));
for (const k of claus) { const g = grups.get(k).sort((a, b) => (b.revisio === 'ia') - (a.revisio === 'ia') || (b.diagnostic) - (a.diagnostic) || r() - 0.5); tria.push(...g.slice(0, perGrup)); }
while (tria.length < n) { const resta = items.filter((i) => !tria.includes(i) && !jaRevisats.has(i.id) && i.revisio !== 'huma'); if (!resta.length) break; tria.push(resta[Math.floor(r() * resta.length)]); }
const lot = { data: new Date().toISOString().slice(0, 10), instruccions: 'Per a cada ítem: estat = ok | corregir | rebutjar; si corregeixes, escriu la forma bona a "correccio" i el motiu a "nota". Quan el lot estigui revisat, la tasca setmanal aplica les correccions i posa revisio: "huma" als ok.', revisor: '', items: tria.slice(0, n).map((it) => ({ id: it.id, nivell: it.nivell, tipus: it.tipus, punt: it.punt, regla: it.regla, enunciat: it.enunciat ?? it.text, opcions: it.opcions, resposta: it.resposta, estat: 'pendent', correccio: '', nota: '' })) };
const f = path.join(dir, `lot-${lot.data}.json`);
fs.writeFileSync(f, JSON.stringify(lot, null, 1));
console.log(`Lot de ${lot.items.length} ítems per a revisió humana → ${path.relative(RAIZ, f)} (${claus.length} estrats)`);
