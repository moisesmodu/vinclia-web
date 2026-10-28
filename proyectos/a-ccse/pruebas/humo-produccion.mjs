// Prueba de humo contra producción: portada, aviso legal, muro, cuenta y Checkout real de Stripe (modo prueba).
// Uso en la nube: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node pruebas/humo-produccion.mjs
const BASE = process.env.BASE || 'https://ccse-en-tu-idioma.vercel.app';
let cookie = '', fallos = 0;
const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FALLA'} ${m}`); if (!c) fallos++; };
async function api(ruta, opts = {}) {
  const r = await fetch(BASE + ruta, { ...opts, redirect: 'manual', headers: { 'Content-Type': 'application/json', cookie, ...(opts.headers || {}) } });
  const sc = r.headers.get('set-cookie'); if (sc && sc.includes('ccse_sesion=')) cookie = sc.split(';')[0];
  let d = null; try { d = await r.json(); } catch {}
  return { s: r.status, d };
}
let r = await fetch(BASE + '/es'); const html = await r.text();
ok(r.status === 200, 'portada 200'); ok(html.includes('300'), 'portada con contenido');
r = await fetch(BASE + '/es/legal/aviso-legal'); const al = await r.text(); ok(!al.includes('[falta LEGAL_'), 'aviso legal sin marcadores (LEGAL_* puestos)');
let x = await api('/api/banco?lengua=uk&ids=1001,1002'); ok(x.d?.datos?.['1001'] && x.d.bloqueadas.includes(1002), 'muro: gratis visible, resto bloqueado');
const email = `humo+${Date.now()}@example.com`;
x = await api('/api/auth/registro', { method: 'POST', body: JSON.stringify({ email, clave: 'humo-prueba-123', idioma: 'es' }) }); ok(x.s === 200, `registro en Neon (${x.s} ${JSON.stringify(x.d)})`);
x = await api('/api/stripe/checkout', { method: 'POST', body: JSON.stringify({ locale: 'es' }) });
ok(x.s === 200 && /checkout\.stripe\.com/.test(x.d?.url || ''), `Checkout real de Stripe (${x.s} ${x.d?.error ?? ''})`);
ok(/cs_test_/.test(x.d?.url || ''), 'la sesión es de modo prueba');
console.log('URL_CHECKOUT ' + (x.d?.url || ''));
console.log('EMAIL ' + email);
x = await api('/api/auth/cuenta', { method: 'DELETE' }); // limpieza: no deja datos de prueba (se rehace en el pago completo)
process.exit(fallos ? 1 : 0);
