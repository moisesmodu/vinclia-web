import type { Metadata } from 'next';
import FormAlerta from '@/components/FormAlerta';
import { esIdioma, t } from '@/lib/i18n';
import { convocatories, pais } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
const fmt = (iso: string, idioma: Idioma) => new Date(iso.length === 7 ? iso + '-15' : iso + 'T12:00:00').toLocaleDateString(idioma === 'ca' ? 'ca-ES' : 'es-ES', iso.length === 7 ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' });
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; return { title: t(l).convocatories.titol, description: t(l).convocatories.text }; }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).convocatories;
  const org = (id: string) => pais.organismes.find((o) => o.id === id)?.nom ?? id;
  return (
    <div className="contenedor py-6">
      <h1>{d.titol}</h1><p className="mt-2 max-w-[52ch] text-[15px] text-secundari">{d.text}</p>
      <div className="mt-4 grid gap-2">{[...convocatories].sort((a, b) => a.prova.localeCompare(b.prova)).map((c) => <div key={c.id} className="full py-3 text-[15px]"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{c.nom[idioma]} <span className="xip ml-1">{(c.nivells ?? [c.nivell]).join(' · ')}</span></p><p className="text-[13px] text-terciari">{org(c.organisme)}</p></div>{!c.verificat ? <span className="xip-boli">{d.prevista}</span> : null}</div><p className="mt-2">{d.prova}: <strong>{fmt(c.prova, idioma)}</strong>{c.inscripcio ? <> · {d.inscripcio}: {fmt(c.inscripcio.inici, idioma)} – {fmt(c.inscripcio.fi, idioma)}{c.inscripcio.estimada ? ` (${d.estimada})` : ''}</> : null}{c.resultats ? <> · {d.resultats}: {fmt(c.resultats, idioma)}</> : null}{c.taxa ? <> · {d.taxa}: {c.taxa} €</> : null}</p><a className="mt-1 inline-block text-[13px] underline" href={c.url} target="_blank" rel="noopener noreferrer">{c.url.replace(/^https?:\/\//, '')}</a></div>)}</div>
      <div className="mt-6"><FormAlerta idioma={idioma} /></div>
    </div>
  );
}
