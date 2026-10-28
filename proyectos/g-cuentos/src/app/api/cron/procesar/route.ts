import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin";
import { db, evento } from "@/lib/db";
import { URL_BASE } from "@/lib/config";
import { correoRecordatorio, enviarCorreo } from "@/lib/correo";
import type { Cuento } from "@/lib/cuento";
import { avanzar, ESTADOS_ACTIVOS } from "@/lib/pedidos";
import type { DatosNino } from "@/lib/rellenar";

export const runtime = "nodejs";
export const maxDuration = 300;

// Vercel Cron (vercel.json) cada 5 minutos: avanza los pedidos que pueden avanzar solos.
export async function GET(req: Request) {
  const okCron = process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!okCron && !esAdmin(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const pendientes = await db.pedido.findMany({
    where: { estado: { in: ESTADOS_ACTIVOS.filter((e) => e !== "ilustrando") } },
    orderBy: { pagadoEn: "asc" }, take: 10, select: { id: true },
  });
  const res = [];
  for (const { id } of pendientes) res.push({ id, estado: (await avanzar(id)).estado });
  // Recuperación: un único correo a quien fue al pago, marcó «recuérdamelo» y no terminó en 20 h.
  const recordados = await recordatorios();
  // Privacidad: los borradores no comprados se borran a los 30 días.
  const borrados = await db.pedido.deleteMany({ where: { estado: "borrador", creadoEn: { lt: new Date(Date.now() - 30 * 86_400_000) } } });
  return NextResponse.json({ procesados: res, recordatorios: recordados, borradoresEliminados: borrados.count });
}

async function recordatorios() {
  const hace20h = new Date(Date.now() - 20 * 3_600_000);
  const checkouts = await db.evento.findMany({ where: { tipo: "checkout", creadoEn: { lt: hace20h, gt: new Date(Date.now() - 7 * 86_400_000) } }, select: { pedidoId: true, detalle: true }, take: 200 });
  const ids = [...new Set(checkouts.filter((e) => (e.detalle as { recordatorio?: boolean } | null)?.recordatorio).map((e) => e.pedidoId!))];
  let n = 0;
  for (const id of ids) {
    const ya = await db.evento.count({ where: { pedidoId: id, tipo: "recordatorio" } });
    const p = await db.pedido.findUnique({ where: { id } });
    if (ya || !p || p.estado !== "borrador" || !p.email) continue;
    const web = ((checkouts.find((e) => e.pedidoId === id)?.detalle as { idiomaWeb?: string } | null)?.idiomaWeb ?? p.idioma) === "ca" ? "/ca" : "";
    const c = correoRecordatorio({ idioma: p.idioma as "es" | "ca", nombre: (p.datos as unknown as DatosNino).nombre, titulo: (p.cuento as unknown as Cuento).titulo, urlVista: `${URL_BASE()}${web}/cuento/${id}` });
    await evento("recordatorio", id);
    try { await enviarCorreo(p.email, c.asunto, c.html, `recordatorio-${id}`); n++; } catch (e) { await evento("error", id, { recordatorio: String(e) }); }
  }
  return n;
}
