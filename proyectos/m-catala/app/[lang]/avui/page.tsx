import Avui from '@/components/Avui';
import { examens, convocatories, punts, BANC } from '@/lib/datos';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; return <div className="contenedor py-6"><h1 className="mb-4 text-2xl font-bold">{t(idioma).avui.titol}</h1><Avui idioma={idioma} examens={examens} convocatories={convocatories} punts={punts} sons={BANC.oral.sons} /></div>; }
