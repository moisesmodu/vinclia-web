import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificar } from "@/lib/sesion";
import { urlBase } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const v = verificar<{ r: string; t: string }>(new URL(req.url).searchParams.get("t"));
  if (!v || v.t !== "c") return new NextResponse("Enlace caducado o no válido.", { status: 400 });
  const r = await db.recordatorio.update({ where: { id: v.r }, data: { confirmado: true } }).catch(() => null);
  if (!r) return new NextResponse("Recordatorio no encontrado.", { status: 404 });
  return NextResponse.redirect(`${urlBase()}/${r.idioma}/guias/${r.guia}?recordatorio=ok#recordatorio`);
}
