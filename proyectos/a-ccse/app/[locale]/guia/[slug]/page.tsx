import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/config';
import { guias, leerDoc } from '@/lib/contenido';
import { traductor } from '@/lib/i18n';

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => guias(locale).map((g) => ({ locale, slug: g.slug })));
}
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const d = leerDoc(`guias/${locale}/${slug}.md`, locale);
  return { title: { absolute: d?.meta.titulo ?? slug }, description: d?.meta.descripcion, alternates: { canonical: `/${locale}/guia/${slug}` } };
}
export default async function Guia({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const d = leerDoc(`guias/${locale}/${slug}.md`, locale);
  if (!d) notFound();
  const t = traductor(locale);
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black leading-tight">{d.meta.h1}</h1>
      <div className="prosa mt-4" dangerouslySetInnerHTML={{ __html: d.html }} />
      <div className="tarjeta mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="font-semibold">{t('inicio.sinRegistro')}</p>
        <Link href={`/${locale}/temas`} className="boton boton-1">{t('inicio.cta')}</Link>
      </div>
    </article>
  );
}
