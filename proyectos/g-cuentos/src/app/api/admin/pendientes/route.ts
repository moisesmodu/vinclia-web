import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { Encargo } from "@/lib/ilustraciones";

export const runtime = "nodejs";

// Para el taller de ilustración (tarea programada): pedidos pagados que esperan sus ilustraciones (hoja propia si la hay, portada y 18 o 22 páginas),
// con el encargo completo (prompts y referencias) listo para Higgsfield.
export async function GET(req: Request) {
  if (!esAdmin(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const pedidos = await db.pedido.findMany({
    where: { estado: "ilustrando" }, orderBy: { pagadoEn: "asc" },
    select: { id: true, pagadoEn: true, formato: true, idioma: true, trabajosIlustr: true, ilustraciones: true },
  });
  return NextResponse.json({
    pedidos: pedidos.map((p) => {
      const enc = p.trabajosIlustr as unknown as Encargo | null;
      const hechas = (p.ilustraciones as Record<string, string> | null) ?? {};
      const total = (enc?.paginas ?? 22) + 1;
      const faltan: (number | "hoja")[] = Array.from({ length: total }, (_, i) => i).filter((i) => !hechas[String(i)]);
      if (enc?.hoja && !hechas.hoja) faltan.unshift("hoja");
      return { ...p, faltan };
    }),
  });
}
