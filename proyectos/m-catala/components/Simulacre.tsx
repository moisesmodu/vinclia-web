'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Area, Convocatoria, Examen, Idioma, Item, Punt, Regla, Simulacre as Sim, So, Tasca, TextCL } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { avaluar } from '@/lib/motor/avaluar';
import { probabilitatAprovar, type NotesArea } from '@/lib/motor/diagnostic';
import { novaTargeta, revisar } from '@/lib/motor/repas';
import { registrarDia, avuiISO } from '@/lib/motor/ratxa';
import type { ResultatCorreccio } from '@/lib/correccio';
import ItemVista from './ItemVista';
import Editor, { Temporitzador } from './Editor';
import ResultatDiag from './ResultatDiag';

type Props = { idioma: Idioma; sim: Sim; examen: Examen; items: Item[]; textos: Record<string, TextCL>; tasques: Record<string, Tasca>; regles: Record<string, Regla>; punts: Punt[]; sons: So[]; convocatories: Convocatoria[] };
type Fase = 'intro' | Area | 'resultat';

/** Simulacre escrit complet amb l'estructura oficial: àrees en l'ordre de l'examen, rellotge real per àrea, mínims i apte o no apte, cohort. */
export default function Simulacre({ idioma, sim, examen, items, textos, tasques, regles, punts, sons, convocatories }: Props) {
  const d = t(idioma).simulacre;
  const [estat, actualitzar] = useEstat();
  const arees = useMemo(() => examen.arees.filter((a) => a.part === 'escrita' && (sim.arees as Record<string, unknown>)[a.id]), [examen, sim]);
  const [fase, setFase] = useState<Fase>('intro');
  const [idx, setIdx] = useState(0);
  const [encerts, setEncerts] = useState<Record<string, { ok: number; total: number }>>({});
  const [errorsUs, setErrorsUs] = useState<Item[]>([]);
  const [escrit, setEscrit] = useState<number[]>([]);
  const [cohort, setCohort] = useState<{ n: number; percentil: number | null } | null>(null);
  const [err, setErr] = useState('');
  const [resultat, setResultat] = useState<ReturnType<typeof probabilitatAprovar> | null>(null);
  const perId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const itemsUs = useMemo(() => (sim.arees.us?.items ?? []).map((id) => perId.get(id)).filter((x): x is Item => !!x), [sim, perId]);
  const tasquesEscrit = useMemo(() => [sim.arees.escrit?.tasca, ...(sim.arees.escrit?.tasques ?? [])].filter((x): x is string => !!x).map((id) => tasques[id]).filter(Boolean), [sim, tasques]);
  const textosArea = (a: 'co' | 'lectura') => (sim.arees[a]?.textos ?? []).map((id) => textos[id]).filter(Boolean);
  const preguntesDe = (a: 'co' | 'lectura') => textosArea(a).flatMap((tx) => tx.preguntes.map((p) => ({ tx, p })));
  const [pIdx, setPIdx] = useState(0);
  const [escoltes, setEscoltes] = useState<Record<string, number>>({});

  const area = fase !== 'intro' && fase !== 'resultat' ? arees[idx] : null;
  const seguentArea = () => { setPIdx(0); if (idx + 1 < arees.length) { setIdx(idx + 1); setFase(arees[idx + 1].id); } else acabar(); };

  const comencar = async () => {
    setErr('');
    try { const r = await fetch('/api/simulacre', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ inici: true, nivell: sim.nivell, nota: 0 }) }); if (r.status === 402) { setErr(d.quotaEsgotada); return; } } catch {}
    actualitzar((e) => ({ ...e, quotes: { ...e.quotes, simulacres: e.quotes.simulacres + 1 } }));
    setIdx(0); setFase(arees[0].id);
  };

  const puntua = (a: string, ok: boolean) => setEncerts((e) => ({ ...e, [a]: { ok: (e[a]?.ok ?? 0) + (ok ? 1 : 0), total: (e[a]?.total ?? 0) + 1 } }));

  const acabar = () => {
    const notes: NotesArea = {};
    for (const a of arees) {
      if (a.id === 'escrit') notes.escrit = escrit.length ? Math.round(escrit.reduce((s, x) => s + x, 0) / escrit.length) : 0;
      else { const e = encerts[a.id]; notes[a.id] = e?.total ? Math.round((100 * e.ok) / e.total) : 0; }
    }
    const oralDiag = estat?.diagnostic?.arees.find((x) => x.id === 'oral');
    if (oralDiag) notes.oral = oralDiag.nota;
    const r = probabilitatAprovar(examen, notes);
    const apte = r.parts.escrita.ok && (examen.aptoGlobal ? r.global >= examen.aptoGlobal : true) && r.arees.filter((x) => x.minim !== undefined && x.id !== 'oral').every((x) => x.nota >= x.minim!);
    setResultat(r);
    actualitzar((e) => {
      const targetes = { ...e.targetes };
      for (const it of errorsUs) targetes[it.id] = targetes[it.id] ? revisar(targetes[it.id], false) : revisar(novaTargeta(it.id, it.punt), false);
      return { ...e, targetes, ratxa: registrarDia(e.ratxa), simulacres: [...e.simulacres.slice(-30), { id: sim.id, data: new Date().toISOString(), nivell: sim.nivell, nota: r.global, apte, arees: Object.fromEntries(r.arees.map((x) => [x.id, x.nota])) }], sessions: [...e.sessions.slice(-400), { data: avuiISO(), tipus: 'simulacre', minuts: arees.reduce((s, a) => s + a.minuts, 0) }] };
    });
    fetch('/api/simulacre', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nivell: sim.nivell, convocatoria: estat?.perfil?.convocatoria || null, simulacreId: sim.id, nota: r.global, arees: Object.fromEntries(r.arees.map((x) => [x.id, x.nota])), apte }) }).then((x) => x.json()).then((j) => setCohort(j.cohort ?? null)).catch(() => {});
    setFase('resultat');
  };

  if (!estat) return <p className="text-suave">{t(idioma).comu.carregant}</p>;

  if (fase === 'intro') return (
    <div className="tarjeta">
      <h1 className="text-2xl font-bold">{sim.nom}</h1>
      <p className="mt-2 text-sm text-suave">{d.text}</p>
      {!(sim as { complet?: boolean }).complet && itemsUs.length < (examen.arees.find((a) => a.id === 'us')?.items ?? 0) ? <p className="mt-2 rounded-lg bg-ocre-claro p-2 text-xs">{d.incomplet}</p> : null}
      <ul className="mt-4 divide-y divide-[#EADFCF] text-sm">{arees.map((a) => <li key={a.id} className="flex items-center justify-between py-2"><span>{a.nom[idioma]}</span><span className="text-suave">{a.minuts} min · {a.pes} %</span></li>)}</ul>
      <p className="mt-3 text-xs text-suave">{d.oralNota}</p>
      {err ? <p className="mt-2 rounded-lg bg-ocre-claro p-3 text-sm">{err} <Link className="underline" href={`/${idioma}/preus`}>{t(idioma).avui.veurePreus}</Link></p> : null}
      <button type="button" className="boton-ocre mt-4 w-full" onClick={comencar} disabled={!itemsUs.length}>{d.comencar}</button>
    </div>
  );

  if (fase === 'resultat' && resultat) {
    const apte = estat.simulacres[estat.simulacres.length - 1]?.apte;
    return (
      <div>
        <div className={`tarjeta text-center ${apte ? 'bg-oliva-claro' : 'bg-[#FBE7E9]'}`}><p className="text-sm text-suave">{d.resultat}</p><p className="titulos mt-1 text-5xl font-bold">{apte ? d.apte : d.noApte} <span className="text-base font-normal text-suave">{d.estimat}</span></p><p className="mt-1">{d.global}: <strong>{resultat.global} %</strong>{examen.aptoGlobal ? <span className="text-suave"> · {d.minim} {examen.aptoGlobal} %</span> : null}</p>{cohort ? <p className="mt-2 text-sm">{cohort.percentil !== null ? d.cohort(cohort.percentil, cohort.n) : d.cohortPocs}</p> : null}</div>
        <div className="mt-3"><ResultatDiag idioma={idioma} resultat={{ ...resultat, data: '', nivell: sim.nivell, theta: 0, febles: [], sons: [], respostes: [] }} examen={examen} punts={punts} sons={sons} compacte /></div>
        <p className="mt-3 text-sm text-suave">{d.pla}</p>
        <div className="mt-4 flex gap-2"><Link className="boton flex-1" href={`/${idioma}/avui`}>{t(idioma).nav.avui}</Link><Link className="boton-sec flex-1" href={`/${idioma}/practica/repas`}>{t(idioma).practica.tipus.repas}</Link></div>
      </div>
    );
  }

  if (!area) return null;
  const cap = <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm shadow-sm"><span className="font-semibold">{d.area} {idx + 1} {d.de} {arees.length} · {area.nom[idioma]}</span><span>{d.temps} <Temporitzador key={area.id} segons={area.minuts * 60} onFi={() => { alert(d.tempsEsgotat); seguentArea(); }} /></span></div>;

  if (area.id === 'us') {
    const it = itemsUs[pIdx];
    return <div>{cap}{it ? <ItemVista key={it.id} item={it} regles={regles} idioma={idioma} idiomaExpl={estat.perfil?.idiomaExpl ?? idioma} retroaccio={false} numero={`${pIdx + 1}/${itemsUs.length}`} onResultat={(a) => { puntua('us', a.correcte); if (!a.correcte) setErrorsUs((e) => [...e, it]); }} onSeguent={() => (pIdx + 1 < itemsUs.length ? setPIdx(pIdx + 1) : seguentArea())} /> : null}</div>;
  }
  if (area.id === 'escrit') {
    const tk = tasquesEscrit[pIdx];
    return <div>{cap}{tk ? <Editor key={tk.id} idioma={idioma} tasca={tk} regles={regles} context="simulacre" senseQuota onCorregit={(r: ResultatCorreccio) => { setEscrit((e) => [...e, r.nota.percent]); }} /> : null}<button type="button" className="boton mt-3 w-full" disabled={escrit.length <= pIdx} onClick={() => (pIdx + 1 < tasquesEscrit.length ? setPIdx(pIdx + 1) : seguentArea())}>{pIdx + 1 < tasquesEscrit.length ? t(idioma).practica.seguent : d.seguentArea}</button></div>;
  }
  const pre = preguntesDe(area.id as 'co' | 'lectura');
  const act = pre[pIdx];
  if (!act) return <div>{cap}<button type="button" className="boton w-full" onClick={seguentArea}>{d.seguentArea}</button></div>;
  const n = escoltes[act.tx.id] ?? 0;
  return (
    <div>{cap}
      <PreguntaSim key={`${act.tx.id}-${act.p.id}`} idioma={idioma} tx={act.tx} p={act.p} audio={area.id === 'co'} escoltes={n} onEscoltar={async () => { setEscoltes((e) => ({ ...e, [act.tx.id]: n + 1 })); const { parlar } = await import('@/lib/client/veu'); await parlar(act.tx.text.replace(/^[AB]:\s*/gm, ''), act.tx.veus?.[0] === 'nord-occidental' ? 'nord-occidental' : 'central'); }} numero={`${pIdx + 1}/${pre.length}`} onResposta={(ok) => { puntua(area.id, ok); if (pIdx + 1 < pre.length) setPIdx(pIdx + 1); else seguentArea(); }} />
    </div>
  );
}

