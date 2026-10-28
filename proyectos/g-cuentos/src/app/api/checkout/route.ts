import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { precioCents } from "@/lib/config";
import type { Cuento } from "@/lib/cuento";
import { db, evento } from "@/lib/db";
import { crearCheckout } from "@/lib/pagos";

export const runtime = "nodejs";

const Esquema = z.object({ pedidoId: z.string().min(5), formato: z.enum(["pdf", "tapaDura"]), email: z.string().email().optional().or(z.literal("")), recordatorio: z.boolean().default(false), idiomaWeb: z.enum(["es", "ca"]).default("es") });

export async function POST(req: Request) {
  const r = Esquema.safeParse(await req.json().catch(() => ({})));
  if (!r.success) return NextResponse.json({ error: "datos no válidos" }, { status: 400 });
  const { pedidoId, formato, email, idiomaWeb, recordatorio } = r.data;
  const p = await db.pedido.findUnique({ where: { id: pedidoId } });
  if (!p || p.estado !== "borrador") return NextResponse.json({ error: "pedido no disponible" }, { status: 409 });
  const afiliado = (await cookies()).get("afiliado")?.value;
  const cuento = p.cuento as unknown as Cuento;
  const c = await crearCheckout({ pedidoId, formato, titulo: cuento.titulo, idioma: idiomaWeb, email: email || undefined, afiliado });
  await db.pedido.update({ where: { id: pedidoId }, data: { formato, precioCents: precioCents(formato), email: email || p.email, afiliado: afiliado ?? null } });
  await evento("checkout", pedidoId, { formato, simulado: c.simulado, recordatorio: recordatorio && !!email, idiomaWeb });
  return NextResponse.json({ url: c.url });
}
