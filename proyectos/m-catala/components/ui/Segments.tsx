/** Progrés segmentat: un segment per pas; el pas actual en boli, els fets en tinta. */
export default function Segments({ total, actual, className = '' }: { total: number; actual: number; className?: string }) {
  const n = Math.max(1, Math.min(total, 40));
  return <div className={`segments ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={actual}>{Array.from({ length: n }, (_, i) => { const pos = Math.floor((i * total) / n); return <span key={i} className={pos < actual ? 'fet' : pos === actual ? 'actual' : ''} />; })}</div>;
}
