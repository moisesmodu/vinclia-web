import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db, hayDb } from './db';
import { sincronizarSiHaceFalta } from './pagos';

const COOKIE = 'aprova_sesion';
const DIAS = 60;

/** Secreto de sesión: AUTH_SECRET si existe; si no, derivado de las claves que ya hay (así Moisés no tiene que crear otra). */
function secreto(): string {
  const base = process.env.AUTH_SECRET || `${process.env.DATABASE_URL ?? ''}|aprova`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

export function hashClave(clave: string): string {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(clave, sal, 64);
  return `scrypt$${sal.toString('hex')}$${h.toString('hex')}`;
}

export function comprobarClave(clave: string, guardado: string): boolean {
  const [alg, salHex, hHex] = guardado.split('$');
  if (alg !== 'scrypt' || !salHex || !hHex) return false;
  const h = crypto.scryptSync(clave, Buffer.from(salHex, 'hex'), 64);
  return crypto.timingSafeEqual(h, Buffer.from(hHex, 'hex'));
}

function firmar(valor: string): string {
  const mac = crypto.createHmac('sha256', secreto()).update(valor).digest('base64url');
  return `${valor}.${mac}`;
}

function leerFirmado(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const valor = token.slice(0, i);
  const esperado = firmar(valor);
  if (esperado.length !== token.length || !crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(token))) return null;
  const [id, caduca] = valor.split(':');
  if (!id || Number(caduca) < Date.now()) return null;
  return id;
}

export async function iniciarSesion(usuarioId: string) {
  const caduca = Date.now() + DIAS * 864e5;
  (await cookies()).set(COOKIE, firmar(`${usuarioId}:${caduca}`), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DIAS * 86400,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function usuarioActual() {
  if (!hayDb()) return null;
  const id = leerFirmado((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const u = await db.usuario.findUnique({ where: { id } });
  if (!u) return null;
  return sincronizarSiHaceFalta(u);
}

export type UsuarioSesion = NonNullable<Awaited<ReturnType<typeof usuarioActual>>>;

export function estaSuscrito(u: { suscripcionEstado: string | null; suscripcionHasta: Date | null } | null): boolean {
  if (!u?.suscripcionEstado) return false;
  const vivo = ['active', 'trialing', 'past_due', 'demo'].includes(u.suscripcionEstado) || (u.suscripcionEstado === 'canceled' && !!u.suscripcionHasta);
  return vivo && (!u.suscripcionHasta || u.suscripcionHasta.getTime() > Date.now());
}

/** Enlace de recuperación de contraseña: caduca en 1 hora y deja de valer en cuanto cambia la contraseña. */
export function tokenRecuperacion(u: { id: string; hash: string }): string {
  const caduca = Date.now() + 3600e3;
  const mac = crypto.createHmac('sha256', secreto()).update(`rec|${u.id}|${caduca}|${u.hash.slice(-16)}`).digest('base64url');
  return Buffer.from(`${u.id}:${caduca}:${mac}`).toString('base64url');
}

export async function usuarioDeToken(token: string) {
  try {
    const [id, caduca, mac] = Buffer.from(token, 'base64url').toString().split(':');
    if (!id || Number(caduca) < Date.now()) return null;
    const u = await db.usuario.findUnique({ where: { id } });
    if (!u) return null;
    const esperado = crypto.createHmac('sha256', secreto()).update(`rec|${u.id}|${caduca}|${u.hash.slice(-16)}`).digest('base64url');
    return esperado.length === mac.length && crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(mac)) ? u : null;
  } catch {
    return null;
  }
}
