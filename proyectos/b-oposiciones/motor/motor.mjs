#!/usr/bin/env node
// Motor completo (modo API, requiere ANTHROPIC_API_KEY): oposición nueva = oposicion.json + convocatoria.pdf.
//   1. temario desde el PDF (si oposicion.json no trae temas)
//   2. preguntas por tema desde el texto legal (Haiku 5.5), descartando las que no tienen cita literal
//   3. verificación de máquina (cita literal) + segunda pasada (Sonnet 5.5)
//   4. compilación del banco que lee la app (y con él, las páginas SEO de la oposición y de cada tema)
// Uso: npm run motor -- <slug> [--por-tema=20]
// Sin clave de API, el mismo proceso lo hace una sesión de Claude Code siguiendo motor/INSTRUCCIONES-GENERACION.md.
import { execFileSync } from 'node:child_process';
import { config } from './comun.mjs';
import { temarioDesdePdf } from './temario.mjs';
import { generarTema } from './generar.mjs';
import { revisar } from './revisar.mjs';

const slug = process.argv[2];
const porTema = Number((process.argv.find((a) => a.startsWith('--por-tema=')) ?? '=20').split('=')[1]);
if (!slug) { console.error('Uso: npm run motor -- <slug>'); process.exit(2); }
if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) { console.error('Falta ANTHROPIC_API_KEY (o usa el modo sesión: TAREA-PROGRAMADA.md).'); process.exit(2); }

if (!config(slug).temas?.length) console.log('Temario:', await temarioDesdePdf(slug));
for (const t of config(slug).temas) {
  try { console.log(`Tema ${t.n}:`, await generarTema(slug, t.n, porTema)); }
  catch (e) { console.log(`Tema ${t.n}: ${e.message}`); }
}
console.log('Revisión:', await revisar(slug));
execFileSync('node', ['motor/verificar.mjs', slug], { stdio: 'inherit' });
execFileSync('node', ['motor/compilar.mjs'], { stdio: 'inherit' });
