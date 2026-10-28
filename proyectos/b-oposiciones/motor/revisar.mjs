#!/usr/bin/env node
// Segunda pasada (modo API): un modelo distinto del que generó lee la pregunta con el texto de la fuente delante
// y decide si la opción marcada es la única correcta. Escribe oposiciones/<slug>/revision/api-<fecha>.json.
// Uso: node motor/revisar.mjs <slug> [--todas]   (por defecto solo las pendientes)
import path from 'node:path';
import { DIR_OPOS, preguntas, revisiones, escribirJson } from './comun.mjs';
import { cargarNorma, buscarArticulo } from './ley.mjs';
import { json, MODELO_CALIDAD, ESQUEMA_REVISION } from './ia.mjs';

export async function revisar(slug, todas = false) {
  const hechas = revisiones(slug);
  const fecha = new Date().toISOString().slice(0, 10);
  const salida = {};
  let ok = 0, mal = 0;
  for (const p of preguntas(slug)) {
    if (!todas && hechas[p.id]) continue;
    let fuente = p.cita ? `Cita: «${p.cita}»` : 'Sin cita (fuente no legal): juzga con conocimiento consolidado.';
    if (p.fuente.tipo === 'boe') {
      const a = buscarArticulo(await cargarNorma(p.fuente.id), p.fuente.articulo);
      if (a) fuente = `${p.fuente.norma}\n${a.cabecera}\n${a.texto.replace(/\\\./g, '.').trim()}`;
    }
    const { datos } = await json({
      modelo: MODELO_CALIDAD,
      esfuerzo: 'medium',
      maxTokens: 4000,
      sistema: 'Revisas preguntas de examen de oposiciones contra su fuente. Respondes "ok" solo si la opción marcada es la única correcta según la fuente, ninguna otra opción es defendible y la explicación no contiene errores. En otro caso "rechazada" y explicas el problema en una frase.',
      contenido: [{ type: 'text', text: `FUENTE:\n${fuente}\n\nPREGUNTA: ${p.es.enunciado}\n${p.es.opciones.map((o, i) => `${i}) ${o}`).join('\n')}\nMARCADA COMO CORRECTA: ${p.correcta}\nEXPLICACIÓN: ${p.es.explicacion}\n\nCATALÁN (comprueba que es traducción fiel): ${p.ca.enunciado} | ${p.ca.opciones.join(' | ')}` }],
      esquema: ESQUEMA_REVISION,
    });
    const v = datos.veredicto === 'ok' && datos.correctaSegunFuente === p.correcta ? 'ok' : 'rechazada';
    salida[p.id] = { revision: v, nota: datos.nota, revisor: MODELO_CALIDAD, fecha };
    v === 'ok' ? ok++ : mal++;
  }
  escribirJson(path.join(DIR_OPOS, slug, 'revision', `api-${fecha}.json`), salida);
  return { ok, rechazadas: mal };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(await revisar(process.argv[2], process.argv.includes('--todas')));
