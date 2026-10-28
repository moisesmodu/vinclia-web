import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { URL_BASE } from "./config";

// Vercel Blob en producción (BLOB_READ_WRITE_TOKEN); disco local en desarrollo y pruebas.
const LOCAL = path.join(process.cwd(), "datos-locales", "almacen");

export async function guardar(clave: string, datos: Buffer | Uint8Array, tipo: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const r = await put(clave, Buffer.from(datos), { access: "public", contentType: tipo, addRandomSuffix: true });
    return r.url;
  }
  const destino = path.join(LOCAL, clave);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, datos);
  return `${URL_BASE()}/api/archivo/${clave}`;
}

/** Lee un archivo guardado (URL de Blob, URL local o ruta pública /muestras/...). */
export async function leer(url: string): Promise<Buffer> {
  const local = url.match(/\/api\/archivo\/(.+)$/);
  if (local) return readFile(path.join(LOCAL, local[1]));
  if (url.startsWith("/")) return readFile(path.join(process.cwd(), "public", url));
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo leer ${url}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export function rutaLocal(clave: string) {
  const p = path.normalize(path.join(LOCAL, clave));
  if (!p.startsWith(LOCAL)) throw new Error("ruta no válida");
  return p;
}
