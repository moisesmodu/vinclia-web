import { usuariActual, esPremium } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { BANC, convocatoria as convocatoriaDe } from '@/lib/datos';
import { json, error, anonId, teAnonValid, clauUs, limitar, consumirQuota, sumarUs, mesActual } from '@/lib/http';
import { NIVELLS } from '@/lib/tipos';
import pais from '@/config/paises/es.json';

export const dynamic = 'force-dynamic';

const AREES = ['us', 'lectura', 'co', 'escrit', 'oral'];
const nota01 = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 100;

/** Inici ({inici:true}): consumeix la quota mensual (1 gratis) de manera atòmica. Resultat: valida rangs i ids contra el banc i la config,
 *  exigeix la galeta anònima signada (o sessió) i, sense premium, que hi hagi hagut un inici aquest mes i no més resultats que inicis.
 *  Retorna la comparació amb la cohort de la mateixa convocatòria i nivell. */
export async function POST(req: Request) {
  if (!(await limitar(req, 'simulacre', 10))) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== 'object') return error('dades');
  const nivell = String(b.nivell ?? '');
  if (!(NIVELLS as string[]).includes(nivell)) return error('dades');
  const u = await usuariActual();
  if (!u && !b.inici && !(await teAnonValid())) return error('galeta', 401); // el resultat només s'accepta d'un navegador que ja té galeta signada
  const anon = await anonId();
  if (!hayDb()) return json({ guardat: false, cohort: null });
  const premium = esPremium(u);
  const clau = clauUs(u?.id, anon);
  if (b.inici) {
    if (premium) { await sumarUs(clau, 'simulacres', 1); return json({ ok: true }); }
    if (!(await consumirQuota(clau, 'simulacres', pais.gratis.simulacresMes))) return error('quota', 402);
    return json({ ok: true });
  }
  const simulacreId = String(b.simulacreId ?? '');
  const sim = BANC.simulacres.find((s) => s.id === simulacreId);
  if (!sim || sim.nivell !== nivell || !nota01(b.nota)) return error('dades');
  const convocatoria = b.convocatoria ? String(b.convocatoria) : null;
  if (convocatoria && !convocatoriaDe(convocatoria)) return error('dades');
  const arees: Record<string, number> = {};
  if (b.arees && typeof b.arees === 'object') for (const [k, v] of Object.entries(b.arees as Record<string, unknown>)) if (AREES.includes(k) && nota01(v)) arees[k] = Math.round((v as number) * 10) / 10;
  if (!premium) {
    const us = await db.us.findUnique({ where: { clau } });
    const inicis = us?.simulacres ?? 0;
    if (inicis < 1) return error('sense inici', 403);
    const desDe = new Date(`${mesActual()}-01T00:00:00Z`);
    const fets = await db.simulacre.count({ where: { ...(u ? { usuariId: u.id } : { anonId: anon }), data: { gte: desDe } } });
    if (fets >= inicis) return error('sense inici', 403);
  }
  await db.simulacre.create({ data: { usuariId: u?.id ?? null, anonId: u ? null : anon, nivell, convocatoria, simulacreId, nota: Math.round(b.nota * 10) / 10, arees, apte: !!b.apte } });
  return json({ guardat: true, cohort: await cohort(nivell, convocatoria, b.nota) });
}

export async function GET(req: Request) {
  if (!(await limitar(req, 'simulacre-cohort', 30))) return error('massa peticions', 429);
  const url = new URL(req.url);
  if (!hayDb()) return json({ cohort: null });
  const nivell = url.searchParams.get('nivell') ?? 'C1';
  if (!(NIVELLS as string[]).includes(nivell)) return error('dades');
  const nota = Number(url.searchParams.get('nota') ?? 0);
  return json({ cohort: await cohort(nivell, url.searchParams.get('convocatoria'), nota01(nota) ? nota : 0) });
}

async function cohort(nivell: string, convocatoria: string | null, nota: number) {
  const where = convocatoria ? { nivell, convocatoria } : { nivell };
  const n = await db.simulacre.count({ where });
  if (n < 5) return { n, percentil: null };
  const sota = await db.simulacre.count({ where: { ...where, nota: { lt: nota } } });
  return { n, percentil: Math.round((100 * sota) / n) };
}
