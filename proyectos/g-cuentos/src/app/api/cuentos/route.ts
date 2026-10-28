import { NextResponse } from "next/server";
import { db, evento } from "@/lib/db";
import { generarTexto } from "@/lib/texto";
import { EsquemaDatos } from "@/lib/validacion";

export const runtime = "nodejs";
export const maxDuration = 60;

// Límite sencillo por IP (memoria del proceso): 8 borradores por hora.
const visitas = new Map<string, number[]>();
function permitido(ip: string) {
  const ahora = Date.now();
  const v = (visitas.get(ip) ?? []).filter((t) => ahora - t < 3_600_000);
  if (v.length >= 8) return false;
  visitas.set(ip, [...v, ahora]);
  return true;
}

export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || cuerpo.web) return NextResponse.json({ error: "petición no válida" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!permitido(ip)) return NextResponse.json({ error: "demasiadas vistas previas; espera un rato" }, { status: 429 });
  const r = EsquemaDatos.safeParse(cuerpo);
  if (!r.success) return NextResponse.json({ error: r.error.issues.map((i) => i.path.join(".") || i.message).join(", ") }, { status: 400 });
  const d = r.data;
  const { cuento, aviso } = await generarTexto(d);
  const p = await db.pedido.create({
    data: { idioma: d.idioma, coleccion: d.coleccion, tema: d.tema, genero: d.genero, datos: d, cuento: JSON.parse(JSON.stringify(cuento)) },
  });
  await evento("borrador", p.id, { fuente: cuento.fuente, aviso });
  return NextResponse.json({ id: p.id, idiomaWeb: cuerpo.idiomaWeb === "ca" ? "ca" : "es" });
}
