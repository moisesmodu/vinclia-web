import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, type Locale } from '@/lib/config';
import { leerDoc } from '@/lib/contenido';
import { traductor } from '@/lib/i18n';

const doc = (l: Locale) => leerDoc(`examen/${l}.md`, l) ?? leerDoc('examen/es.md', l);

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = doc(locale);
  const t = traductor(locale);
  return {
    title: d?.meta.titulo ?? t('examen.h1'),
    description: d?.meta.descripcion ?? t('examen.desc'),
    alternates: { canonical: `/${locale}/examen`, languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}/examen`])) },
  };
}

export default async function Examen({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = traductor(locale);
  const d = doc(locale);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: d?.meta.h1 ?? t('examen.h1'), inLanguage: locale,
    about: { '@type': 'EducationalOccupationalCredential', name: 'CCSE', recognizedBy: { '@type': 'Organization', name: 'Instituto Cervantes' } },
  };
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black leading-tight">{d?.meta.h1 ?? t('examen.h1')}</h1>
      <div className="prosa mt-4" dangerouslySetInnerHTML={{ __html: d?.html ?? '' }} />
      <div className="tarjeta mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="font-semibold">{t('inicio.sinRegistro')}</p>
        <Link href={`/${locale}/simulacro`} className="boton boton-1">{t('inicio.cta2')}</Link>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </article>
  );
}
