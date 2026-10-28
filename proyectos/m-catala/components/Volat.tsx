/** En Volat: el punt volat (l·l) amb cara. Personatge d'Aprova (MARCA.md). Un cercle, dos ulls amb reflex, una boca.
 *  `to` = color del cos; `cara` = color dels ulls i la boca. Postures: neutre, content, pensa, sorpres, vola. */
export type Postura = 'neutre' | 'content' | 'pensa' | 'sorpres' | 'vola';

export default function Volat({ mida = 48, postura = 'neutre', to = '#2140D6', cara = '#141C3A', reflex = '#FFFFFF', className = '', aterra = false, titol }: {
  mida?: number; postura?: Postura; to?: string; cara?: string; reflex?: string; className?: string; aterra?: boolean; titol?: string;
}) {
  const content = postura === 'content';
  const pensa = postura === 'pensa';
  const sorpres = postura === 'sorpres';
  const vola = postura === 'vola';
  return (
    <svg viewBox="-10 -10 120 120" width={mida} height={mida} className={`${aterra ? 'volat-aterra ' : ''}${className}`} role={titol ? 'img' : undefined} aria-label={titol} aria-hidden={titol ? undefined : true}>
      {vola ? <g stroke={to} strokeWidth="6" strokeLinecap="round" fill="none" opacity=".55"><path d="M-6 42h22" /><path d="M-2 58h16" /></g> : null}
      <circle cx="50" cy="50" r="48" fill={to} />
      {content ? (
        <g stroke={cara} strokeWidth="7" strokeLinecap="round" fill="none"><path d="M26 46q8-10 16 0" /><path d="M58 46q8-10 16 0" /></g>
      ) : (
        <g className="volat-ulls">
          <ellipse cx={pensa ? 36 : 34} cy={pensa ? 40 : sorpres ? 44 : 46} rx={sorpres ? 8 : 6.5} ry={sorpres ? 11 : 9} fill={cara} />
          <ellipse cx={pensa ? 68 : 66} cy={pensa ? 38 : sorpres ? 44 : 46} rx={sorpres ? 8 : 6.5} ry={sorpres ? 11 : 9} fill={cara} />
          <circle cx={pensa ? 38.5 : 36.5} cy={pensa ? 37 : sorpres ? 40 : 43} r="2.4" fill={reflex} />
          <circle cx={pensa ? 70.5 : 68.5} cy={pensa ? 35 : sorpres ? 40 : 43} r="2.4" fill={reflex} />
        </g>
      )}
      {pensa ? <path d="M58 24q10-6 18 0" stroke={cara} strokeWidth="5" strokeLinecap="round" fill="none" /> : null}
      {content ? <path d="M36 62q14 14 28 0" stroke={cara} strokeWidth="6" strokeLinecap="round" fill="none" />
        : sorpres ? <ellipse cx="50" cy="68" rx="7" ry="9" fill={cara} />
        : pensa ? <path d="M42 68h14" stroke={cara} strokeWidth="5" strokeLinecap="round" />
        : <path d="M41 64q9 8 18 0" stroke={cara} strokeWidth="5.5" strokeLinecap="round" fill="none" />}
    </svg>
  );
}
