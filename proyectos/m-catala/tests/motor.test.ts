// Proves unitàries del motor pedagògic i de les regles de correcció. S'executen amb `npm test` (node --test via tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import examensJson from '../config/examens.json';
import type { Convocatoria, Examen, Item, Nivell } from '../lib/tipos';
import { actualitzarTheta, condicionsExamen, notaDesDeTheta, probabilitatAprovar, thetaDesDeNota } from '../lib/motor/diagnostic';
import { fraseResultat } from '../lib/motor/narrativa';
import { avaluar } from '../lib/motor/avaluar';
import { detectar } from '../lib/correccio/regles';
import { consolidarCongelacions, progresCompromis, ratxaActual, registrarDia, ratxaBuida, type EstatRatxa } from '../lib/motor/ratxa';
import { generarPla } from '../lib/motor/pla';

const examens = examensJson.nivells as unknown as Record<Nivell, Examen>;

// ---------------------------------------------------------------- probabilitat d'aprovar

test('C1: les condicions efectives són àrea 1 ≥ 62,5, àrea 3 ≥ 63,3 i global ≥ 65, sense duplicar l\'oral', () => {
  const c = condicionsExamen(examens.C1);
  assert.deepEqual(c.map((x) => x.id).sort(), ['area:escrit', 'area:oral', 'global']);
  assert.equal(Math.round(c.find((x) => x.id === 'area:escrit')!.minim * 10) / 10, 62.5);
  assert.equal(Math.round(c.find((x) => x.id === 'area:oral')!.minim * 10) / 10, 63.3);
});

test('B1/B2: les condicions són el 60 % de cada part', () => {
  for (const n of ['B1', 'B2'] as const) {
    const c = condicionsExamen(examens[n]);
    assert.deepEqual(c.map((x) => x.id).sort(), ['part:escrita', 'part:oral']);
    assert.ok(c.every((x) => x.minim === 60));
  }
});

test('candidat exactament a tots els mínims: probabilitat ≈ 40–50 %', () => {
  // C1: àrea 1 = 25/40, oral = 19/30 i ús tal que el global = 65 → 0,4·62,5 + 0,3·us + 0,3·63,33 = 65 → us = 70,33
  const c1 = probabilitatAprovar(examens.C1, { escrit: 62.5, us: 70.33, oral: 63.34 });
  assert.ok(c1.probabilitat >= 38 && c1.probabilitat <= 52, `C1 als mínims: ${c1.probabilitat}`);
  const b1 = probabilitatAprovar(examens.B1, { co: 60, lectura: 60, escrit: 60, us: 60, oral: 60 });
  assert.ok(b1.probabilitat >= 38 && b1.probabilitat <= 52, `B1 als mínims: ${b1.probabilitat}`);
  const b2 = probabilitatAprovar(examens.B2, { co: 60, lectura: 60, escrit: 60, us: 60, oral: 60 });
  assert.ok(b2.probabilitat >= 38 && b2.probabilitat <= 52, `B2 als mínims: ${b2.probabilitat}`);
});

test('la probabilitat és monòtona i determinista', () => {
  const baixa = probabilitatAprovar(examens.C1, { escrit: 50, us: 50, oral: 50 }).probabilitat;
  const alta = probabilitatAprovar(examens.C1, { escrit: 85, us: 85, oral: 85 }).probabilitat;
  assert.ok(baixa < 15 && alta > 90, `${baixa} / ${alta}`);
  assert.equal(probabilitatAprovar(examens.C1, { escrit: 70, us: 72, oral: 66 }).probabilitat, probabilitatAprovar(examens.C1, { escrit: 70, us: 72, oral: 66 }).probabilitat);
});

test('sense oral: oralMesurat = false, només compten les condicions de la part escrita i no s\'inventa nota oral', () => {
  const r = probabilitatAprovar(examens.C1, { escrit: 80, us: 80 });
  assert.equal(r.oralMesurat, false);
  assert.deepEqual(r.condicions!.map((c) => c.id).sort(), ['area:escrit', 'global']);
  assert.ok(r.probabilitat > 85, `sense oral i notes altes: ${r.probabilitat}`);
  const oral = r.arees.find((a) => a.id === 'oral')!;
  assert.equal(oral.estimada, true);
  assert.equal(oral.nota, 80); // mitjana de les mesurades, sense el −8 d'abans
  assert.equal(r.globalEscrit, 80);
  // Amb l'oral mesurada i baixa, la probabilitat ha de caure: l'oral només compta quan s'ha mesurat.
  const ambOral = probabilitatAprovar(examens.C1, { escrit: 80, us: 80, oral: 40 });
  assert.equal(ambOral.oralMesurat, true);
  assert.ok(ambOral.probabilitat < 15, `amb oral baixa: ${ambOral.probabilitat}`);
  // B1 sense oral: només la part escrita
  const b1 = probabilitatAprovar(examens.B1, { co: 75, lectura: 75, escrit: 70, us: 70 });
  assert.equal(b1.oralMesurat, false);
  assert.deepEqual(b1.condicions!.map((c) => c.id), ['part:escrita']);
  assert.equal(b1.parts.oral.estimada, true);
});

