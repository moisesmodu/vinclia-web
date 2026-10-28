import { cerrarSesion } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  await cerrarSesion();
  const idioma = new URL(req.url).searchParams.get('idioma') === 'es' ? 'es' : 'ca';
  return Response.redirect(new URL(`/${idioma}`, req.url), 303);
}
