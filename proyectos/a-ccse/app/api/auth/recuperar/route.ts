import { randomBytes } from 'node:crypto';
import { db, hayBaseDeDatos } from '@/lib/db';
import { cuerpo, error, ok } from '@/lib/http';
import { PAIS, SITE_URL, esLocale } from '@/lib/config';

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
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CORREO_REMITENTE || `${PAIS.producto} <noreply@algorithmicslleida.com>`,
        to: email,
        subject: `${PAIS.producto}: cambia tu contraseña`,
        text: `Para elegir una contraseña nueva abre este enlace (caduca en 1 hora):\n${enlace}\n\nSi no lo has pedido tú, ignora este correo.`,
      }),
    }).catch((e) => console.error('Resend', e));
  }
  return ok({ ok: true });
}
