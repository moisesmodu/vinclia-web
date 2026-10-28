import Mapa from '@/components/Mapa';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).mapa; return <div className="contenedor py-6"><h1>{d.titol}</h1><p className="mb-6 mt-2 max-w-[48ch] text-[15px] text-secundari">{d.text}</p><Mapa idioma={idioma} /></div>; }
