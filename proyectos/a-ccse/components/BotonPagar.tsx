'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { precioTexto } from '@/lib/config';
import { useEstado } from './Estado';

/** «Quiero esto» → Stripe en una pantalla si ya hay cuenta; si no, a /precio, que crea la cuenta y abre el pago seguido. */
export function BotonPagar({ etiqueta, clase = 'boton boton-1' }: { etiqueta?: string; clase?: string }) {
  const { t, locale, usuario } = useEstado();
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const texto = etiqueta ?? t('oferta.boton', { p: precioTexto(locale) });
  async function ir() {
    if (!usuario) return router.push(`/${locale}/precio?pagar=1`);
    setOcupado(true);
    try {
      const r = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale }) });
      const d = await r.json();
      if (d.url) return void (location.href = d.url);
    } catch {}
    setOcupado(false);
    router.push(`/${locale}/precio`);
  }
  return <button type="button" disabled={ocupado} onClick={ir} className={clase}>{texto}</button>;
}
