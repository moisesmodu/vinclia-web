import { NextResponse } from "next/server";
import { configPais } from "@/lib/config";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// La visitante acepta la cookie de afiliación (consentimiento explícito).
export async function POST(req: Request) {
  const { codigo } = (await req.json().catch(() => ({}))) as { codigo?: string };
  const a = codigo ? await db.afiliado.findUnique({ where: { codigo } }) : null;
  if (!a?.activo) return NextResponse.json({ ok: false }, { status: 404 });
  const res = NextResponse.json({ ok: true, nombre: a.nombre });
  res.cookies.set("afiliado", a.codigo, { maxAge: configPais().afiliados.cookieDias * 86_400, httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
