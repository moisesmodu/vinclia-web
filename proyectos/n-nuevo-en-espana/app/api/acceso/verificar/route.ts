import { NextResponse } from "next/server";
import { verificar, abrirSesion } from "@/lib/sesion";
import { esIdioma, urlBase } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const idioma = esIdioma(u.searchParams.get("i") ?? "") ? u.searchParams.get("i")! : "es";
  const v = verificar<{ email: string; t: string }>(u.searchParams.get("t"));
  if (!v || v.t !== "m") return NextResponse.redirect(`${urlBase()}/${idioma}/acceso?caducado=1`);
  await abrirSesion(v.email);
  return NextResponse.redirect(`${urlBase()}/${idioma}/cuenta`);
}
