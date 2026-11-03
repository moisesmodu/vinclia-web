'use client';
import { useOptimistic, useRef, useState, useTransition } from 'react';
import { Check, CheckCircle, Copy, PaperPlaneTilt } from '@phosphor-icons/react';
import { enviarCorreos, marcarPieza, marcarTarea, type ResultadoCorreo } from '@/app/(mando)/acciones';

/** Botón «Hecho» de una tarea: cambia al instante y se guarda en la base del panel. */
export function BotonHecho({ id, hecho, titulo }: { id: string; hecho: boolean; titulo: string }) {
  const [optimo, setOptimo] = useOptimistic(hecho);
  const [, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
      <button type="button" className="check" aria-pressed={optimo} aria-label={optimo ? `Marcar «${titulo}» como pendiente` : `Marcar «${titulo}» como hecha`}
        onClick={() => empezar(async () => {
          setError(null); setOptimo(!optimo);
          const r = await marcarTarea(id, !optimo);
          if (!r.ok) setError(r.mensaje);
        })}>
        <Check weight="bold" aria-hidden="true" />
      </button>
      {error && <small role="alert" style={{ color: 'var(--baja)', fontSize: '0.7rem', maxWidth: 90, textAlign: 'center' }}>No se guardó</small>}
    </span>
  );
}

/** «Publicado ✓» de una pieza de marketing. */
export function BotonPublicado({ id, publicado }: { id: string; publicado: boolean }) {
  const [optimo, setOptimo] = useOptimistic(publicado);
  const [, empezar] = useTransition();
  const [error, setError] = useState(false);
  return (
    <button type="button" className={`boton peque${optimo ? ' primario' : ''}`} aria-pressed={optimo}
      onClick={() => empezar(async () => { setError(false); setOptimo(!optimo); const r = await marcarPieza(id, !optimo); if (!r.ok) setError(true); })}>
      {optimo ? <CheckCircle weight="fill" aria-hidden="true" /> : <Check weight="bold" aria-hidden="true" />}
      {error ? 'No se guardó' : optimo ? 'Publicado' : 'Marcar publicado'}
    </button>
  );
}

/** Copia el texto de un elemento de la página (así el texto no viaja dos veces). */
export function Copiar({ objetivo, etiqueta = 'Copiar texto' }: { objetivo: string; etiqueta?: string }) {
  const [hecho, setHecho] = useState(false);
  return (
    <button type="button" className="boton peque" aria-controls={objetivo} onClick={async () => {
      const texto = document.getElementById(objetivo)?.textContent ?? '';
      try { await navigator.clipboard.writeText(texto); } catch {
        const t = document.createElement('textarea'); t.value = texto; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
      }
      setHecho(true); setTimeout(() => setHecho(false), 1800);
    }}>
      {hecho ? <CheckCircle weight="fill" aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{hecho ? 'Copiado' : etiqueta}</span>
    </button>
  );
}

type CorreoMin = { clave: string; para: string; asunto: string };

/** Envía uno o varios correos tras confirmar en un diálogo. La server action impide reenviar. */
export function EnviarCorreos({ correos, etiqueta, primario = false, modo }: { correos: CorreoMin[]; etiqueta: string; primario?: boolean; modo: 'real' | 'simulacion' }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [pendiente, empezar] = useTransition();
  const [resultado, setResultado] = useState<{ mensaje: string; resultados: ResultadoCorreo[]; ok: boolean } | null>(null);
  const abrir = () => { setResultado(null); dialogo.current?.showModal(); };
  return (
    <>
      <button type="button" className={`boton${primario ? ' primario' : ' peque'}`} onClick={abrir} disabled={correos.length === 0}>
        <PaperPlaneTilt weight={primario ? 'fill' : 'regular'} aria-hidden="true" />{etiqueta}
      </button>
      <dialog ref={dialogo} className="confirmar" aria-labelledby="tit-confirmar" onClose={() => setResultado(null)}>
        <div className="dialogo">
          {!resultado ? (
            <>
              <h2 id="tit-confirmar">{correos.length === 1 ? '¿Enviar este correo?' : `¿Enviar ${correos.length} correos?`}</h2>
              <p className="t2" style={{ fontSize: '0.88rem' }}>
                {modo === 'real' ? 'Saldrán ahora por Resend, desde el remitente de cada marca. Un correo enviado no se puede repetir desde el panel.' : 'Modo simulación: no saldrá ningún correo, solo se comprueba el flujo.'}
              </p>
              <ul>{correos.map((c) => <li key={c.clave}><b>{c.para}</b>: {c.asunto}</li>)}</ul>
              <div className="botones">
                <button type="button" className="boton" onClick={() => dialogo.current?.close()} disabled={pendiente}>Cancelar</button>
                <button type="button" className="boton primario" disabled={pendiente} onClick={() => empezar(async () => {
                  const r = await enviarCorreos(correos.map((c) => c.clave));
                  setResultado({ mensaje: r.mensaje, resultados: r.resultados, ok: r.ok });
                })}>
                  <PaperPlaneTilt weight="fill" aria-hidden="true" />{pendiente ? 'Enviando…' : modo === 'real' ? 'Sí, enviar' : 'Sí, simular'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 id="tit-confirmar">{resultado.ok ? 'Listo' : 'Revisa el resultado'}</h2>
              <p role="status">{resultado.mensaje}</p>
              <ul>{resultado.resultados.map((r) => <li key={r.clave}><b>{r.para}</b>: {r.estado}{r.detalle ? ` · ${r.detalle}` : ''}</li>)}</ul>
              <div className="botones"><button type="button" className="boton primario" onClick={() => dialogo.current?.close()}>Cerrar</button></div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
