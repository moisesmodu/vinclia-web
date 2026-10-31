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
  // En Vercel el disco es efímero: sin Blob los PDF se perderían y la imprenta no podría descargarlos.
  if (process.env.VERCEL) throw new Error("Falta BLOB_READ_WRITE_TOKEN: conecta un Blob store al proyecto en Vercel");
  const destino = path.join(LOCAL, clave);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, datos);
  return `${URL_BASE()}/api/archivo/${clave}`;
}

/** Lee un archivo guardado (URL de Blob, URL local o ruta pública /muestras/...). */
export async function leer(url: string): Promise<Buffer> {
  const local = url.match(/\/api\/archivo\/(.+)$/);
  if (local) return readFile(rutaLocal(decodeURIComponent(local[1])));
  if (url.startsWith("/")) return readFile(dentroDe(path.join(process.cwd(), "public"), url));
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo leer ${url}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

function dentroDe(base: string, rel: string) {
  const p = path.resolve(base, `.${path.sep}${rel}`);
  const r = path.relative(base, p);
  if (!r || r.startsWith("..") || path.isAbsolute(r)) throw new Error("ruta no válida");
  return p;
}

export function rutaLocal(clave: string) {
  return dentroDe(LOCAL, clave);
}
