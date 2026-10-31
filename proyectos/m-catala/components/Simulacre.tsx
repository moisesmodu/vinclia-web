'use client';
import { startTransition, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Area, Convocatoria, Examen, Idioma, Item, Punt, Regla, Simulacre as Sim, So, Tasca, TextCL } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { avaluar } from '@/lib/motor/avaluar';
import { probabilitatAprovar, type NotesArea } from '@/lib/motor/diagnostic';
import { novaTargeta, revisar } from '@/lib/motor/repas';
import { registrarDia, avuiISO } from '@/lib/motor/ratxa';
import type { ResultatCorreccio } from '@/lib/correccio';
import Volat from '@/components/Volat';
import ItemVista from './ItemVista';
import Editor, { Temporitzador } from './Editor';
import ResultatDiag from './ResultatDiag';
import Segments from './ui/Segments';

type Props = { idioma: Idioma; sim: Sim; examen: Examen; regles: Record<string, Regla>; punts: Punt[]; sons: So[]; convocatories: Convocatoria[] };
type Fase = 'intro' | Area | 'resultat';
type Contingut = { items: Item[]; textos: Record<string, TextCL>; tasques: Record<string, Tasca> };

/** Simulacre escrit complet amb l'estructura oficial: àrees en l'ordre de l'examen, rellotge real per àrea, mínims i apte o no apte, cohort.
 *  Els ítems (amb resposta) no van a l'HTML: es demanen a /api/banc?simulacre= en prémer «Començar», després de l'inici autoritzat. */
