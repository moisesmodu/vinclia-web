import { NextResponse } from "next/server";
import { enviarAvisosPendientes } from "@/lib/recordatorios";
import { hayBaseDeDatos } from "@/lib/db";

export const dynamic = "force-dynamic";

// Vercel Cron (vercel.json) lo llama cada día a las 08:00 UTC con Authorization: Bearer $CRON_SECRET.
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  if (!hayBaseDeDatos()) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  return NextResponse.json(await enviarAvisosPendientes());
}
