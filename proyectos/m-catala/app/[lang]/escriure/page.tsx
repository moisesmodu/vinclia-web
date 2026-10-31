import Link from 'next/link';
import { esIdioma, t } from '@/lib/i18n';
import { BANC, nivellsActius } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/escriure', d.escriure.titol, d.escriure.text); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).escriure;
  const tasques = Object.values(BANC.tasques);
  return (
    <div className="contenedor py-6">
      <h1>{d.titol}</h1>
      <p className="mt-2 max-w-[48ch] text-[15px] text-secundari">{d.text}</p>
      {nivellsActius().map((n) => { const ts = tasques.filter((x) => x.nivell === n); if (!ts.length) return null; return (
        <section key={n} className="mt-8">
          <h2 className="text-[22px]">{n}</h2>
          <ul className="mt-3 divide-y divide-linia border-y border-linia">
            {ts.map((tk) => <li key={tk.id}><Link href={`/${idioma}/escriure/${tk.id}`} className="group flex items-center justify-between gap-4 py-3 no-underline"><span><span className="block text-[17px] font-bold group-hover:text-boli">{tk.titol}</span><span className="mt-0.5 block text-[14px] text-secundari">{tk.tipus} · {tk.paraulesMin}–{tk.paraulesMax} {d.paraules ?? (idioma === 'ca' ? 'paraules' : 'palabras')} · {tk.minuts} min</span></span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-terciari group-hover:text-boli"><path d="M9 6l6 6-6 6" /></svg></Link></li>)}
          </ul>
        </section>); })}
    </div>
  );
}
