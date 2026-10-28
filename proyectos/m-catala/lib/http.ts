import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';

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

/** Identificador anónimo del navegador (cookie técnica) para cuotas gratuitas y cohorte sin registro. */
export async function anonId(): Promise<string> {
  const c = await cookies();
  let id = c.get('aprova_anon')?.value;
  if (!id || !/^[a-f0-9]{24}$/.test(id)) {
    id = crypto.randomBytes(12).toString('hex');
    try { c.set('aprova_anon', id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 400 * 86400 }); } catch {}
  }
  return id;
}

export const mesActual = () => new Date().toISOString().slice(0, 7);
