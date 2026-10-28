#!/usr/bin/env node
// Paso 1 del motor: del PDF de la convocatoria al temario troceado (rellena oposicion.json si no tiene temas).
// Uso: node motor/temario.mjs <slug>   (lee oposiciones/<slug>/convocatoria.pdf o convocatoria.pdfUrl)
import fs from 'node:fs';
import path from 'node:path';
import { DIR_OPOS, config, escribirJson } from './comun.mjs';
import { json, MODELO_CALIDAD, ESQUEMA_TEMARIO } from './ia.mjs';
import { cargarNorma } from './ley.mjs';

export async function temarioDesdePdf(slug) {
  const cfg = config(slug);
  const local = path.join(DIR_OPOS, slug, 'convocatoria.pdf');
  let pdf;
  if (fs.existsSync(local)) pdf = fs.readFileSync(local);
  else if (cfg.convocatoria?.pdfUrl) pdf = Buffer.from(await (await fetch(cfg.convocatoria.pdfUrl)).arrayBuffer());
  else throw new Error(`Falta oposiciones/${slug}/convocatoria.pdf o convocatoria.pdfUrl`);
  const { datos, uso } = await json({
    modelo: MODELO_CALIDAD,
    esfuerzo: 'high',
    sistema: 'Eres un técnico de selección de personal de las administraciones catalanas. Extraes de las bases de una convocatoria el temario oficial, sin resumir ni reordenar, y el formato de la prueba de conocimientos. Para cada tema indicas las normas que lo regulan con su identificador del BOE (BOE-A-AAAA-NNNNN) si lo conoces con seguridad; si no, boeId vacío.',
    contenido: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.toString('base64') } },
      { type: 'text', text: 'Extrae el temario (título literal en catalán y su traducción al castellano, slug corto en minúsculas con guiones), la referencia de la resolución, el diario, la fecha (AAAA-MM-DD), las plazas y el formato del examen tipo test. Si un dato no aparece, usa 0 o cadena vacía.' },
    ],
    esquema: ESQUEMA_TEMARIO,
  });
  const temas = [];
  for (const t of datos.temas) {
    const fuentes = [];
    for (const n of t.normas) {
      let ok = false;
      if (n.boeId) { try { await cargarNorma(n.boeId); ok = true; } catch {} }
      fuentes.push(ok ? { tipo: 'boe', id: n.boeId, norma: n.norma, articulos: n.articulos } : { tipo: 'web', norma: n.norma });
    }
    temas.push({ n: t.n, titulo: { ca: t.titulo_ca, es: t.titulo_es }, slug: t.slug, fuentes, peso: 1 });
  }
  const nuevo = {
    ...cfg,
    convocatoria: { ...cfg.convocatoria, referencia: cfg.convocatoria?.referencia || datos.referencia, diario: cfg.convocatoria?.diario || datos.diario, fecha: cfg.convocatoria?.fecha || datos.fecha, plazas: cfg.convocatoria?.plazas || datos.plazas, verificado: 'fuente primaria (PDF de la convocatoria)' },
    examen: { ...datos.examen, notaMaxima: 10, notaCorte: 5, ...cfg.examen },
    temas: cfg.temas?.length ? cfg.temas : temas,
  };
  escribirJson(path.join(DIR_OPOS, slug, 'oposicion.json'), nuevo);
  return { temas: nuevo.temas.length, uso };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(await temarioDesdePdf(process.argv[2]));
