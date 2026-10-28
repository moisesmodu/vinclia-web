import { db, hayDb } from '@/lib/db';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Mensajes de soporte: se guardan en la tabla Errata con oposicion = "contacto" y los contesta la tarea programada. */
export async function POST(req: Request) {
  if (!limitar(req, 'contacto', 5)) return error('demasiadas peticiones', 429);
  const f = await req.formData().catch(() => null);
  const email = String(f?.get('email') ?? '').trim().slice(0, 200);
  const texto = String(f?.get('texto') ?? '').trim().slice(0, 3000);
  const idioma = String(f?.get('idioma') ?? 'ca') === 'es' ? 'es' : 'ca';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || texto.length < 5) return error('faltan datos');
  if (hayDb()) await db.errata.create({ data: { oposicion: 'contacto', preguntaId: '-', texto, email } });
  return Response.redirect(new URL(`/${idioma}/contacto?enviado=1`, req.url), 303);
}
