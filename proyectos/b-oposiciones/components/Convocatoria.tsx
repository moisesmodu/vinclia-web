import type { Idioma, Oposicion } from '@/lib/tipos';
import { t } from '@/lib/i18n';

export function fechaLarga(f: string | undefined, idioma: Idioma) {
  if (!f) return '';
  const d = new Date(f + 'T12:00:00');
  return isNaN(d.getTime()) ? f : d.toLocaleDateString(idioma === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Convocatoria({ o, idioma }: { o: Oposicion; idioma: Idioma }) {
  const d = t(idioma);
  const c = o.convocatoria;
  const e = o.examen;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="tarjeta">
        <h2 className="text-lg font-bold">{d.convocatoria}</h2>
        <p className="mt-2 text-sm">
          {c.url ? <a href={c.url} target="_blank" rel="noopener" className="font-semibold text-marca underline">{c.referencia}</a> : <strong>{c.referencia}</strong>}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {c.diario}{c.numero ? ` núm. ${c.numero}` : ''}{c.fecha ? `, ${fechaLarga(c.fecha, idioma)}` : ''}
        </p>
        <p className="mt-2 flex flex-wrap gap-2 text-sm">
          {c.plazas ? <span className="etiqueta">{c.plazas} {d.plazas}</span> : null}
          {c.estado ? <span className="etiqueta">{d.estado[c.estado] ?? c.estado}</span> : null}
        </p>
        {c.verificado && !/primaria/i.test(c.verificado) ? <p className="mt-2 text-xs text-amber-700">⚠ {c.verificado}</p> : null}
      </div>
      <div className="tarjeta">
        <h2 className="text-lg font-bold">{d.formatoExamen}</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          <li>{e.preguntas} {d.preguntas}{e.reserva ? ` + ${e.reserva} reserva` : ''} · {e.opciones} {d.opciones}</li>
          <li>{e.minutos} {d.minutos}</li>
          <li>{e.penalizacion ? `${d.penaliza} ${Math.round(e.penalizacion * 100) / 100 === 0.25 ? '1/4' : Math.round(e.penalizacion * 1000) / 1000} ${idioma === 'ca' ? "d'encert" : 'de acierto'}` : d.sinPenalizacion}</li>
        </ul>
        {e.descripcion?.[idioma] ? <p className="mt-2 text-sm text-slate-600">{e.descripcion[idioma]}</p> : null}
        {e.otrasPruebas?.[idioma]?.length ? (
          <>
            <p className="mt-3 text-sm font-semibold">{d.otrasPruebas}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">{e.otrasPruebas[idioma].map((x) => <li key={x}>{x}</li>)}</ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
