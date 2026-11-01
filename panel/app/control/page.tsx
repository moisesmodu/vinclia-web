import Link from 'next/link';
import { Aviso, Estado, Proyecto } from '@/components/control/Piezas';
import { dinero, fechaHora, inicioDiaMadrid, inicioMesMadrid, nombreProyecto, PROYECTOS_CONTROL } from '@/lib/control/comun';
import { esDeCartera, ESTADOS_SUSCRIPCION_MRR, netoEntre } from '@/lib/control/stripe';
import { usuariosUnificados } from '@/lib/control/unificado';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %` : '—');

export default async function Resumen() {
  const { usuarios, avisos, porProyecto, stripe } = await usuariosUnificados();
  const hoy = inicioDiaMadrid(0), hace7 = inicioDiaMadrid(6), hace30 = inicioDiaMadrid(29), mes = inicioMesMadrid();
  const s = stripe.ok ? stripe.datos : null;
  const pagos = s?.pagos ?? [];
  const cartera = (p: { proyecto: string | null }) => esDeCartera(p.proyecto);
  const ing = { hoy: netoEntre(pagos, hoy, undefined, cartera), d7: netoEntre(pagos, hace7, undefined, cartera), mes: netoEntre(pagos, mes, undefined, cartera) };
  const otrosMes = netoEntre(pagos, mes, undefined, (p) => !esDeCartera(p.proyecto));
  const subsMrr = (s?.suscripciones ?? []).filter((x) => ESTADOS_SUSCRIPCION_MRR.has(x.estado) && x.moneda === 'eur');
  const mrr = subsMrr.filter((x) => esDeCartera(x.proyecto)).reduce((t, x) => t + x.mensual, 0);
  const mrrOtros = subsMrr.filter((x) => !esDeCartera(x.proyecto)).reduce((t, x) => t + x.mensual, 0);
  const nuevos = (desde: Date) => usuarios.filter((u) => u.alta >= desde).length;
  const pagan = usuarios.filter((u) => u.haPagado).length;

  return (
    <>
      {!stripe.ok && <Aviso titulo="Stripe" error={stripe.error} />}
      {avisos.map((a) => <Aviso key={a.clave} titulo={`Base de datos de ${a.nombre}`} error={a.error} />)}

      <section>
        <h2>Ingresos netos de la cartera</h2>
        <div className="cifras">
          <div><b>{s ? dinero(ing.hoy.neto) : '—'}</b><span>hoy · {ing.hoy.cobros} cobros</span></div>
          <div><b>{s ? dinero(ing.d7.neto) : '—'}</b><span>últimos 7 días</span></div>
          <div><b>{s ? dinero(ing.mes.neto) : '—'}</b><span>este mes{ing.mes.reembolsado ? ` · −${dinero(ing.mes.reembolsado)} reembolsado` : ''}</span></div>
          <div><b>{s ? dinero(mrr) : '—'}</b><span>MRR · {subsMrr.filter((x) => esDeCartera(x.proyecto)).length} suscripciones activas</span></div>
        </div>
        {s && (otrosMes.cobrado > 0 || mrrOtros > 0) && (
          <p className="nota">Fuera de la cartera (misma cuenta de Stripe, sin <code>metadata.proyecto</code>): {dinero(otrosMes.neto)} este mes y {dinero(mrrOtros)} de MRR. No se suman arriba.</p>
        )}
      </section>

      <section>
        <h2>Usuarios</h2>
        <div className="cifras">
          <div><b>{nuevos(hoy)}</b><span>altas hoy</span></div>
          <div><b>{nuevos(hace7)}</b><span>altas en 7 días</span></div>
          <div><b>{nuevos(hace30)}</b><span>altas en 30 días</span></div>
          <div><b>{pct(pagan, usuarios.length)}</b><span>conversión a pago · {pagan} de {usuarios.length}</span></div>
        </div>
      </section>

      <section>
        <h2>Por proyecto</h2>
        <div className="ctl-scroll">
          <table className="tabla ctl-tabla">
            <thead><tr><th>Proyecto</th><th className="d">Usuarios</th><th className="d">Altas 30 d</th><th className="d">Pagan</th><th className="d">Conversión</th><th className="d">Ingresos mes</th><th className="d">MRR</th></tr></thead>
            <tbody>
              {PROYECTOS_CONTROL.map((p) => {
                const r = porProyecto.find((x) => x.clave === p.clave)!;
                const us = usuarios.filter((u) => u.proyecto === p.clave);
                const pg = us.filter((u) => u.haPagado).length;
                const im = netoEntre(pagos, mes, undefined, (x) => x.proyecto === p.slug);
                const m = subsMrr.filter((x) => x.proyecto === p.slug).reduce((t, x) => t + x.mensual, 0);
                return (
                  <tr key={p.clave}>
                    <td><Proyecto letra={p.clave} nombre={p.nombre} /></td>
                    {r.resultado.ok ? <>
                      <td className="d">{us.length}</td><td className="d">{us.filter((u) => u.alta >= hace30).length}</td><td className="d">{pg}</td><td className="d">{pct(pg, us.length)}</td>
                    </> : <td colSpan={4}><small className="ctl-error">Sin datos de la base de datos</small></td>}
                    <td className="d">{s ? dinero(im.neto) : '—'}</td><td className="d">{s ? dinero(m) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dos">
        <section>
          <h2>Últimos pagos</h2>
          {!s ? <p className="vacio">Sin datos de Stripe.</p> : pagos.filter((p) => p.estado !== 'fallido').length === 0 ? <p className="vacio">Todavía no hay pagos.</p> : (
            <ul className="ctl-lista">
              {pagos.filter((p) => p.estado !== 'fallido').slice(0, 10).map((p) => (
                <li key={p.id}>
                  <span><b>{dinero(p.importe, p.moneda)}</b> <Estado estado={p.estado} /><small>{nombreProyecto(p.proyecto)} · {p.email ?? 'sin email'}</small></span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer"><small>{fechaHora(p.creado)}</small></a>
                </li>
              ))}
            </ul>
          )}
          <p className="nota"><Link href="/control/pagos/">Todos los pagos</Link></p>
        </section>
        <section>
          <h2>Últimas altas</h2>
          {usuarios.length === 0 ? <p className="vacio">Todavía no hay usuarios.</p> : (
            <ul className="ctl-lista">
              {usuarios.slice(0, 10).map((u) => (
                <li key={u.proyecto + u.email}>
                  <span><b>{u.email}</b> <Estado estado={u.estado} /><small>{nombreProyecto(u.slug)}{u.plan !== '—' ? ` · ${u.plan}` : ''}</small></span>
                  <small>{fechaHora(u.alta)}</small>
                </li>
              ))}
            </ul>
          )}
          <p className="nota"><Link href="/control/usuarios/">Todos los usuarios</Link></p>
        </section>
      </div>
      <p className="nota">«Pagan» cuenta a quien ha pagado alguna vez (aunque después cancelara o le caducara el acceso). En Lunilla no hay cuentas: cada email con pedido cuenta como usuario. El MRR usa el precio de lista de las suscripciones activas y con pago atrasado, sin descuentos.</p>
    </>
  );
}
