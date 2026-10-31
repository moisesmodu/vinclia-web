import RequereixCompte from '@/components/RequereixCompte';
import PlaVista from '@/components/PlaVista';
import { esIdioma, t } from '@/lib/i18n';
import { convocatories } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/pla', d.pla.titol, d.avui.senseDiag, { noIndex: true }); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).pla; return <RequereixCompte idioma={idioma}><div className="contenedor py-6"><h1>{d.titol}</h1><p className="mb-6 mt-2 max-w-[48ch] text-[15px] text-secundari">{d.text}</p><PlaVista idioma={idioma} convocatories={convocatories} /></div></RequereixCompte>; }
