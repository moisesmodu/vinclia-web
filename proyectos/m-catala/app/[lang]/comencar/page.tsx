import Comencar from '@/components/Comencar';
import { examens, convocatories } from '@/lib/datos';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/comencar', d.nav.comencar, d.hero.ctaSub); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; return <Comencar idioma={idioma} examens={examens} convocatories={convocatories} />; }
