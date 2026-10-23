import type { Lider as TLider } from '@/lib/data';

function Lista({ titulo, items }: { titulo: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="lider-bloque">
      <h3>{titulo}</h3>
      <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

/** Ingeniería inversa de producto del mejor competidor: su modelo, y qué copiamos, mejoramos y adaptamos. */
export default function Lider({ lider, titulo }: { lider: TLider; titulo: string }) {
  const m = lider.modelo ?? {};
  const filas: [string, string | undefined][] = [
    ['Qué promete', m.propuesta], ['Precio', m.precio], ['Embudo', m.embudo], ['Retención', m.retencion],
    ['Captación', m.adquisicion], ['Tecnología', m.tecnologia], ['Cifras', m.metricas],
  ];
  return (
    <section className="lider">
      <h2>{titulo}</h2>
      <p className="lider-cab">
        <b>{lider.url ? <a href={lider.url} target="_blank" rel="noopener">{lider.nombre}</a> : lider.nombre}</b>
        {lider.porQue && <> {lider.porQue}</>}
      </p>
      <dl className="lider-modelo">
        {filas.filter(([, v]) => v).map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        {m.funciones?.length ? (
          <div><dt>Funciones</dt><dd><ol className="compacta">{m.funciones.map((f, i) => <li key={i}>{f}</li>)}</ol></dd></div>
        ) : null}
      </dl>
      <div className="lider-grid">
        <Lista titulo="Lo que le funciona" items={lider.loQueFunciona} />
        <Lista titulo="Donde falla" items={lider.loQueFalla} />
      </div>
      <div className="lider-grid tres">
        <Lista titulo="Copiamos" items={lider.copiar} />
        <Lista titulo="Mejoramos" items={lider.mejorar} />
        <Lista titulo="Adaptamos" items={lider.adaptar} />
      </div>
      {lider.planAccion?.length ? (
        <div className="lider-bloque plan">
          <h3>Plan para superarlo</h3>
          <ol className="tareas">{lider.planAccion.map((x, i) => <li key={i}>{x}</li>)}</ol>
        </div>
      ) : null}
    </section>
  );
}
