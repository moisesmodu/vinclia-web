import { timingSafeEqual } from "node:crypto";

/** Acceso de administración (Moisés y la tarea programada): ADMIN_TOKEN por cabecera o ?t=. */
export function esAdmin(req: Request): boolean {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado || esperado.length < 16) return false;
  const url = new URL(req.url);
  const dado = req.headers.get("x-admin-token") ?? url.searchParams.get("t") ?? "";
  const a = Buffer.from(dado), b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function tokenValido(dado: string | undefined): boolean {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado || esperado.length < 16 || !dado) return false;
  const a = Buffer.from(dado), b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
