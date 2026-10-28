import Link from 'next/link';
import type { Metadata } from 'next';
import { PAIS, type Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { TAREAS, deTarea, ES_GRATIS } from '@/lib/preguntas';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = traductor((await params).locale);
  return { title: t('temas.h1'), description: t('temas.intro'), alternates: { canonical: `/${(await params).locale}/temas` } };
}

export default async function Temas({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = traductor(locale);
  const reparto = PAIS.simulacro.reparto as Record<string, number>;
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-black">{t('temas.h1')}</h1>
      <p className="text-suave">{t('temas.intro')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TAREAS.map((n) => {
          const lista = deTarea(n);
          return (
            <Link key={n} href={`/${locale}/temas/${n}`} className="tarjeta block p-5 hover:border-marca">
              <p className="text-sm font-semibold text-marca">{t('tarea.n', { n })}</p>
              <h2 className="mt-1 text-lg font-bold">{t(`tarea.${n}` as 'tarea.1')}</h2>
              <p className="mt-2 text-sm text-suave">
                {t('tarea.preguntas', { n: lista.length })} · {t('tarea.enExamen', { n: reparto[n] })} · {t('test.gratis')}: {lista.filter((p) => ES_GRATIS.has(p.id)).length}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
