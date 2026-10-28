import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { pais, precioTexto, oposiciones, marca } from '@/lib/datos';
import { esModoPrueba } from '@/lib/pagos';
import { alternates } from '@/lib/seo';
import BotonPlan from '@/components/BotonPlan';

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === 'ca' ? 'Preus: totes les oposicions catalanes per 9,99 €/mes' : 'Precios: todas las oposiciones catalanas por 9,99 €/mes', alternates: alternates(lang, '/precios') };
}

/** Pantalla de precio con la estructura común de la cartera (MARCAS.md §3): gratis · de pago · precio con IVA · cancela en un clic · sello. */
export default async function Precios({ params }: { params: Promise<{ lang: Idioma }> }) {
  const { lang } = await params;
  const d = t(lang);
  const planes = pais.planes.filter((p) => p.activo);
  return (
    <div className="contenedor py-10">
      <h1 className="text-3xl font-bold">{d.precios}</h1>
      <p className="mt-2 max-w-2xl text-slate-700">{d.v4}</p>
      {esModoPrueba() ? <p className="mt-3 inline-block rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">{d.modoPrueba}</p> : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="tarjeta">
          <h2 className="text-lg font-bold">{d.gratisTitulo}</h2>
          <p className="mt-1 text-3xl font-bold">0 €</p>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">{d.gratisIncluye.map((x) => <li key={x}>✓ {x}</li>)}</ul>
        </div>
        <div className="tarjeta border-2 border-marca">
          <h2 className="text-lg font-bold">{d.pagoTitulo}</h2>
          <p className="mt-1"><span className="text-3xl font-bold">{precioTexto(planes[0].porMes, lang)}</span><span className="text-slate-500">{d.porMes}</span> <span className="text-sm text-slate-500">· {d.ivaIncluido}</span></p>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">{d.incluye.map((x) => <li key={x}>✓ {x}</li>)}</ul>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {planes.map((p) => (
          <div key={p.id} className={`tarjeta flex flex-col ${p.destacado ? 'border-2 border-marca' : ''}`}>
            <p className="font-bold">{d.planes[p.id]}</p>
            <p className="mt-2"><span className="text-4xl font-bold">{precioTexto(p.porMes, lang)}</span><span className="text-slate-500">{d.porMes}</span></p>
            <p className="text-sm text-slate-500">{p.id === 'mensual' ? d.ivaIncluido : `${d.pagoUnico(precioTexto(p.importe, lang), d.cada[p.id])} · ${d.ivaIncluido}`}</p>
            <div className="flex-1" />
            <BotonPlan plan={p.id} idioma={lang} texto={d.suscribirme} destacado={p.destacado} />
          </div>
        ))}
      </section>

      <p className="mt-6 text-base font-semibold text-tinta">{d.cancelaClic}</p>
      <p className="mt-1 text-sm text-slate-600">{oposiciones().map((o) => o.nombreCorto[lang]).join(' · ')}</p>
      <p className="mt-4 inline-block rounded-lg bg-marca-claro px-3 py-1 text-sm font-semibold text-marca-oscuro">{marca.sello[lang]}</p>
    </div>
  );
}
