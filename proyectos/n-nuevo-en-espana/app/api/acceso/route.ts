import { NextResponse } from "next/server";
import { db, hayBaseDeDatos } from "@/lib/db";
import { emailValido, normalizarEmail, tieneAcceso } from "@/lib/acceso";
import { firmar } from "@/lib/sesion";
import { enviar, plantilla } from "@/lib/correo";
import { dicc } from "@/lib/i18n";
import { esIdioma, urlBase } from "@/lib/config";

export const dynamic = "force-dynamic";

// Enlace mágico para entrar en otro dispositivo. Responde igual exista o no la cuenta (no revela correos).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizarEmail(String(body.email ?? ""));
  const idioma = esIdioma(String(body.idioma)) ? String(body.idioma) : "es";
  if (!emailValido(email)) return NextResponse.json({ error: "email" }, { status: 400 });
  if (hayBaseDeDatos() && (await tieneAcceso(email))) {
    const u = await db.usuario.findUnique({ where: { email } });
    const d = dicc(u?.idioma ?? idioma);
    const url = `${urlBase()}/api/acceso/verificar?t=${encodeURIComponent(firmar({ email, t: "m" }, 30 * 60))}&i=${idioma}`;
    const { html, texto } = plantilla({ idioma, titulo: d.correo.accesoAsunto, parrafos: [d.correo.accesoTexto], boton: { texto: d.acceso.boton, url }, pie: [d.aviso.corto] });
    await enviar({ para: email, asunto: d.correo.accesoAsunto, html, texto, idioma });
  }
  return NextResponse.json({ ok: true });
}
