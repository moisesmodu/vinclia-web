import { NextResponse } from "next/server";
import { z } from "zod";
import { esAdmin } from "@/lib/admin";
import { recibirIlustraciones } from "@/lib/pedidos";

export const runtime = "nodejs";
export const maxDuration = 300;

// Cuerpo: { "0": "https://…png", "1": "…", … "12": "…" } (se admiten entregas parciales).
const Esquema = z.record(z.string().regex(/^(1[0-2]|[0-9])$/), z.string().url());

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!esAdmin(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const r = Esquema.safeParse(await req.json().catch(() => null));
  if (!r.success) return NextResponse.json({ error: "formato: {\"0\": url, …, \"12\": url}" }, { status: 400 });
  const { id } = await params;
  const p = await recibirIlustraciones(id, r.data);
  return NextResponse.json({ id: p.id, estado: p.estado, pdfUrl: p.pdfUrl, error: p.error });
}
