import { usuariActual, esPremium, estatAcces } from '@/lib/auth';
import { hayDb } from '@/lib/db';
import { json } from '@/lib/http';
import { modoPago, esModoPrueba } from '@/lib/pagos';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await usuariActual();
  return json({
    usuari: u ? { email: u.email, premium: esPremium(u), acces: estatAcces(u), provaFins: u.provaFins, estat: u.subscripcioEstat, fins: u.subscripcioFins, pla: u.pla, cancelaAlFinal: u.cancelaAlFinal, nivell: u.nivell, convocatoria: u.convocatoria } : null,
    pagaments: modoPago(), prova: esModoPrueba(), db: hayDb(),
  });
}
