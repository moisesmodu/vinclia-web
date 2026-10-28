#!/usr/bin/env node
// Compila el banco que usa la app: solo preguntas que pasan las dos verificaciones.
//   - fuente BOE: cita literal encontrada (maquina ok / ok-otro-articulo) Y revisión ok|corregida
//   - fuente web: revisión ok|corregida
// Elige las preguntas gratuitas (config/paises/<pais>.json → gratisPorOposicion) repartidas entre temas.
// Escribe generado/<slug>.json y generado/index.ts.
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, DIR_OPOS, slugs, config, preguntas, leerJson, escribirJson } from './comun.mjs';

const SIN_VERIFICAR = process.env.INCLUIR_SIN_VERIFICAR === '1';
const OUT = path.join(RAIZ, 'generado');
fs.mkdirSync(OUT, { recursive: true });
const incluidos = [];

for (const slug of slugs()) {
  const cfg = config(slug);
  const pais = leerJson(path.join(RAIZ, 'config', 'paises', `${cfg.pais}.json`));
  const ver = leerJson(path.join(DIR_OPOS, slug, 'verificacion.json'), {});
  const temasValidos = new Set(cfg.temas.map((t) => t.n));
  const pasa = (p) => {
    if (!temasValidos.has(p.tema)) return false;
    if (SIN_VERIFICAR) return true;
    const v = ver[p.id];
    if (!v || !['ok', 'corregida'].includes(v.revision)) return false;
    if (p.fuente?.tipo === 'boe') return v.maquina === 'ok' || v.maquina === 'ok-otro-articulo';
    return v.maquina === 'fuente-web' || v.maquina === 'fuente-web-sin-cita';
  };
  const todas = preguntas(slug);
  const ok = todas.filter(pasa).map(({ _archivo, ...p }) => ({ ...p, verificacion: ver[p.id] ? { maquina: ver[p.id].maquina, revision: ver[p.id].revision } : undefined }));

  // Gratis: reparto por temas (ronda), preferencia por dificultad baja y por cita literal, determinista.
  const n = pais.gratisPorOposicion ?? 20;
  const porTema = new Map();
  for (const p of [...ok].sort((a, b) => a.dificultad - b.dificultad || a.id.localeCompare(b.id))) {
    if (!porTema.has(p.tema)) porTema.set(p.tema, []);
    porTema.get(p.tema).push(p);
  }
  const gratis = new Set();
  const temasOrden = [...porTema.keys()].sort((a, b) => a - b);
  for (let ronda = 0; gratis.size < n && ronda < 50; ronda++)
    for (const t of temasOrden) {
      const p = porTema.get(t)[ronda];
      if (p && gratis.size < n) gratis.add(p.id);
    }
  for (const p of ok) p.gratis = gratis.has(p.id);

  const resumen = {
    total: ok.length,
    porTema: Object.fromEntries(cfg.temas.map((t) => [t.n, ok.filter((p) => p.tema === t.n).length])),
    verificadasLiteral: ok.filter((p) => p.verificacion?.maquina?.startsWith('ok')).length,
    examenOficial: ok.filter((p) => p.origen === 'examen-oficial').length,
  };
  const actualizado = new Date().toISOString().slice(0, 10);
  escribirJson(path.join(OUT, `${slug}.json`), { oposicion: cfg, preguntas: ok, actualizado, resumen });
  incluidos.push(slug);
  console.log(`${slug}: ${ok.length}/${todas.length} preguntas al banco (${gratis.size} gratis)${SIN_VERIFICAR ? ' [SIN VERIFICAR]' : ''}`);
}

const ident = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[0-9]/, '_$&');
const ts =
  `// Generado por motor/compilar.mjs. No editar a mano.\nimport type { Banco } from '@/lib/tipos';\n` +
  incluidos.map((s) => `import ${ident(s)} from './${s}.json';`).join('\n') +
  `\n\nexport const bancos: Record<string, Banco> = {\n` +
  incluidos.map((s) => `  '${s}': ${ident(s)} as unknown as Banco,`).join('\n') +
  `\n};\n`;
fs.writeFileSync(path.join(OUT, 'index.ts'), ts);
console.log(`generado/index.ts con ${incluidos.length} oposiciones`);
