import type { Juicio as TJuicio } from '@/lib/data';

const clase = (v: string) => v.toLowerCase().startsWith('aparcar') ? 'aparcar' : v.toLowerCase().includes('condicion') || v.toLowerCase().includes('solo si') ? 'condiciones' : 'adelante';

export function Veredicto({ texto }: { texto: string }) {
  return <span className={`veredicto ${clase(texto)}`}>{texto}</span>;
}

export function Probabilidad({ valor }: { valor: number }) {
  return (
    <span className="prob" role="img" aria-label={`${valor} % de probabilidad`}>
      <span className="prob-barra"><span className="prob-relleno" style={{ width: `${valor}%` }} /></span>
      <b>{valor} %</b>
    </span>
  );
}

/** El juicio de la idea: probabilidad a 6 meses, veredicto, a favor, en contra y criterio de parada. */
export default function Juicio({ j }: { j: TJuicio }) {
  return (
    <section className="juicio">
      <h2>Juicio a 6 meses</h2>
      <div className="juicio-cab">
        <Probabilidad valor={j.probabilidad} />
        <Veredicto texto={j.veredicto} />
      </div>
      <p className="juicio-exito">Éxito a 6 meses significa: {j.exito}.</p>
      <div className="dos">
        <div><h3>A favor</h3><p>{j.porQue}</p></div>
        <div><h3>En contra</h3><p>{j.contra}</p></div>
      </div>
      <p className="juicio-parada"><b>Criterio de parada:</b> {j.parada}</p>
    </section>
  );
}
