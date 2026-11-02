import { db } from "./db";
import { config, urlBase } from "./config";
import { dicc, t } from "./i18n";
import { guia } from "./contenido";
import { firmar } from "./sesion";
import { enviar, plantilla, enlacePie } from "./correo";

const DIA = 86400 * 1000;

/** Fecha (UTC, 08:00) en que toca cada aviso. Solo se guardan los que aún no han pasado. */
export function calcularAvisos(fechaClave: Date, avisos: { dias: number; texto: string }[], hoy = new Date()) {
  const inicioHoy = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  return avisos
    .map((a) => ({ fecha: new Date(fechaClave.getTime() + a.dias * DIA + 8 * 3600 * 1000), texto: a.texto }))
    .filter((a) => a.fecha.getTime() >= inicioHoy);
}

export function enlaceBaja(recordatorioId: string) {
  return `${urlBase()}/api/recordatorio/baja?t=${encodeURIComponent(firmar({ r: recordatorioId, t: "b" }, 3 * 365 * 86400))}`;
}

export async function crearRecordatorio(p: { email: string; guia: string; idioma: string; fechaClave: Date }) {
  const g = guia(p.guia, p.idioma);
  if (!g) throw new Error("guía desconocida");
  const avisos = calcularAvisos(p.fechaClave, g.guia.recordatorio.avisos);
  const usuario = await db.usuario.upsert({ where: { email: p.email }, create: { email: p.email, idioma: p.idioma }, update: {} });
  const rec = await db.recordatorio.create({
    data: {
      usuarioId: usuario.id, guia: p.guia, idioma: p.idioma, pais: config.pais, fechaClave: p.fechaClave,
      avisos: { create: avisos }
    }
  });
  const d = dicc(p.idioma);
  const enlace = `${urlBase()}/api/recordatorio/confirmar?t=${encodeURIComponent(firmar({ r: rec.id, t: "c" }, 7 * 86400))}`;
  const { html, texto } = plantilla({
    idioma: p.idioma,
    titulo: t(d.correo.confirmarAsunto, { guia: g.guia.titulo }),
    parrafos: [t(d.correo.confirmarTexto, { guia: g.guia.titulo })],
    boton: { texto: d.recordatorio.boton, url: enlace },
    pie: [d.aviso.corto, enlacePie(d.correo.baja, enlaceBaja(rec.id))]
  });
  await enviar({ para: p.email, asunto: t(d.correo.confirmarAsunto, { guia: g.guia.titulo }), html, texto, idioma: p.idioma });
  return rec;
}

/** Lo llama el cron diario: envía los avisos de hoy (y los de hasta 3 días atrás que no salieron). */
export async function enviarAvisosPendientes(ahora = new Date()) {
  const desde = new Date(ahora.getTime() - 3 * DIA);
  const pendientes = await db.aviso.findMany({
    where: { enviado: null, fecha: { lte: ahora, gte: desde }, recordatorio: { confirmado: true } },
    include: { recordatorio: { include: { usuario: true } } },
    take: 500
  });
  let enviados = 0;
  for (const a of pendientes) {
    const { recordatorio: r } = a;
    const g = guia(r.guia, r.idioma);
    const d = dicc(r.idioma);
    const titulo = g?.guia.titulo ?? r.guia;
    const { html, texto } = plantilla({
      idioma: r.idioma,
      titulo: t(d.correo.avisoAsunto, { guia: titulo }),
      parrafos: [a.texto],
      boton: { texto: d.correo.abrirGuia, url: `${urlBase()}/${r.idioma}/guias/${r.guia}` },
      pie: [d.aviso.largo, enlacePie(d.correo.baja, enlaceBaja(r.id))]
    });
    const ok = await enviar({ para: r.usuario.email, asunto: t(d.correo.avisoAsunto, { guia: titulo }), html, texto, idioma: r.idioma });
    if (ok) {
      await db.aviso.update({ where: { id: a.id }, data: { enviado: new Date() } });
      enviados++;
    }
  }
  return { revisados: pendientes.length, enviados };
}
