import { Suspense } from 'react';
import FormulariEntrar from '@/components/FormulariEntrar';
import { esIdioma } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; return <div className="contenedor max-w-md py-8"><Suspense><FormulariEntrar idioma={idioma} /></Suspense></div>; }
