import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { codigoDesde } from "@/lib/afiliados";
import { URL_BASE } from "@/lib/config";
import { correoAfiliado, enviarCorreo } from "@/lib/correo";
import { db, evento } from "@/lib/db";

export const runtime = "nodejs";

const Esquema = z.object({
  nombre: z.string().trim().min(2).max(60), email: z.string().trim().email(), redSocial: z.string().trim().min(3).max(120),
  seguidores: z.string().trim().max(20).optional(), acepto: z.literal("on"), web: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  const r = Esquema.safeParse(await req.json().catch(() => ({})));
  if (!r.success) return NextResponse.json({ error: "Revisa los campos y acepta las condiciones" }, { status: 400 });
  const d = r.data;
  const existente = await db.afiliado.findUnique({ where: { email: d.email } });
  const a = existente ?? (await db.afiliado.create({
    data: { codigo: codigoDesde(d.nombre), nombre: d.nombre, email: d.email, redSocial: d.redSocial, seguidores: d.seguidores, token: randomBytes(18).toString("base64url") },
  }));
  const enlace = `${URL_BASE()}/r/${a.codigo}`;
  const panel = `${URL_BASE()}/afiliados/panel?t=${a.token}`;
  const c = correoAfiliado({ nombre: a.nombre, enlace, panel });
  await enviarCorreo(a.email, c.asunto, c.html, `afiliado-${a.codigo}`);
  await evento("afiliado-alta", undefined, { codigo: a.codigo, nueva: !existente });
  // Por seguridad, si el correo ya existía solo se reenvía el acceso por correo.
  return NextResponse.json(existente ? { reenviado: true } : { codigo: a.codigo, enlace, panel });
}
