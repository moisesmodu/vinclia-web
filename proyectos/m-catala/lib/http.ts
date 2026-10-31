import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db, hayDb } from './db';
import { secreto } from './auth';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const error = (mensaje: string, status = 400) => json({ error: mensaje }, status);

export const ipDe = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';

/** Límite de peticiones persistente (tabla Limit, compartida entre instancias de Vercel). Sin DATABASE_URL (demo local), Map en memoria.
 *  `extra` añade una segunda dimensión (p. ej. el correo en el login), que se guarda como hash. Devuelve true si la petición pasa. */
const golpes = new Map<string, { n: number; finestra: number }>();
export async function limitar(req: Request, clave: string, max = 10, ventanaMs = 60_000, extra?: string): Promise<boolean> {
  const quien = extra ? `h:${crypto.createHash('sha256').update(extra).digest('hex').slice(0, 24)}` : ipDe(req);
  const k = `${clave}:${quien}`;
  const finestra = Math.floor(Date.now() / ventanaMs);
  if (hayDb()) {
    try {
      const filas = await db.$queryRaw<{ compte: number }[]>`
        INSERT INTO "Limit" ("clau", "finestra", "compte") VALUES (${k}, ${finestra}, 1)
        ON CONFLICT ("clau") DO UPDATE SET
          "compte" = CASE WHEN "Limit"."finestra" = ${finestra} THEN "Limit"."compte" + 1 ELSE 1 END,
          "finestra" = ${finestra}
        RETURNING "compte"`;
      const n = filas[0]?.compte ?? 1;
      if (n === 1 && Math.random() < 0.01) db.limit.deleteMany({ where: { finestra: { lt: finestra - 2 } } }).catch(() => {});
      return n <= max;
    } catch (e) {
      console.error('limitar: fallo de base de datos, se usa memoria', e);
    }
  }
  const g = golpes.get(k);
  if (!g || g.finestra !== finestra) { golpes.set(k, { n: 1, finestra }); if (golpes.size > 5000) golpes.clear(); return true; }
  g.n++;
  return g.n <= max;
}

/** Identificador anónimo del navegador (cookie técnica firmada `<id>.<hmac>`) para cuotas gratuitas y cohorte sin registro.
 *  Una cookie sin firma válida se descarta y se emite otra: el cliente no puede fabricarse ids a voluntad. */
const COOKIE_ANON = 'aprova_anon';
const firmaAnon = (id: string) => crypto.createHmac('sha256', secreto()).update(`anon|${id}`).digest('hex').slice(0, 24);
function leerAnon(valor: string | undefined): string | null {
  if (!valor) return null;
  const [id, mac] = valor.split('.');
  if (!id || !mac || !/^[a-f0-9]{24}$/.test(id) || mac.length !== 24) return null;
  const esperado = firmaAnon(id);
  return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(mac)) ? id : null;
}
export async function anonId(): Promise<string> {
  const c = await cookies();
  let id = leerAnon(c.get(COOKIE_ANON)?.value);
  if (!id) {
    id = crypto.randomBytes(12).toString('hex');
    try { c.set(COOKIE_ANON, `${id}.${firmaAnon(id)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 400 * 86400 }); } catch {}
  }
  return id;
}
/** Solo lee: true si la petición trae una cookie anónima con firma válida (sin emitir otra). */
export async function teAnonValid(): Promise<boolean> {
  return !!leerAnon((await cookies()).get(COOKIE_ANON)?.value);
}

export const mesActual = () => new Date().toISOString().slice(0, 7);
export const clauUs = (usuariId: string | undefined, anon: string) => `${usuariId ?? anon}:${mesActual()}`;

/** Consumo atómico de una cuota mensual en la tabla Us: incrementa `camp` solo si sigue por debajo de `limit`
 *  (UPDATE … WHERE camp < limit RETURNING). Devuelve true si se ha consumido. Dos peticiones concurrentes no pasan ambas. */
const CAMPS_US = ['correccions', 'simulacres', 'oralSegons', 'diagnostics', 'correccionsSim'] as const;
export type CampUs = (typeof CAMPS_US)[number];
export async function consumirQuota(clau: string, camp: CampUs, limit: number, quant = 1): Promise<boolean> {
  if (!CAMPS_US.includes(camp)) throw new Error('camp');
  if (limit <= 0 || quant <= 0) return false;
  const col = Prisma.raw(`"${camp}"`);
  const filas = await db.$queryRaw<{ v: number }[]>`
    INSERT INTO "Us" ("clau", ${col}, "actualitzat") VALUES (${clau}, ${quant}, now())
    ON CONFLICT ("clau") DO UPDATE SET ${col} = "Us".${col} + ${quant}, "actualitzat" = now()
    WHERE "Us".${col} < ${limit}
    RETURNING ${col} AS v`;
  return filas.length > 0;
}
/** Consumo sin tope (solo contabiliza), p. ej. para premium. */
export async function sumarUs(clau: string, camp: CampUs | 'ttsCaracters' | 'sttSegons', quant = 1): Promise<void> {
  await db.us.upsert({ where: { clau }, update: { [camp]: { increment: quant } }, create: { clau, [camp]: quant } });
}