test('fraseResultat: ignora les àrees estimades i diu que l\'oral no s\'ha mesurat', () => {
  const p = probabilitatAprovar(examens.C1, { escrit: 80, us: 80 });
  const r = { data: '2026-10-31', nivell: 'C1' as const, theta: 1, ...p, febles: [{ punt: 'pronoms-febles', confianca: 40 }], sons: [], respostes: [] };
  const frase = fraseResultat(r, examens.C1, 'ca', (id) => id, (id) => id);
  assert.match(frase, /part escrita/);
  assert.match(frase, /part escrita/);
  assert.doesNotMatch(frase, /per oral/);
  const baix = probabilitatAprovar(examens.C1, { escrit: 50, us: 50 });
  const frase2 = fraseResultat({ ...r, ...baix }, examens.C1, 'es', (id) => id, (id) => id);
  assert.match(frase2, /parte escrita/);
});

// ---------------------------------------------------------------- θ

test('theta puja amb un encert i baixa amb una errada', () => {
  const r = { itemId: 'x', punt: 'p', dificultat: 0 };
  assert.ok(actualitzarTheta(0, { ...r, correcte: true }, 1) > 0);
  assert.ok(actualitzarTheta(0, { ...r, correcte: false }, 1) < 0);
  let theta = 0;
  for (let n = 1; n <= 12; n++) theta = actualitzarTheta(theta, { ...r, dificultat: 0.5, correcte: true }, n);
  assert.ok(theta > 1 && theta <= 3);
});

test('calibratge θ → nota: 50 % a θ = 0 i ≈ 85 % a θ = 1,5; la inversa torna al mateix θ', () => {
  assert.equal(notaDesDeTheta(0), 50);
  assert.equal(notaDesDeTheta(1.5), 85);
  assert.ok(notaDesDeTheta(-1.5) === 15);
  assert.ok(Math.abs(thetaDesDeNota(85) - 1.5) < 1e-9);
});

// ---------------------------------------------------------------- avaluar

const dictat: Item = { id: 'c1-dictat-9999', nivell: 'C1', area: 'us', tipus: 'dictat', punt: 'ortografia-accents', regla: 'accents-regles', dificultat: 0, text: "La infermera de l'hospital ens va dir que l'anàlisi i la radiografia s'havien de repetir l'endemà a les onze.", resposta: "La infermera de l'hospital ens va dir que l'anàlisi i la radiografia s'havien de repetir l'endemà a les onze.", diagnostic: false, gratis: true, revisio: 'sessio' };

test('dictat: tolerància 0 (història ≠ historia) i «només accents» marcat com a quasi', () => {
  const exacte = avaluar(dictat, dictat.text!);
  assert.equal(exacte.correcte, true);
  const senseAccents = avaluar(dictat, "La infermera de l'hospital ens va dir que l'analisi i la radiografia s'havien de repetir l'endema a les onze.");
  assert.equal(senseAccents.correcte, false);
  assert.equal(senseAccents.quasi, true);
  assert.ok((senseAccents.precisio ?? 1) < 0.9);
  const bv = avaluar(dictat, "La infermera de l'hospital ens ba dir que l'anàlisi i la radiografia s'habien de repetir l'endemà a les onze.");
  assert.equal(bv.correcte, false);
  assert.equal(bv.quasi, false);
  const unaLletra: Item = { ...dictat, text: 'La història de la ciutat és molt llarga i interessant per a tothom.', resposta: 'La història de la ciutat és molt llarga i interessant per a tothom.' };
  const r = avaluar(unaLletra, 'La historia de la ciutat és molt llarga i interessant per a tothom.');
  assert.equal(r.detall!.find((d) => d.paraula === 'història')!.ok, false);
});

test('transformació: exacta, o 1 lletra en paraules de més de 8 lletres, mai només accents', () => {
  const it: Item = { id: 'c1-transformacio-9999', nivell: 'C1', area: 'us', tipus: 'transformacio', punt: 'pronoms-febles', regla: 'pronoms-en-hi', dificultat: 0, enunciat: 'x', resposta: ["L'administració ens ho comunicarà demà"], diagnostic: false, gratis: true, revisio: 'sessio' };
  assert.equal(avaluar(it, "L'administració ens ho comunicarà demà.").correcte, true);
  assert.equal(avaluar(it, "L'administració ens ho comunicrà demà").correcte, true); // 1 lletra (tecleig) en paraula llarga
  assert.equal(avaluar(it, "L'administracio ens ho comunicarà demà").correcte, false); // només accent
  assert.equal(avaluar(it, "L'administracio ens ho comunicarà demà").quasi, true);
  assert.equal(avaluar(it, "L'administració ens ho comunicarà dema").correcte, false); // paraula curta
});

// ---------------------------------------------------------------- regles pròpies

