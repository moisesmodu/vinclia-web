'use client';
import { useEffect, useState } from 'react';

/** Dial de probabilitat: arc de 270° amb l'agulla al valor i una marca fixa al punt d'apte. Es dibuixa una sola vegada. */
export default function Dial({ valor, etiqueta, mida = 220, llindar = 65 }: { valor: number; etiqueta: string; mida?: number; llindar?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setV(valor)); return () => cancelAnimationFrame(id); }, [valor]);
  const r = 86, c = 2 * Math.PI * r, arc = c * 0.75;
  const offset = arc - (arc * Math.max(0, Math.min(100, v))) / 100;
  const ang = (p: number) => (135 + 270 * (p / 100)) * (Math.PI / 180);
  const mx = 100 + Math.cos(ang(llindar)) * r, my = 100 + Math.sin(ang(llindar)) * r;
  const mx2 = 100 + Math.cos(ang(llindar)) * (r + 12), my2 = 100 + Math.sin(ang(llindar)) * (r + 12);
  const color = valor >= llindar ? '#138A5C' : '#2140D6';
  return (
    <div className="relative mx-auto" style={{ width: mida, height: mida * 0.86 }} role="img" aria-label={`${etiqueta}: ${valor} %`}>
      <svg viewBox="0 0 200 180" width={mida} height={mida * 0.9} className="block overflow-visible">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#E9EDFF" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} transform="rotate(135 100 100)" />
        <circle className="dial-arc" cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="14" strokeDasharray={`${arc} ${c}`} strokeDashoffset={offset} transform="rotate(135 100 100)" />
        <line x1={mx} y1={my} x2={mx2} y2={my2} stroke="#141C3A" strokeWidth="3" strokeLinecap="round" />
        <text x="100" y="104" textAnchor="middle" fontFamily="Archivo Variable, Archivo, sans-serif" fontWeight="800" fontStretch="125%" fontSize="56" fill="#141C3A" letterSpacing="-2">{valor}<tspan fontSize="24" dx="2">%</tspan></text>
        <text x="100" y="128" textAnchor="middle" fontFamily="Archivo Variable, Archivo, sans-serif" fontSize="11" fill="#5B6480">{etiqueta}</text>
        <text x={mx2 + (mx2 > 100 ? 4 : -4)} y={my2 + 4} textAnchor={mx2 > 100 ? 'start' : 'end'} fontFamily="Archivo Variable, Archivo, sans-serif" fontSize="10" fill="#141C3A" fontWeight="700">apte</text>
      </svg>
    </div>
  );
}
