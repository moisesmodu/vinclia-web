import { notFound } from 'next/navigation';
import Editor from '@/components/Editor';
import type { Metadata } from 'next';
import { esIdioma, t } from '@/lib/i18n';
import { meta } from '@/lib/meta';
import { BANC, tasca as tascaDe } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => Object.keys(BANC.tasques).map((tasca) => ({ lang, tasca })));
export async function generateMetadata({ params }: { params: Promise<{ lang: string; tasca: string }> }): Promise<Metadata> { const { lang, tasca } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const tk = tascaDe(tasca); return meta(l, `/escriure/${tasca}`, tk ? tk.titol : t(l).escriure.titol, t(l).escriure.text); }
export default async function Pagina({ params }: { params: Promise<{ lang: string; tasca: string }> }) { const { lang, tasca } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const tk = tascaDe(tasca); if (!tk) notFound(); return <div className="contenedor py-6"><Editor idioma={idioma} tasca={tk} regles={BANC.regles} /></div>; }
