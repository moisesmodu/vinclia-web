import Avui from '@/components/Avui';
import { examens, convocatories, punts, BANC } from '@/lib/datos';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/avui', d.nav.avui, d.avui.senseDiag, { noIndex: true }); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; return <div className="contenedor py-6"><Avui idioma={idioma} examens={examens} convocatories={convocatories} punts={punts} sons={BANC.oral.sons} /></div>; }
