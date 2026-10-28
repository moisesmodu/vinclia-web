import { notFound } from 'next/navigation';
import Editor from '@/components/Editor';
import { esIdioma } from '@/lib/i18n';
import { BANC, tasca as tascaDe } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => Object.keys(BANC.tasques).map((tasca) => ({ lang, tasca })));
export default async function Pagina({ params }: { params: Promise<{ lang: string; tasca: string }> }) { const { lang, tasca } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const tk = tascaDe(tasca); if (!tk) notFound(); return <div className="contenedor py-6"><Editor idioma={idioma} tasca={tk} regles={BANC.regles} /></div>; }
