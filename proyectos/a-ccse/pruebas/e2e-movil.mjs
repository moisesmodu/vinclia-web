// Prueba en navegador con pantalla de móvil (Pixel 7): test por tema en árabe, simulacro completo, muro, cuenta y pago.
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch { pw = req('/opt/node-tools/node_modules/playwright'); }
import { arrancar } from './stripe-falso.mjs';
const { srv } = await arrancar(12111);
const BASE = process.env.BASE || 'http://localhost:3100';
const OUT = process.env.CAPTURAS || 'pruebas/capturas';
const { mkdirSync } = await import('node:fs'); mkdirSync(OUT, { recursive: true });
let fallos = 0;
const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FALLA'} ${m}`); if (!c) fallos++; };
const b = await pw.chromium.launch();
const ctx = await b.newContext({ ...pw.devices['Pixel 7'], locale: 'es-ES' });
const p = await ctx.newPage();
const errores = []; p.on('pageerror', (e) => errores.push(String(e)));
const sinScroll = async () => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

await p.goto(`${BASE}/es`); await p.waitForLoadState('networkidle');
ok(await p.locator('h1').innerText().then((t) => t.includes('CCSE')), 'portada carga'); ok(await sinScroll(), 'portada sin scroll horizontal');
await p.screenshot({ path: `${OUT}/1-portada.png`, fullPage: false });

await p.goto(`${BASE}/ar/temas/1`); await p.waitForLoadState('networkidle');
ok((await p.getAttribute('html', 'dir')) === 'rtl', 'árabe en modo derecha a izquierda');
await p.locator('ul button').first().click();
await p.waitForSelector('[aria-live="polite"] p[lang="ar"]', { timeout: 8000 });
ok(await p.locator('[aria-live="polite"] p[lang="ar"]').count() > 0, 'explicación en árabe tras responder');
ok(await sinScroll(), 'test en árabe sin scroll horizontal');
await p.screenshot({ path: `${OUT}/2-test-arabe.png`, fullPage: true });

await p.goto(`${BASE}/es/simulacro`); await p.waitForLoadState('networkidle');
await p.getByRole('button', { name: 'Empezar simulacro' }).click();
ok(await p.locator('[role="timer"]').innerText().then((t) => t.startsWith('45') || t.startsWith('44')), 'cronómetro de 45 minutos');
await p.screenshot({ path: `${OUT}/3-simulacro.png` });
for (let i = 0; i < 25; i++) {
  await p.locator('ul button').first().click();
  if (i < 24) await p.getByRole('button', { name: /Siguiente/ }).click();
}
p.once('dialog', (d) => d.accept());
await p.getByRole('button', { name: 'Entregar' }).first().click();
await p.waitForSelector('text=/APTO/');
ok(await p.locator('text=/Nota: \\d+\\/25/').count() > 0, 'nota del simulacro');
const gancho = p.locator('[data-gancho="proyecto-n"] a');
ok((await gancho.getAttribute('href')) === '/nuevo-en-espana', 'tarjeta "Siguiente paso: tus trámites" apunta a /nuevo-en-espana');
ok(await p.locator('text=/están en el acceso completo/').count() > 0, 'preguntas no gratis del simulacro muestran el muro en la revisión');
await p.screenshot({ path: `${OUT}/4-resultado.png`, fullPage: false });
await gancho.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${OUT}/5-siguiente-paso.png` });

await p.getByRole('button', { name: 'Hacer otro simulacro' }).click();
await p.waitForSelector('text=Ya has usado tu simulacro gratis');
ok(true, 'segundo simulacro gratis bloqueado con muro de pago');

await p.goto(`${BASE}/es/precio`); await p.waitForLoadState('networkidle');
await p.fill('input[type=email]', `movil${Date.now()}@example.com`); await p.fill('input[type=password]', 'clave-movil-123');
await p.getByRole('button', { name: 'Crear cuenta' }).last().click();
await p.waitForSelector('text=/Pagar/');
await p.screenshot({ path: `${OUT}/6-precio.png`, fullPage: true });
await p.route('https://checkout.stripe.com/**', (r) => r.fulfill({ status: 200, body: 'checkout' }));
const [nav] = await Promise.all([p.waitForRequest((r) => r.url().startsWith('https://checkout.stripe.com/')), p.getByRole('button', { name: /Pagar/ }).click()]);
ok(!!nav, 'el botón de pago lleva a Stripe Checkout');

await p.goto(`${BASE}/zh/examen`); await p.waitForLoadState('networkidle');
ok(await p.locator('.prosa table').count() >= 2, 'página del examen en chino con tablas de tareas y fechas');
ok(await sinScroll(), 'examen en chino sin scroll horizontal');
await p.screenshot({ path: `${OUT}/7-examen-chino.png` });
await p.goto(`${BASE}/es/preguntas/1001`); ok(await p.locator('text=Respuesta correcta').count() > 0, 'página indexable de una pregunta');
ok(errores.length === 0, `sin errores de JavaScript (${errores.join(' | ')})`);
await b.close(); srv.close();
console.log(fallos ? `\n${fallos} prueba(s) fallida(s)` : '\nTodas las pruebas pasan');
process.exit(fallos ? 1 : 0);
