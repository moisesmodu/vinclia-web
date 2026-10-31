import { euros } from '@/lib/data';

type Hito = { nombre: string; mensual: number; plazo: string };

/** El camino: una sola pista de 0 al último hito. Lo real en color sólido; lo previsto para el mes 12, rayado. */
export default function Camino({ actual, previsto, hitos }: { actual: number; previsto: number; hitos: Hito[] }) {
  const max = Math.max(...hitos.map((h) => h.mensual), previsto, 1);
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <section className="camino" aria-label="Camino hacia la libertad financiera">
      <div className="camino-cifra">
        <span className="camino-num">{euros(actual)}</span>
        <span className="camino-sub">al mes, recurrentes, hoy</span>
      </div>
      <div className="pista" role="img" aria-label={`Ingresos actuales ${euros(actual)} al mes; previstos en el mes 12 ${euros(previsto)}`}>
        <div className="pista-previsto" style={{ width: pct(previsto) }} />
        <div className="pista-real" style={{ width: pct(actual) }} />
        {hitos.map((h) => (
          <div key={h.nombre} className="hito" style={{ left: pct(h.mensual) }}>
            <span className="hito-marca" />
            <span className="hito-texto">
              <b>{euros(h.mensual)}</b> {h.nombre}
              <small>{h.plazo}</small>
            </span>
          </div>
        ))}
      </div>
      <ul className="hitos-lista" aria-hidden="true">
        {[...hitos].sort((a, b) => a.mensual - b.mensual).map((h) => (
          <li key={h.nombre}><b>{euros(h.mensual)}</b> {h.nombre} <small>{h.plazo}</small></li>
        ))}
      </ul>
      <p className="camino-leyenda">
        <span className="leyenda-real" /> ingresos reales
        <span className="leyenda-previsto" /> previsión del mes 12 en el escenario prudente ({euros(previsto)})
      </p>
    </section>
  );
}
