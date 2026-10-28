#!/usr/bin/env node
// Comprueba la forma de todo el contenido (motor/ESQUEMA.md). Sale con 1 si hay errores. Uso: node motor/comprobar.mjs [--resumen]
import { cargarTodo, NIVELLS, AREES, TIPUS, IDIOMES_EXPL, punts } from './comun.mjs';

const errores = [];
const avisos = [];
const err = (d, m) => errores.push(`${d}: ${m}`);
const aviso = (d, m) => avisos.push(`${d}: ${m}`);
const esTexto = (s, min = 1) => typeof s === 'string' && s.trim().length >= min;
const { regles, items, textos, tasques, simulacres, oral, seo } = cargarTodo();
const puntIds = new Set(punts().map((p) => p.id));

// Reglas
for (const r of Object.values(regles)) {
  const d = `regla ${r.id}`;
  if (!/^[a-z0-9-]+$/.test(r.id)) err(d, 'id con caracteres no permitidos');
  if (!puntIds.has(r.punt)) err(d, `punt desconocido: ${r.punt}`);
  if (!Array.isArray(r.nivells) || !r.nivells.every((n) => NIVELLS.includes(n))) err(d, 'nivells inválido');
  if (!esTexto(r.titol?.ca, 3)) err(d, 'falta titol.ca');
  for (const l of IDIOMES_EXPL) if (!esTexto(r.regla?.[l], 20)) err(d, `falta regla.${l} (mínimo 20 caracteres)`);
  if (!Array.isArray(r.exemples) || r.exemples.length < 2 || !r.exemples.every((e) => esTexto(e.be))) err(d, 'mínimo 2 exemples con "be"');
  if (!esTexto(r.font?.nom) || !/^https?:\/\//.test(r.font?.url ?? '')) err(d, 'font.nom y font.url obligatorios');
}

// Ítems
const ids = new Set();
const norm = (s) => s.normalize('NFC').trim();
for (const it of items) {
  const d = `${it._f} · ${it.id}`;
  if (!it.id || ids.has(it.id)) err(d, 'id repetido o ausente'); ids.add(it.id);
  if (!NIVELLS.includes(it.nivell)) err(d, `nivell inválido: ${it.nivell}`);
  if (!new RegExp(`^${String(it.nivell).toLowerCase()}-${it.tipus}-\\d{4}$`).test(it.id ?? '')) err(d, `id no sigue <nivell>-<tipus>-NNNN`);
  if (!AREES.includes(it.area)) err(d, `area inválida: ${it.area}`);
  if (!TIPUS.includes(it.tipus)) err(d, `tipus inválido: ${it.tipus}`);
  if (!puntIds.has(it.punt)) err(d, `punt desconocido: ${it.punt}`);
  if (!regles[it.regla]) err(d, `regla desconocida: ${it.regla}`);
  else if (!regles[it.regla].nivells.includes(it.nivell)) aviso(d, `la regla ${it.regla} no declara el nivel ${it.nivell}`);
  if (typeof it.dificultat !== 'number' || it.dificultat < -2 || it.dificultat > 2) err(d, 'dificultat debe ser número entre -2 y 2');
  if (!['sessio', 'ia', 'huma'].includes(it.revisio)) err(d, 'revisio inválida');
  if (typeof it.gratis !== 'boolean' || typeof it.diagnostic !== 'boolean') err(d, 'gratis y diagnostic deben ser booleanos');
  const conOpc = Array.isArray(it.opcions);
  if (conOpc) {
    if (it.opcions.length < 3 || it.opcions.length > 4) err(d, 'opcions: 3 o 4');
    if (new Set(it.opcions.map((o) => norm(String(o)).toLowerCase())).size !== it.opcions.length) err(d, 'opcions repetidas');
    if (!Number.isInteger(it.resposta) || it.resposta < 0 || it.resposta >= it.opcions.length) err(d, 'resposta debe ser el índice de la opción correcta');
  }
  switch (it.tipus) {
    case 'buits':
      if (!esTexto(it.enunciat, 8) || !it.enunciat.includes('___')) err(d, 'buits: enunciat con ___');
      if (!conOpc && !(esTexto(it.resposta) || (Array.isArray(it.resposta) && it.resposta.length && it.resposta.every((x) => esTexto(x))))) err(d, 'buits: resposta string o array');
      break;
    case 'transformacio':
      if (!esTexto(it.enunciat, 10)) err(d, 'transformacio: enunciat');
      if (!Array.isArray(it.resposta) || !it.resposta.length || !it.resposta.every((x) => esTexto(x, 2))) err(d, 'transformacio: resposta array de formas aceptadas');
      break;
    case 'castellanismes':
      if (!esTexto(it.enunciat, 8)) err(d, 'castellanismes: enunciat');
      if (!conOpc) err(d, 'castellanismes: opcions obligatorias');
      if (!esTexto(it.error)) err(d, 'castellanismes: campo error (fragmento incorrecto)');
      else if (!it.enunciat?.toLowerCase().includes(it.error.toLowerCase())) err(d, 'castellanismes: el fragmento "error" no aparece en el enunciat');
      break;
    case 'lexic':
      if (!esTexto(it.enunciat, 6) || !conOpc) err(d, 'lexic: enunciat y opcions');
      break;
    case 'dictat': {
      if (!esTexto(it.text, 20)) err(d, 'dictat: text');
      const n = (it.text ?? '').split(/\s+/).length;
      if (n < 10 || n > 45) err(d, `dictat: ${n} palabras (10–45)`);
      if (it.resposta !== it.text) err(d, 'dictat: resposta debe ser igual a text');
      break;
    }
    case 'lectura':
    case 'co': {
      const t = textos[it.textId];
      if (!t) err(d, `textId desconocido: ${it.textId}`);
      else if (t.area !== it.tipus) err(d, `el texto ${it.textId} es de area ${t.area}`);
      if (!esTexto(it.enunciat, 6) || !conOpc) err(d, 'lectura/co: enunciat y opcions');
      break;
    }
  }
  if (it.area === 'us' && !['buits', 'transformacio', 'castellanismes', 'lexic', 'dictat'].includes(it.tipus)) err(d, 'area us con tipus incoherente');
  if (['lectura', 'co'].includes(it.tipus) && it.area !== it.tipus) err(d, 'area debe coincidir con tipus en lectura/co');
}

// Textos
for (const t of Object.values(textos)) {
  const d = `${t._f} · ${t.id}`;
  if (!NIVELLS.includes(t.nivell)) err(d, 'nivell');
  if (!['lectura', 'co'].includes(t.area)) err(d, 'area lectura|co');
  if (!esTexto(t.titol, 3) || !esTexto(t.text, 200)) err(d, 'titol y text (mínimo 200 caracteres)');
  const n = (t.text ?? '').split(/\s+/).length;
  const lim = t.area === 'co' ? [60, 260] : { B1: [120, 280], B2: [220, 450], C1: [350, 700], C2: [450, 900] }[t.nivell] ?? [100, 900];
  if (n < lim[0] || n > lim[1]) aviso(d, `${n} palabras (esperado ${lim[0]}–${lim[1]})`);
  if (!Array.isArray(t.preguntes) || t.preguntes.length < 3) err(d, 'mínimo 3 preguntes');
  else for (const p of t.preguntes) {
    if (!esTexto(p.id) || !esTexto(p.enunciat, 6) || !Array.isArray(p.opcions) || p.opcions.length < 3 || p.opcions.length > 4) err(d, `pregunta ${p.id}: enunciat y 3–4 opcions`);
    if (!Number.isInteger(p.resposta) || p.resposta < 0 || p.resposta >= (p.opcions?.length ?? 0)) err(d, `pregunta ${p.id}: resposta índice`);
  }
  if (!['sessio', 'ia', 'huma'].includes(t.revisio)) err(d, 'revisio');
}

// Tareas
for (const t of Object.values(tasques)) {
  const d = `${t._f} · ${t.id}`;
  if (!NIVELLS.includes(t.nivell)) err(d, 'nivell');
  if (!['correu', 'text-informatiu', 'argumentatiu-3-fonts', 'nota', 'carta-formal', 'argumentatiu'].includes(t.tipus)) err(d, `tipus ${t.tipus}`);
  if (!esTexto(t.enunciat, 30)) err(d, 'enunciat');
  if (t.tipus === 'argumentatiu-3-fonts' && (!Array.isArray(t.fonts) || t.fonts.length !== 3 || !t.fonts.every((f) => esTexto(f.titol) && esTexto(f.text, 200)))) err(d, '3 fonts con titol y text');
  if (!(t.paraulesMin > 0 && t.paraulesMax > t.paraulesMin && t.minuts > 0)) err(d, 'paraulesMin, paraulesMax, minuts');
  if (!esTexto(t.guia?.ca, 20)) err(d, 'guia.ca');
}

// Simulacros
for (const s of simulacres) {
  const d = `${s._f} · ${s.id}`;
  if (!NIVELLS.includes(s.nivell)) err(d, 'nivell');
  const a = s.arees ?? {};
  if (!a.us?.items?.length) err(d, 'arees.us.items');
  else for (const id of a.us.items) if (!ids.has(id)) err(d, `item desconocido ${id}`);
  const esperados = { B1: 30, B2: 40, C1: 45 }[s.nivell];
  if (esperados && a.us?.items && a.us.items.length !== esperados) aviso(d, `us tiene ${a.us.items.length} ítems; el examen tiene ${esperados}`);
  if (!a.escrit?.tasca && !a.escrit?.tasques) err(d, 'arees.escrit.tasca');
  for (const tid of [a.escrit?.tasca, ...(a.escrit?.tasques ?? [])].filter(Boolean)) if (!tasques[tid]) err(d, `tasca desconocida ${tid}`);
  if (['B1', 'B2'].includes(s.nivell)) {
    for (const k of ['co', 'lectura']) {
      if (!a[k]?.textos?.length) err(d, `arees.${k}.textos`);
      else for (const tid of a[k].textos) { if (!textos[tid]) err(d, `text desconocido ${tid}`); else if (textos[tid].area !== k) err(d, `${tid} no es de area ${k}`); }
    }
  }
}

// Oral
if (oral.sons) for (const s of oral.sons.sons ?? []) { if (!esTexto(s.id) || !esTexto(s.nom?.ca) || !Array.isArray(s.paraules) || s.paraules.length < 3) err(`so ${s.id}`, 'id, nom.ca y mínimo 3 paraules'); }
if (oral.lectures) {
  const sonIds = new Set((oral.sons?.sons ?? []).map((s) => s.id));
  for (const l of oral.lectures.lectures ?? []) {
    const d = `lectura oral ${l.id}`;
    if (!esTexto(l.text, 80)) err(d, 'text');
    if (!Array.isArray(l.sons) || !l.sons.every((s) => sonIds.has(s))) err(d, 'sons desconocidos');
    for (const [w, ss] of Object.entries(l.paraulesClau ?? {})) { if (!l.text.toLowerCase().includes(w.toLowerCase())) err(d, `paraula clau "${w}" no está en el text`); if (!ss.every((s) => sonIds.has(s))) err(d, `sons de "${w}" desconocidos`); }
  }
}

// SEO
const slugs = new Set();
for (const p of seo) {
  const d = `${p._f}`;
  if (!/^[a-z0-9-]+$/.test(p.slug ?? '') || slugs.has(p.slug)) err(d, 'slug inválido o repetido'); slugs.add(p.slug);
  for (const l of ['ca', 'es']) { if (!esTexto(p.titol?.[l], 10) || !esTexto(p.descripcio?.[l], 40) || !Array.isArray(p.seccions?.[l]) || p.seccions[l].length < 3) err(d, `${l}: titol, descripcio y mínimo 3 seccions`); }
}

// Resumen
const porNivelTipo = {};
for (const it of items) { const k = `${it.nivell} ${it.tipus}`; porNivelTipo[k] = (porNivelTipo[k] ?? 0) + 1; }
console.log(`Reglas: ${Object.keys(regles).length} · Ítems: ${items.length} · Textos: ${Object.keys(textos).length} · Tareas: ${Object.keys(tasques).length} · Simulacros: ${simulacres.length} · SEO: ${seo.length}`);
if (process.argv.includes('--resumen')) for (const [k, v] of Object.entries(porNivelTipo).sort()) console.log(`  ${k}: ${v}`);
for (const a of avisos.slice(0, 40)) console.log('aviso ·', a);
if (avisos.length > 40) console.log(`… y ${avisos.length - 40} avisos más`);
for (const e of errores) console.error('ERROR ·', e);
if (errores.length) { console.error(`${errores.length} errores`); process.exit(1); }
console.log('Contenido correcto.');
