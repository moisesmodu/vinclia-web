import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db, hayDb } from './db';
import { sincronitzarSiCal } from './pagos';

const COOKIE = 'aprova_sessio';
/** Galeta llegible pel client (sense dades) que només diu «hi ha sessió»: evita cridar /api/progres sense sessió. */
export const COOKIE_FLAG = 'aprova_te_sessio';
const DIAS = 60;

const enProduccion = () => process.env.NODE_ENV === 'production';
const enBuild = () => process.env.NEXT_PHASE === 'phase-production-build';

// AUTH_SECRET es obligatorio en producción: sin él fallamos al arrancar (no durante `next build`, que no sirve peticiones).
if (enProduccion() && !enBuild() && !process.env.AUTH_SECRET) {
  throw new Error('Falta AUTH_SECRET: en producción es obligatorio (32+ caracteres aleatorios). Ver DESPLIEGUE.md.');
}

/** Secreto de sesión/cookies/enlaces firmados: AUTH_SECRET (obligatorio en producción); en desarrollo, derivado de DATABASE_URL. */
export function secreto(): string {
  if (!process.env.AUTH_SECRET && enProduccion()) throw new Error('Falta AUTH_SECRET en producción');
  const base = process.env.AUTH_SECRET || `${process.env.DATABASE_URL ?? ''}|aprova`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

export function hashClave(clave: string): string {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(clave, sal, 64);
  return `scrypt$${sal.toString('hex')}$${h.toString('hex')}`;
}

export function comprobarClave(clave: string, guardado: string): boolean {
  try {
    const [alg, salHex, hHex] = guardado.split('$');
    if (alg !== 'scrypt' || !salHex || !hHex) return false;
    const h = crypto.scryptSync(clave, Buffer.from(salHex, 'hex'), 64);
    const g = Buffer.from(hHex, 'hex');
    return h.length === g.length && crypto.timingSafeEqual(h, g);
  } catch {
    return false;
  }
}

/** Hash fijo para que el login tarde lo mismo exista o no el correo (evita enumerar cuentas por tiempo). */
const HASH_FICTICIO = hashClave('aprova-ficticio');
export const comprobarClaveFicticia = (clave: string) => { comprobarClave(clave, HASH_FICTICIO); return false; };

function firmar(valor: string): string {
  const mac = crypto.createHmac('sha256', secreto()).update(valor).digest('base64url');
  return `${valor}.${mac}`;
}

function leerFirmado(token: string | undefined): { id: string; versio: number } | null {
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const valor = token.slice(0, i);
  const esperado = firmar(valor);
  if (esperado.length !== token.length || !crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(token))) return null;
  const [id, caduca, versio] = valor.split(':');
  if (!id || Number(caduca) < Date.now() || versio === undefined) return null;
  return { id, versio: Number(versio) };
}

const opcionesCookie = (httpOnly: boolean) => ({ httpOnly, sameSite: 'lax' as const, secure: enProduccion(), path: '/', maxAge: DIAS * 86400 });

export async function iniciarSesion(usuariId: string, sessioVersio = 0) {
  const caduca = Date.now() + DIAS * 864e5;
  const c = await cookies();
  c.set(COOKIE, firmar(`${usuariId}:${caduca}:${sessioVersio}`), opcionesCookie(true));
  c.set(COOKIE_FLAG, '1', opcionesCookie(false));
}

export async function cerrarSesion() {
  const c = await cookies();
  c.delete(COOKIE);
  c.delete(COOKIE_FLAG);
}

/** Cierra la sesión en todos los dispositivos: los tokens llevan la versión y dejan de valer al incrementarla. */
export async function cerrarSesionTotal(usuariId: string) {
  await db.usuari.update({ where: { id: usuariId }, data: { sessioVersio: { increment: 1 } } });
  await cerrarSesion();
}

export async function usuariActual() {
  if (!hayDb()) return null;
  const s = leerFirmado((await cookies()).get(COOKIE)?.value);
  if (!s) return null;
  const u = await db.usuari.findUnique({ where: { id: s.id } });
  if (!u || u.sessioVersio !== s.versio) return null;
  return sincronitzarSiCal(u);
}

export type UsuariSessio = NonNullable<Awaited<ReturnType<typeof usuariActual>>>;

export function esPremium(u: { subscripcioEstat: string | null; subscripcioFins: Date | null } | null): boolean {
  if (!u?.subscripcioEstat) return false;
  const viu = ['active', 'trialing', 'past_due', 'demo', 'passi'].includes(u.subscripcioEstat) || (u.subscripcioEstat === 'canceled' && !!u.subscripcioFins);
  return viu && (!u.subscripcioFins || u.subscripcioFins.getTime() > Date.now());
}

/** Enlace de recuperación de contraseña: caduca en 1 hora y deja de valer en cuanto cambia la contraseña. */
export function tokenRecuperacion(u: { id: string; hash: string }): string {
  const caduca = Date.now() + 3600e3;
  const mac = crypto.createHmac('sha256', secreto()).update(`rec|${u.id}|${caduca}|${u.hash.slice(-16)}`).digest('base64url');
  return Buffer.from(`${u.id}:${caduca}:${mac}`).toString('base64url');
}

export async function usuariDeToken(token: string) {
  try {
    const [id, caduca, mac] = Buffer.from(token, 'base64url').toString().split(':');
    if (!id || Number(caduca) < Date.now()) return null;
    const u = await db.usuari.findUnique({ where: { id } });
    if (!u) return null;
    const esperado = crypto.createHmac('sha256', secreto()).update(`rec|${u.id}|${caduca}|${u.hash.slice(-16)}`).digest('base64url');
    return esperado.length === mac.length && crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(mac)) ? u : null;
  } catch {
    return null;
  }
}

/** Firma del enlace de baja de alertas (/api/alerta/baixa?e=<email>&t=<firma>). No caduca: el correo puede abrirse meses después. */
export function firmaBaixa(email: string): string {
  return crypto.createHmac('sha256', secreto()).update(`baixa|${email.trim().toLowerCase()}`).digest('base64url').slice(0, 32);
}
export function comprovarFirmaBaixa(email: string, t: string): boolean {
  const esperado = firmaBaixa(email);
  return esperado.length === t.length && crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(t));
}
/** URL completa de baja para incluir en cada correo de alerta (la tarea semanal la usa). */
export const enllacBaixa = (base: string, email: string) => `${base.replace(/\/$/, '')}/api/alerta/baixa?e=${encodeURIComponent(email.trim().toLowerCase())}&t=${firmaBaixa(email)}`;
