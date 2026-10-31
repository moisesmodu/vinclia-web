import { usuariActual, esPremium } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { BANC, itemsDe } from '@/lib/datos';
import { json, error, limitar, anonId, clauUs } from '@/lib/http';
import { NIVELLS, type Item, type Nivell } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

/** Només el que el client necessita per practicar: fora els camps de gestió. */
const lleuger = ({ revisio: _r, ...i }: Item) => i; // els camps diagnostic/gratis els necessita el client per triar ítems

/** Ítems del nivell. Sense premium: els gratuïts i els del diagnòstic (prou per a la minisessió i el repàs); amb premium, tots.
 *  Amb ?simulacre=<id>: els ítems, textos i tasques d'aquest simulacre, només després d'un inici autoritzat (premium, o un simulacre
 *  iniciat aquest mes per aquesta persona a /api/simulacre {inici:true}). La resposta és privada: Cache-Control no-store i fora del SW. */
export async function GET(req: Request) {
  if (!(await limitar(req, 'banc', 30))) return error('massa peticions', 429);
  const u = await usuariActual();
  const premium = esPremium(u);
  const url = new URL(req.url);
  const simId = url.searchParams.get('simulacre');
  if (simId) {
    const sim = BANC.simulacres.find((s) => s.id === simId);
    if (!sim) return error('simulacre');
    if (!premium && hayDb()) { // sense base de dades (demo local) no hi ha quotes a comprovar
      const us = await db.us.findUnique({ where: { clau: clauUs(u?.id, await anonId()) } });
      if ((us?.simulacres ?? 0) < 1) return error('sense inici', 403);
    }
    const ids = new Set(sim.arees.us?.items ?? []);
    const textIds = new Set([...(sim.arees.co?.textos ?? []), ...(sim.arees.lectura?.textos ?? [])]);
    const tascaIds = [sim.arees.escrit?.tasca, ...(sim.arees.escrit?.tasques ?? [])].filter((x): x is string => !!x);
    return json({
      simulacre: sim.id, premium,
      items: BANC.items.filter((i) => ids.has(i.id)).map(lleuger),
      textos: Object.fromEntries(Object.entries(BANC.textos).filter(([id]) => textIds.has(id))),
      tasques: Object.fromEntries(tascaIds.map((id) => [id, BANC.tasques[id]]).filter(([, t]) => !!t)),
    });
  }
  const nivell = url.searchParams.get('nivell') ?? 'C1';
  if (!(NIVELLS as string[]).includes(nivell)) return error('nivell');
  const tot = itemsDe(nivell as Nivell);
  const items = (premium ? tot : tot.filter((i) => i.gratis || i.diagnostic)).map(lleuger);
  return json({ nivell, premium, total: tot.length, items, regles: BANC.regles, textos: Object.values(BANC.textos).filter((t) => t.nivell === nivell), actualitzat: BANC.actualitzat }, 200);
}
