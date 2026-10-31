#!/usr/bin/env node
// Genera ítems nous per al banc amb el model configurat (BSC o Anthropic) i els deixa en contenido/items/<nivell>/<tipus>.json
// amb revisio: "ia". Després: node motor/comprobar.mjs && LANGUAGETOOL_URL=… node motor/validar-lt.mjs (els que LT marqui es descarten)
// i node motor/lot-revisio.mjs per al mostreig humà.
// Ús: node motor/generar.mjs --nivell=C1 --tipus=buits --n=10 [--punt=pronoms-febles]
import fs from 'node:fs';
import path from 'node:path';
import { cargarTodo, RAIZ, C, leerJson } from './comun.mjs';
import { completar, extreureJson, proveidor } from './ia.mjs';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? '').split('=')[1] || d;
const nivell = arg('nivell', 'C1'), tipus = arg('tipus', 'buits'), n = Number(arg('n', 10)), puntForcat = arg('punt', '');
const { regles, items } = cargarTodo();
const punts = leerJson(path.join(RAIZ, 'config', 'punts.json')).punts.filter((p) => p.nivells.includes(nivell));
const existents = items.filter((i) => i.nivell === nivell && i.tipus === tipus);
const compte = Object.fromEntries(punts.map((p) => [p.id, items.filter((i) => i.nivell === nivell && i.punt === p.id).length]));
const puntsObjectiu = puntForcat ? [puntForcat] : punts.sort((a, b) => compte[a.id] - compte[b.id]).slice(0, 3).map((p) => p.id);
const reglesDisponibles = Object.values(regles).filter((r) => puntsObjectiu.includes(r.punt) && r.nivells.includes(nivell));
const esquema = fs.readFileSync(path.join(RAIZ, 'motor', 'ESQUEMA.md'), 'utf8').split('## 3.')[0];
const exemples = existents.slice(0, 3).map((i) => { const { _f, ...r } = i; return r; });
const seguent = existents.length + 1;

const prompt = `Ets filòleg/òloga de català i autor/a de material per al certificat ${nivell} de la Direcció General de Política Lingüística. Escriu ${n} ítems NOUS de tipus "${tipus}" (àrea "us"), en català normatiu, sobre aquests punts del programa: ${puntsObjectiu.join(', ')}, repartits entre aquestes regles (camp "regla"): ${reglesDisponibles.map((r) => `${r.id} (${r.titol.ca})`).join('; ')}.
Segueix exactament aquest esquema:
${esquema}
Exemples del banc actual (no els repeteixis ni els parafrasegis):
${JSON.stringify(exemples, null, 1)}
Requisits: una sola resposta correcta inequívoca; distractors que siguin errors reals de castellanoparlants; context real de Catalunya (feina, salut, ajuntament, escola, habitatge); cap dada personal; cap frase copiada de llibres ni de models oficials; ids consecutius a partir de ${nivell.toLowerCase()}-${tipus}-${String(seguent).padStart(4, '0')}; "revisio": "ia"; "diagnostic": false; "gratis": false; dificultat entre -1.5 i 1.5.
Respon NOMÉS amb un array JSON d'ítems.`;

console.log(`Proveïdor: ${proveidor()} · ${nivell} ${tipus} · punts: ${puntsObjectiu.join(', ')}`);
const r = await completar(prompt, { maxTokens: 6000 });
const nous = extreureJson(r.text).map((it, k) => ({ ...it, id: `${nivell.toLowerCase()}-${tipus}-${String(seguent + k).padStart(4, '0')}`, nivell, area: 'us', tipus, revisio: 'ia', diagnostic: false, gratis: false }));
const f = C('items', nivell, `${tipus}.json`);
const actual = fs.existsSync(f) ? leerJson(f) : [];
fs.writeFileSync(f, JSON.stringify([...actual, ...nous], null, 1));
fs.mkdirSync(path.join(RAIZ, 'motor', '.cache'), { recursive: true });
fs.appendFileSync(path.join(RAIZ, 'motor', '.cache', 'cost.log'), `${new Date().toISOString()} ${r.model} in=${r.tokensIn} out=${r.tokensOut} items=${nous.length}\n`);
console.log(`${nous.length} ítems afegits a ${path.relative(RAIZ, f)} (model ${r.model}, ${r.tokensIn}+${r.tokensOut} tokens). Ara: node motor/comprobar.mjs && node motor/validar-lt.mjs --nomes=items`);
