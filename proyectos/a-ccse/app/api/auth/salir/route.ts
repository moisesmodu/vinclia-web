import { cerrarSesion } from '@/lib/auth';
import { ok } from '@/lib/http';
export async function POST() {
  await cerrarSesion();
  return ok({ ok: true });
}
