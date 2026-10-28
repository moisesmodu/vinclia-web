'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PAIS, precioTexto } from '@/lib/config';
import { useEstado } from './Estado';
import { FormCuenta } from './Cuenta';

export function Precio() {
  const { t, locale, usuario, acceso, listo } = useEstado();
  const cancelado = useSearchParams().get('cancelado');
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

  return (
    <div className="grid gap-4">
      {cancelado && <p className="rounded-lg bg-amber-50 p-3">{t('precio.cancelado')}</p>}
      <div className="tarjeta border-2 border-marca p-6">
        <p className="text-5xl font-black">{p}</p>
        <p className="mt-1 text-suave">{t('precio.pago', { p, d: PAIS.accesoDias })}</p>
        <ul className="mt-4 grid gap-2">
          {[1, 2, 3, 4, 5].map((n) => <li key={n} className="flex gap-2"><span className="text-ok">✓</span>{t(`precio.incluye${n}` as 'precio.incluye1')}</li>)}
        </ul>
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm">{t('precio.garantia', { p })}</p>
        <p className="mt-2 text-sm text-suave">{t('precio.comparar', { t: PAIS.convocatoria.tasaEuros })}</p>
      </div>
      {!listo ? null : acceso ? (
        <div className="tarjeta p-5">
          <p>{t('precio.yaTienes')}</p>
          <Link className="boton boton-1 mt-3" href={`/${locale}/temas`}>{t('pago.empezar')}</Link>
        </div>
      ) : usuario ? (
        <div className="grid gap-2">
          <button disabled={ocupado} onClick={pagar} className="boton boton-1 text-lg">{t('precio.comprar', { p })}</button>
          <p className="text-center text-sm text-suave">{t('precio.seguro')}</p>
          {msg && <p role="alert" className="rounded-lg bg-amber-50 p-2 text-sm">{msg}</p>}
        </div>
      ) : (
        <div className="grid gap-2">
          <p className="text-sm text-suave">{t('precio.antes')}</p>
          <FormCuenta />
        </div>
      )}
    </div>
  );
}
