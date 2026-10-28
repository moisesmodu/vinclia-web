import { db, hayBaseDeDatos } from "./db";
import { emailSesion } from "./sesion";

export function normalizarEmail(e: string): string {
  return e.trim().toLowerCase();
}

export function emailValido(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
}

export async function tieneAcceso(email: string | null): Promise<boolean> {
  if (!email || !hayBaseDeDatos()) return false;
  const u = await db.usuario.findUnique({ where: { email } });
  return Boolean(u?.accesoHasta && u.accesoHasta > new Date());
}

export async function accesoSesion(): Promise<{ email: string | null; acceso: boolean }> {
  const email = await emailSesion();
  return { email, acceso: await tieneAcceso(email) };
}
