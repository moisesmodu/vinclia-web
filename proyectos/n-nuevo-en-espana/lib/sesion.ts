import crypto from "node:crypto";
import { cookies } from "next/headers";

// Tokens firmados con HMAC: sirven para la cookie de sesión y para los enlaces de los correos.
// Sin contraseñas: se entra con el correo de pago (enlace mágico) o al volver de Stripe.

const COOKIE = "nee_sesion";

function secreto(): string {
  const s = process.env.SECRETO_SESION;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("Falta SECRETO_SESION");
    return "secreto-de-desarrollo-no-usar-en-produccion";
  }
  return s;
}

export function firmar(datos: Record<string, unknown>, segundos: number): string {
  const cuerpo = Buffer.from(JSON.stringify({ ...datos, exp: Math.floor(Date.now() / 1000) + segundos })).toString("base64url");
  const firma = crypto.createHmac("sha256", secreto()).update(cuerpo).digest("base64url");
  return `${cuerpo}.${firma}`;
}

export function verificar<T = Record<string, unknown>>(token: string | undefined | null): (T & { exp: number }) | null {
  if (!token) return null;
  const [cuerpo, firma] = token.split(".");
  if (!cuerpo || !firma) return null;
  const esperada = crypto.createHmac("sha256", secreto()).update(cuerpo).digest("base64url");
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
    if (typeof datos.exp !== "number" || datos.exp < Date.now() / 1000) return null;
    return datos;
  } catch {
    return null;
  }
}

const DIAS_SESION = 400;

export async function abrirSesion(email: string) {
  const c = await cookies();
  c.set(COOKIE, firmar({ email, t: "s" }, DIAS_SESION * 86400), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: DIAS_SESION * 86400
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function emailSesion(): Promise<string | null> {
  const v = verificar<{ email: string; t: string }>((await cookies()).get(COOKIE)?.value);
  return v && v.t === "s" ? v.email : null;
}
