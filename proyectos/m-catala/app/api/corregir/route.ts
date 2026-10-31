import { usuariActual, esPremium } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { corregir } from '@/lib/correccio';
import { tasca as tascaDe } from '@/lib/datos';
import { json, error, limitar, anonId, clauUs, consumirQuota } from '@/lib/http';
import pais from '@/config/paises/es.json';
import type { Nivell } from '@/lib/tipos';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Correcció escrita per criteris. Quota gratuïta: 3 al mes per persona (compte o navegador), consumida de manera atòmica al servidor.
 *  Exempcions (ja no les decideix el client): la correcció del diagnòstic, una vegada al mes (camp Us.diagnostics); la del simulacre,
 *  només si aquest mes s'ha iniciat un simulacre (Us.simulacres ≥ 1) i com a màxim 2 correccions per simulacre iniciat (Us.correccionsSim). */
export async function POST(req: Request) {
  if (!(await limitar(req, 'corregir', 12))) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const text = String(b?.text ?? '').trim();
  const nivell = (['B1', 'B2', 'C1', 'C2'].includes(b?.nivell) ? b.nivell : 'C1') as Nivell;
  const idiomaExpl = ['ca', 'es', 'en', 'ar', 'ro', 'fr'].includes(b?.idiomaExpl) ? b.idiomaExpl : 'ca';
  if (text.split(/\s+/).length < 15) return error('curt');
  if (text.length > 8000) return error('llarg', 413);
  const u = await usuariActual();
  const anon = await anonId();
  const premium = esPremium(u);
  const clau = clauUs(u?.id, anon);
  const context = b?.context === 'diagnostic' || b?.context === 'simulacre' ? (b.context as 'diagnostic' | 'simulacre') : null;
  let exempta = false;
  if (hayDb() && !premium) {
    if (context === 'diagnostic') exempta = await consumirQuota(clau, 'diagnostics', 1);
    else if (context === 'simulacre') {
      const us = await db.us.findUnique({ where: { clau } });
      if ((us?.simulacres ?? 0) > 0) exempta = await consumirQuota(clau, 'correccionsSim', (us?.simulacres ?? 0) * 2);
    }
    if (!exempta && !(await consumirQuota(clau, 'correccions', pais.gratis.correccionsMes))) return error('quota', 402);
  }
  const t = b?.tascaId ? tascaDe(String(b.tascaId)) ?? null : null;
  const r = await corregir(nivell, text, t, idiomaExpl);
  if (hayDb()) {
    try {
      await db.correccio.create({ data: { usuariId: u?.id ?? null, anonId: u ? null : anon, nivell, tascaId: t?.id ?? null, paraules: r.paraules, resultat: { nota: r.nota, criteris: r.criteris, motor: r.motor, errors: r.errors.length, context } as object, motor: r.motor, ms: r.ms, tokensIn: r.tokensIn, tokensOut: r.tokensOut } });
    } catch (e) { console.error('corregir: registre', e); }
  }
  return json(r);
}
