import { NextResponse } from "next/server";
import { URL_BASE } from "@/lib/config";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Enlace de afiliada: cuenta el clic y lleva a la portada con ?ref=código (?a=ca para catalán).
// La cookie solo se guarda si la visitante acepta el aviso (BannerAfiliado → /api/afiliados/aceptar).
export async function GET(req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const destino = new URL(req.url).searchParams.get("a") === "ca" ? "/ca" : "/";
  const a = await db.afiliado.findUnique({ where: { codigo } }).catch(() => null);
  if (!a?.activo) return NextResponse.redirect(`${URL_BASE()}${destino}`, 302);
  await db.afiliado.update({ where: { codigo }, data: { clics: { increment: 1 } } });
  return NextResponse.redirect(`${URL_BASE()}${destino}?ref=${encodeURIComponent(codigo)}`, 302);
}
