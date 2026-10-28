import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificar } from "@/lib/sesion";
import { urlBase } from "@/lib/config";

export const dynamic = "force-dynamic";

// Baja en un clic: borra el recordatorio y sus avisos.
export async function GET(req: Request) {
  const v = verificar<{ r: string; t: string }>(new URL(req.url).searchParams.get("t"));
  if (!v || v.t !== "b") return new NextResponse("Enlace no válido.", { status: 400 });
  const r = await db.recordatorio.findUnique({ where: { id: v.r } });
  if (r) await db.recordatorio.delete({ where: { id: r.id } });
  return NextResponse.redirect(`${urlBase()}/${r?.idioma ?? "es"}/baja`);
}
export const POST = GET; // List-Unsubscribe-Post
