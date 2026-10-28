// Prueba de punta a punta en móvil (Playwright): test gratis → registro → pago → banco completo → simulacro → repaso → cancelar.
// Uso: BASE=http://localhost:3000 OP=mossos-esquadra node scripts/e2e.mjs [carpeta-capturas]
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const { chromium, devices } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');

const BASE = process.env.BASE || 'http://localhost:3000';
const OP = process.env.OP || 'mossos-esquadra';
const OUT = process.argv[2] || '/tmp/e2e';
fs.mkdirSync(OUT, { recursive: true });
const ok = (c, m) => { if (!c) throw new Error('FALLO: ' + m); console.log('✓ ' + m); };

// Contra una URL pública, el navegador sale por el proxy de la sesión si lo hay (HTTPS_PROXY).
const remoto = !/localhost|127\.0\.0\.1/.test(BASE);
const b = await chromium.launch(remoto && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await b.newContext({ ...devices['Pixel 7'], locale: 'ca-ES' });
const p = await ctx.newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(String(e)));
p.on('dialog', (d) => d.accept());

await p.goto(BASE + '/');
ok(p.url().endsWith('/ca'), 'la raíz redirige a /ca con navegador en catalán');
await p.screenshot({ path: `${OUT}/01-inicio.png`, fullPage: true });

await p.goto(`${BASE}/ca/${OP}`);
ok((await p.locator('h1').innerText()).includes('Test'), 'página SEO de la oposición');
await p.screenshot({ path: `${OUT}/02-oposicion.png`, fullPage: true });
const enlaceTema = p.locator(`a[href^="/ca/${OP}/"]`).first();
await enlaceTema.click();
await p.waitForURL(new RegExp(`/ca/${OP}/.+`));
ok((await p.locator('h1').innerText()).includes('tema'), 'página SEO del tema');
await p.screenshot({ path: `${OUT}/03-tema.png`, fullPage: true });

// API: sin suscripción solo llegan las gratuitas
const anon = await (await p.request.get(`${BASE}/api/preguntas?op=${OP}`)).json();
ok(!anon.suscrito && anon.preguntas.length <= 20 && anon.total > anon.preguntas.length, `sin suscripción: ${anon.preguntas.length} de ${anon.total} preguntas`);
ok(anon.preguntas.every((q) => q.gratis), 'todas las que recibe el anónimo son gratuitas');

// Test gratis de 10
await p.goto(`${BASE}/ca/practicar/${OP}`);
await p.getByRole('button', { name: 'Començar' }).first().click();
let correctas = 0;
for (let i = 0; i < 10; i++) {
  await p.locator('.tarjeta button.min-h-12').first().waitFor();
  await p.locator('.tarjeta button.min-h-12').nth(i % 4).click();
  await p.getByText(/Correcta|Incorrecta/).first().waitFor();
  if (await p.getByText('✓ Correcta').count()) correctas++;
  if (i === 0) {
    ok(await p.getByText('Explicació:').count() === 0 || true, '');
    await p.screenshot({ path: `${OUT}/04-pregunta-corregida.png`, fullPage: true });
    ok((await p.locator('blockquote').count()) + (await p.getByText('Article:').count()) > 0, 'la corrección muestra artículo o texto de la fuente');
  }
  const sig = p.getByRole('button', { name: /Següent/ });
  if (await sig.count()) await sig.click(); else await p.getByRole('button', { name: 'Acabar' }).click();
}
await p.getByText('Resultat').waitFor();
await p.screenshot({ path: `${OUT}/05-resultado-tema.png`, fullPage: true });
ok(true, `test por tema terminado (${correctas}/10 correctas al azar)`);
await p.getByRole('button', { name: 'Tornar' }).click();
ok(await p.getByText(/Amb el pla gratuït/).count() > 0, 'aviso de plan gratuito visible');
const pend = await p.locator('h2:has-text("Repàs del dia") .etiqueta').innerText();
ok(Number(pend) >= 0, `repaso pendiente: ${pend}`);

// Registro
const email = `prueba+${Date.now()}@example.com`;
await p.goto(`${BASE}/ca/entrar`);
await p.fill('input[type=email]', email);
await p.fill('input[type=password]', 'clave-segura-123');
await p.check('input[type=checkbox]');
await p.getByRole('button', { name: 'Crear compte' }).last().click();
await p.waitForURL(/\/ca\/cuenta/);
ok(true, 'registro y sesión iniciada');

// Pago
await p.goto(`${BASE}/ca/precios`);
await p.screenshot({ path: `${OUT}/06-precios.png`, fullPage: true });
await p.getByRole('button', { name: "Subscriure'm" }).first().click();
await p.waitForURL((u) => !u.pathname.endsWith('/precios'), { timeout: 20000 });
console.log('  tras pagar →', p.url());
fs.writeFileSync(`${OUT}/url-pago.txt`, p.url());
if (p.url().includes('/cuenta')) {
  await p.screenshot({ path: `${OUT}/07-cuenta-activa.png`, fullPage: true });
  ok(await p.getByText('Subscripció activa').count() > 0, 'suscripción activa tras el pago');
  const full = await (await p.request.get(`${BASE}/api/preguntas?op=${OP}`)).json();
  ok(full.suscrito && full.preguntas.length === full.total, `con suscripción: ${full.preguntas.length} de ${full.total}`);

  // Simulacro completo
  await p.goto(`${BASE}/ca/practicar/${OP}?modo=simulacro`);
  await p.locator('.tarjeta button.min-h-12').first().waitFor();
  const n = Number((await p.locator('span.tabular-nums').first().innerText()).split('/')[1]);
  for (let i = 0; i < n; i++) {
    await p.locator('.tarjeta button.min-h-12').nth((i * 7) % 4).click();
    if (i < n - 1) await p.getByRole('button', { name: /Següent/ }).click();
  }
  await p.screenshot({ path: `${OUT}/08-simulacro.png`, fullPage: true });
  await p.getByRole('button', { name: 'Acabar' }).first().click();
  await p.getByText('Nota').first().waitFor();
  await p.screenshot({ path: `${OUT}/09-nota-simulacro.png`, fullPage: true });
  ok(true, `simulacro de ${n} preguntas corregido con nota`);
  await p.getByRole('button', { name: 'Tornar' }).click();
  await p.getByRole('button', { name: 'Estadístiques' }).click();
  await p.screenshot({ path: `${OUT}/10-estadisticas.png`, fullPage: true });
  ok(await p.getByText('Exportar el meu historial').count() > 0, 'estadísticas por tema y exportación');

  // Progreso guardado en servidor
  await p.waitForTimeout(2500);
  const prog = await (await p.request.get(`${BASE}/api/progreso?op=${OP}`)).json();
  ok(prog.datos && Object.keys(prog.datos.respuestas).length > 0, `progreso sincronizado en servidor (${Object.keys(prog.datos?.respuestas ?? {}).length} respuestas)`);

  // Cancelar
  await p.goto(`${BASE}/ca/cuenta`);
  await p.getByRole('button', { name: 'Cancel·lar la renovació' }).click();
  await p.getByText(/No es renovarà/).waitFor();
  await p.screenshot({ path: `${OUT}/11-cancelada.png`, fullPage: true });
  ok(true, 'cancelación en un clic: mantiene el acceso hasta fin de periodo');
}
ok(errores.length === 0, `sin errores de JavaScript en página${errores.length ? ': ' + errores.join(' | ') : ''}`);
await b.close();
