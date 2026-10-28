import Link from 'next/link';
import { PAIS, precioTexto, type Locale } from '@/lib/config';
import { fechaLarga, traductor } from '@/lib/i18n';
import { TAREAS, deTarea, FUENTE } from '@/lib/preguntas';
import { proximaConvocatoria } from '@/lib/convocatorias';

export default async function Inicio({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = traductor(locale);
  const prox = proximaConvocatoria();
  const reparto = PAIS.simulacro.reparto as Record<string, number>;
  const faq = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`faq.${n}.q` as 'faq.1.q'),
    a: t(`faq.${n}.a` as 'faq.1.a', { p: precioTexto(locale), d: PAIS.accesoDias }),
  }));
  const ld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: t('marca'), applicationCategory: 'EducationalApplication', operatingSystem: 'Web, Android', inLanguage: locale, offers: { '@type': 'Offer', price: (PAIS.precioCentimos / 100).toFixed(2), priceCurrency: PAIS.moneda } },
  ];
  return (
    <div className="grid gap-10">
      <section className="pt-4 text-center sm:pt-10">
        <p className="titulos mb-2 text-lg font-bold text-marca">{t('lema')}</p>
        <p className="mb-3 inline-block rounded-full bg-oro/20 px-3 py-1 text-sm font-semibold">{t('inicio.badge')}</p>
        <h1 className="mx-auto max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{t('inicio.h1')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-suave">{t('inicio.sub')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}/temas`} className="boton boton-1 text-lg">{t('inicio.cta')}</Link>
          <Link href={`/${locale}/simulacro`} className="boton boton-2 text-lg">{t('inicio.cta2')}</Link>
        </div>
        <p className="mt-3 text-sm text-suave">{t('inicio.sinRegistro')}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="tarjeta p-5">
            <h2 className="font-bold">{t(`inicio.ventaja${n}.t` as 'inicio.ventaja1.t')}</h2>
            <p className="mt-1 text-suave">{t(`inicio.ventaja${n}.d` as 'inicio.ventaja1.d')}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">{t('inicio.temas')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TAREAS.map((n) => (
            <Link key={n} href={`/${locale}/temas/${n}`} className="tarjeta block p-5 hover:border-marca">
              <p className="text-sm font-semibold text-marca">{t('tarea.n', { n })}</p>
              <h3 className="mt-1 font-bold">{t(`tarea.${n}` as 'tarea.1')}</h3>
              <p className="mt-2 text-sm text-suave">{t('tarea.preguntas', { n: deTarea(n).length })} · {t('tarea.enExamen', { n: reparto[n] })}</p>
            </Link>
          ))}
        </div>
      </section>

      {prox && (
        <section className="tarjeta p-5">
          <h2 className="font-bold">{t('inicio.proximo')}: {fechaLarga(prox.examen, locale)}</h2>
          <Link className="mt-2 inline-block text-marca underline" href={`/${locale}/examen`}>{t('nav.examen')} →</Link>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-2xl font-bold">{t('inicio.faq')}</h2>
        <div className="grid gap-2">
          {faq.map((f) => (
            <details key={f.q} className="tarjeta p-4">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-suave">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <p className="text-sm text-suave">
        {t('inicio.fuente')}: <a className="underline" href={FUENTE.url}>{FUENTE.titulo}</a> ({FUENTE.autor}).
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </div>
  );
}
