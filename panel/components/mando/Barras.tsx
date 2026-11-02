'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

// Barras apiladas por día con leyenda que filtra, globo al pasar o tocar y tabla accesible.
// Recibe solo agregados por día (sin datos personales). Colores fijos por entidad: filtrar no repinta.
type Serie = { clave: string; nombre: string; color: string; valores: number[] };

const fmtDia = (d: string) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z'));
const fmtDiaLargo = (d: string) => new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z'));

export default function Barras({ dias, series, formato, alto = 210, vacio = 'Sin datos en este periodo', titulo }: {
  dias: string[]; series: Serie[]; formato: 'euros' | 'numero'; alto?: number; vacio?: string; titulo: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(640);
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const [foco, setFoco] = useState<number | null>(null);

  useEffect(() => {
    const el = caja.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fmt = (v: number) => (formato === 'euros'
    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: Math.abs(v) >= 100_000 ? 0 : 2 }).format(v / 100)
    : v.toLocaleString('es-ES'));
  const fmtEje = (v: number) => (formato === 'euros' ? `${(v / 100).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €` : v.toLocaleString('es-ES'));

  const visibles = series.filter((s) => !ocultas.has(s.clave));
  const totales = useMemo(() => dias.map((_, i) => visibles.reduce((t, s) => t + Math.max(0, s.valores[i]), 0)), [dias, visibles]);
  const maxBruto = Math.max(0, ...totales);
  const vacioTodo = series.every((s) => s.valores.every((v) => v === 0));
  // Escala «bonita»: 1, 2 o 5 × 10^n.
  const max = (() => { if (maxBruto <= 0) return formato === 'euros' ? 1000 : 4; const e = 10 ** Math.floor(Math.log10(maxBruto)); const m = maxBruto / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; })();

  const izq = 44, abajo = 22, arriba = 6;
  const altoP = alto - abajo - arriba;
  const anchoP = ancho - izq;
  const paso = anchoP / dias.length;
  const barra = Math.max(2, paso - (paso > 10 ? 3 : 1.5));
  const y = (v: number) => arriba + altoP - (v / max) * altoP;
  const marcas = [0, max / 2, max];

  return (
    <div className="grafico" ref={caja}>
      <svg width={ancho} height={alto} role="img" aria-label={`${titulo}. Total ${fmt(totales.reduce((a, b) => a + b, 0))}.`}
        onPointerLeave={() => setFoco(null)}
        onPointerMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const i = Math.floor((e.clientX - r.left - izq) / paso); setFoco(i >= 0 && i < dias.length ? i : null); }}>
        {marcas.map((m) => (
          <g key={m}>
            <line className="rejilla-g" x1={izq} x2={ancho} y1={y(m)} y2={y(m)} />
            <text className="eje" x={izq - 8} y={y(m) + 4} textAnchor="end">{fmtEje(m)}</text>
          </g>
        ))}
        {foco != null && <rect className="cursor" x={izq + foco * paso} y={arriba} width={paso} height={altoP} rx="4" />}
        {dias.map((d, i) => {
          let base = 0;
          const capas = visibles.map((s) => ({ s, v: Math.max(0, s.valores[i]) })).filter((c) => c.v > 0);
          return (
            <g key={d}>
              {capas.map((c, j) => {
                const fondo = y(base) - (j > 0 ? 2 : 0); // 2 px de separación entre segmentos
                const tope = y(base + c.v); base += c.v;
                const h = Math.max(1, fondo - tope); const t = fondo - h;
                const x = izq + i * paso + (paso - barra) / 2;
                const r = j === capas.length - 1 ? Math.min(4, barra / 2, h) : 0;
                return <path key={c.s.clave} fill={c.s.color} d={`M${x},${fondo} V${t + r} Q${x},${t} ${x + r},${t} H${x + barra - r} Q${x + barra},${t} ${x + barra},${t + r} V${fondo} Z`} />;
              })}
            </g>
          );
        })}
        {dias.map((d, i) => (i % 7 === (dias.length - 1) % 7 ? <text key={d} className="eje" x={izq + i * paso + paso / 2} y={alto - 5} textAnchor="middle">{fmtDia(d)}</text> : null))}
      </svg>
      {vacioTodo && <div className="vacio-g"><span>{vacio}</span></div>}
      {foco != null && !vacioTodo && (
        <div className="globo" style={{ left: Math.min(Math.max(izq + foco * paso + paso / 2, 95), ancho - 95), top: Math.max(y(totales[foco]), 90) }}>
          <b>{fmtDiaLargo(dias[foco])}</b>
          <ul>
            {visibles.filter((s) => s.valores[foco] !== 0).map((s) => (
              <li key={s.clave}><span className="punto-serie" style={{ background: s.color }} /><span>{s.nombre}</span><span>{fmt(s.valores[foco])}</span></li>
            ))}
            <li className="total"><span /><span>Total</span><span>{fmt(visibles.reduce((t, s) => t + s.valores[foco], 0))}</span></li>
          </ul>
        </div>
      )}
      {series.length > 1 && (
        <div className="leyenda" role="group" aria-label="Mostrar u ocultar series">
          {series.map((s) => {
            const on = !ocultas.has(s.clave);
            const total = s.valores.reduce((a, b) => a + b, 0);
            return (
              <button key={s.clave} type="button" aria-pressed={on} onClick={() => setOcultas((o) => { const n = new Set(o); if (n.has(s.clave)) n.delete(s.clave); else n.add(s.clave); return n; })}>
                <span className="punto-serie" style={{ background: s.color }} />{s.nombre}<span className="t3 num">{fmt(total)}</span>
              </button>
            );
          })}
        </div>
      )}
      <details className="tabla-datos">
        <summary>Ver los datos en tabla</summary>
        <div className="scroll">
          <table className="tabla">
            <thead><tr><th>Día</th>{series.map((s) => <th key={s.clave} className="d">{s.nombre}</th>)}</tr></thead>
            <tbody>{[...dias].reverse().map((d) => { const i = dias.indexOf(d); return <tr key={d}><td>{fmtDia(d)}</td>{series.map((s) => <td key={s.clave} className="d">{fmt(s.valores[i])}</td>)}</tr>; })}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
