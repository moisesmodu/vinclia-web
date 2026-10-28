import 'server-only';
import { PAIS } from './config';

/** Correo de contacto (aviso legal, respuesta, Stripe): LEGAL_EMAIL o hola@numimates.com (SESIONES.md «Correo de contacto»). */
export const correoContacto = () => process.env.LEGAL_EMAIL?.trim() || 'hola@numimates.com';
const remitente = () => process.env.CORREO_REMITENTE?.trim() || `${PAIS.producto} <noreply@numimates.com>`;

/** Envía un correo con Resend. Devuelve false (sin lanzar) si no hay clave o falla. */
export async function enviarCorreo(o: { para: string; asunto: string; texto: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: remitente(), to: o.para, reply_to: correoContacto(), subject: o.asunto, text: o.texto }),
    });
    return r.ok;
  } catch (e) {
    console.error('Resend', e);
    return false;
  }
}
