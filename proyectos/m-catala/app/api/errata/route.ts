import { db, hayDb } from '@/lib/db';
import { json, error, limitar } from '@/lib/http';
export const dynamic = 'force-dynamic';
/** Botó «Informar d'un error» de cada ítem: la tasca setmanal els revisa. */
export async function POST(req: Request) {
  if (!limitar(req, 'errata', 10)) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const itemId = String(b?.itemId ?? '').slice(0, 60);
  const text = String(b?.text ?? '').trim().slice(0, 2000);
  if (!itemId || text.length < 3) return error('dades');
  if (!hayDb()) return json({ ok: true, guardat: false });
  await db.contacte.create({ data: { email: b?.email ? String(b.email).slice(0, 200) : null, text: `[${itemId}] ${text}`, tipus: 'errata' } });
  return json({ ok: true, guardat: true });
}
