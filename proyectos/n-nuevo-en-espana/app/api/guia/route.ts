import { NextResponse } from "next/server";
import { guia, esGratis } from "@/lib/contenido";
import { accesoSesion } from "@/lib/acceso";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const slug = u.searchParams.get("slug") ?? "";
  const idioma = u.searchParams.get("idioma") ?? "es";
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "slug" }, { status: 400 });
  const r = guia(slug, idioma);
  if (!r) return NextResponse.json({ error: "no existe" }, { status: 404 });
  if (!esGratis(slug)) {
    const { acceso } = await accesoSesion();
    if (!acceso) return NextResponse.json({ error: "sin acceso" }, { status: 401 });
  }
  return NextResponse.json({ guia: r.guia, idiomaContenido: r.idiomaContenido }, { headers: { "Cache-Control": "private, no-store" } });
}
