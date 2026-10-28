import { db, hayDb } from '@/lib/db';
import { json, error, limitar } from '@/lib/http';
export const dynamic = 'force-dynamic';
/** Alerta per correu de la finestra d'inscripció (calendari 2027). La tasca setmanal envia els avisos. */
export async function POST(req: Request) {
  if (!limitar(req, 'alerta', 5)) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? '').trim().toLowerCase();
  const nivell = String(b?.nivell ?? '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !['B1', 'B2', 'C1', 'C2'].includes(nivell)) return error('dades');
  if (!hayDb()) return error('Base de dades no configurada', 503);
  await db.alerta.upsert({ where: { email_nivell: { email, nivell } }, update: { idioma: b?.idioma === 'es' ? 'es' : 'ca' }, create: { email, nivell, idioma: b?.idioma === 'es' ? 'es' : 'ca' } });
  return json({ ok: true });
}
