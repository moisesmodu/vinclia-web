import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { TAREAS, deTarea, FUENTE } from '@/lib/preguntas';

export async function generateMetadata(): Promise<Metadata> {
  const t = traductor('es');
  return { title: t('preg.h1'), description: t('preg.intro'), alternates: { canonical: '/es/preguntas' } };
}
export default async function Indice({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (locale !== 'es') notFound();
  const t = traductor('es');
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black">{t('preg.h1')}</h1>
      <p className="mt-2 text-suave">{t('preg.intro')} <a className="underline" href={FUENTE.url}>{FUENTE.titulo}</a>.</p>
      {TAREAS.map((n) => (
        <section key={n} className="mt-6">
          <h2 className="text-xl font-bold">{t('tarea.n', { n })}: {t(`tarea.${n}` as 'tarea.1')}</h2>
          <ol className="mt-2 grid gap-1">
            {deTarea(n).map((p) => <li key={p.id}><Link className="hover:underline" href={`/es/preguntas/${p.id}`}>{p.id}. {p.texto}</Link></li>)}
          </ol>
        </section>
      ))}
    </div>
  );
}