export default function Simulacre({ idioma, sim, examen, regles, punts, sons, convocatories }: Props) {
  const d = t(idioma).simulacre;
  const [estat, actualitzar] = useEstat();
  const arees = useMemo(() => examen.arees.filter((a) => a.part === 'escrita' && (sim.arees as Record<string, unknown>)[a.id]), [examen, sim]);
  const [contingut, setContingut] = useState<Contingut>({ items: [], textos: {}, tasques: {} });
  const [carregant, setCarregant] = useState(false);
  const { items, textos, tasques } = contingut;
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

  const nItemsUs = (sim.arees.us?.items ?? []).length;
  const nTasques = [sim.arees.escrit?.tasca, ...(sim.arees.escrit?.tasques ?? [])].filter(Boolean).length;
  const area = fase !== 'intro' && fase !== 'resultat' ? arees[idx] : null;
  const seguentArea = () => { setPIdx(0); if (idx + 1 < arees.length) { setIdx(idx + 1); setFase(arees[idx + 1].id); } else acabar(); };

  const comencar = async () => {
    setErr(''); setCarregant(true);
    try {
      const r = await fetch('/api/simulacre', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ inici: true, nivell: sim.nivell, nota: 0 }) });
      if (r.status === 402) { setErr(d.quotaEsgotada); setCarregant(false); return; }
      const b = await fetch(`/api/banc?simulacre=${encodeURIComponent(sim.id)}`);
      if (!b.ok) { setErr(b.status === 402 || b.status === 403 ? d.quotaEsgotada : t(idioma).comu.error); setCarregant(false); return; }
      const j = (await b.json()) as Contingut;
      if (!j.items?.length) { setErr(t(idioma).comu.error); setCarregant(false); return; }
      setContingut({ items: j.items, textos: j.textos ?? {}, tasques: j.tasques ?? {} });
    } catch { setErr(t(idioma).comu.error); setCarregant(false); return; }
    setCarregant(false);
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

  if (!estat) return <p className="text-terciari">{t(idioma).comu.carregant}</p>;

  if (fase === 'intro') return (
    <div>
      <p className="text-[15px] text-secundari">{sim.nivell} · {examen.nom[idioma].replace(/^\w\d · /, '')}</p>
      <h1 className="mt-1">{sim.nom}</h1>
      <p className="mt-3 max-w-[48ch] text-[16px] leading-relaxed text-secundari">{d.text}</p>
      <ol className="mt-6 divide-y divide-linia border-y border-linia">{arees.map((a, i) => <li key={a.id} className="grid grid-cols-[28px_1fr_auto] items-baseline gap-3 py-3"><span className="num text-[18px] text-boli">{i + 1}</span><span className="min-w-0">{a.nom[idioma]}<span className="block text-[13px] text-terciari">{a.pes} % · {a.id === 'us' ? `${nItemsUs} ítems` : a.id === 'escrit' ? `${nTasques} ${idioma === 'ca' ? 'tasca' : 'tarea'}${nTasques > 1 ? 's' : ''}` : `${(sim.arees[a.id as 'co' | 'lectura']?.textos ?? []).length} ${idioma === 'ca' ? 'textos' : 'textos'}`}</span></span><span className="num text-[17px]">{a.minuts}<span className="text-[13px] font-normal text-terciari"> min</span></span></li>)}</ol>
      <p className="mt-3 text-[13px] text-terciari">{d.oralNota}</p>
      {!(sim as { complet?: boolean }).complet && nItemsUs < (examen.arees.find((a) => a.id === 'us')?.items ?? 0) ? <p className="mt-2 rounded-[6px] bg-boli-tenue p-3 text-[14px]">{d.incomplet}</p> : null}
      {err ? <p className="mt-3 rounded-[6px] bg-boli-tenue p-3 text-[15px]" role="alert">{err} <Link className="underline" href={`/${idioma}/preus`}>{t(idioma).avui.veurePreus}</Link></p> : null}
      <button type="button" className="boton-primari mt-6 w-full text-[18px]" onClick={comencar} disabled={!nItemsUs || carregant}>{carregant ? t(idioma).comu.carregant : d.comencar}</button>
    </div>
  );

  if (fase === 'resultat' && resultat) {
    const apte = estat.simulacres[estat.simulacres.length - 1]?.apte;
    return (
      <div>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex items-center gap-4"><Volat mida={56} postura={apte ? 'content' : 'sorpres'} aterra /><span className={`segell segell-anima ${apte ? 'segell-apte' : 'segell-no'}`} role="status">{apte ? d.apte : d.noApte}</span></div>
          <p className="mt-5 text-[13px] text-terciari">{t(idioma).nou.apteEstimat} · {sim.nom}</p>
          <p className="num mt-1 text-[44px] leading-none">{resultat.global}<span className="text-[22px] text-terciari">%</span></p>
          <p className="text-[14px] text-secundari">{d.global}{examen.aptoGlobal ? ` · ${d.minim} ${examen.aptoGlobal} %` : ''}</p>
          {cohort ? <p className="mt-3 max-w-[36ch] text-[15px]">{cohort.percentil !== null ? d.cohort(cohort.percentil, cohort.n) : d.cohortPocs}</p> : null}
        </div>
        <ResultatDiag idioma={idioma} resultat={{ ...resultat, data: '', nivell: sim.nivell, theta: 0, febles: [], sons: [], respostes: [] }} examen={examen} punts={punts} sons={sons} compacte />
        <p className="mt-6 text-[15px] text-secundari">{d.pla}</p>
        <div className="mt-5 grid gap-2"><Link className="boton-primari" href={`/${idioma}/avui`}>{t(idioma).nav.avui}</Link><Link className="boton-sec" href={`/${idioma}/practica/repas`}>{t(idioma).practica.tipus.repas}</Link></div>
      </div>
    );
  }

  if (!area) return null;
  const cap = <div className="mb-4"><div className="flex items-baseline justify-between gap-3"><h1 className="min-w-0 truncate text-[20px]">{area.nom[idioma]}</h1><span className="shrink-0 text-[13px] text-terciari">{t(idioma).nou.tempsRestant} <Temporitzador key={area.id} segons={area.minuts * 60} onFi={() => { alert(d.tempsEsgotat); seguentArea(); }} /></span></div><Segments total={arees.length} actual={idx} className="mt-2" /></div>;

  if (area.id === 'us') {
    const it = itemsUs[pIdx];
    return <div>{cap}{it ? <ItemVista key={it.id} item={it} regles={regles} idioma={idioma} idiomaExpl={estat.perfil?.idiomaExpl ?? idioma} retroaccio={false} numero={`${pIdx + 1}/${itemsUs.length}`} onResultat={(a) => { puntua('us', a.correcte); if (!a.correcte) setErrorsUs((e) => [...e, it]); }} onSeguent={() => startTransition(() => (pIdx + 1 < itemsUs.length ? setPIdx(pIdx + 1) : seguentArea()))} /> : null}</div>;
  }
  if (area.id === 'escrit') {
    const tk = tasquesEscrit[pIdx];
    return <div>{cap}{tk ? <Editor key={tk.id} idioma={idioma} tasca={tk} regles={regles} context="simulacre" senseQuota onCorregit={(r: ResultatCorreccio) => { setEscrit((e) => [...e, r.nota.percent]); }} /> : null}<button type="button" className="boton-primari mt-4 w-full" disabled={escrit.length <= pIdx} onClick={() => (pIdx + 1 < tasquesEscrit.length ? setPIdx(pIdx + 1) : seguentArea())}>{pIdx + 1 < tasquesEscrit.length ? t(idioma).practica.seguent : d.seguentArea}</button></div>;
  }
  const pre = preguntesDe(area.id as 'co' | 'lectura');
  const act = pre[pIdx];
  if (!act) return <div>{cap}<button type="button" className="boton-primari w-full" onClick={seguentArea}>{d.seguentArea}</button></div>;
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
    <div className="full" style={{ viewTransitionName: 'item' }}>
      <p className="full-cap"><span><span className="num text-tinta">{numero}</span> · {tx.titol}</span></p>
      {audio ? <div className="my-3 flex items-center gap-2"><button type="button" className="boton-primari" disabled={escoltes >= 2} onClick={onEscoltar}>{t(idioma).nou.escolta}</button><span className="text-[13px] text-terciari">{d.escoltat(escoltes)}</span></div> : <div className="prosa my-3 max-h-80 overflow-y-auto rounded-[6px] bg-paper p-3 text-[15px]">{tx.text.split(/\n+/).map((x, i) => <p key={i}>{x}</p>)}</div>}
      <p className="text-[19px] font-semibold leading-snug">{p.enunciat}</p>
      <div className="mt-4 grid gap-2" role="radiogroup">{p.opcions.map((o, i) => <button key={i} type="button" role="radio" aria-checked={sel === i} className={`opcio ${sel === i ? 'opcio-sel' : ''}`} onClick={() => setSel(i)}><span className="lletra" aria-hidden="true">{String.fromCharCode(97 + i)}</span><span>{o}</span></button>)}</div>
      <button type="button" className="boton mt-5 w-full" disabled={sel === null} onClick={() => onResposta(sel === p.resposta)}>{t(idioma).practica.seguent}</button>
    </div>
  );
}
