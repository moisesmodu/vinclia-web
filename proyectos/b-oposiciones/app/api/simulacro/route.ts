import { usuarioActual } from '@/lib/auth';
import { db } from '@/lib/db';
import { banco } from '@/lib/datos';
import { json, error } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Guarda el resultado de un simulacro y devuelve el percentil frente a los demás simulacros de esa oposición. */
export async function POST(req: Request) {
  const u = await usuarioActual();
  if (!u) return error('sin sesión', 401);
  const b = await req.json().catch(() => null);
  if (!b || !banco(b.op)) return error('datos inválidos');
  const nota = Number(b.nota);
  if (!Number.isFinite(nota)) return error('nota inválida');
  await db.simulacro.create({ data: { usuarioId: u.id, oposicion: b.op, nota, aciertos: b.aciertos | 0, fallos: b.fallos | 0, blancos: b.blancos | 0 } });
  const [peores, total] = await Promise.all([
    db.simulacro.count({ where: { oposicion: b.op, nota: { lt: nota } } }),
    db.simulacro.count({ where: { oposicion: b.op } }),
  ]);
  return json({ percentil: total >= 5 ? Math.round((peores / total) * 100) : null, total });
}
