import FormContacte from '@/components/FormContacte';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).contacte; return <div className="contenedor max-w-xl py-8"><h1 className="text-2xl font-bold">{d.titol}</h1><p className="mb-4 mt-1 text-sm text-suave">{d.text} · {process.env.LEGAL_EMAIL || 'hola@numimates.com'}</p><FormContacte idioma={idioma} /></div>; }
