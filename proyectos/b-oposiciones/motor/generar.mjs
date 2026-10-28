#!/usr/bin/env node
// Paso 2: genera preguntas de un tema a partir del texto literal de sus normas (BOE consolidado).
// Uso: node motor/generar.mjs <slug> <tema> [n=20]
import fs from 'node:fs';
import path from 'node:path';
import { DIR_OPOS, config, leerJson, escribirJson } from './comun.mjs';
import { cargarNorma, articulos, titulo, comprobarCita, urlBoe } from './ley.mjs';
import { json, MODELO_VOLUMEN, ESQUEMA_PREGUNTAS } from './ia.mjs';

const REGLAS = fs.readFileSync(new URL('./INSTRUCCIONES-GENERACION.md', import.meta.url), 'utf8');

/** "1-11, 55-86, adicional primera" → filtro de claves de artículo */
function enRango(clave, rangos) {
  if (!rangos) return true;
  return rangos.split(',').map((x) => x.trim().toLowerCase()).some((r) => {
    const m = r.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) { const n = parseInt(clave, 10); return n >= +m[1] && n <= +m[2]; }
    return clave === r || clave === r.replace(/^art(ículo)?\.?\s*/, '');
  });
}

export async function generarTema(slug, n, cuantas = 20, prefijo) {
  const cfg = config(slug);
  const t = cfg.temas.find((x) => x.n === n);
  if (!t) throw new Error(`Tema ${n} no existe`);
  const pre = prefijo || slug.split('-').map((s) => s[0]).join('').slice(0, 4);
  const archivo = path.join(DIR_OPOS, slug, 'preguntas', `tema-${String(n).padStart(2, '0')}.json`);
  const previas = leerJson(archivo, []);
  const textos = [];
  for (const f of t.fuentes.filter((x) => x.tipo === 'boe')) {
    const md = await cargarNorma(f.id);
    const arts = articulos(md).filter((a) => enRango(a.clave, f.articulos));
    textos.push(`### ${titulo(md)} (${f.id})\n` + arts.map((a) => `#### ${a.cabecera}\n${a.texto.replace(/\\\./g, '.').trim()}`).join('\n\n'));
  }
  if (!textos.length) throw new Error('El tema no tiene fuentes BOE: en modo API solo se generan temas con texto legal (los demás, en modo sesión)');
  const { datos, uso } = await json({
    modelo: MODELO_VOLUMEN,
    maxTokens: 64000,
    sistema: `Redactas preguntas tipo test de oposiciones catalanas. Sigue estas reglas:\n\n${REGLAS}`,
    contenido: [
      { type: 'text', text: `Texto legal vigente del tema:\n\n${textos.join('\n\n')}`, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `Oposición: ${cfg.nombre.es}. Tema ${n}: ${t.titulo.es}.\nEscribe ${cuantas} preguntas nuevas, distintas de estas que ya existen:\n${previas.map((p) => '- ' + p.es.enunciado).join('\n') || '(ninguna)'}\n"articulo" = número del artículo; "cita" = fragmento literal copiado del texto de arriba.` },
    ],
    esquema: ESQUEMA_PREGUNTAS,
  });
  // Solo se guardan las que superan ya la comprobación de cita literal.
  let sig = previas.length + 1;
  const nuevas = [];
  let descartadas = 0;
  for (const q of datos.preguntas) {
    const fuente = t.fuentes.filter((x) => x.tipo === 'boe').find((f) => comprobarCita(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '.cache', `${f.id}.md`), 'utf8'), q.articulo, q.cita).ok);
    if (!fuente) { descartadas++; continue; }
    nuevas.push({
      id: `${pre}-t${String(n).padStart(2, '0')}-${String(sig++).padStart(3, '0')}`, tema: n, dificultad: q.dificultad, correcta: q.correcta, es: q.es, ca: q.ca,
      fuente: { tipo: 'boe', id: fuente.id, norma: fuente.norma, articulo: q.articulo, url: urlBoe(fuente.id, q.articulo.split('.')[0]) },
      cita: q.cita, origen: 'ia',
    });
  }
  escribirJson(archivo, [...previas, ...nuevas]);
  return { nuevas: nuevas.length, descartadas, uso };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [slug, n, cuantas] = process.argv.slice(2);
  console.log(await generarTema(slug, Number(n), Number(cuantas || 20)));
}
