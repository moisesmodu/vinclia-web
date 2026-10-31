import { Suspense } from 'react';
import FormulariEntrar from '@/components/FormulariEntrar';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, '/entrar', d.nav.entrar, d.nav.compte, { noIndex: true }); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; return <div className="contenedor max-w-md py-10"><Suspense><FormulariEntrar idioma={idioma} /></Suspense></div>; }
