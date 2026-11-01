import Link from 'next/link';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { pais, precioTexto, oposiciones, marca } from '@/lib/datos';
import { esModoPrueba } from '@/lib/pagos';
import { alternates, jsonLd, imagenOg } from '@/lib/seo';
import BotonPlan from '@/components/BotonPlan';

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  const titulo = lang === 'ca' ? 'Preus: totes les oposicions catalanes per 9,99 €/mes' : 'Precios: todas las oposiciones catalanas por 9,99 €/mes';
  const desc = lang === 'ca'
    ? `${pais.gratisPorOposicion} preguntes gratis per oposició sense registre. Subscripció mensual, trimestral o anual amb totes les preguntes i simulacres de totes les oposicions. IVA inclòs, cancel·la amb un clic.`
    : `${pais.gratisPorOposicion} preguntas gratis por oposición sin registro. Suscripción mensual, trimestral o anual con todas las preguntas y simulacros de todas las oposiciones. IVA incluido, cancela en un clic.`;
  return { title: titulo, description: desc, alternates: alternates(lang, '/precios'), openGraph: { images: imagenOg(lang), title: titulo, description: desc } };
}

/** Pantalla de precio con la estructura común de la cartera (MARCAS.md §3): gratis · de pago · precio con IVA · cancela en un clic · sello. */
export default async function Precios({ params }: { params: Promise<{ lang: Idioma }> }) {
  const { lang } = await params;
  const ca = lang === 'ca';
  const d = t(lang);
  const planes = pais.planes.filter((p) => p.activo);
  const mensual = planes.find((p) => p.id === 'mensual') ?? planes[0];
  const ahorro = (porMes: number) => Math.round((1 - porMes / mensual.porMes) * 100);
  const faq = ca
    ? [
        ['Què inclou la subscripció?', `Totes les preguntes de totes les oposicions (${oposiciones().map((o) => o.nombreCorto.ca).join(', ')}), simulacres il·limitats amb el format de cada convocatòria, repàs espaiat i estadístiques per tema.`],
        ['Com cancel·lo?', 'Des de «El meu compte», amb un clic. No es renova i mantens l\'accés fins al final del període que has pagat.'],
        ['Com pago?', 'Amb targeta, a través de Stripe. No guardem les dades de la teva targeta. Les factures les tens a «El meu compte».'],
        ['Puc provar-ho abans?', `Sí: ${pais.gratisPorOposicion} preguntes de cada oposició, amb la correcció completa, sense registre i sense targeta.`],
      ]
    : [
        ['¿Qué incluye la suscripción?', `Todas las preguntas de todas las oposiciones (${oposiciones().map((o) => o.nombreCorto.es).join(', ')}), simulacros ilimitados con el formato de cada convocatoria, repaso espaciado y estadísticas por tema.`],
        ['¿Cómo cancelo?', 'Desde «Mi cuenta», con un clic. No se renueva y mantienes el acceso hasta el final del periodo que has pagado.'],
        ['¿Cómo pago?', 'Con tarjeta, a través de Stripe. No guardamos los datos de tu tarjeta. Las facturas las tienes en «Mi cuenta».'],
        ['¿Puedo probarlo antes?', `Sí: ${pais.gratisPorOposicion} preguntas de cada oposición, con la corrección completa, sin registro y sin tarjeta.`],
      ];
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  return (
    <div className="contenedor py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <h1 className="text-3xl font-bold sm:text-4xl">{ca ? 'Un preu. Totes les oposicions.' : 'Un precio. Todas las oposiciones.'}</h1>
      <p className="mt-3 max-w-2xl text-suave">{d.v4}</p>
      {esModoPrueba() ? <p className="mt-3 inline-block rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">{d.modoPrueba}</p> : null}

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label={d.precios}>
        {planes.map((p) => {
          const pct = ahorro(p.porMes);
          return (
            <div key={p.id} className={`tarjeta relative flex flex-col ${p.destacado ? 'order-first md:order-none border-2 border-marca shadow-[0_18px_40px_-24px_rgba(59,63,216,0.6)]' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold">{d.planes[p.id]}</h2>
                {p.destacado ? <span className="rounded-md bg-marca px-2 py-0.5 text-xs font-semibold text-white">{ca ? 'Millor preu' : 'Mejor precio'}</span> : null}
              </div>
              <p className="mt-3"><span className="num font-titulos text-4xl font-bold">{precioTexto(p.porMes, lang)}</span><span className="text-suave">{d.porMes}</span></p>
              <p className="mt-1 min-h-10 text-sm text-suave">
                {p.id === 'mensual' ? d.ivaIncluido : `${d.pagoUnico(precioTexto(p.importe, lang), d.cada[p.id])} · ${d.ivaIncluido}`}
                {pct > 0 ? <span className="ml-1 font-semibold text-ok">· {ca ? 'estalvies' : 'ahorras'} {pct}%</span> : null}
              </p>
              <div className="flex-1" />
              <BotonPlan plan={p.id} idioma={lang} texto={d.suscribirme} destacado={p.destacado} />
            </div>
          );
        })}
      </section>
      <p className="mt-4 text-sm font-semibold">{d.cancelaClic}</p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#E4E4EF] p-5">
          <h2 className="font-bold">{d.gratisTitulo} · 0 €</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-suave">{d.gratisIncluye.map((x) => <li key={x} className="flex gap-2"><span aria-hidden="true">·</span>{x}</li>)}</ul>
          <Link href={`/${lang}#oposicions`} className="mt-4 inline-block text-sm font-semibold text-marca">{d.testGratis} →</Link>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-[#E4E4EF]">
          <h2 className="font-bold">{d.pagoTitulo}</h2>
          <ul className="mt-3 space-y-1.5 text-sm">{d.incluye.map((x) => <li key={x} className="flex gap-2"><span className="text-ok" aria-hidden="true">✓</span>{x}</li>)}</ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{ca ? 'Preguntes freqüents' : 'Preguntas frecuentes'}</h2>
        <dl className="mt-4 grid gap-6 sm:grid-cols-2">
          {faq.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-suave">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 inline-block rounded-lg bg-marca-claro px-3 py-1 text-sm font-semibold text-marca-oscuro">{marca.sello[lang]}</p>
    </div>
  );
}
