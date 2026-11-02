import { NextResponse } from "next/server";
import { db, hayBaseDeDatos } from "@/lib/db";
import { accesoSesion, emailValido, normalizarEmail } from "@/lib/acceso";
import { esGratis, guia } from "@/lib/contenido";
import { esIdioma } from "@/lib/config";
import { crearRecordatorio } from "@/lib/recordatorios";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hayBaseDeDatos()) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const email = normalizarEmail(String(b.email ?? ""));
  const slug = String(b.guia ?? "");
  const idioma = esIdioma(String(b.idioma)) ? String(b.idioma) : "es";
  const fecha = new Date(`${String(b.fecha ?? "")}T00:00:00Z`);
  if (!emailValido(email) || b.consentimiento !== true || isNaN(fecha.getTime()) || !guia(slug, idioma)) {
    return NextResponse.json({ error: "datos" }, { status: 400 });
  }
  const anios = (fecha.getTime() - Date.now()) / (365 * 86400 * 1000);
  if (anios > 15 || anios < -15) return NextResponse.json({ error: "fecha" }, { status: 400 });
  if (!esGratis(slug) && !(await accesoSesion()).acceso) return NextResponse.json({ error: "pago" }, { status: 402 });
  // Límite anti-abuso: como mucho 5 recordatorios nuevos por correo y día (cada uno envía un correo de confirmación).
  const recientes = await db.recordatorio.count({ where: { usuario: { email }, creado: { gte: new Date(Date.now() - 864e5) } } });
  if (recientes >= 5) return NextResponse.json({ error: "límite" }, { status: 429 });
  await crearRecordatorio({ email, guia: slug, idioma, fechaClave: fecha });
  return NextResponse.json({ ok: true });
}
