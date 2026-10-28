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
const IGNORAR = new Set([
  // Afegits en la revisió final (28/10/2026): falsos positius comprovats a mà.
  'US', 'HAVER_PARTICIPI_HAVER_IMPERSONAL', // «us» (pronom) i «haver» citats aïllats a les guies de pronoms i perífrasis
  'MES1', 'MES2', // «un mes de fiança», «més una sessió»: LT confon mes/més en contextos correctes
  'SOCIALISME_MAJ_MIN', // capçaleres de taula («Organisme»)
  'PRESA_PRESSA', // «presa de posició» és correcte
  'EN_D_ACI_A_TRES_MINUTS', // «ho acabo en cinc minuts» (durada) és correcte
  'COMMA_PERO', // coma davant de «però» en frases curtes: estil
  'CONCORDANCES_DET_ADJ', 'DUES_PREPOSICIONS', 'PREP_VERB_CONJUGAT', 'PEL_PELS', 'PER_QUAN', 'ELS_DOS_TOTS_DOS', 'RESPONDRE_A', 'Y_CONJUNCIO', 'PRONOMS_FEBLES_SOLTS1', 'VERBS_MOVIMENT', 'HO_HA_HI_HA', 'UNPAIRED_BRACKETS', 'EN_LLOC', 'SINO_SI_NO', 'ASSABENTARSEN', 'RELATIUS', // només salten a les guies SEO que citen formes aïllades (*en*, *hi*, «per a» + nom) i exemples en cursiva
  'WHITESPACE_RULE', 'UPPERCASE_SENTENCE_START', 'COMMA_PARENTHESIS_WHITESPACE', 'DOUBLE_PUNCTUATION', 'PUNCTUATION_PARAGRAPH_END', 'CA_UNPAIRED_BRACKETS', 'CA_SIMPLE_REPLACE_ANGLICISM', 'ESPAIS_SOBRANTS', 'MORFOLOGIK_RULE_CA_ES',
  'CITA_PREVIA', // «cita prèvia» és el terme administratiu habitual (TERMCAT l'admet); LT el marca com a redundància d'estil.
  'NOMBRES_NO_LLETRES', // preferència tipogràfica (xifres per a percentatges); als guions de comprensió oral s'escriuen amb lletres per al TTS.
  'CA_DATE_WEEKDAY_CURRENTYEAR', // les dates dels textos són fictícies: no cal que el dia de la setmana quadri amb l'any en curs.
  'EL_DILLUNS_DILLUNS', // «el diumenge» amb valor habitual és correcte; LT no pot distingir-ho del dia immediat. Als ítems s'ha evitat l'article quan era ambigu.
  'FRASE_INFINITIU', // les opcions de resposta i els títols són sintagmes d'infinitiu sense verb principal (p. ex. «Avisar la presidenta»), cosa esperable.
  'VEURE_VEGEU', // als buits de verbs s'indica l'infinitiu entre parèntesis «(veure, nosaltres)»; LT ho pren per una remissió «vegeu».
]);
const IGNORAR_CATEGORIES = new Set(['TYPOGRAPHY', 'STYLE', 'REDUNDANCY', 'MISC']);

