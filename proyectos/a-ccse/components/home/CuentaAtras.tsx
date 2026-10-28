'use client';
import { useEffect, useState } from 'react';
import { useEstado } from '../Estado';
import type { Locale } from '@/lib/config';
import { CONVOCATORIAS } from '@/lib/convocatorias';

const corta = (iso: string, l: Locale) =>
  new Intl.DateTimeFormat(l === 'zh' ? 'zh-CN' : l, { day: 'numeric', month: 'short' }).format(new Date(iso + 'T12:00:00'));

/** Urgencia real: próxima convocatoria cuyo plazo de inscripción sigue abierto (calculado en el navegador). */
export function CuentaAtras() {
  const { t, locale } = useEstado();
  const [hoy, setHoy] = useState<string | null>(null);
  useEffect(() => setHoy(new Date().toISOString().slice(0, 10)), []);
  if (!hoy) return <div className="h-9" />;
  const c = CONVOCATORIAS.find((x) => (x.cierre ?? x.examen) >= hoy);
  if (!c) return null;
  const limite = c.cierre ?? c.examen;
  const dias = Math.max(0, Math.ceil((new Date(limite + 'T23:59:00').getTime() - Date.now()) / 86400000));
  return (
    <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl bg-tinta px-4 py-2 text-sm font-semibold text-white">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracota opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-terracota" />
      </span>
      <span>{t('home.cuentaAtras', { f: corta(c.examen, locale), c: corta(limite, locale) })}</span>
      <span className="rounded-full bg-terracota px-2 py-0.5">{t('home.quedan', { n: dias })}</span>
    </p>
  );
}
