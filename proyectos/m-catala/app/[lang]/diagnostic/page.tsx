import Diagnostic from '@/components/Diagnostic';
import { examens, convocatories, punts, BANC } from '@/lib/datos';
import { esIdioma } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; return <Diagnostic idioma={idioma} examens={examens} convocatories={convocatories} punts={punts} tasques={Object.values(BANC.tasques)} sons={BANC.oral.sons} lectures={BANC.oral.lectures} />; }
