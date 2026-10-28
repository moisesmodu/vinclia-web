'use client';
import { useMemo } from 'react';
import type { Idioma, Regla } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import type { ResultatCorreccio } from '@/lib/correccio';

/** Resultat de la correcció per criteris: nota en l'escala de l'examen, 4 criteris, 3 errors prioritaris amb la forma normativa i
 *  la regla, «possibles errors» quan la IA dubta i el text amb els errors marcats. */
export default function Correccio({ idioma, r, text, regles, onReescriure }: { idioma: Idioma; r: ResultatCorreccio; text: string; regles?: Record<string, Regla>; onReescriure?: () => void }) {
  const d = t(idioma).escriure;
  const marcat = useMemo(() => {
    const parts: { t: string; e?: ResultatCorreccio['errors'][number]; p?: boolean }[] = [];
    const marques = [...r.errors.map((e) => ({ ...e, tipus: 'e' as const })), ...r.possibles.filter((p) => p.offset !== undefined).map((p) => ({ offset: p.offset!, length: p.fragment.length, tipus: 'p' as const, fragment: p.fragment, forma: '', regla: '', missatge: { ca: p.dubte, es: p.dubte }, segur: false, origen: 'llm' as const }))].sort((a, b) => a.offset - b.offset);
    let pos = 0;
    for (const m of marques) { if (m.offset < pos) continue; parts.push({ t: text.slice(pos, m.offset) }); parts.push({ t: text.slice(m.offset, m.offset + m.length), e: m.tipus === 'e' ? m : undefined, p: m.tipus === 'p' }); pos = m.offset + m.length; }
    parts.push({ t: text.slice(pos) });
    return parts;
  }, [r, text]);
  const orientativa = Object.values(r.criteris).some((c) => c.orientativa);
  return (
    <div className="grid gap-3">
      <div className="tarjeta text-center">
        <p className="text-sm text-suave">{d.nota}</p>
        <p className="titulos mt-1 text-5xl font-bold">{r.nota.punts}<span className="text-2xl text-suave"> / {r.nota.max}</span></p>
        <p className="mt-1 text-xs text-suave">{r.motor.includes('lt') ? d.motor.lt : d.motor.regles}{r.motor.includes('llm') ? ` + ${d.motor.llm}` : ''} · {(r.ms / 1000).toFixed(1)} s</p>
        {orientativa ? <p className="mt-2 rounded-lg bg-ocre-claro p-2 text-xs text-ocre-oscuro">{d.senseLlm}</p> : null}
      </div>
      <div className="tarjeta">
        <div className="grid gap-3">
          {(Object.keys(r.criteris) as (keyof typeof r.criteris)[]).map((k) => <div key={k}><div className="flex items-center justify-between text-sm"><span className="font-semibold">{d.criteris[k]}{r.criteris[k].orientativa ? <span className="etiqueta ml-2">{d.orientativa}</span> : null}</span><span>{r.criteris[k].nota} / 10</span></div><div className="barra mt-1"><span style={{ width: `${r.criteris[k].nota * 10}%` }} /></div>{r.criteris[k].comentari ? <p className="mt-1 text-xs text-suave">{r.criteris[k].comentari}</p> : null}</div>)}
        </div>
      </div>
      {r.prioritaris.length ? (
        <div className="tarjeta">
          <p className="font-semibold">{d.errorsPrioritaris}</p>
          <ol className="mt-2 space-y-3 text-sm">{r.prioritaris.map((e, i) => { const reg = regles?.[e.regla ?? '']; return <li key={i}><span className="rounded bg-[#FBE7E9] px-1 text-mal line-through">{e.fragment}</span> → <strong className="text-ok">{e.forma}</strong><p className="mt-1 text-suave">{e.explicacio}</p>{reg ? <a className="text-xs underline" href={reg.font.url} target="_blank" rel="noopener noreferrer">{reg.titol.ca} · {reg.font.nom}</a> : null}</li>; })}</ol>
          {onReescriure ? <button type="button" className="boton-sec mt-3 w-full" onClick={onReescriure}>{d.reescriu}</button> : null}
        </div>
      ) : null}
      {r.possibles.length ? <div className="tarjeta"><p className="font-semibold">{d.possibles}</p><ul className="mt-2 space-y-1 text-sm">{r.possibles.map((p, i) => <li key={i}><span className="rounded bg-ocre-claro px-1">{p.fragment}</span> <span className="text-suave">{p.dubte}</span></li>)}</ul></div> : null}
      <div className="tarjeta"><p className="text-sm leading-relaxed whitespace-pre-wrap">{marcat.map((p, i) => p.e ? <span key={i} className="rounded bg-[#FBE7E9] text-mal" title={`${p.e.forma}`}>{p.t}</span> : p.p ? <span key={i} className="rounded bg-ocre-claro" title="?">{p.t}</span> : <span key={i}>{p.t}</span>)}</p>{r.resum ? <p className="mt-3 border-t border-[#EADFCF] pt-3 text-sm">{r.resum}</p> : null}</div>
    </div>
  );
}
