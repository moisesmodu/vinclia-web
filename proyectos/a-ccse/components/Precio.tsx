'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PAIS, precioTexto } from '@/lib/config';
import { useEstado } from './Estado';
import { FormCuenta } from './Cuenta';

export function Precio() {
  const { t, locale, usuario, acceso, listo } = useEstado();
  const sp = useSearchParams();
  const cancelado = sp.get('cancelado');
  const pagarYa = sp.get('pagar') === '1';
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const p = precioTexto(locale);

  async function pagar() {
    setOcupado(true);
    setMsg(null);
    try {
      const r = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale }) });
      const d = await r.json();
      if (d.url) return void (location.href = d.url);
      setMsg(d.error === 'stripe_no_configurado' ? t('precio.noConfig') : t('cuenta.err.generico'));
    } catch {
      setMsg(t('cuenta.err.generico'));
    }
    setOcupado(false);
  }

  // Desde una oferta con ?pagar=1: si ya hay sesión, abre Stripe sin otra pantalla.
  const lanzado = useRef(false);
  useEffect(() => {
    if (pagarYa && listo && usuario && !acceso && !lanzado.current) {
      lanzado.current = true;
      pagar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagarYa, listo, usuario, acceso]);

  return (
    <div className="grid gap-4">
      {cancelado && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-3">
          <p>{t('precio.cancelado')}</p>
          {usuario && !acceso && <button className="boton boton-1 min-h-10 px-3 py-1.5 text-sm" onClick={pagar}>{t('rec.cta')}</button>}
        </div>
      )}
      {/* Estructura común de precio (MARCAS.md §3): gratis, de pago, precio con IVA, cancela en un clic y sello. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="tarjeta p-5">
          <h2 className="text-lg font-bold">{t('precio.gratisT')}</h2>
          <p className="mt-1 text-3xl font-black">0 €</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {[1, 2, 3].map((n) => <li key={n} className="flex gap-2"><span className="text-oro">✓</span>{t(`precio.gratis${n}` as 'precio.gratis1')}</li>)}
          </ul>
        </section>
        <section className="tarjeta border-2 border-terracota p-5">
          <h2 className="text-lg font-bold">{t('precio.pagoT')}</h2>
          <p className="mt-1 text-3xl font-black">{p}</p>
          <p className="text-sm text-suave">{t('precio.iva', { d: PAIS.accesoDias })}</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {[1, 2, 3, 4, 5].map((n) => <li key={n} className="flex gap-2"><span className="text-ok">✓</span>{t(`precio.incluye${n}` as 'precio.incluye1')}</li>)}
          </ul>
        </section>
      </div>
      <p className="rounded-lg bg-oro/15 p-3 text-sm"><b>{t('precio.cancela')}</b></p>
      <p className="rounded-lg bg-green-50 p-3 text-sm">{t('precio.garantia', { p })}</p>
      <p className="text-sm text-suave">{t('precio.comparar', { t: PAIS.convocatoria.tasaEuros })}</p>
      {!listo ? null : acceso ? (
        <div className="tarjeta p-5">
          <p>{t('precio.yaTienes')}</p>
          <Link className="boton boton-1 mt-3" href={`/${locale}/temas`}>{t('pago.empezar')}</Link>
        </div>
      ) : usuario ? (
        <div className="grid gap-2">
          <button disabled={ocupado} onClick={pagar} className="boton boton-1 text-lg">{t('precio.comprar', { p })}</button>
          <p className="text-center text-sm text-suave">{t('precio.seguro')}</p>
          <p className="titulos text-center text-sm font-bold">{t('sello')}</p>
          <p className="text-center text-xs text-suave">{t('precio.desistimiento')} <Link className="underline" href={`/${locale}/legal/condiciones`}>{t('pie.condiciones')}</Link></p>
          {msg && <p role="alert" className="rounded-lg bg-amber-50 p-2 text-sm">{msg}</p>}
        </div>
      ) : (
        <div className="grid gap-2">
          <p className="text-sm text-suave">{t('precio.antes')}</p>
          <FormCuenta despues={pagar} />
        </div>
      )}
    </div>
  );
}
