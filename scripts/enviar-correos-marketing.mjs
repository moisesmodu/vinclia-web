#!/usr/bin/env node
// Envía por Resend los correos de marketing ya aprobados en marketing/APROBAR.md y deja el registro en
// marketing/ENVIADOS.md. Uso: node scripts/enviar-correos-marketing.mjs <archivo.json> [--simular]
// El JSON es una lista de { id, para, de, responderA, asunto, texto }. Necesita RESEND_API_KEY.
// Remitentes válidos: dominios verificados en Resend (numimates.com, ccsefacil.com, tuspapeles.app, oposita.digital,
// lunilla.cat). Respuesta siempre a hola@numimates.com (SESIONES.md, «Correo de contacto»).
import fs from 'node:fs';

const [archivo, flag] = process.argv.slice(2);
const simular = flag === '--simular';
if (!archivo) { console.error('Uso: node scripts/enviar-correos-marketing.mjs <archivo.json> [--simular]'); process.exit(2); }
if (!process.env.RESEND_API_KEY && !simular) { console.error('Falta RESEND_API_KEY'); process.exit(2); }
const correos = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const hoy = new Date().toISOString().slice(0, 10);
const filas = [];
for (const c of correos) {
  const cuerpo = { from: c.de, to: [c.para], reply_to: c.responderA || 'hola@numimates.com', subject: c.asunto, text: c.texto };
  if (simular) { console.log(`[simulación] ${c.id} → ${c.para} · ${c.asunto}`); filas.push(`| ${hoy} | ${c.id} | ${c.para} | ${c.asunto} | simulado |`); continue; }
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({}));
  if (r.ok) { console.log(`enviado ${c.id} → ${c.para} (${j.id})`); filas.push(`| ${hoy} | ${c.id} | ${c.para} | ${c.asunto} | enviado · ${j.id} |`); }
  else { console.error(`ERROR ${c.id} → ${c.para}: ${r.status} ${JSON.stringify(j)}`); filas.push(`| ${hoy} | ${c.id} | ${c.para} | ${c.asunto} | error ${r.status} |`); }
  await new Promise((res) => setTimeout(res, 600));
}
const registro = 'marketing/ENVIADOS.md';
if (!fs.existsSync(registro)) fs.writeFileSync(registro, '# Correos enviados (registro automático)\n\n| Fecha | Pieza | Destinatario | Asunto | Resultado |\n|---|---|---|---|---|\n');
fs.appendFileSync(registro, filas.join('\n') + '\n');
console.log(`Registro en ${registro}`);
