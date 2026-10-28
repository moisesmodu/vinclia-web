'use client';
import Link from 'next/link';
import type { Examen, Idioma, Punt, So } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import type { ResultatDiagnostic } from '@/lib/motor/diagnostic';

/** Pantalla de resultat del diagnòstic: probabilitat, nota per àrea sobre l'estructura oficial, 3 punts febles, 3 sons. */
export default function ResultatDiag({ idioma, resultat, examen, punts, sons, compacte }: { idioma: Idioma; resultat: ResultatDiagnostic; examen: Examen; punts: Punt[]; sons: So[]; compacte?: boolean }) {
  const d = t(idioma).diag;
  const color = resultat.probabilitat >= 65 ? 'text-ok' : resultat.probabilitat >= 40 ? 'text-ocre-oscuro' : 'text-mal';
  return (
    <div>
      <div className="tarjeta text-center">
        <p className="text-sm text-suave">{d.probabilitat} · {examen.curt}</p>
        <p className={`titulos mt-1 text-6xl font-bold ${color}`}>{resultat.probabilitat} %</p>
        <p className="mt-2 text-sm text-suave">{d.repetir}</p>
      </div>
      <div className="tarjeta mt-3">
        <p className="font-semibold">{d.notaArea}</p>
        <div className="mt-3 grid gap-3">
          {resultat.arees.map((a) => {
            const def = examen.arees.find((x) => x.id === a.id)!;
            const part = examen.parts[def.part];
            return (
              <div key={a.id}>
                <div className="flex items-center justify-between text-sm"><span>{def.nom[idioma]} <span className="text-suave">({d.pes} {a.pes} %)</span>{a.estimada ? <span className="etiqueta ml-2">{t(idioma).simulacre.estimat}</span> : null}</span><span className="font-semibold">{a.nota} %</span></div>
                <div className="barra mt-1"><span style={{ width: `${a.nota}%`, background: a.nota >= (a.minim ?? part.minim ?? 60) ? '#7A8F3C' : '#C62F3B' }} /></div>
                {a.minim !== undefined || part.minim ? <p className="mt-0.5 text-xs text-suave">{d.minim} {a.minim ?? part.minim} %</p> : null}
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {(['escrita', 'oral'] as const).map((p) => <div key={p} className={`rounded-xl p-3 ${resultat.parts[p].ok ? 'bg-oliva-claro' : 'bg-[#FBE7E9]'}`}><p className="text-xs text-suave">{t(idioma).simulacre.part[p]}</p><p className="font-semibold">{resultat.parts[p].nota} %{resultat.parts[p].minim !== null ? <span className="font-normal text-suave"> / {d.minim} {resultat.parts[p].minim}</span> : null}</p></div>)}
        </div>
        {examen.aptoGlobal ? <p className="mt-2 text-sm">{t(idioma).simulacre.global}: <strong>{resultat.global} %</strong> <span className="text-suave">({d.minim} {examen.aptoGlobal} %)</span></p> : null}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="tarjeta"><p className="font-semibold">{d.febles}</p><ul className="mt-2 space-y-2 text-sm">{resultat.febles.map((f) => { const p = punts.find((x) => x.id === f.punt); return <li key={f.punt} className="flex items-center justify-between"><span>{p?.nom[idioma] ?? f.punt}</span><span className="text-suave">{f.confianca} %</span></li>; })}</ul></div>
        <div className="tarjeta"><p className="font-semibold">{d.sons}</p>{resultat.oralNota === null || resultat.oralNota === undefined ? <p className="mt-1 text-xs text-suave">{d.senseOral}</p> : null}<ul className="mt-2 space-y-2 text-sm">{resultat.sons.map((id) => { const s = sons.find((x) => x.id === id); return <li key={id}><span className="font-medium">{s?.nom[idioma] ?? id}</span>{s ? <span className="block text-xs text-suave">{s.paraules.slice(0, 4).join(', ')}</span> : null}</li>; })}</ul></div>
      </div>
      {!compacte ? <>
        <p className="mt-4 text-xs leading-relaxed text-suave">{d.explicacio}</p>
        <Link className="boton-ocre mt-4 w-full" href={`/${idioma}/avui`}>{d.crearPla}</Link>
      </> : null}
    </div>
  );
}
