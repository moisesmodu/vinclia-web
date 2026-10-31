import RequereixCompte from '@/components/RequereixCompte';
import OralPagina from '@/components/OralPagina';
import { esIdioma, t } from '@/lib/i18n';
import { BANC } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/oral', d.oral.titol, d.oral.text); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).oral; return <RequereixCompte idioma={idioma}><div className="contenedor py-6"><h1>{d.titol}</h1><p className="mb-6 mt-2 max-w-[48ch] text-[15px] text-secundari">{d.text}</p><OralPagina idioma={idioma} lectures={BANC.oral.lectures} sons={BANC.oral.sons} /></div></RequereixCompte>; }
