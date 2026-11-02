import { Aviso, Caja, fechaHora } from '@/components/mando/Piezas';
import TareaFila from '@/components/mando/TareaFila';
import { contenido } from '@/lib/mando/contenido';
import { ultimasAcciones } from '@/lib/mando/db';
import { WEBS } from '@/lib/mando/entidades';
import { uno, type Busqueda } from '@/lib/mando/filtros';
import { tareasConEstado } from '@/lib/mando/tareas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tareas' };

const GRUPOS = [
  { clave: 'alta', titulo: 'Primero esto' },
  { clave: 'media', titulo: 'Esta semana' },
  { clave: 'baja', titulo: 'Sin prisa' },
] as const;

export default async function Tareas({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const ver = uno(await searchParams, 'ver');
  const vista = (['pendientes', 'hechas', 'todas'] as const).find((v) => v === ver) ?? 'pendientes';
  const [{ lista, aviso }, acciones] = await Promise.all([tareasConEstado(), ultimasAcciones(15)]);
  const hechas = lista.filter((t) => t.hecho).length;
  const pendientes = lista.filter((t) => !t.hecho);
  const minutos = pendientes.reduce((a, t) => a + (t.minutos ?? 0), 0);
  const visibles = lista.filter((t) => (vista === 'todas' ? true : vista === 'hechas' ? t.hecho : !t.hecho));
  const porProyecto = contenido.proyectos.filter((p) => p.paraMoises.length > 0);
  const nombre = (clave: string) => WEBS.find((w) => w.repo === clave)?.nombre ?? contenido.proyectos.find((p) => p.clave === clave)?.nombre ?? clave;

  return (
    <>
      <header className="cab entra">
        <div>
          <h1>Tus tareas</h1>
          <p>Solo lo que exige tu identidad o tus cuentas. Pulsa el círculo cuando esté hecha: se guarda al momento.</p>
        </div>
      </header>
      {aviso && <Aviso titulo="No se pudo leer ni guardar el estado">{aviso}</Aviso>}

      <Caja className="entra entra-2">
        <div className="caja-cab" style={{ marginBottom: 0 }}>
          <div><h2>{hechas} de {lista.length} hechas</h2><small>{pendientes.length ? `Quedan ${pendientes.length}${minutos ? `, unos ${minutos} min con tiempo estimado` : ''}` : 'Nada pendiente'}</small></div>
          <nav className="segmentos" aria-label="Filtrar tareas">
            <a href="/tareas/" aria-current={vista === 'pendientes' ? 'true' : undefined}>Pendientes {pendientes.length}</a>
            <a href="/tareas/?ver=hechas" aria-current={vista === 'hechas' ? 'true' : undefined}>Hechas {hechas}</a>
            <a href="/tareas/?ver=todas" aria-current={vista === 'todas' ? 'true' : undefined}>Todas</a>
          </nav>
        </div>
        <div className="progreso" role="progressbar" aria-valuemin={0} aria-valuemax={lista.length} aria-valuenow={hechas} aria-label="Tareas hechas"><span style={{ width: `${lista.length ? (hechas / lista.length) * 100 : 0}%` }} /></div>
      </Caja>

      {GRUPOS.map((g) => {
        const ts = visibles.filter((t) => t.prioridad === g.clave);
        if (ts.length === 0) return null;
        return (
          <Caja key={g.clave} className="seccion entra entra-3">
            <div className="caja-cab"><h2>{g.titulo}</h2><small>{ts.length}</small></div>
            <ol className="lista">{ts.map((t) => <TareaFila key={t.id} t={t} />)}</ol>
          </Caja>
        );
      })}
      {visibles.length === 0 && <Caja className="seccion"><p className="vacio">{vista === 'hechas' ? 'Todavía no has marcado ninguna.' : 'Todo hecho. Buen trabajo.'}</p></Caja>}

      <div className="rejilla r-md-2 seccion">
        <Caja>
          <details className="plegable">
            <summary className="caja-cab" style={{ marginBottom: 0 }}><h2>Pendientes dentro de cada proyecto</h2><small>{porProyecto.reduce((a, p) => a + p.paraMoises.length, 0)}</small></summary>
            <div style={{ marginTop: 12 }}>
              {porProyecto.map((p) => (
                <div key={p.clave} style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: 4 }}>{nombre(p.clave)}</h3>
                  <ul className="lista">{p.paraMoises.map((x) => <li key={x} className="fila-l"><span className="crece t2" style={{ fontSize: '0.86rem' }}>{x}</span></li>)}</ul>
                </div>
              ))}
            </div>
          </details>
        </Caja>
        <Caja>
          <div className="caja-cab"><h2>Registro</h2><small>lo que se ha hecho desde el panel</small></div>
          {acciones.datos.length === 0 ? <p className="vacio">Sin acciones todavía.</p> : (
            <ul className="lista">{acciones.datos.map((a, i) => <li key={i} className="fila-l"><span className="crece"><b style={{ fontSize: '0.84rem' }}>{a.accion}</b><small>{a.detalle?.titulo ?? a.detalle?.para ?? a.detalle?.id ?? ''}</small></span><small>{fechaHora(a.en)}</small></li>)}</ul>
          )}
        </Caja>
      </div>
      <p className="t3" style={{ fontSize: '0.76rem', marginTop: 12 }}>Las tareas salen de marketing/PARA-MOISES.md y de cartera.json (decisionesPendientes) en cada publicación del panel; el estado «hecha» vive en la base de datos del panel.</p>
    </>
  );
}
