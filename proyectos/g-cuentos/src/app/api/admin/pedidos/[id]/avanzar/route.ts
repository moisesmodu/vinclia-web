import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin";
import { db, evento } from "@/lib/db";
import { avanzar } from "@/lib/pedidos";

export const runtime = "nodejs";
export const maxDuration = 300;

// Reintenta un pedido (también los que están en «incidencia»). ?estado=… fuerza el estado de partida.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!esAdmin(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const { id } = await params;
  const estado = new URL(req.url).searchParams.get("estado");
  const p = await db.pedido.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "no existe" }, { status: 404 });
  if (estado || p.estado === "incidencia") {
    // Sin ?estado, vuelve al paso en que falló (último evento «error»): así no se repiten correos ni se maqueta sin ilustraciones.
    const ultimo = await db.evento.findFirst({ where: { pedidoId: id, tipo: "error" }, orderBy: { creadoEn: "desc" } });
    const previo = (ultimo?.detalle as { estado?: string } | null)?.estado;
    const destino = estado ?? (previo && previo !== "incidencia" ? previo : "pagado");
    await db.pedido.update({ where: { id }, data: { estado: destino, intentos: 0, error: null, bloqueoHasta: null } });
    await evento("reintento", id, { desde: p.estado, a: destino });
  }
  const r = await avanzar(id);
  return NextResponse.json({ id, estado: r.estado, error: r.error });
}
