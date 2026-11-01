import { Aviso, Estado } from '@/components/control/Piezas';
import { dinero, fechaCorta, nombreProyecto } from '@/lib/control/comun';
import { datosStripe, esDeCartera, type SuscripcionStripe } from '@/lib/control/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function Tabla({ lista, fecha, vacio }: { lista: SuscripcionStripe[]; fecha: (s: SuscripcionStripe) => [string, Date | null]; vacio: string }) {
  if (lista.length === 0) return <p className="vacio">{vacio}</p>;
  return (
    <div className="ctl-scroll">
      <table className="tabla ctl-tabla">
        <thead><tr><th>Proyecto</th><th>Email</th><th>Producto</th><th className="d">Al mes</th><th>Estado</th><th>{fecha(lista[0])[0]}</th><th>Stripe</th></tr></thead>
        <tbody>
          {lista.map((s) => (
            <tr key={s.id}>
              <td>{nombreProyecto(s.proyecto)}</td><td className="ctl-email">{s.email ?? <small>—</small>}</td>
              <td><small>{s.producto}{s.intervalo ? ` · cada ${s.intervalo}` : ''}</small></td>
              <td className="d">{dinero(s.mensual, s.moneda)}</td>
              <td><Estado estado={s.estado} />{s.cancelaAlFinal && s.estado !== 'canceled' ? <small> · cancela al final</small> : null}</td>
              <td>{fechaCorta(fecha(s)[1])}</td>
              <td><a href={s.url} target="_blank" rel="noopener noreferrer">abrir</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Suscripciones({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const todas = sp.todas === '1';
  const r = await datosStripe();
  if (!r.ok) return <section><h2>Suscripciones</h2><Aviso titulo="Stripe" error={r.error} /></section>;
  const subs = r.datos.suscripciones.filter((s) => todas || esDeCartera(s.proyecto));
  const de = (e: string) => subs.filter((s) => s.estado === e);
  const en30 = Date.now() + 30 * 864e5;
  const renovaciones = subs.filter((s) => (s.estado === 'active' || s.estado === 'trialing') && !s.cancelaAlFinal && s.finPeriodo && +s.finPeriodo <= en30).sort((a, b) => +a.finPeriodo! - +b.finPeriodo!);
  const canceladas = de('canceled').sort((a, b) => +(b.canceladaEl ?? 0) - +(a.canceladaEl ?? 0)).slice(0, 50);
  const fuera = r.datos.suscripciones.filter((s) => !esDeCartera(s.proyecto)).length;

  return (
    <>
      <section>
        <div className="cifras">
          <div><b>{de('active').length}</b><span>activas</span></div>
          <div><b>{de('trialing').length}</b><span>en prueba</span></div>
          <div><b>{de('past_due').length + de('unpaid').length}</b><span>con pago atrasado</span></div>
          <div><b>{de('canceled').length}</b><span>canceladas</span></div>
        </div>
        <p className="nota">
          {todas ? <>Incluye las {fuera} suscripciones de la cuenta que no son de la cartera. <a href="/control/suscripciones/">Ver solo la cartera</a></>
            : <>Solo suscripciones de la cartera.{fuera ? <> Hay {fuera} más en la cuenta fuera de la cartera: <a href="/control/suscripciones/?todas=1">verlas</a>.</> : null}</>}
        </p>
      </section>
      <section><h2>Próximas renovaciones (30 días)</h2><Tabla lista={renovaciones} fecha={(s) => ['Renueva', s.finPeriodo]} vacio="Ninguna renovación en los próximos 30 días." /></section>
      <section><h2>Con pago atrasado</h2><Tabla lista={[...de('past_due'), ...de('unpaid')]} fecha={(s) => ['Fin del periodo', s.finPeriodo]} vacio="Ninguna." /></section>
      <section><h2>En prueba</h2><Tabla lista={de('trialing')} fecha={(s) => ['Fin de la prueba', s.finPrueba]} vacio="Ninguna." /></section>
      <section><h2>Activas</h2><Tabla lista={de('active')} fecha={(s) => ['Fin del periodo', s.finPeriodo]} vacio="Ninguna todavía." /></section>
      <section><h2>Canceladas</h2><Tabla lista={canceladas} fecha={(s) => ['Cancelada el', s.canceladaEl]} vacio="Ninguna." /></section>
    </>
  );
}
