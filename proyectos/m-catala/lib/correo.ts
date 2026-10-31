import 'server-only';
import marca from '@/config/marca.json';

/** Correo transaccional con Resend (DESPLIEGUES.md §3.4). Sin RESEND_API_KEY no envía y devuelve false. Tiempo máximo 8 s. */
export const hayCorreo = () => !!process.env.RESEND_API_KEY;

export async function enviarCorreo(para: string, asunto: string, texto: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const de = process.env.CORREO_REMITENTE || `${marca.nombre} <noreply@numimates.com>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: de, to: [para], subject: asunto, text: texto, reply_to: process.env.LEGAL_EMAIL || 'hola@numimates.com' }),
      signal: AbortSignal.timeout(8000),
    });
    return r.ok;
  } catch (e) {
    console.error('correo', e);
    return false;
  }
}
