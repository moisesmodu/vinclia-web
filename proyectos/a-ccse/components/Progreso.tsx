'use client';
import Link from 'next/link';
import { preparacion } from '@/lib/progreso';
import { PREGUNTAS, TAREAS } from '@/lib/preguntas';
import { futuras } from '@/lib/convocatorias';
import { fechaLarga } from '@/lib/i18n';
import { useEstado } from './Estado';

export function PanelProgreso() {
  const { t, locale, progreso, listo, usuario, setConvocatoria } = useEstado();
  if (!listo) return <p>{t('comun.cargando')}</p>;
  const prep = preparacion(progreso, PREGUNTAS.length);
  const porTema = TAREAS.map((n) => {
    const regs = PREGUNTAS.filter((p) => p.tarea === n).map((p) => progreso.preguntas[p.id]).filter(Boolean);
    const a = regs.reduce((s, r) => s + r.a, 0), f = regs.reduce((s, r) => s + r.f, 0);
    return { n, pct: a + f ? Math.round((100 * a) / (a + f)) : null, vistas: regs.length };
  });
  const dias = progreso.convocatoria ? Math.ceil((new Date(progreso.convocatoria + 'T09:00:00').getTime() - Date.now()) / 86400000) : null;
  return (
    <div className="grid gap-4">
      <p className={`rounded-xl p-3 text-sm ${usuario ? 'bg-green-50' : 'bg-amber-50'}`}>
        {usuario ? t('prog.sincronizado') : <>{t('prog.local')} <Link className="underline" href={`/${locale}/cuenta`}>{t('cuenta.crear')}</Link></>}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="tarjeta p-5 text-center">
          <p className="text-sm text-suave">{t('prog.preparacion')}</p>
          <p className="text-4xl font-black text-marca">{prep.indice}%</p>
        </div>
        <div className="tarjeta p-5 text-center">
          <p className="text-sm text-suave">{t('prog.dominadas')}</p>
          <p className="text-4xl font-black">{prep.dominadas}<span className="text-lg text-suave">/{PREGUNTAS.length}</span></p>
        </div>
        <div className="tarjeta p-5 text-center">
          <p className="text-sm text-suave">{t('prog.convocatoria')}</p>
          {dias !== null && dias >= 0 ? <p className="text-2xl font-black">{t('prog.faltan', { n: dias })}</p> : null}
          <select className="mt-2 w-full rounded-lg border p-2 text-sm" value={progreso.convocatoria ?? ''} onChange={(e) => setConvocatoria(e.target.value)}>
            <option value="">{t('prog.elige')}</option>
            {futuras().map((c) => <option key={c.examen} value={c.examen}>{fechaLarga(c.examen, locale)}</option>)}
          </select>
        </div>
      </div>
      <div className="tarjeta p-5">
        <h2 className="font-bold">{t('prog.porTema')}</h2>
        <ul className="mt-3 grid gap-3">
          {porTema.map((x) => (
            <li key={x.n}>
              <div className="flex justify-between text-sm"><span>{t(`tarea.${x.n}` as 'tarea.1')}</span><span>{x.pct === null ? '—' : `${x.pct}%`}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded bg-black/10"><div className="h-full bg-ok" style={{ width: `${x.pct ?? 0}%` }} /></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="tarjeta p-5">
        <h2 className="font-bold">{t('prog.simulacros')}</h2>
        {progreso.simulacros.length === 0 ? (
          <p className="mt-2 text-suave">{t('prog.ninguno')}</p>
        ) : (
          <ul className="mt-2 grid gap-1">
            {[...progreso.simulacros].reverse().slice(0, 10).map((s) => (
              <li key={s.fecha} className="flex justify-between border-b border-black/5 py-1 text-sm">
                <span>{fechaLarga(new Date(s.fecha), locale)}</span>
                <span className={s.aciertos >= 15 ? 'font-bold text-ok' : 'font-bold text-mal'}>{s.aciertos}/{s.total}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
