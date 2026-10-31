import FormContacte from '@/components/FormContacte';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/contacte', d.contacte.titol, d.contacte.text); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).contacte; return <div className="contenedor max-w-xl py-8"><h1>{d.titol}</h1><p className="mb-5 mt-2 text-[15px] text-secundari">{d.text} · {process.env.LEGAL_EMAIL || 'hola@numimates.com'}</p><FormContacte idioma={idioma} /></div>; }
