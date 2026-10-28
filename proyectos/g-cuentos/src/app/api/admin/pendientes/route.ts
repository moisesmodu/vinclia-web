import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Para el taller de ilustración (tarea programada): pedidos pagados que esperan sus 13 ilustraciones,
// con el encargo completo (prompts y referencias) listo para Higgsfield.
export async function GET(req: Request) {
  if (!esAdmin(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const pedidos = await db.pedido.findMany({
    where: { estado: "ilustrando" }, orderBy: { pagadoEn: "asc" },
    select: { id: true, pagadoEn: true, formato: true, idioma: true, trabajosIlustr: true, ilustraciones: true },
  });
  return NextResponse.json({
    pedidos: pedidos.map((p) => ({ ...p, faltan: Array.from({ length: 13 }, (_, i) => i).filter((i) => !(p.ilustraciones as Record<string, string> | null)?.[String(i)]) })),
  });
}
