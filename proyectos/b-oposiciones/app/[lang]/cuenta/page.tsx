import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { usuarioActual, estaSuscrito } from '@/lib/auth';
import { oposiciones } from '@/lib/datos';
import { modoPago } from '@/lib/pagos';
import AccionesCuenta from '@/components/AccionesCuenta';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false } };

export default async function Cuenta({ params, searchParams }: { params: Promise<{ lang: Idioma }>; searchParams: Promise<{ pagado?: string }> }) {
  const { lang } = await params;
  const { pagado } = await searchParams;
  const u = await usuarioActual();
  if (!u) redirect(`/${lang}/entrar`);
  const d = t(lang);
  const sus = estaSuscrito(u);
  const fecha = u.suscripcionHasta ? u.suscripcionHasta.toLocaleDateString(lang === 'ca' ? 'ca-ES' : 'es-ES') : '';
  return (
    <div className="contenedor py-10">
      <h1 className="text-2xl font-bold">{d.cuenta}</h1>
      <p className="mt-1 text-slate-600">{u.email}</p>
      {pagado ? <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-ok">✓ {lang === 'ca' ? 'Subscripció activada. Ja tens totes les preguntes.' : 'Suscripción activada. Ya tienes todas las preguntas.'}{pagado === 'demo' ? ' (demo)' : ''}</p> : null}
      <div className="tarjeta mt-6 max-w-xl">
        <p className="text-sm text-slate-500">{d.cuentaTxt.plan}</p>
        <p className="text-lg font-bold">{sus ? d.cuentaTxt.activo : d.cuentaTxt.gratis}{u.suscripcionEstado === 'demo' ? ' (demo)' : ''}</p>
        {sus && fecha ? <p className="text-sm text-slate-600">{u.cancelaAlFinal ? `${d.cuentaTxt.cancelada} ${fecha}` : `${d.cuentaTxt.hasta} ${fecha}`}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {!sus ? <Link href={`/${lang}/precios`} className="boton">{d.app.desbloquear}</Link> : null}
          {sus && !u.cancelaAlFinal ? <AccionesCuenta idioma={lang} accion="cancelar" texto={d.cuentaTxt.cancelar} secundario /> : null}
          {sus && u.cancelaAlFinal ? <AccionesCuenta idioma={lang} accion="reactivar" texto={d.cuentaTxt.reactivar} /> : null}
          {modoPago() === 'stripe' && u.stripeCustomerId ? <AccionesCuenta idioma={lang} accion="portal" texto={d.cuentaTxt.gestionar} secundario /> : null}
        </div>
      </div>
      <h2 className="mt-8 text-lg font-bold">{d.practicar}</h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {oposiciones().map((o) => <li key={o.slug}><Link className="tarjeta block p-4 font-semibold no-underline hover:border-marca" href={`/${lang}/practicar/${o.slug}`}>{o.nombre[lang]}</Link></li>)}
      </ul>
      <form action={`/api/auth/salir?idioma=${lang}`} method="post" className="mt-8"><button className="text-sm text-slate-500 underline">{d.salir}</button></form>
    </div>
  );
}
