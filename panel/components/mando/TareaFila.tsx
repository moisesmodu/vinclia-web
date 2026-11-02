import { ArrowSquareOut, Clock, Laptop } from '@phosphor-icons/react/dist/ssr';
import type { TareaEstado } from '@/lib/mando/tareas';
import { BotonHecho } from './Interacciones';
import { fechaHora } from './Piezas';

const NIVEL = { alta: 'Alta', media: 'Media', baja: 'Baja' };

export default function TareaFila({ t, compacta = false }: { t: TareaEstado; compacta?: boolean }) {
  return (
    <li className={`tarea${t.hecho ? ' hecha' : ''}`}>
      <BotonHecho id={t.id} hecho={t.hecho} titulo={t.titulo} />
      <div>
        <p className="tarea-tit">{t.titulo}</p>
        <div className="tarea-meta">
          <span className={`chip prio-${t.prioridad}`}>Prioridad {NIVEL[t.prioridad].toLowerCase()}</span>
          {t.minutos ? <span className="chip"><Clock aria-hidden="true" />{t.tiempo || `${t.minutos} min`}</span> : null}
          {t.hecho && t.hechoEn ? <span className="chip">Hecha {fechaHora(t.hechoEn)}</span> : null}
          {!compacta && <span className="t3" style={{ fontSize: '0.74rem' }}>{t.origen}</span>}
        </div>
        {!compacta && t.detalle ? <p className="det">{t.detalle}</p> : null}
        {!compacta && t.porque ? <p className="det"><b>Por qué:</b> {t.porque}</p> : null}
        {(t.enlaces.length > 0 || t.ubicacion) && (
          <div className="enlaces">
            {t.enlaces.slice(0, compacta ? 2 : 6).map((e) => (
              <a key={e.url} className="enlace-p" href={e.url} {...(e.interno ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                {e.texto}{e.interno ? null : <ArrowSquareOut aria-hidden="true" />}
              </a>
            ))}
            {t.ubicacion ? <span className="enlace-p" title="Archivo en tu Mac"><Laptop aria-hidden="true" /><span className="mono">{t.ubicacion}</span></span> : null}
          </div>
        )}
      </div>
    </li>
  );
}
