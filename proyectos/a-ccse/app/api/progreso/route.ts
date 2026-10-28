import { db } from '@/lib/db';
import { usuarioActual } from '@/lib/auth';
import { esProgreso, fusionar, progresoVacio } from '@/lib/progreso';
import { cuerpo, error, ok } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await usuarioActual().catch(() => null);
  if (!u) return error('no_autenticado', 401);
  return ok(esProgreso(u.progreso) ? u.progreso : progresoVacio());
}

/** Recibe el progreso del navegador, lo fusiona con el guardado y devuelve el resultado. */
export async function PUT(req: Request) {
  const u = await usuarioActual().catch(() => null);
  if (!u) return error('no_autenticado', 401);
  const b = await cuerpo(req);
  if (!esProgreso(b)) return error('formato');
  if (JSON.stringify(b).length > 400_000) return error('demasiado_grande', 413);
  const actual = esProgreso(u.progreso) ? u.progreso : progresoVacio();
  const nuevo = fusionar(actual, b);
  await db().usuario.update({ where: { id: u.id }, data: { progreso: nuevo as object } });
  return ok(nuevo);
}
