import Link from 'next/link';
import { esIdioma, t } from '@/lib/i18n';
import { BANC, examens, nivellsActius } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).simulacre;
  return <div className="contenedor py-6"><h1>{d.titol}</h1><p className="mt-2 max-w-[48ch] text-[15px] text-secundari">{d.text}</p>{nivellsActius().map((n) => <section key={n} className="mt-6"><h2 className="text-lg font-bold">{examens[n].nom[idioma]}</h2><p className="text-xs text-secundari">{examens[n].arees.filter((a) => a.part === 'escrita').map((a) => `${a.nom[idioma]} · ${a.minuts} min`).join(' · ')}</p><div className="mt-2 grid gap-2">{BANC.simulacres.filter((s) => s.nivell === n).map((s) => <Link key={s.id} href={`/${idioma}/simulacre/${s.id}`} className="full no-underline hover:border-tinta"><p className="text-[17px] font-semibold">{s.nom}</p><p className="mt-1 text-[13px] text-terciari">{s.arees.us?.items.length ?? 0} ítems · {idioma === 'ca' ? 'expressió escrita' : 'expresión escrita'}{(s as { complet?: boolean }).complet === false ? ` · ${d.incomplet}` : ''}</p></Link>)}</div></section>)}</div>;
}
