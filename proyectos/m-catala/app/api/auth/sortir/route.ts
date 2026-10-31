import { cerrarSesion, cerrarSesionTotal, usuariActual } from '@/lib/auth';
import { json } from '@/lib/http';
export const dynamic = 'force-dynamic';
/** Tanca la sessió d'aquest navegador; amb {tot:true}, la de tots els dispositius (incrementa sessioVersio). */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (b?.tot) { const u = await usuariActual(); if (u) { await cerrarSesionTotal(u.id); return json({ ok: true, tot: true }); } }
  await cerrarSesion();
  return json({ ok: true });
}
