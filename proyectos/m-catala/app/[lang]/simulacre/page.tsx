import Link from 'next/link';
import { esIdioma, t } from '@/lib/i18n';
import { BANC, examens, nivellsActius } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/simulacre', d.simulacre.titol, d.simulacre.text); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).simulacre;
  return (
    <div className="contenedor py-6">
      <h1>{d.titol}</h1>
      <p className="mt-2 max-w-[48ch] text-[15px] text-secundari">{d.text}</p>
      <p className="mt-2 max-w-[48ch] text-[15px] font-semibold">{t(idioma).nou.nomesEscrita}</p>
      {nivellsActius().map((n) => { const e = examens[n]; const sims = BANC.simulacres.filter((s) => s.nivell === n); return (
        <section key={n} className="mt-8">
          <h2 className="text-[22px]">{e.nom[idioma]}</h2>
          <p className="mt-1 text-[13px] text-secundari">{e.arees.filter((a) => a.id !== 'oral' && a.id !== 'co').map((a) => `${a.nom[idioma].replace(/^Àrea \d · |^Área \d · /, '')} · ${a.minuts} min`).join(' · ')}</p>
          <ul className="mt-3 divide-y divide-linia border-y border-linia">
            {sims.map((sim) => <li key={sim.id}><Link href={`/${idioma}/simulacre/${sim.id}`} className="group flex items-center justify-between gap-4 py-3 no-underline"><span><span className="block text-[17px] font-bold group-hover:text-boli">{sim.nom}</span><span className="mt-0.5 block text-[14px] text-secundari">{sim.arees.us?.items.length ?? 0} ítems · {idioma === 'ca' ? 'expressió escrita' : 'expresión escrita'}</span></span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-terciari group-hover:text-boli"><path d="M9 6l6 6-6 6" /></svg></Link></li>)}
          </ul>
        </section>); })}
    </div>
  );
}
