import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { avanzar, ESTADOS_ACTIVOS } from "@/lib/pedidos";

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
  // Privacidad: los borradores no comprados se borran a los 30 días.
  const borrados = await db.pedido.deleteMany({ where: { estado: "borrador", creadoEn: { lt: new Date(Date.now() - 30 * 86_400_000) } } });
  return NextResponse.json({ procesados: res, borradoresEliminados: borrados.count });
}
