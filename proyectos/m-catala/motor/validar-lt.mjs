#!/usr/bin/env node
// Valida amb LanguageTool (regles de Softcatalà) tots els textos en català del banc: enunciats, opcions correctes, respostes, textos, tasques,
// regles (exemples "be") i pàgines SEO. Marca com a sospitós tot el que LT consideri error (excepte dins dels ítems de castellanismes,
// on l'enunciat conté l'error a propòsit). Escriu contenido/revisio/lt-<data>.json i surt amb 1 si hi ha errors "segurs" fora d'excepcions.
// Uso: LANGUAGETOOL_URL=http://localhost:8081/v2 node motor/validar-lt.mjs [--nomes=items|textos|tasques|regles|seo] [--resumen]
import fs from 'node:fs';
import path from 'node:path';
import { cargarTodo, RAIZ } from './comun.mjs';

const URL_LT = (process.env.LANGUAGETOOL_URL ?? 'http://localhost:8081/v2').replace(/\/$/, '');
const nomes = (process.argv.find((a) => a.startsWith('--nomes=')) ?? '').split('=')[1];
const { regles, items, textos, tasques, seo } = cargarTodo();

// Regles de LT que no apliquen al material d'examen (estil, tipografia, suggeriments) o que xoquen amb textos amb buits "___".
const IGNORAR = new Set(['WHITESPACE_RULE', 'UPPERCASE_SENTENCE_START', 'COMMA_PARENTHESIS_WHITESPACE', 'DOUBLE_PUNCTUATION', 'PUNCTUATION_PARAGRAPH_END', 'CA_UNPAIRED_BRACKETS', 'CA_SIMPLE_REPLACE_ANGLICISM', 'ESPAIS_SOBRANTS', 'MORFOLOGIK_RULE_CA_ES']);
const IGNORAR_CATEGORIES = new Set(['TYPOGRAPHY', 'STYLE', 'REDUNDANCY', 'MISC']);

async function check(text) {
  const body = new URLSearchParams({ language: 'ca-ES', text, level: 'default' });
  const r = await fetch(`${URL_LT}/check`, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!r.ok) throw new Error(`LT ${r.status}`);
  const j = await r.json();
  return j.matches.filter((m) => !IGNORAR.has(m.rule.id) && !IGNORAR_CATEGORIES.has(m.rule.category.id)).map((m) => ({ regla: m.rule.id, cat: m.rule.category.id, missatge: m.message, fragment: text.slice(m.offset, m.offset + m.length), suggeriments: m.replacements.slice(0, 3).map((x) => x.value) }));
}

const peces = [];
const afegir = (origen, id, camp, text, excepcio = false) => { if (typeof text === 'string' && text.trim()) peces.push({ origen, id, camp, text, excepcio }); };
if (!nomes || nomes === 'items') for (const it of items) {
  const esCast = it.tipus === 'castellanismes';
  if (it.tipus === 'buits') { const correcta = Array.isArray(it.opcions) ? it.opcions[it.resposta] : [].concat(it.resposta)[0]; afegir('item', it.id, 'frase', it.enunciat.replace('___', correcta)); }
  else if (it.tipus === 'dictat') afegir('item', it.id, 'text', it.text);
  else if (it.tipus === 'transformacio') { afegir('item', it.id, 'enunciat', it.enunciat, true); for (const r of it.resposta.slice(0, 2)) afegir('item', it.id, 'resposta', r); }
  else { afegir('item', it.id, 'enunciat', it.enunciat, esCast); if (Array.isArray(it.opcions)) { const correcta = it.opcions[it.resposta]; afegir('item', it.id, 'opcio-correcta', esCast ? it.enunciat.replace(new RegExp(it.error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), correcta) : correcta); } }
  if (it.pista) afegir('item', it.id, 'pista', it.pista, true);
}
if (!nomes || nomes === 'textos') for (const t of Object.values(textos)) { afegir('text', t.id, 'text', t.text); for (const p of t.preguntes) { afegir('text', t.id, `pregunta ${p.id}`, p.enunciat); afegir('text', t.id, `opcio ${p.id}`, p.opcions[p.resposta]); } }
if (!nomes || nomes === 'tasques') for (const t of Object.values(tasques)) { afegir('tasca', t.id, 'enunciat', t.enunciat); for (const f of t.fonts ?? []) afegir('tasca', t.id, `font ${f.titol}`, f.text); afegir('tasca', t.id, 'guia', t.guia.ca); }
if (!nomes || nomes === 'regles') for (const r of Object.values(regles)) { afegir('regla', r.id, 'regla.ca', r.regla.ca, true); for (const e of r.exemples) afegir('regla', r.id, 'exemple', e.be); }
if (!nomes || nomes === 'seo') for (const p of seo) { afegir('seo', p.slug, 'titol', p.titol.ca); afegir('seo', p.slug, 'descripcio', p.descripcio.ca); for (const s of p.seccions.ca) afegir('seo', p.slug, s.h2, s.text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*#|]/g, '')); }

const resultats = [];
let fets = 0;
for (const p of peces) {
  try { const m = await check(p.text); if (m.length) resultats.push({ ...p, text: p.text.slice(0, 200), avisos: m }); } catch (e) { console.error(`LT no respon (${e.message}); comprova LANGUAGETOOL_URL=${URL_LT}`); process.exit(2); }
  if (++fets % 100 === 0) process.stdout.write(`  ${fets}/${peces.length}\r`);
}
const segurs = resultats.filter((r) => !r.excepcio);
fs.mkdirSync(path.join(RAIZ, 'contenido', 'revisio'), { recursive: true });
const sortida = path.join(RAIZ, 'contenido', 'revisio', `lt-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(sortida, JSON.stringify({ data: new Date().toISOString(), lt: URL_LT, peces: peces.length, ambAvisos: resultats.length, segurs: segurs.length, resultats }, null, 1));
console.log(`\nLanguageTool: ${peces.length} textos comprovats · ${resultats.length} amb avisos (${segurs.length} fora d'excepcions) → ${path.relative(RAIZ, sortida)}`);
if (process.argv.includes('--resumen')) for (const r of segurs.slice(0, 80)) console.log(`- ${r.origen} ${r.id} [${r.camp}]: ${r.avisos.map((a) => `${a.regla} «${a.fragment}» → ${a.suggeriments.join('/')}`).join('; ')}`);
process.exit(segurs.length ? 1 : 0);
