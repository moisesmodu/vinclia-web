import Diagnostic from '@/components/Diagnostic';
import { examens, convocatories, punts, BANC } from '@/lib/datos';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/diagnostic', d.diag.titol, d.diag.intro, { noIndex: true }); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; return <Diagnostic idioma={idioma} examens={examens} convocatories={convocatories} punts={punts} tasques={Object.values(BANC.tasques)} sons={BANC.oral.sons} lectures={BANC.oral.lectures} />; }
