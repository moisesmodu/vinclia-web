import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db, hayBaseDeDatos } from './db';

const scrypt = promisify(_scrypt) as (p: string, s: Buffer, n: number) => Promise<Buffer>;
const COOKIE = 'ccse_sesion';

function secreto() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === 'production') throw new Error('Falta AUTH_SECRET');
    return new TextEncoder().encode('desarrollo-solo-local-no-usar-en-produccion');
  }
  return new TextEncoder().encode(s);
}

export async function hashClave(clave: string) {
  const sal = randomBytes(16);
  const h = await scrypt(clave, sal, 64);
  return `scrypt$${sal.toString('base64')}$${h.toString('base64')}`;
}
export async function compararClave(clave: string, guardado: string) {
  const [alg, s, h] = guardado.split('$');
  if (alg !== 'scrypt' || !s || !h) return false;
  const esperado = Buffer.from(h, 'base64');
  const calc = await scrypt(clave, Buffer.from(s, 'base64'), esperado.length);
  return timingSafeEqual(esperado, calc);
}

export async function iniciarSesion(usuarioId: string) {
  const token = await new SignJWT({ sub: usuarioId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('180d')
    .sign(secreto());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 180,
  });
}
export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}
export async function usuarioIdActual(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secreto());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
export async function usuarioActual() {
  if (!hayBaseDeDatos()) return null;
  const id = await usuarioIdActual();
  if (!id) return null;
  return db().usuario.findUnique({ where: { id } });
}
export function tieneAcceso(u: { accesoHasta: Date | null } | null | undefined) {
  return !!u?.accesoHasta && u.accesoHasta.getTime() > Date.now();
}
export function emailValido(e: unknown): e is string {
  return typeof e === 'string' && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
