import { redirect } from 'next/navigation';
import AccionsCompte from '@/components/AccionsCompte';
import { esIdioma, t } from '@/lib/i18n';
import { usuariActual, esPremium } from '@/lib/auth';
import { modoPago } from '@/lib/pagos';
import type { Idioma } from '@/lib/tipos';
export const dynamic = 'force-dynamic';
export default async function Pagina({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ pagat?: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).compte; const sp = await searchParams;
  const u = await usuariActual(); if (!u) redirect(`/${idioma}/entrar?seguent=/${idioma}/compte`);
  const premium = esPremium(u);
  const fins = u.subscripcioFins ? u.subscripcioFins.toLocaleDateString(idioma === 'ca' ? 'ca-ES' : 'es-ES') : '';
  return (
    <div className="contenedor max-w-xl py-8">
      <h1 className="text-2xl font-bold">{d.titol}</h1>
      {sp.pagat ? <p className="mt-3 rounded-lg bg-oliva-claro p-3 text-sm">{sp.pagat === 'demo' ? d.demo : d.pagat}</p> : null}
      <div className="tarjeta mt-4 text-sm">
        <p>{u.email}</p>
        <p className="mt-2">{d.pla}: <strong>{premium ? (u.subscripcioEstat === 'passi' ? d.passi : d.actiu) : d.gratis}</strong>{premium && fins ? <> · {u.cancelaAlFinal ? `${d.cancelada} ${fins}` : `${d.fins} ${fins}`}</> : null}{u.pla ? <span className="text-suave"> ({t(idioma).preus.plans[u.pla] ?? u.pla})</span> : null}</p>
        <AccionsCompte idioma={idioma} cancelaAlFinal={u.cancelaAlFinal} premium={premium && u.subscripcioEstat !== 'passi'} teStripe={modoPago() === 'stripe' && !!u.stripeCustomerId} />
      </div>
    </div>
  );
}
