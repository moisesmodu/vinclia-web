import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { pais, precioTexto, oposiciones } from '@/lib/datos';
import { esModoPrueba } from '@/lib/pagos';
import { alternates } from '@/lib/seo';
import BotonPlan from '@/components/BotonPlan';

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === 'ca' ? 'Preus: totes les oposicions catalanes per 9,99 €/mes' : 'Precios: todas las oposiciones catalanas por 9,99 €/mes', alternates: alternates(lang, '/precios') };
}

export default async function Precios({ params }: { params: Promise<{ lang: Idioma }> }) {
  const { lang } = await params;
  const d = t(lang);
  const planes = pais.planes.filter((p) => p.activo);
  return (
    <div className="contenedor py-10">
      <h1 className="text-3xl font-extrabold">{d.precios}</h1>
      <p className="mt-2 max-w-2xl text-slate-700">{d.v4} {d.gratisN(pais.gratisPorOposicion)}</p>
      {esModoPrueba() ? <p className="mt-3 inline-block rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">{d.modoPrueba}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {planes.map((p) => (
          <div key={p.id} className={`tarjeta flex flex-col ${p.destacado ? 'border-2 border-marca' : ''}`}>
            <p className="font-bold">{d.planes[p.id]}</p>
            <p className="mt-2"><span className="text-4xl font-extrabold">{precioTexto(p.porMes, lang)}</span><span className="text-slate-500">{d.porMes}</span></p>
            <p className="text-sm text-slate-500">{p.id === 'mensual' ? ' ' : d.pagoUnico(precioTexto(p.importe, lang), d.cada[p.id])}</p>
            <ul className="mt-4 flex-1 space-y-1 text-sm text-slate-700">{d.incluye.map((x) => <li key={x}>✓ {x}</li>)}</ul>
            <BotonPlan plan={p.id} idioma={lang} texto={d.suscribirme} destacado={p.destacado} />
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-600">{d.cancelaCuandoQuieras} {lang === 'ca' ? 'IVA inclòs.' : 'IVA incluido.'}</p>
      <p className="mt-2 text-sm text-slate-500">{oposiciones().map((o) => o.nombreCorto[lang]).join(' · ')}</p>
    </div>
  );
}
