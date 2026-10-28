/** Nota en l'escala real de l'examen: barra amb la marca del mínim i la nota en punts (27/40) quan n'hi ha. */
export default function Escala({ valor, minim, punts, max, nom, extra }: { valor: number; minim?: number; punts?: number; max?: number; nom: string; extra?: React.ReactNode }) {
  const sota = minim !== undefined && valor < minim;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px]">{nom}{extra}</span>
        <span className="num shrink-0 text-[17px]">{punts !== undefined && max ? <>{punts}<span className="text-terciari">/{max}</span></> : <>{valor}<span className="text-[13px] text-terciari"> %</span></>}</span>
      </div>
      <div className="escala mt-2" aria-hidden="true">
        <div className={`valor ${sota ? 'sota' : ''}`} style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} />
        {minim !== undefined ? <div className="minim" style={{ left: `${minim}%` }} title={`mínim ${minim} %`} /> : null}
      </div>
    </div>
  );
}