test('regles: no marquen frases correctes com a error segur', () => {
  const correctes = ['El mateix dia hi han arribat vint persones i ens han donat el número de compte.', 'Hi havien anat tots els veïns.', 'Cal que ho sapiguem aviat.', 'Un mes tard va tornar.', 'El retard és degut a la vaga.', 'He llegit a El Periódico que anem a El Vendrell.', 'La família es va assentar a Lleida.', 'Els mateixos problemes es repeteixen cada any.'];
  for (const f of correctes) assert.deepEqual(detectar(f).filter((e) => e.segur), [], f);
});

test('regles: «degut a» locutiu és possible error (segur: false), no error segur', () => {
  const e = detectar('Degut a la pluja, han suspès la festa.');
  assert.equal(e.length, 1);
  assert.equal(e[0].segur, false);
});

test('regles: els errors clars sí que es marquen', () => {
  const casos: [string, string][] = [['Hi han molts casos nous.', 'hi ha'], ['Arribarem mes tard del previst.', 'més'], ['Voldria sapiguer-ho.', 'saber'], ['Tinc que anar al metge.', 'he de'], ['Lo millor seria demanar hora.', 'el'], ['No se que fer.', 'no sé'], ['Vaig a el poble.', 'al']];
  for (const [f, forma] of casos) { const e = detectar(f).filter((x) => x.segur); assert.equal(e.length, 1, f); assert.equal(e[0].forma, forma, f); }
});

// ---------------------------------------------------------------- ratxa

const amb = (dies: string[]): EstatRatxa => ({ ...ratxaBuida(), dies });

test('ratxa: màxim 2 congelacions per mes natural', () => {
  // Practicat del 20 al 28 de gener menys el 22, el 25 i el 27 (3 forats el mateix mes): la ratxa només aguanta els dos primers forats.
  const r = amb(['2026-01-20', '2026-01-21', '2026-01-23', '2026-01-24', '2026-01-26', '2026-01-28']);
  const x = ratxaActual(r, '2026-01-28');
  assert.equal(x.viva, true);
  assert.equal(x.congelacionsMes, 2);
  assert.equal(x.dies, 4); // 28, (27 congelat), 26, (25 congelat), 24, 23 → el 22 ja no es pot congelar
});

test('ratxa: mai més de 2 dies seguits congelats, tampoc en canviar de mes', () => {
  // 29 i 30 de gener fets; 31/1, 1/2 i 2/2 sense fer res: abans es congelaven 2 del gener + 1 del febrer i la ratxa sobrevivia.
  const r = amb(['2026-01-29', '2026-01-30', '2026-02-03']);
  assert.equal(ratxaActual(r, '2026-02-03').dies, 1);
  // Amb només dos forats (1/2 i 2/2) la ratxa aguanta.
  const r2 = amb(['2026-01-29', '2026-01-30', '2026-01-31', '2026-02-03']);
  const x = ratxaActual(r2, '2026-02-03');
  assert.equal(x.viva, true);
  assert.equal(x.dies, 4);
  const c = consolidarCongelacions(r2, '2026-02-03');
  assert.deepEqual(c.congelacions['2026-02'], ['2026-02-02', '2026-02-01']);
});

test('compromís: caduca en complir els dies', () => {
  const r: EstatRatxa = { ...amb(['2026-03-01', '2026-03-02', '2026-03-03']), compromis: { dies: 7, inici: '2026-03-01' } };
  assert.deepEqual(progresCompromis(r, '2026-03-03'), { fets: 3, total: 7, fi: '2026-03-07', acabat: false });
  assert.equal(progresCompromis(r, '2026-03-07')!.acabat, true);
  assert.equal(progresCompromis(r, '2026-03-08'), null);
  assert.equal(registrarDia(r, '2026-03-09').compromis, null);
  assert.notEqual(registrarDia(r, '2026-03-05').compromis, null);
});

// ---------------------------------------------------------------- pla

test('pla: acaba el dia abans de la convocatòria (sense tall a 200 dies) i hi ha simulacre a les dues últimes setmanes', () => {
  const conv = { id: 'dpl-c1-2027-09', prova: '2027-09-11' } as Convocatoria;
  const pla = generarPla(examens.C1, 'C1', conv, 15, undefined, '2026-10-31');
  assert.equal(pla.dataProva, '2027-09-11');
  assert.ok(pla.sessions.length > 300, `sessions: ${pla.sessions.length}`);
  assert.equal(pla.sessions.at(-1)!.data, '2027-09-10');
  const simulacres = pla.sessions.filter((s) => s.tipus === 'simulacre');
  assert.ok(simulacres.length >= 1 && simulacres.every((s) => s.data >= '2027-08-28'), JSON.stringify(simulacres.map((s) => s.data)));
  // Prova d'aquí a 5 dies: igualment hi ha un simulacre.
  const curt = generarPla(examens.B2, 'B2', { id: 'x', prova: '2026-11-05' } as Convocatoria, 15, undefined, '2026-10-31');
  assert.equal(curt.sessions.length, 5);
  assert.ok(curt.sessions.some((s) => s.tipus === 'simulacre'));
  // Sense convocatòria: 90 dies.
  assert.equal(generarPla(examens.B1, 'B1', undefined, 10, undefined, '2026-10-31').sessions.length, 90);
});
