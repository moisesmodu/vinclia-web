import { db, hayDb } from '@/lib/db';
import { usuarioActual } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!limitar(req, 'errata', 10)) return error('demasiadas peticiones', 429);
  const b = await req.json().catch(() => null);
  const texto = String(b?.texto ?? '').trim().slice(0, 1000);
  if (!b?.op || !b?.id || texto.length < 5) return error('faltan datos');
  if (!hayDb()) return json({ ok: true, guardado: false });
  const u = await usuarioActual().catch(() => null);
  await db.errata.create({ data: { oposicion: String(b.op).slice(0, 80), preguntaId: String(b.id).slice(0, 80), texto, email: u?.email } });
  return json({ ok: true });
}
