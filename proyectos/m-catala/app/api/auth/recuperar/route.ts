import { db, hayDb } from '@/lib/db';
import { tokenRecuperacion } from '@/lib/auth';
import { enviarCorreo, hayCorreo } from '@/lib/correo';
import { json, error, limitar } from '@/lib/http';
import { urlBase } from '@/lib/datos';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  if (!(await limitar(req, 'recuperar', 3, 600_000))) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? '').trim().toLowerCase().slice(0, 200);
  const idioma = b?.idioma === 'es' ? 'es' : 'ca';
  if (!email) return json({ ok: true, correu: hayCorreo() });
  if (!(await limitar(req, 'recuperar-email', 3, 3600_000, email))) return error('massa peticions', 429);
  const u = await db.usuari.findUnique({ where: { email } });
  if (u && hayCorreo()) {
    const enlace = `${urlBase()}/${idioma}/entrar?token=${tokenRecuperacion(u)}`;
    await enviarCorreo(email, idioma === 'ca' ? 'Aprova: nova contrasenya' : 'Aprova: nueva contraseña', idioma === 'ca' ? `Per crear una contrasenya nova, obre aquest enllaç (caduca en 1 hora):\n${enlace}\n\nSi no ho has demanat tu, ignora aquest correu.` : `Para crear una contraseña nueva, abre este enlace (caduca en 1 hora):\n${enlace}\n\nSi no lo has pedido tú, ignora este correo.`);
  }
  return json({ ok: true, correu: hayCorreo() });
}
