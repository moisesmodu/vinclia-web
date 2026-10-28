'use client';
import type { Item, Nivell, Regla, TextCL } from '../tipos';

export type BancClient = { nivell: Nivell; premium: boolean; total: number; items: Item[]; regles: Record<string, Regla>; textos: TextCL[]; actualitzat: string };
const mem = new Map<string, BancClient>();

/** Banc del nivell (els ítems que toquen segons el pla). Es guarda en memòria i al navegador per funcionar sense connexió. */
export async function carregarBanc(nivell: Nivell): Promise<BancClient> {
  const m = mem.get(nivell);
  if (m) return m;
  const clau = `aprova:banc:${nivell}`;
  try {
    const r = await fetch(`/api/banc?nivell=${nivell}`);
    if (r.ok) { const j = (await r.json()) as BancClient; mem.set(nivell, j); try { localStorage.setItem(clau, JSON.stringify(j)); } catch {} return j; }
  } catch {}
  try { const raw = localStorage.getItem(clau); if (raw) { const j = JSON.parse(raw) as BancClient; mem.set(nivell, j); return j; } } catch {}
  return { nivell, premium: false, total: 0, items: [], regles: {}, textos: [], actualitzat: '' };
}
export const buidarBanc = () => mem.clear();
