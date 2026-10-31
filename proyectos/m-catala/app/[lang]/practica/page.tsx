import Link from 'next/link';
import type { Metadata } from 'next';
import { esIdioma, t } from '@/lib/i18n';
import { meta } from '@/lib/meta';
import type { Idioma } from '@/lib/tipos';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/practica', d.practica.titol, d.nou.sessioTitol); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).practica;
  const tipus = ['repas', 'buits', 'transformacio', 'castellanismes', 'dictat', 'lexic'];
  return (
    <div className="contenedor py-6">
      <h1>{d.titol}</h1>
      <ul className="mt-6 divide-y divide-linia border-y border-linia">
        {tipus.map((k) => <li key={k}><Link href={`/${idioma}/practica/${k}`} className="group flex items-center justify-between gap-4 py-4 no-underline"><span><span className="block text-[18px] font-bold group-hover:text-boli">{d.tipus[k]}</span><span className="mt-0.5 block text-[15px] text-secundari">{d.tipusText?.[k] ?? ''}</span></span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-terciari group-hover:text-boli"><path d="M9 6l6 6-6 6" /></svg></Link></li>)}
      </ul>
    </div>
  );
}
