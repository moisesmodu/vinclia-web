import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Resumen para la tarea diaria y el informe semanal. ?dias=7
export async function GET(req: Request) {
  if (!esAdmin(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const dias = Number(new URL(req.url).searchParams.get("dias") ?? 1);
  const desde = new Date(Date.now() - dias * 86_400_000);
  const [pagados, borradores, porEstado, incidencias, afiliados] = await Promise.all([
    db.pedido.findMany({ where: { pagadoEn: { gte: desde } }, select: { id: true, formato: true, precioCents: true, afiliado: true, comisionCents: true, estado: true, idioma: true, coleccion: true } }),
    db.pedido.count({ where: { creadoEn: { gte: desde } } }),
    db.pedido.groupBy({ by: ["estado"], _count: true }),
    db.pedido.findMany({ where: { OR: [{ estado: "incidencia" }, { error: { not: null } }] }, select: { id: true, estado: true, error: true, intentos: true, actualizadoEn: true } }),
    db.afiliado.findMany({ select: { codigo: true, nombre: true, clics: true, activo: true, pagadoCents: true } }),
  ]);
  const ingresos = pagados.reduce((s, p) => s + (p.precioCents ?? 0), 0);
  const comisiones = pagados.reduce((s, p) => s + (p.comisionCents ?? 0), 0);
  return NextResponse.json({
    periodoDias: dias, vistasPrevias: borradores, ventas: pagados.length, ingresosCents: ingresos, comisionesCents: comisiones,
    conversion: borradores ? Number((pagados.length / borradores).toFixed(3)) : null,
    porFormato: { pdf: pagados.filter((p) => p.formato === "pdf").length, tapaDura: pagados.filter((p) => p.formato === "tapaDura").length },
    porEstado: Object.fromEntries(porEstado.map((e) => [e.estado, e._count])), incidencias, afiliados,
  });
}
