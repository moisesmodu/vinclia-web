import { NextResponse } from "next/server";
import { z } from "zod";
import type { Cuento } from "@/lib/cuento";
import { db, evento } from "@/lib/db";
import { BANDAS, bandaDe } from "@/lib/plantillas";
import type { DatosNino } from "@/lib/rellenar";

export const runtime = "nodejs";

const limpio = (s: string) => s.replace(/[<>{}|\\]/g, "").replace(/[ \t]+/g, " ").trim();

// Retoque del texto antes de pagar: la familia puede cambiar título, dedicatoria y cualquier página.
// Solo en borrador; misma cantidad de páginas y el mismo límite de caracteres de su franja de edad.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.pedido.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "no existe" }, { status: 404 });
  if (p.estado !== "borrador") return NextResponse.json({ error: "el cuento ya está pagado y en marcha" }, { status: 409 });
  const datos = p.datos as unknown as DatosNino;
  const B = BANDAS[bandaDe(datos.edad)];
  const Esquema = z.object({
    titulo: z.string().min(2).max(80).optional(),
    dedicatoria: z.string().max(240).optional(),
    paginas: z.array(z.string().min(20).max(B.maxCaracteres)).length(B.paginas).optional(),
  });
  const r = Esquema.safeParse(await req.json().catch(() => null));
  if (!r.success) return NextResponse.json({ error: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
  const actual = p.cuento as unknown as Cuento;
  const nuevo: Cuento = {
    ...actual,
    titulo: r.data.titulo !== undefined ? limpio(r.data.titulo) : actual.titulo,
    dedicatoria: r.data.dedicatoria !== undefined ? r.data.dedicatoria.replace(/[<>{}|\\]/g, "").trim() : actual.dedicatoria,
    paginas: r.data.paginas ? r.data.paginas.map(limpio) : actual.paginas,
  };
  if (nuevo.paginas.some((x) => x.length < 20)) return NextResponse.json({ error: "alguna página se ha quedado vacía" }, { status: 400 });
  await db.pedido.update({ where: { id }, data: { cuento: JSON.parse(JSON.stringify({ ...nuevo, retocado: true })) } });
  await evento("retoque", id, { paginas: !!r.data.paginas });
  return NextResponse.json({ ok: true });
}
