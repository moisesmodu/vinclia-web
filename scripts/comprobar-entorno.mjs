#!/usr/bin/env node
// Comprueba si esta sesión puede desplegar sola: red del entorno y secretos. Uso: node scripts/comprobar-entorno.mjs
const hosts = ['api.stripe.com', 'api.vercel.com', 'console.neon.tech', 'api.resend.com', 'api.anthropic.com'];
const vars = ['VERCEL_TOKEN', 'VERCEL_TEAM_ID', 'NEON_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_TEST_SECRET_KEY', 'RESEND_API_KEY', 'LEGAL_NOM', 'LEGAL_NIF', 'LEGAL_EMAIL', 'LEGAL_ADRECA'];
let ok = true;
console.log('Red del entorno:');
for (const h of hosts) {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch(`https://${h}/`, { method: 'GET', signal: c.signal, redirect: 'manual' }); clearTimeout(t);
    console.log(`  ✓ ${h} (HTTP ${r.status})`);
  } catch (e) { ok = false; console.log(`  ✗ ${h} bloqueado: ${e.cause?.code ?? e.name}`); }
}
console.log('Secretos del entorno:');
for (const v of vars) {
  const hay = !!process.env[v]; if (!hay) ok = false;
  console.log(`  ${hay ? '✓' : '✗'} ${v}`);
}
console.log(ok ? '\nTodo listo: esta sesión puede desplegar sola (DESPLIEGUES.md §3).'
  : '\nFalta algo: la sesión escribe proyectos/<clave>/DESPLIEGUE.md y sigue (DESPLIEGUES.md §4). Lo que falta se arregla una vez en el entorno (DESPLIEGUES.md §0 y §1).');
process.exit(ok ? 0 : 1);
