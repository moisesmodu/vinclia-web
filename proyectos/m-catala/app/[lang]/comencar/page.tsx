import Comencar from '@/components/Comencar';
import { examens, convocatories } from '@/lib/datos';
import { esIdioma } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; return <Comencar idioma={idioma} examens={examens} convocatories={convocatories} />; }
