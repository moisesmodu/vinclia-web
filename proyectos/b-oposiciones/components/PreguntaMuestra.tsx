import type { Idioma, Pregunta } from '@/lib/tipos';
import { t } from '@/lib/i18n';

/** Pregunta en página pública. Si es gratuita se muestra la respuesta y la explicación; si no, solo el enunciado. */
export default function PreguntaMuestra({ p, idioma, conRespuesta }: { p: Pick<Pregunta, 'id' | 'ca' | 'es'> & Partial<Pregunta>; idioma: Idioma; conRespuesta: boolean }) {
  const d = t(idioma);
  const x = p[idioma];
  return (
    <div className="tarjeta">
      <p className="font-semibold">{x.enunciado}</p>
      <ol className="mt-3 space-y-2">
        {x.opciones.map((o, i) => (
          <li key={i} className={`rounded-lg border px-3 py-2 text-sm ${conRespuesta && i === p.correcta ? 'border-ok bg-green-50 font-semibold' : 'border-slate-200'}`}>
            <span className="mr-2 font-bold text-slate-500">{'abcd'[i]})</span>{o}
          </li>
        ))}
      </ol>
      {conRespuesta && p.fuente ? (
        <div className="mt-3 text-sm text-slate-700">
          <p><strong>{d.app.explicacion}:</strong> {x.explicacion}</p>
          <p className="mt-1 text-xs text-slate-500">
            {p.fuente.url ? <a className="text-marca underline" href={p.fuente.url} rel="nofollow noopener" target="_blank">{p.fuente.norma}{p.fuente.articulo ? `, art. ${p.fuente.articulo}` : ''}</a> : <>{p.fuente.norma}</>}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{d.verRespuesta}</p>
      )}
    </div>
  );
}