function PreguntaSim({ idioma, tx, p, audio, escoltes, onEscoltar, onResposta, numero }: { idioma: Idioma; tx: TextCL; p: TextCL['preguntes'][number]; audio: boolean; escoltes: number; onEscoltar: () => void; onResposta: (ok: boolean) => void; numero: string }) {
  const d = t(idioma).simulacre;
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="tarjeta">
      <p className="text-xs text-suave">{numero} · {tx.titol}</p>
      {audio ? <div className="my-3 flex items-center gap-2"><button type="button" className="boton-ocre" disabled={escoltes >= 2} onClick={onEscoltar}>🔊 {d.escoltar}</button><span className="text-xs text-suave">{d.escoltat(escoltes)}</span></div> : <div className="prosa my-3 max-h-80 overflow-y-auto rounded-xl bg-crema p-3 text-sm">{tx.text.split(/\n+/).map((x, i) => <p key={i}>{x}</p>)}</div>}
      <p className="font-semibold">{p.enunciat}</p>
      <div className="mt-3 grid gap-2">{p.opcions.map((o, i) => <button key={i} type="button" className={`opcio ${sel === i ? 'border-nit ring-1 ring-nit' : ''}`} onClick={() => setSel(i)}>{o}</button>)}</div>
      <button type="button" className="boton mt-4 w-full" disabled={sel === null} onClick={() => onResposta(sel === p.resposta)}>{t(idioma).practica.seguent}</button>
    </div>
  );
}
