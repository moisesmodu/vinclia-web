import { usuarioActual, estaSuscrito } from '@/lib/auth';
import { banco, preguntasAccesibles } from '@/lib/datos';
import { json, error } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Preguntas de una oposición: las gratuitas para todos; el banco completo solo con suscripción activa. */
export async function GET(req: Request) {
  const op = new URL(req.url).searchParams.get('op') ?? '';
  const b = banco(op);
  if (!b) return error('oposición desconocida', 404);
  const u = await usuarioActual().catch(() => null);
  const suscrito = estaSuscrito(u);
  return json({ suscrito, logueado: !!u, total: b.preguntas.length, preguntas: preguntasAccesibles(op, suscrito) });
}
