import type { Metadata } from 'next';
import BotonPlan from '@/components/BotonPlan';
import { esIdioma, t } from '@/lib/i18n';
import { marca, pais, preu } from '@/lib/datos';
import { esModoPrueba, modoPago } from '@/lib/pagos';
import type { Idioma } from '@/lib/tipos';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; return { title: t(l).preus.titol }; }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).preus;
  const planes = pais.planes.filter((p) => p.activo);
  return (
    <div className="contenedor py-6">
      <h1 className="text-2xl font-bold">{d.titol}</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="tarjeta"><h2 className="font-bold">{d.gratisTitol}</h2><ul className="mt-2 space-y-1 text-sm">{d.gratis.map((x) => <li key={x}>✓ {x}</li>)}</ul></div>
        <div className="tarjeta border-ocre"><h2 className="font-bold">{d.premiumTitol}</h2><ul className="mt-2 space-y-1 text-sm">{d.premium.map((x) => <li key={x}>✓ {x}</li>)}</ul></div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {planes.map((p) => <div key={p.id} className={`tarjeta flex flex-col ${p.destacado ? 'border-ocre ring-1 ring-ocre' : ''}`}><p className="font-semibold">{d.plans[p.id]}</p><p className="titulos mt-1 text-3xl font-bold">{preu(p.importe)}<span className="text-base font-normal text-suave">{p.tipo === 'unic' ? ` ${d.unic}` : p.intervalo === 'year' ? d.any : d.porMes}</span></p>{p.porMes && p.id !== 'mensual' ? <p className="text-xs text-suave">≈ {preu(p.porMes)}{d.porMes}</p> : null}<p className="mt-1 text-sm text-suave">{d.plansText[p.id]}</p><p className="mt-auto text-xs text-suave">{d.ivaInclos}</p><BotonPlan plan={p.id} idioma={idioma} texto={d.triar} destacado={p.destacado} /></div>)}
      </div>
      <p className="mt-4 text-sm text-suave">{d.avis}</p><p className="mt-1 text-sm text-suave">{d.garantia}</p><p className="mt-1 text-sm text-suave">{d.referencia}</p>
      {modoPago() !== 'stripe' || esModoPrueba() ? <p className="mt-3 inline-block rounded-lg bg-ocre-claro px-3 py-1 text-xs">{d.modoPrueba}</p> : null}
      <p className="mt-6 text-xs font-semibold text-ocre-oscuro">{marca.sello[idioma]}</p>
    </div>
  );
}
