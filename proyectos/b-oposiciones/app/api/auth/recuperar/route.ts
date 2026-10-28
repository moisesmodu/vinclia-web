import { db, hayDb } from '@/lib/db';
import { tokenRecuperacion } from '@/lib/auth';
import { enviarCorreo, hayCorreo } from '@/lib/correo';
import { urlBase } from '@/lib/datos';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Envía el enlace de recuperación. Responde siempre igual para no revelar qué correos tienen cuenta. */
export async function POST(req: Request) {
  if (!hayDb() || !hayCorreo()) return error('sin correo', 503);
  if (!limitar(req, 'recuperar', 3)) return error('demasiadas peticiones', 429);
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? '').trim().toLowerCase();
  const idioma = b?.idioma === 'es' ? 'es' : 'ca';
  const u = email ? await db.usuario.findUnique({ where: { email } }) : null;
  if (u) {
    const raiz = process.env.NODE_ENV === 'production' ? urlBase() : new URL(req.url).origin;
    const enlace = `${raiz}/${idioma}/recuperar?t=${tokenRecuperacion(u)}`;
    const ca = idioma === 'ca';
    await enviarCorreo(
      u.email,
      ca ? 'Canvia la teva contrasenya d\'Aprova' : 'Cambia tu contraseña de Aprova',
      ca
        ? `Hola,\n\nPer posar una contrasenya nova, obre aquest enllaç (caduca en 1 hora):\n${enlace}\n\nSi no ho has demanat tu, ignora aquest correu.\n\nAprova`
        : `Hola:\n\nPara poner una contraseña nueva, abre este enlace (caduca en 1 hora):\n${enlace}\n\nSi no lo has pedido tú, ignora este correo.\n\nAprova`,
    ).catch(() => false);
  }
  return json({ ok: true });
}
