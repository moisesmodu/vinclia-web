import { randomBytes } from 'node:crypto';
import { db, hayBaseDeDatos } from '@/lib/db';
import { cuerpo, error, ok } from '@/lib/http';
import { SITE_URL, esLocale } from '@/lib/config';
import { enviarCorreo } from '@/lib/correo';

/** Envía un enlace para cambiar la contraseña. Requiere RESEND_API_KEY; responde igual exista o no la cuenta. */
export async function POST(req: Request) {
  if (!hayBaseDeDatos()) return error('sin_base_de_datos', 503);
  if (!process.env.RESEND_API_KEY) return error('correo_no_configurado', 503);
  const b = await cuerpo<{ email: string; locale: string }>(req);
  const email = String(b.email ?? '').trim().toLowerCase();
  const locale = esLocale(b.locale) ? b.locale : 'es';
  const u = await db().usuario.findUnique({ where: { email } });
  if (u) {
    const token = randomBytes(24).toString('base64url');
    await db().tokenClave.create({ data: { token, usuarioId: u.id, caduca: new Date(Date.now() + 3600_000) } });
    const enlace = `${SITE_URL}/${locale}/cuenta?token=${token}`;
    await enviarCorreo({
      para: email,
      asunto: 'Cambia tu contraseña de CCSE en tu idioma',
      texto: `Para elegir una contraseña nueva abre este enlace (caduca en 1 hora):\n${enlace}\n\nSi no lo has pedido tú, ignora este correo.`,
    });
  }
  return ok({ ok: true });
}
