import type { Metadata } from 'next';
import Link from 'next/link';
import { traductor } from '@/lib/i18n';
import { alternas } from '@/lib/seo';
import type { Locale } from '@/lib/config';
import { guias } from '@/lib/contenido';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = traductor(locale);
  return { title: t('seo.guias.t'), description: t('seo.guias.d'), alternates: alternas(locale, '/guia') };
}
export default async function Indice({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const propias = guias(locale);
  const es = locale === 'es' ? [] : guias('es');
  const lista = (g: ReturnType<typeof guias>, l: string) => (
    <ul className="grid gap-2">
      {g.map((x) => (
        <li key={x.slug}><Link className="tarjeta block p-4 hover:border-marca" href={`/${l}/guia/${x.slug}`}><b>{x.meta.h1}</b><span className="block text-sm text-suave">{x.meta.descripcion}</span></Link></li>
      ))}
    </ul>
  );
  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <h1 className="text-3xl font-black">Guías CCSE</h1>
      {propias.length > 0 && lista(propias, locale)}
      {es.length > 0 && (<><h2 className="mt-4 text-xl font-bold">Español</h2>{lista(es, 'es')}</>)}
    </div>
  );
}
