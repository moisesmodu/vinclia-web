import { usuariActual, esPremium } from '@/lib/auth';
import { BANC, itemsDe } from '@/lib/datos';
import { json } from '@/lib/http';
import type { Nivell } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

/** Ítems del nivell. Sense premium: els gratuïts i els del diagnòstic (prou per a la minisessió i el repàs); amb premium, tots. */
export async function GET(req: Request) {
  const u = await usuariActual();
  const premium = esPremium(u);
  const url = new URL(req.url);
  const nivell = (url.searchParams.get('nivell') ?? 'C1') as Nivell;
  const tot = itemsDe(nivell);
  const items = premium ? tot : tot.filter((i) => i.gratis || i.diagnostic);
  const regles = Object.fromEntries(Object.entries(BANC.regles));
  return json({ nivell, premium, total: tot.length, items, regles, textos: Object.values(BANC.textos).filter((t) => t.nivell === nivell), actualitzat: BANC.actualitzat }, 200);
}
