import { db, hayDb } from '@/lib/db';
import { comprovarFirmaBaixa } from '@/lib/auth';
import { limitar } from '@/lib/http';
export const dynamic = 'force-dynamic';

const pagina = (titol: string, text: string, status = 200) =>
  new Response(`<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titol}</title><style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5}</style></head><body><h1>${titol}</h1><p>${text}</p><p><a href="/ca">Aprova</a></p></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

/** Baixa de les alertes en un clic des del correu: /api/alerta/baixa?e=<email>&t=<firma>. La firma (HMAC amb AUTH_SECRET) evita que ningú
 *  doni de baixa un tercer. Resposta en català i castellà (sense i18n: no passa pel layout). */
export async function GET(req: Request) {
  if (!(await limitar(req, 'alerta-baixa', 20))) return pagina('Massa peticions', 'Torna-ho a provar d\'aquí a un minut. / Vuelve a intentarlo dentro de un minuto.', 429);
  const u = new URL(req.url);
  const email = (u.searchParams.get('e') ?? '').trim().toLowerCase().slice(0, 200);
  const t = u.searchParams.get('t') ?? '';
  if (!email || !t || !comprovarFirmaBaixa(email, t)) return pagina('Enllaç no vàlid', 'L\'enllaç de baixa no és correcte. Escriu-nos des de la pàgina Contacte. / El enlace de baja no es correcto. Escríbenos desde la página Contacto.', 400);
  if (hayDb()) await db.alerta.deleteMany({ where: { email } });
  return pagina('Baixa feta', `No t'enviarem més avisos de convocatòria a ${email}. / No te enviaremos más avisos de convocatoria a ${email}.`);
}
