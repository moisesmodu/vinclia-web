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
    <div className="grid gap-6">
      <div aria-live="polite">
        <p className="text-[15px] text-secundari">{d.nota}</p>
        <p className="num text-[56px] leading-none">{r.nota.punts}<span className="text-[26px] text-terciari">/{r.nota.max}</span></p>
        <p className="mt-2 text-[13px] text-terciari">{r.motor.includes('lt') ? d.motor.lt : d.motor.regles}{r.motor.includes('llm') ? ` + ${d.motor.llm}` : ''} · {(r.ms / 1000).toFixed(1)} s</p>
        {orientativa ? <p className="mt-3 rounded-[6px] bg-boli-tenue p-3 text-[14px] text-boli">{d.senseLlm}</p> : null}
      </div>
      <div className="grid gap-4">
        {(Object.keys(r.criteris) as (keyof typeof r.criteris)[]).map((k) => <div key={k}><div className="flex items-baseline justify-between text-[15px]"><span className="font-semibold">{d.criteris[k]}{r.criteris[k].orientativa ? <span className="xip ml-2">{d.orientativa}</span> : null}</span><span className="num">{r.criteris[k].nota}<span className="text-terciari">/10</span></span></div><div className="barra mt-1.5"><span style={{ width: `${r.criteris[k].nota * 10}%`, background: r.criteris[k].nota < 5 ? '#B9342E' : r.criteris[k].nota < 7 ? '#E0B23A' : '#7A8F3C' }} /></div>{r.criteris[k].comentari ? <p className="mt-1 text-[14px] text-secundari">{r.criteris[k].comentari}</p> : null}</div>)}
      </div>
      {r.prioritaris.length ? (
        <div className="regla">
          <p className="font-semibold">{d.errorsPrioritaris}</p>
          <ol className="mt-3 space-y-3 text-[15px]">{r.prioritaris.map((e, i) => { const reg = regles?.[e.regla ?? '']; return <li key={i} className="grid grid-cols-[20px_1fr] gap-2"><span className="num text-boli">{i + 1}</span><div><span className="text-vermell line-through decoration-2">{e.fragment}</span> → <strong className="text-apte">{e.forma}</strong><p className="mt-1 text-secundari">{e.explicacio}</p>{reg ? <a className="text-[13px] underline" href={reg.font.url} target="_blank" rel="noopener noreferrer">{reg.titol.ca} · {reg.font.nom}</a> : null}</div></li>; })}</ol>
          {onReescriure ? <button type="button" className="boton-sec mt-4 w-full bg-paper" onClick={onReescriure}>{d.reescriu}</button> : null}
        </div>
      ) : null}
      {r.possibles.length ? <div><p className="font-semibold">{d.possibles}</p><ul className="mt-2 space-y-1 text-[15px]">{r.possibles.map((p, i) => <li key={i}><span className="rounded bg-boli-tenue px-1">{p.fragment}</span> <span className="text-secundari">{p.dubte}</span></li>)}</ul></div> : null}
      <div className="full"><p className="full-cap">{t(idioma).nou.toqueixParaula}</p><p className="mt-3 text-[16px] leading-relaxed whitespace-pre-wrap">{marcat.map((p, i) => p.e ? <span key={i} className="rounded bg-vermell-tenue text-vermell underline decoration-vermell decoration-2 underline-offset-2" title={`${p.e.forma}`} tabIndex={0}>{p.t}</span> : p.p ? <span key={i} className="rounded bg-boli-tenue" title="?">{p.t}</span> : <span key={i}>{p.t}</span>)}</p>{r.resum ? <p className="linia mt-4 pt-3 text-[15px]">{r.resum}</p> : null}</div>
    </div>
  );
}
