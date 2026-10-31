#!/usr/bin/env node
// Prova de punta a punta en mòbil (Pixel 7 emulat amb el Chromium de Playwright): entrada en 3 pantalles, diagnòstic complet (ús de la
// llengua adaptatiu, lectura, text breu corregit, oral saltat), pantalla de resultat, Avui amb compromís, pràctica amb «Per què?»,
// simulacre complet de C1 fins al resultat, correcció escrita, convocatòries, preus i (si hi ha base de dades) registre i Checkout.
// Ús: BASE=http://localhost:3000 node scripts/e2e.mjs [carpeta de captures]
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const { chromium, devices } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '');
const OUT = process.argv[2] || '/tmp/e2e-aprova';
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['Pixel 7'], locale: 'ca-ES', permissions: [] });
const p = await ctx.newPage();
p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
p.on('console', (m) => { if (m.type() === 'error' && !/favicon|sw\.js|ServiceWorker|net::ERR|status of (400|401|402|503)/.test(m.text())) errors.push(`console: ${m.text().slice(0, 200)}`); });
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png`, fullPage: false });
const pas = (n) => console.log('✓', n);
const t0 = Date.now();

await p.goto(`${BASE}/`); await p.waitForURL(/\/(ca|es)$/); pas('redirecció per idioma → ' + p.url()); await shot('01-inici');
await p.goto(`${BASE}/ca/comencar`);
await p.getByRole('radio', { name: /C1/ }).first().click();
await p.getByRole('radio', { name: /DPL · prova de C1/ }).click();
await p.getByRole('button', { name: 'Següent' }).click();
await p.getByRole('radio', { name: 'Oposicions' }).click();
await p.getByRole('radio', { name: 'Castellà' }).click();
await p.getByRole('button', { name: 'Següent' }).click();
await p.getByRole('radio', { name: /^15/ }).click();
await p.getByRole('radio', { name: 'Castellano' }).click();
await shot('02-comencar');
await p.getByRole('button', { name: 'Començar el diagnòstic' }).click();
await p.waitForURL(/\/ca\/diagnostic/); pas('entrada en 3 pantalles');

// Bloc ús de la llengua (adaptatiu): respon fins que canviï de bloc.
async function respondreItem() {
  await p.waitForSelector('button.opcio, input.campo, textarea.campo', { timeout: 15000 }); await p.waitForTimeout(350); /* transició entre ítems */
  if (await p.locator('text=/^Resultat ·/').count()) return false; /* ja s'ha acabat la sessió */
  const opcions = p.locator('button.opcio');
  if (await opcions.count()) await opcions.nth(0).click();
  else { const camp = p.locator('input.campo, textarea.campo').first(); if (!(await camp.count())) return false; await camp.fill('hi'); }
  await p.getByRole('button', { name: 'Comprovar' }).click();
  await p.waitForTimeout(150);
  return true;
}
for (let i = 0; i < 12; i++) {
  await respondreItem();
  if (i === 0) { await p.getByRole('button', { name: 'Per què?' }).click(); await p.waitForSelector('text=Font:'); pas('botó «Per què?» amb la regla citada'); await shot('03-diagnostic-perque'); }
  await p.getByRole('button', { name: /Següent/ }).click();
}
pas('bloc d\'ús de la llengua (12 ítems adaptatius)');
// Lectura
for (let i = 0; i < 8; i++) { await p.waitForTimeout(450); if (!(await p.locator('text=/Comprensió lectora/').count())) break; await p.locator('button.opcio').nth(0).click(); await p.getByRole('button', { name: 'Comprovar' }).click(); await p.getByRole('button', { name: 'Següent' }).click(); }
pas('bloc de lectura'); await shot('04-diagnostic-escrit');
// Escrit
await p.locator('textarea.campo').fill('Benvolgut company, et volia demanar un canvi de torn per a la setmana vinent. Tinc una visita mèdica dijous al matí i no la puc moure. Podríem canviar el torn de dijous pel de divendres? Si no et va bé, també em va bé dimecres a la tarda. Moltes gràcies per endavant i disculpa les molèsties. Salutacions cordials, Marta.');
await p.getByRole('button', { name: 'Enviar' }).click();
await p.waitForSelector('text=Lectura en veu alta', { timeout: 70000 }); pas('text breu corregit per criteris');
await p.getByRole('button', { name: 'Saltar aquest bloc' }).click();
await p.waitForSelector("text=/Probabilitat d.aprovar/i", { timeout: 20000 });
const prob = (await p.locator('[role="img"][aria-label*="%"]').first().getAttribute('aria-label')) ?? ''; pas(`resultat del diagnòstic: ${prob.trim()}`); await shot('05-resultat');
if (!(await p.locator('text=Els 3 punts febles').count()) || !(await p.locator('text=Els 3 sons').count())) errors.push('falten punts febles o sons al resultat');
await p.getByRole('link', { name: 'Crear el meu pla' }).click();
await p.waitForURL(/\/ca\/avui/);
// Porta: amb base de dades cal compte (7 dies de prova, sense targeta); en demo local no hi ha porta.
const yo0 = await p.evaluate(() => fetch('/api/yo').then((r) => r.json()));
const emailProva = `e2e+${Date.now()}@aprova.test`;
if (yo0.db && !yo0.usuari) {
  await p.waitForSelector('text=Guarda el teu pla', { timeout: 15000 }); await shot('05b-porta');
  await p.getByRole('link', { name: 'Crear el compte' }).click();
  await p.waitForURL(/entrar/);
  await p.fill('input[type=email]', emailProva); await p.fill('input[type=password]', 'provaprova1');
  await p.locator('input[type=checkbox]').check();
  await p.getByRole('button', { name: 'Crear compte' }).click();
  await p.waitForURL(/\/ca\/avui/, { timeout: 20000 }); pas('compte creat des de la porta: comença la prova de 7 dies');
}
await p.getByRole('radio', { name: '14 dies' }).click(); await p.getByRole('button', { name: 'Em comprometo' }).click();
await p.waitForSelector('text=/congelacions|congelaciones/'); pas('Avui amb compromís, ratxa i pla'); await shot('06-avui');
if (!(await p.locator('text=/dies per a la prova|dies/').count())) errors.push('Avui sense dies per a la prova');

// Pràctica: minisessió amb FSRS
await p.goto(`${BASE}/ca/practica/mini`);
await p.waitForSelector('button.opcio, input.campo, textarea.campo', { timeout: 15000 }); await p.waitForTimeout(350); /* transició entre ítems */
for (let i = 0; i < 6; i++) { if (await p.locator('text=/^Resultat ·/').count()) break; if (!(await respondreItem())) break; const seg = p.getByRole('button', { name: /Següent|Acabar/ }); if (await seg.count()) await seg.click(); else break; }
await p.waitForSelector('text=/^Resultat ·/', { timeout: 10000 }); pas('minisessió de 2 minuts'); await shot('07-practica');
await p.goto(`${BASE}/ca/mapa`); await p.waitForSelector('text=Mapa de domini'); pas('mapa de domini'); await shot('08-mapa');

// Simulacre C1 complet
await p.goto(`${BASE}/ca/simulacre/c1-simulacre-1`);
await p.getByRole('button', { name: 'Començar el simulacre' }).click();
await p.waitForSelector('text=Àrea 1');
const tx = 'El teletreball a l\'administració pública és, segons el meu parer, una oportunitat que cal aprofitar amb seny. D\'una banda, permet conciliar la vida laboral i familiar i redueix els desplaçaments, cosa que beneficia el medi ambient i la salut de les persones. D\'altra banda, els detractors sostenen que l\'atenció ciutadana se\'n ressent i que la cohesió dels equips es debilita. Tanmateix, les dades de les administracions que ja l\'han implantat mostren que la productivitat es manté i que l\'absentisme disminueix. Cal, doncs, un model mixt: presència dos dies per setmana per a les tasques d\'atenció directa i treball a distància la resta, amb objectius clars i eines digitals segures. En conclusió, el teletreball no és un privilegi, sinó una manera moderna d\'organitzar el servei públic que, ben regulada, millora tant la vida dels treballadors com la qualitat del servei que rep la ciutadania. Per això, les administracions haurien de regular-lo amb criteris objectius, formar els comandaments i avaluar-ne els resultats cada any amb indicadors públics i transparents que permetin corregir el que no funcioni.';
await p.locator('textarea.campo').fill(tx);
await p.getByRole('button', { name: 'Enviar a corregir' }).click();
await p.waitForSelector('text=Nota prevista', { timeout: 70000 }); pas('àrea 1: redacció corregida amb la rúbrica'); await shot('09-simulacre-escrit');
await p.getByRole('button', { name: 'Següent àrea' }).click();
await p.waitForSelector('text=Àrea 2');
for (let i = 0; i < 45; i++) { if (!(await p.locator('text=Àrea 2').count())) break; if (!(await respondreItem())) break; }
await p.waitForSelector('.segell[role="status"]', { timeout: 20000 }); pas('àrea 2: 45 ítems; resultat apte/no apte'); await shot('10-simulacre-resultat');

// Correcció escrita independent (quota)
await p.goto(`${BASE}/ca/escriure`); await p.waitForSelector('text=Escriure'); pas('llista de tasques escrites');
await p.goto(`${BASE}/ca/oral`); await p.waitForSelector('text=Gravar'); pas('pantalla oral'); await shot('11-oral');
await p.goto(`${BASE}/ca/convocatories`); await p.waitForSelector('text=Convocatòries 2027'); pas('convocatòries 2027');
await p.goto(`${BASE}/ca/preus`); await p.waitForSelector('text=Preu clar'); await shot('12-preus'); pas('preus');
await p.goto(`${BASE}/ca/guia/examen-c1-catala-2027-model`); await p.waitForSelector('h1'); pas('pàgina SEO');
await p.goto(`${BASE}/es`); await p.waitForSelector('text=Sabrás si apruebas'); pas('versió en castellà');

// Registre i pagament (només si hi ha base de dades)
// Les crides van des del navegador (el proxy de les sessions no afecta Node).
const yo = await p.evaluate(() => fetch('/api/yo').then((r) => r.json()));
const dbOk = await p.evaluate(() => fetch('/api/auth/registre', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).then((r) => r.status !== 503));
if (yo.pagaments !== 'off' && dbOk) {
  if (!yo.usuari) {
    await p.goto(`${BASE}/ca/entrar?mode=crear`);
    await p.fill('input[type=email]', `e2e+${Date.now()}@aprova.test`); await p.fill('input[type=password]', 'provaprova1');
    await p.locator('input[type=checkbox]').check();
    await p.getByRole('button', { name: 'Crear compte' }).click();
    await p.waitForURL(/\/ca\/avui/, { timeout: 20000 }).catch(() => {});
  }
  const yo2 = await p.evaluate(() => fetch('/api/yo').then((r) => r.json()));
  if (yo2.usuari) {
    pas(`sessió amb compte (${yo2.usuari.acces?.tipus ?? '?'}, ${yo2.usuari.acces?.diesProva ?? 0} dies de prova)`);
    if (yo2.usuari.acces?.tipus !== 'prova') errors.push('el compte nou no està en prova de 7 dies');
    await p.goto(`${BASE}/ca/preus`);
    // Mateixa crida que fa el botó «Triar», des del navegador (amb la galeta de sessió) i sense navegar a Stripe.
    const j = await p.evaluate(() => fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan: 'anual', idioma: 'ca' }) }).then((r) => r.json()).catch(() => ({})));
    if (j.url?.includes('checkout.stripe.com')) pas(`Checkout de Stripe creat (${yo.prova ? 'mode prova' : 'REAL'}): ${j.url.slice(0, 40)}…`);
    else if (j.url?.includes('pagat=demo')) pas('pagament simulat (mode demo)');
    else errors.push('checkout sense url: ' + JSON.stringify(j));
  } else errors.push('registre fallit: ' + p.url());
} else console.log('· sense base de dades: es salta registre i pagament');

await b.close();
console.log(`\n${errors.length ? 'ERRORS:\n' + errors.join('\n') : 'Sense errors de JavaScript.'} · ${Math.round((Date.now() - t0) / 1000)} s · captures a ${OUT}`);
process.exit(errors.length ? 1 : 0);