// Falsos positius que depenen del context (no es pot ignorar la regla sencera perquè caça errors reals en altres contextos).
const SALUTACIO = /(^|\n)\s*(Benvolgu(t|da|ts|des)|Estima(t|da|ts|des)|Hola|Bon dia|Bona tarda|Senyors?|Senyora|Senyores)\b[^\n,]{0,40}$/;
const MENCIO_PRONOMS = /\bpronoms?\b|\ben (i|o) hi\b|\ben, hi\b|\bhi (i|o) en\b/i;
function esFalsPositiu(m, text) {
  const abans = text.slice(0, m.offset), frag = text.slice(m.offset, m.offset + m.length), despres = text.slice(m.offset + m.length);
  const context = text.slice(Math.max(0, m.offset - 30), m.offset + m.length + 12);
  switch (m.rule.id) {
    case 'MAJUSCULA_IMPROBABLE': return SALUTACIO.test(abans); // «Benvolguda senyora, Us escrivim»: després de la salutació d'una carta el cos comença amb majúscula (convenció epistolar).
    case 'LA_NA_NOM_FEMENI': return frag === 'la una' && /\b(a|de|fins a|cap a) $/.test(abans); // «a la una» (hora) no s'apostrofa (OIEC).
    case 'DERRAMAR': return /^derrama$/i.test(frag) && /\b(cap|una|la|les|de|d')\s*$/i.test(abans); // «derrama» nom (quota extraordinària) és al DIEC2; la regla apunta al verb.
    case 'PRESA_PRESSA': return /^ de (posició|notes|decisions|possessió|consciència|contacte|terra|corrent|mostres)\b/.test(despres); // «presa de posició», «presa de notes»: nom correcte.
    case 'PRONOMS_FEBLES_SOLTS1': case 'PRONOMS_FEBLES_SOLTS2': case 'FINS_I_TOT': return MENCIO_PRONOMS.test(context); // text metalingüístic que anomena els pronoms «en» i «hi».
    case 'PREP_VERB_CONJUGAT_NP': case 'FALTA_ELEMENT_ENTRE_VERBS': return /\bAprova\b/.test(context); // «Aprova» és el nom de l'app, no el verb aprovar.
    default: return false;
  }
}
async function check(text) {
  const body = new URLSearchParams({ language: 'ca-ES', text, level: 'default' });
  const r = await fetch(`${URL_LT}/check`, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!r.ok) throw new Error(`LT ${r.status}`);
  const j = await r.json();
  return j.matches.filter((m) => !IGNORAR.has(m.rule.id) && !IGNORAR_CATEGORIES.has(m.rule.category.id) && !esFalsPositiu(m, text)).map((m) => ({ regla: m.rule.id, cat: m.rule.category.id, missatge: m.message, fragment: text.slice(m.offset, m.offset + m.length), suggeriments: m.replacements.slice(0, 3).map((x) => x.value) }));
}

const peces = [];
const afegir = (origen, id, camp, text, excepcio = false) => { if (typeof text === 'string' && text.trim()) peces.push({ origen, id, camp, text, excepcio }); };
// Omple el buit amb la resposta correcta i tanca l'espai darrere d'un apòstrof («a l' ajuntament» → «a l'ajuntament»).
const omplir = (enunciat, correcta) => enunciat.replace('___', correcta).replace(/\b([ldmnst])'\s+/gi, "$1'");
// Text SEO en Markdown: es treuen els enllaços (queda el text), les taules (cada fila com a frase), la negreta, i s'eliminen les cursives i les
// citacions «…» amb cursiva, perquè és la convenció amb què aquestes pàgines citen errors típics (*tenir que*, «*n'hi* ha dos»).
const netejarSeo = (t) => t
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .split('\n').filter((l) => !/^\s*\|?\s*-{2,}\s*(\|\s*-{2,}\s*)*\|?\s*$/.test(l)).map((l) => (/^\s*\|/.test(l) ? l.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim()).filter(Boolean).join('; ') + '.' : l)).join('\n')
  .replace(/«[^»]*\*[^»]*»/g, '')
  .replace(/\*\*([^*\n]+)\*\*/g, '$1')
  .replace(/\*[^*\n]+\*/g, '')
  .replace(/[*#]/g, '');
if (!nomes || nomes === 'items') for (const it of items) {
  const esCast = it.tipus === 'castellanismes';
  if (it.tipus === 'buits') { const correcta = Array.isArray(it.opcions) ? it.opcions[it.resposta] : [].concat(it.resposta)[0]; afegir('item', it.id, 'frase', omplir(it.enunciat, correcta)); }
  else if (it.tipus === 'dictat') afegir('item', it.id, 'text', it.text);
  else if (it.tipus === 'transformacio') { afegir('item', it.id, 'enunciat', it.enunciat, true); for (const r of it.resposta.slice(0, 2)) afegir('item', it.id, 'resposta', r); }
  else if (it.tipus === 'lexic' && Array.isArray(it.opcions) && it.enunciat.includes('___')) afegir('item', it.id, 'frase', omplir(it.enunciat, it.opcions[it.resposta])); // l'enunciat amb el buit omplert: el buit sol fa que LT trobi a faltar participis, pronoms…
  else { afegir('item', it.id, 'enunciat', it.enunciat, esCast); if (Array.isArray(it.opcions)) { const correcta = it.opcions[it.resposta]; afegir('item', it.id, 'opcio-correcta', esCast ? it.enunciat.replace(new RegExp(it.error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), correcta) : correcta); } }
  if (it.pista) afegir('item', it.id, 'pista', it.pista, true);
}
if (!nomes || nomes === 'textos') for (const t of Object.values(textos)) { afegir('text', t.id, 'text', t.text); for (const p of t.preguntes) { afegir('text', t.id, `pregunta ${p.id}`, p.enunciat); afegir('text', t.id, `opcio ${p.id}`, p.opcions[p.resposta]); } }
if (!nomes || nomes === 'tasques') for (const t of Object.values(tasques)) { afegir('tasca', t.id, 'enunciat', t.enunciat); for (const f of t.fonts ?? []) afegir('tasca', t.id, `font ${f.titol}`, f.text); afegir('tasca', t.id, 'guia', t.guia.ca, true); } // la guia del corrector enumera a propòsit els errors que penalitzen (bueno, vale, tenir que…)
if (!nomes || nomes === 'regles') for (const r of Object.values(regles)) { afegir('regla', r.id, 'regla.ca', r.regla.ca, true); for (const e of r.exemples) afegir('regla', r.id, 'exemple', e.be); }
if (!nomes || nomes === 'seo') for (const p of seo) { afegir('seo', p.slug, 'titol', p.titol.ca); afegir('seo', p.slug, 'descripcio', p.descripcio.ca, /castellanismes|pronoms|per-i-per-a|errors/.test(p.slug)); for (const s of p.seccions.ca) afegir('seo', p.slug, s.h2, netejarSeo(s.text)); }

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
