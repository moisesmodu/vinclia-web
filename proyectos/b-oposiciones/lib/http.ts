import 'server-only';
import { NextResponse } from 'next/server';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const error = (mensaje: string, status = 400) => json({ error: mensaje }, status);

/** Límite sencillo por IP en memoria (por instancia). Suficiente contra abusos básicos en formularios. */
const golpes = new Map<string, { n: number; desde: number }>();
export function limitar(req: Request, clave: string, max = 10, ventanaMs = 60_000): boolean {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const k = `${clave}:${ip}`;
  const ahora = Date.now();
  const g = golpes.get(k);
  if (!g || ahora - g.desde > ventanaMs) { golpes.set(k, { n: 1, desde: ahora }); return true; }
  g.n++;
  return g.n <= max;
}
