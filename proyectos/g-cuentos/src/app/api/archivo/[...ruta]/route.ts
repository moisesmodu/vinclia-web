import { readFile } from "node:fs/promises";
import { rutaLocal } from "@/lib/almacen";

export const runtime = "nodejs";

// Solo para desarrollo y pruebas (sin Vercel Blob): sirve los archivos del almacén local.
export async function GET(_: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return new Response("no disponible", { status: 404 });
  const { ruta } = await params;
  try {
    const buf = await readFile(rutaLocal(ruta.join("/")));
    const tipo = ruta.at(-1)!.endsWith(".pdf") ? "application/pdf" : ruta.at(-1)!.endsWith(".png") ? "image/png" : "application/octet-stream";
    return new Response(new Uint8Array(buf), { headers: { "content-type": tipo } });
  } catch {
    return new Response("no encontrado", { status: 404 });
  }
}
