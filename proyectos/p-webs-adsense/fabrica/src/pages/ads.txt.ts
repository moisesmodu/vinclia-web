// ads.txt: obligatorio para que AdSense sirva anuncios sin restricciones. Vacío hasta tener cuenta.
import type { APIRoute } from 'astro';
import { anunciosActivos, pubId } from '../lib/sitio';
export const GET: APIRoute = () => new Response(anunciosActivos() ? `google.com, ${pubId()}, DIRECT, f08c47fec0942fa0\n` : '# Pendiente de la cuenta de AdSense\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
