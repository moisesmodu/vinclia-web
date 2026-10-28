import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { deTarea, TAREAS } from '@/lib/preguntas';
import { Test } from '@/components/Test';

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => TAREAS.map((n) => ({ locale, tarea: String(n) })));
}
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; tarea: string }> }): Promise<Metadata> {
  const { locale, tarea } = await params;
  const t = traductor(locale);
  return { title: `Test CCSE ${t('tarea.n', { n: tarea })}: ${t(`tarea.${tarea}` as 'tarea.1')}` };
}

export default async function TestTema({ params }: { params: Promise<{ locale: Locale; tarea: string }> }) {
  const { locale, tarea } = await params;
  const n = Number(tarea);
  if (!TAREAS.includes(n as 1)) notFound();
  const t = traductor(locale);
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <h1 className="text-2xl font-black">{t('tarea.n', { n })}: {t(`tarea.${n}` as 'tarea.1')}</h1>
      <Test ids={deTarea(n).map((p) => p.id)} titulo={t('tarea.n', { n })} volver={`/${locale}/temas`} />
    </div>
  );
}
