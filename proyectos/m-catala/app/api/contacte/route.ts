import { db, hayDb } from '@/lib/db';
import { json, error, limitar } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  if (!(await limitar(req, 'contacte', 5))) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const text = String(b?.text ?? '').trim().slice(0, 4000);
  if (text.length < 5) return error('text');
  if (!hayDb()) return json({ ok: true, guardat: false });
  await db.contacte.create({ data: { email: b?.email ? String(b.email).slice(0, 200) : null, text, tipus: String(b?.tipus ?? 'contacte').slice(0, 30) } });
  return json({ ok: true, guardat: true });
}
