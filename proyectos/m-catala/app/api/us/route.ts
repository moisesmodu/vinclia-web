import { usuariActual, esPremium } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { json, anonId, mesActual } from '@/lib/http';
import pais from '@/config/paises/es.json';

export const dynamic = 'force-dynamic';

/** Quotes gratuïtes del mes (servidor) per a la persona (compte o navegador anònim). */
export async function GET() {
  const u = await usuariActual();
  const clau = `${u?.id ?? (await anonId())}:${mesActual()}`;
  const us = hayDb() ? await db.us.findUnique({ where: { clau } }) : null;
  return json({ premium: esPremium(u), limits: pais.gratis, us: { correccions: us?.correccions ?? 0, simulacres: us?.simulacres ?? 0, oralSegons: us?.oralSegons ?? 0 } });
}
