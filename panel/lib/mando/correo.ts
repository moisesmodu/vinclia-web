import 'server-only';
import crypto from 'node:crypto';
import type { Correo } from './contenido';

// Envío por Resend. Solo envía de verdad en el despliegue de producción de Vercel (VERCEL_ENV=production) y si no
// está activada la simulación (PANEL_CORREO_MODO=simulacion). En local y en vistas previas siempre simula: no llama
// a la API, devuelve un id ficticio.
export const modoCorreo = (): 'real' | 'simulacion' =>
  process.env.VERCEL_ENV === 'production' && process.env.PANEL_CORREO_MODO !== 'simulacion' ? 'real' : 'simulacion';

export type ResultadoEnvio = { ok: true; id: string; simulado: boolean } | { ok: false; error: string };

export async function enviarPorResend(c: Correo): Promise<ResultadoEnvio> {
  if (modoCorreo() === 'simulacion') return { ok: true, id: `simulado_${crypto.randomUUID().slice(0, 8)}`, simulado: true };
  const clave = process.env.RESEND_API_KEY;
  if (!clave) return { ok: false, error: 'Falta la variable RESEND_API_KEY' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json',
        // Si la misma petición se repitiera (doble pulsación, reintento de red), Resend no la envía dos veces.
        'Idempotency-Key': `panel-${crypto.createHash('sha256').update(c.clave).digest('hex').slice(0, 32)}`,
      },
      body: JSON.stringify({ from: c.de, to: [c.para], reply_to: c.responderA, subject: c.asunto, text: c.texto }),
      cache: 'no-store', signal: AbortSignal.timeout(15_000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: `Resend ${r.status}: ${String(j?.message ?? j?.name ?? '').slice(0, 160)}` };
    return { ok: true, id: String(j.id ?? ''), simulado: false };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 160) : 'Error de red' };
  }
}
