#!/usr/bin/env node
// Compila contenido/ → generado/banc.json (lo único que lee la app). Monta además los simulacros de B1, B2 y C1 con la
// estructura oficial (config/examens.json) a partir del banco, de forma determinista (semilla por id), salvo que exista un
// simulacro escrito a mano en contenido/simulacres/.
import fs from 'node:fs';
import path from 'node:path';
import { cargarTodo, RAIZ, leerJson } from './comun.mjs';

const { regles, items, textos, tasques, simulacres, oral, seo } = cargarTodo();
const examens = leerJson(path.join(RAIZ, 'config', 'examens.json')).nivells;
const limpiar = (o) => { const { _f, ...r } = o; return r; };

// Generador pseudoaleatorio determinista (mulberry32) para que el build sea reproducible.
function rng(seedStr) { let h = 1779033703 ^ seedStr.length; for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } let a = h >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const barajar = (arr, r) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Reparto del área de ús de la llengua por tipo, aproximando el examen (C1: 3 buits, 2 morfosintaxi, 1 lèxic → 45 ítems).
const REPARTO = {
  B1: { total: 30, buits: 14, transformacio: 4, castellanismes: 6, lexic: 6 },
  B2: { total: 40, buits: 18, transformacio: 6, castellanismes: 8, lexic: 8 },
  C1: { total: 45, buits: 21, transformacio: 8, castellanismes: 8, lexic: 8 },
};

function montarSimulacre(nivell, n, usados) {
  const r = rng(`${nivell}-${n}`);
  const rep = REPARTO[nivell];
  const us = [];
  for (const tipus of ['buits', 'transformacio', 'castellanismes', 'lexic']) {
    const pool = barajar(items.filter((i) => i.nivell === nivell && i.area === 'us' && i.tipus === tipus && !usados.has(i.id)), r);
    const poolTodo = barajar(items.filter((i) => i.nivell === nivell && i.area === 'us' && i.tipus === tipus), r);
    const elegidos = (pool.length >= rep[tipus] ? pool : poolTodo).slice(0, rep[tipus]);
    for (const e of elegidos) { us.push(e.id); usados.add(e.id); }
  }
  // Tareas escritas sin reemplazo: una sola barajada por nivel y tipo (semilla fija por nivel) y el simulacro n toma la posición n−1,
  // así los tres simulacros de un nivel llevan redacciones distintas mientras haya tareas suficientes (antes se rebarajaba con la
  // semilla del simulacro y los tres de C1 compartían c1-escrit-0003).
  const tareas = Object.values(tasques).filter((t) => t.nivell === nivell);
  const porTipo = (tp) => { const l = barajar(tareas.filter((t) => t.tipus === tp).sort((x, y) => x.id.localeCompare(y.id)), rng(`${nivell}-tasques-${tp}`)); return l[(n - 1) % Math.max(1, l.length)]?.id; };
  let escrit;
  if (nivell === 'C1') escrit = { tasca: porTipo('argumentatiu-3-fonts') };
  else if (nivell === 'B2') escrit = { tasques: [porTipo('text-informatiu'), porTipo('correu')].filter(Boolean) };
  else escrit = { tasca: porTipo('correu') };
  const arees = { us: { items: us }, escrit };
  if (nivell !== 'C1') {
    const tx = (area, k) => barajar(Object.values(textos).filter((t) => t.nivell === nivell && t.area === area), rng(`${nivell}-${n}-${area}`)).slice(0, k).map((t) => t.id);
    arees.co = { textos: tx('co', nivell === 'B1' ? 3 : 3) };
    arees.lectura = { textos: tx('lectura', 2) };
  }
  const completo = us.length === rep.total && (escrit.tasca || escrit.tasques?.length) && (nivell === 'C1' || (arees.co.textos.length && arees.lectura.textos.length));
  return { id: `${nivell.toLowerCase()}-simulacre-${n}`, nivell, nom: `Simulacre ${nivell} · model ${n}`, arees, complet: !!completo, generat: true };
}

const simulacresFinal = simulacres.map(limpiar);
for (const nivell of ['B1', 'B2', 'C1']) {
  if (!examens[nivell]?.actiu) continue;
  const usados = new Set(simulacresFinal.filter((s) => s.nivell === nivell).flatMap((s) => s.arees?.us?.items ?? []));
  const disponibles = items.filter((i) => i.nivell === nivell && i.area === 'us').length;
  const cuantos = Math.max(1, Math.min(3, Math.floor(disponibles / REPARTO[nivell].total)));
  for (let n = 1; n <= cuantos; n++) if (!simulacresFinal.some((s) => s.id === `${nivell.toLowerCase()}-simulacre-${n}`)) simulacresFinal.push(montarSimulacre(nivell, n, usados));
}

const resum = {
  total: items.length,
  perNivell: Object.fromEntries(['B1', 'B2', 'C1', 'C2'].map((n) => [n, items.filter((i) => i.nivell === n).length])),
  perTipus: items.reduce((a, i) => ((a[i.tipus] = (a[i.tipus] ?? 0) + 1), a), {}),
  gratis: items.filter((i) => i.gratis).length,
  diagnostic: items.filter((i) => i.diagnostic).length,
  revisioHumana: items.filter((i) => i.revisio === 'huma').length,
  textos: Object.keys(textos).length,
  tasques: Object.keys(tasques).length,
  simulacres: simulacresFinal.length,
};

const banc = {
  actualitzat: new Date().toISOString().slice(0, 10),
  regles,
  items: items.map(limpiar),
  textos: Object.fromEntries(Object.values(textos).map((t) => [t.id, limpiar(t)])),
  tasques: Object.fromEntries(Object.values(tasques).map((t) => [t.id, limpiar(t)])),
  simulacres: simulacresFinal,
  oral: { l1: oral.sons?.l1 ?? 'es', sons: oral.sons?.sons ?? [], lectures: oral.lectures?.lectures ?? [] },
  seo: seo.map(limpiar),
  resum,
};
fs.mkdirSync(path.join(RAIZ, 'generado'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'generado', 'banc.json'), JSON.stringify(banc));
console.log(`banc.json: ${resum.total} ítems (gratis ${resum.gratis}, diagnòstic ${resum.diagnostic}), ${resum.textos} textos, ${resum.tasques} tasques, ${resum.simulacres} simulacres (${simulacresFinal.filter((s) => s.complet === false).length} incomplets), ${seo.length} pàgines SEO, ${Object.keys(regles).length} regles`);
