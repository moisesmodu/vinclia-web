#!/usr/bin/env node
// Primera pasada de verificación (máquina): forma de cada pregunta y cita literal contra el texto consolidado del BOE.
// Escribe oposiciones/<slug>/verificacion.json con { id: { maquina, detalle, revision, nota } } fusionando la segunda pasada.
// Uso: node motor/verificar.mjs [slug ...]
import path from 'node:path';
import { DIR_OPOS, slugs, config, preguntas, revisiones, errorDeForma, escribirJson } from './comun.mjs';
import { cargarNorma, comprobarCita } from './ley.mjs';

const pedidos = process.argv.slice(2);
const lista = pedidos.length ? pedidos : slugs();
let global = { total: 0, ok: 0 };

for (const slug of lista) {
  const cfg = config(slug);
  const ps = preguntas(slug);
  const rev = revisiones(slug);
  const res = {};
  const cuenta = {};
  const ids = new Set();
  for (const p of ps) {
    let maquina, detalle = '';
    const forma = errorDeForma(p, cfg.examen?.opciones ?? 4);
    if (ids.has(p.id)) { maquina = 'id-duplicado'; }
    else if (forma) { maquina = 'forma'; detalle = forma; }
    else if (p.fuente.tipo === 'boe') {
      if (!p.cita) { maquina = 'sin-cita'; }
      else {
        try {
          const md = await cargarNorma(p.fuente.id);
          const r = comprobarCita(md, p.fuente.articulo, p.cita);
          maquina = r.ok ? (r.donde === 'articulo' ? 'ok' : 'ok-otro-articulo') : 'cita-no-encontrada';
          if (!r.ok) detalle = r.articuloEncontrado ? 'el artículo existe pero la cita no coincide' : 'artículo no encontrado';
        } catch (e) { maquina = 'norma-no-disponible'; detalle = String(e.message); }
      }
    } else maquina = p.cita ? 'fuente-web' : 'fuente-web-sin-cita';
    ids.add(p.id);
    const r = rev[p.id] ?? {};
    res[p.id] = { maquina, ...(detalle && { detalle }), revision: r.revision ?? 'pendiente', ...(r.nota && { nota: r.nota }), ...(r.fecha && { fecha: r.fecha }) };
    cuenta[maquina] = (cuenta[maquina] ?? 0) + 1;
  }
  escribirJson(path.join(DIR_OPOS, slug, 'verificacion.json'), res);
  const revCuenta = Object.values(res).reduce((a, x) => ((a[x.revision] = (a[x.revision] ?? 0) + 1), a), {});
  console.log(`${slug}: ${ps.length} preguntas · máquina ${JSON.stringify(cuenta)} · revisión ${JSON.stringify(revCuenta)}`);
  global.total += ps.length;
  global.ok += Object.values(res).filter((x) => x.maquina === 'ok').length;
}
console.log(`Total ${global.total} · citas literales verificadas en su artículo: ${global.ok}`);
