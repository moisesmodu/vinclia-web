#!/usr/bin/env node
// Comprueba UN archivo de preguntas sin escribir nada: forma + cita literal (fuentes BOE). Pensado para quien genera.
// Uso: node motor/comprobar.mjs oposiciones/<slug>/preguntas/tema-01.json
import fs from 'node:fs';
import path from 'node:path';
import { errorDeForma, config } from './comun.mjs';
import { cargarNorma, comprobarCita } from './ley.mjs';

const f = process.argv[2];
const slug = path.basename(path.dirname(path.dirname(path.resolve(f))));
const cfg = config(slug);
const ps = JSON.parse(fs.readFileSync(f, 'utf8'));
let mal = 0;
const ids = new Set();
const correctas = [0, 0, 0, 0, 0, 0];
for (const p of ps) {
  const e = [];
  if (ids.has(p.id)) e.push('id duplicado');
  ids.add(p.id);
  const forma = errorDeForma(p, cfg.examen?.opciones ?? 4);
  if (forma) e.push(forma);
  if (!forma && p.fuente.tipo === 'boe') {
    if (!p.cita) e.push('falta cita');
    else {
      try {
        const r = comprobarCita(await cargarNorma(p.fuente.id), p.fuente.articulo, p.cita);
        if (!r.ok) e.push(`cita no encontrada (${r.articuloEncontrado ? 'el artículo existe, el texto no coincide' : 'artículo ' + p.fuente.articulo + ' no encontrado'})`);
        else if (r.donde !== 'articulo') e.push(`aviso: la cita está en la norma pero no en el artículo ${p.fuente.articulo}`);
      } catch (x) { e.push(String(x.message)); }
    }
  }
  correctas[p.correcta] = (correctas[p.correcta] ?? 0) + 1;
  if (e.length) { mal++; console.log(`${p.id}: ${e.join('; ')}`); }
}
console.log(`${f}: ${ps.length} preguntas, ${mal} con problemas · reparto de la correcta ${correctas.slice(0, cfg.examen?.opciones ?? 4).join('/')}`);
process.exit(mal ? 1 : 0);
