'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Convocatoria, Examen, Idioma, Item, Nivell, Punt, So, TextCL, Tasca, LecturaOral } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { carregarBanc, type BancClient } from '@/lib/client/banc';
import { actualitzarTheta, notaUs, probabilitatAprovar, puntsFebles, seguentItem, sonsPerDefecte, type NotesArea, type RespostaDiag, type ResultatDiagnostic } from '@/lib/motor/diagnostic';
import { generarPla } from '@/lib/motor/pla';
import { novaTargeta, revisar } from '@/lib/motor/repas';
import { registrarDia, avuiISO } from '@/lib/motor/ratxa';
import { barrejar } from '@/lib/motor/avaluar';
import { notaOralDesDePronuncia, type ResultatOral } from '@/lib/oral';
import ItemVista from './ItemVista';
import Oral from './Oral';
import ResultatDiag from './ResultatDiag';

type Props = { idioma: Idioma; examens: Record<string, Examen>; convocatories: Convocatoria[]; punts: Punt[]; tasques: Tasca[]; sons: So[]; lectures: LecturaOral[] };
type Bloc = 'us' | 'lectura' | 'co' | 'escrit' | 'oral' | 'resultat';
const N_US = 12;

/** Diagnòstic adaptatiu de 12 a 15 minuts: ús de la llengua (adaptatiu), lectura, comprensió oral (B1/B2), text breu corregit per criteris
 *  i lectura en veu alta opcional. Sortida: probabilitat d'aprovar, nota per àrea, 3 punts febles i 3 sons. */
export default function Diagnostic({ idioma, examens, convocatories, punts, tasques, sons, lectures }: Props) {
  const d = t(idioma).diag;
  const router = useRouter();
  const [estat, actualitzar] = useEstat();
  const [banc, setBanc] = useState<BancClient | null>(null);
  const [bloc, setBloc] = useState<Bloc>('us');
  const [theta, setTheta] = useState(0);
  const [resp, setResp] = useState<RespostaDiag[]>([]);
  const [item, setItem] = useState<Item | null>(null);
  const [lecturaIdx, setLecturaIdx] = useState(0);
  const [lecturaOk, setLecturaOk] = useState<boolean[]>([]);
  const [coIdx, setCoIdx] = useState(0);
  const [coOk, setCoOk] = useState<boolean[]>([]);
  const [text, setText] = useState('');
  const [corregint, setCorregint] = useState(false);
  const [notaEscrit, setNotaEscrit] = useState<number | null>(null);
  const [oralRes, setOralRes] = useState<ResultatOral | null>(null);
  const [resultat, setResultat] = useState<ResultatDiagnostic | null>(null);
  const perfil = estat?.perfil;
  const nivell = perfil?.nivell as Nivell | undefined;
  const ex = nivell ? examens[nivell] : null;

  useEffect(() => { if (estat && !perfil) router.replace(`/${idioma}/comencar`); }, [estat, perfil, router, idioma]);
  useEffect(() => { if (nivell) carregarBanc(nivell).then(setBanc); }, [nivell]);

  const pool = useMemo(() => banc?.items.filter((x) => x.area === 'us' && x.diagnostic) ?? [], [banc]);
  const llavor = useMemo(() => Math.floor(Date.now() / 86400000), []);
  useEffect(() => { if (bloc === 'us' && pool.length && !item) setItem(seguentItem(pool, resp, theta, llavor)); }, [pool, bloc, item, resp, theta, llavor]);

  const textosLectura = useMemo(() => (banc ? barrejar(banc.textos.filter((x) => x.area === 'lectura'), `diag-${avuiISO()}`) : []), [banc]);
  const textosCo = useMemo(() => (banc ? barrejar(banc.textos.filter((x) => x.area === 'co'), `diag-${avuiISO()}`) : []), [banc]);
  const textL: TextCL | undefined = textosLectura[0];
  const textCo: TextCL | undefined = textosCo[0];
  const preguntesL = textL?.preguntes.slice(0, 5) ?? [];
  const preguntesCo = textCo?.preguntes.slice(0, 4) ?? [];
  // Text breu del diagnòstic (uns 4 minuts): la tasca del nivell més curta a B1; a B2 i C1 una consigna pròpia de 70–100 paraules.
  const tascaDiag = useMemo(() => (nivell === 'B1' ? tasques.filter((x) => x.nivell === 'B1').sort((a, b) => a.paraulesMin - b.paraulesMin)[0] : undefined), [tasques, nivell]);
  const consignaDiag = nivell === 'B2'
    ? { ca: 'Escriu una nota informativa de 70 a 100 paraules per als veïns de la teva escala: hi haurà obres a l\'ascensor la setmana vinent. Digues quins dies, què cal fer amb les escombraries i a qui s\'ha de trucar si hi ha cap problema.', es: 'Escribe una nota informativa de 70 a 100 palabras para los vecinos de tu escalera: habrá obras en el ascensor la semana que viene. Di qué días, qué hay que hacer con la basura y a quién hay que llamar si hay algún problema.' }
    : { ca: 'Escriu un paràgraf d\'opinió de 80 a 110 paraules, en registre formal, sobre aquesta afirmació: «Les administracions haurien d\'oferir tots els tràmits en línia i tancar l\'atenció presencial». Pren posició i dona dos arguments.', es: 'Escribe un párrafo de opinión de 80 a 110 palabras, en registro formal, sobre esta afirmación: «Les administracions haurien d\'oferir tots els tràmits en línia i tancar l\'atenció presencial». Toma posición y da dos argumentos.' };
  const lecturaOral = useMemo(() => lectures.find((l) => l.nivell === nivell) ?? lectures[0], [lectures, nivell]);

  const respondreUs = (correcte: boolean) => {
    if (!item) return;
    const r: RespostaDiag = { itemId: item.id, punt: item.punt, dificultat: item.dificultat, correcte };
    const nous = [...resp, r];
    const th = actualitzarTheta(theta, r, nous.length);
    setResp(nous); setTheta(th);
  };
  const seguentUs = () => {
    const n = resp.length;
    const seg = n < N_US ? seguentItem(pool, resp, theta, llavor) : null;
    if (seg) setItem(seg); else { setItem(null); setBloc(textL ? 'lectura' : textCo ? 'co' : 'escrit'); }
  };

  const enviarEscrit = async () => {
    if (!nivell) return;
    setCorregint(true);
    try {
      const r = await fetch('/api/corregir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, nivell, tascaId: tascaDiag?.id, idiomaExpl: perfil?.idiomaExpl, context: 'diagnostic' }) });
      const j = await r.json();
      setNotaEscrit(typeof j?.nota?.percent === 'number' ? j.nota.percent : 50);
    } catch { setNotaEscrit(50); }
    setCorregint(false);
    setBloc('oral');
  };

  const calcular = (oral: ResultatOral | null) => {
    if (!ex || !nivell || !banc) return;
    const notes: NotesArea = { us: notaUs(theta, banc.items) };
    if (textL && lecturaOk.length) notes.lectura = Math.round((100 * lecturaOk.filter(Boolean).length) / lecturaOk.length);
    if (textCo && coOk.length) notes.co = Math.round((100 * coOk.filter(Boolean).length) / coOk.length);
    if (notaEscrit !== null) notes.escrit = notaEscrit;
    if (oral) notes.oral = notaOralDesDePronuncia(oral.global);
    const p = probabilitatAprovar(ex, notes);
    const sonsIds = sons.map((s) => s.id);
    const res: ResultatDiagnostic = { data: new Date().toISOString(), nivell, theta, ...p, febles: puntsFebles(resp, punts.filter((x) => x.nivells.includes(nivell))), sons: oral && oral.pitjors.length ? oral.pitjors : sonsPerDefecte(perfil?.l1 ?? 'es', sonsIds), respostes: resp, escritNota: notaEscrit ?? undefined, oralNota: oral ? notes.oral : null };
    setResultat(res);
    actualitzar((e) => {
      const targetes = { ...e.targetes };
      for (const r of resp) if (!r.correcte) targetes[r.itemId] = revisar(novaTargeta(r.itemId, r.punt), false);
      const conv = convocatories.find((c) => c.id === e.perfil?.convocatoria);
      const pla = generarPla(ex, nivell, conv, e.perfil?.minuts ?? 15, res);
      return { ...e, diagnostic: res, diagnostics: [...e.diagnostics.slice(-11), res], targetes, pla, ratxa: registrarDia(e.ratxa), respostes: [...e.respostes, ...resp.map((r) => ({ itemId: r.itemId, punt: r.punt, area: 'us' as const, correcte: r.correcte, data: res.data, dificultat: r.dificultat }))], oral: oral ? [...e.oral, { data: res.data, lecturaId: lecturaOral?.id ?? '', global: oral.global, pitjors: oral.pitjors }] : e.oral };
    });
    setBloc('resultat');
  };

  if (!estat || !perfil || !banc || !ex) return <p className="contenedor py-10 text-suave">{t(idioma).comu.carregant}</p>;
  if (!pool.length) return <div className="contenedor py-10"><p>{t(idioma).simulacre.incomplet}</p><Link className="boton mt-4" href={`/${idioma}/avui`}>{t(idioma).nav.avui}</Link></div>;

  const Cap = ({ actual }: { actual: Bloc }) => {
    const blocs: Bloc[] = ['us', ...(textL ? ['lectura' as Bloc] : []), ...(textCo ? ['co' as Bloc] : []), 'escrit', 'oral'];
    const idx = blocs.indexOf(actual);
    return <div className="mb-4"><div className="flex items-center justify-between text-sm text-suave"><span className="font-semibold text-nit">{d.titol} · {d.bloc[actual as keyof typeof d.bloc] ?? (actual === 'co' ? (idioma === 'ca' ? 'Comprensió oral' : 'Comprensión oral') : '')}</span><span>{idx + 1} / {blocs.length}</span></div><div className="barra mt-2"><span style={{ width: `${((idx + (actual === 'us' ? resp.length / N_US : 0.5)) / blocs.length) * 100}%` }} /></div></div>;
  };

  const paraules = text.trim().split(/\s+/).filter(Boolean).length;
  const minEscrit = tascaDiag ? Math.max(40, Math.round(tascaDiag.paraulesMin * 0.6)) : 50;

  return (
    <div className="contenedor py-6">
      {bloc !== 'resultat' ? <Cap actual={bloc} /> : null}
      {bloc === 'us' && item ? <ItemVista key={item.id} item={item} regles={banc.regles} idioma={idioma} idiomaExpl={perfil.idiomaExpl} onResultat={(a) => respondreUs(a.correcte)} onSeguent={seguentUs} numero={`${resp.length + 1}/${N_US}`} /> : null}

      {bloc === 'lectura' && textL ? (
        <PreguntesText text={textL} preguntes={preguntesL} idx={lecturaIdx} idioma={idioma} onResposta={(ok) => { setLecturaOk((v) => [...v, ok]); if (lecturaIdx + 1 < preguntesL.length) setLecturaIdx(lecturaIdx + 1); else setBloc(textCo ? 'co' : 'escrit'); }} />
      ) : null}
      {bloc === 'co' && textCo ? (
        <PreguntesText text={textCo} audio preguntes={preguntesCo} idx={coIdx} idioma={idioma} onResposta={(ok) => { setCoOk((v) => [...v, ok]); if (coIdx + 1 < preguntesCo.length) setCoIdx(coIdx + 1); else setBloc('escrit'); }} />
      ) : null}

      {bloc === 'escrit' ? (
        <div className="tarjeta">
          <p className="text-sm font-semibold text-suave">{tascaDiag?.titol ?? d.bloc.escrit}</p>
          <p className="mt-1 leading-relaxed">{tascaDiag?.enunciat ?? consignaDiag[idioma]}</p>
          <p className="mt-1 text-xs text-suave">{t(idioma).escriure.minimParaules(minEscrit)} · {idioma === 'ca' ? 'uns 4 minuts' : 'unos 4 minutos'}</p>
          <textarea className="campo mt-3 min-h-44" value={text} onChange={(e) => setText(e.target.value)} lang="ca" placeholder={d.escriu} />
          <div className="mt-2 flex items-center justify-between text-sm text-suave"><span>{paraules} {d.paraules}</span></div>
          <div className="mt-3 flex gap-2"><button type="button" className="boton-sec" onClick={() => setBloc('oral')}>{d.saltar}</button><button type="button" className="boton flex-1" disabled={paraules < minEscrit || corregint} onClick={enviarEscrit}>{corregint ? d.corregint : d.enviar}</button></div>
        </div>
      ) : null}

      {bloc === 'oral' && lecturaOral ? (
        <div>
          <Oral idioma={idioma} lectures={[lecturaOral]} sons={sons} nivell={nivell!} compacte onResultat={(r) => { setOralRes(r); }} />
          <div className="mt-3 flex gap-2"><button type="button" className="boton-sec" onClick={() => calcular(null)}>{d.saltar}</button><button type="button" className="boton flex-1" disabled={!oralRes} onClick={() => calcular(oralRes)}>{d.seguent}</button></div>
        </div>
      ) : null}

      {bloc === 'resultat' && resultat ? <ResultatDiag idioma={idioma} resultat={resultat} examen={ex} punts={punts} sons={sons} /> : null}
    </div>
  );
}

function PreguntesText({ text, preguntes, idx, idioma, onResposta, audio }: { text: TextCL; preguntes: TextCL['preguntes']; idx: number; idioma: Idioma; onResposta: (ok: boolean) => void; audio?: boolean }) {
  const d = t(idioma).diag;
  const p = preguntes[idx];
  const [sel, setSel] = useState<number | null>(null);
  const [fet, setFet] = useState(false);
  const [escoltes, setEscoltes] = useState(0);
  useEffect(() => { setSel(null); setFet(false); }, [idx]);
  if (!p) return null;
  return (
    <div className="tarjeta">
      <p className="text-sm font-semibold text-suave">{text.titol}</p>
      {audio ? (
        <div className="my-3 flex items-center gap-2"><button type="button" className="boton-ocre" disabled={escoltes >= 2} onClick={async () => { setEscoltes((n) => n + 1); const { parlar } = await import('@/lib/client/veu'); await parlar(text.text.replace(/^[AB]:\s*/gm, ''), text.veus?.[0] === 'nord-occidental' ? 'nord-occidental' : 'central'); }}>🔊 {t(idioma).simulacre.escoltar}</button><span className="text-xs text-suave">{t(idioma).simulacre.escoltat(escoltes)}</span></div>
      ) : <div className="prosa my-3 max-h-72 overflow-y-auto rounded-xl bg-crema p-3 text-sm">{text.text.split(/\n+/).map((x, i) => <p key={i}>{x}</p>)}</div>}
      <p className="text-xs text-suave">{idx + 1} / {preguntes.length}</p>
      <p className="mt-1 font-semibold">{p.enunciat}</p>
      <div className="mt-3 grid gap-2">{p.opcions.map((o, i) => <button key={i} type="button" className={`opcio ${fet ? (i === p.resposta ? 'opcio-ok' : sel === i ? 'opcio-mal' : '') : sel === i ? 'border-nit ring-1 ring-nit' : ''}`} disabled={fet} onClick={() => setSel(i)}>{o}</button>)}</div>
      {!fet ? <button type="button" className="boton mt-4 w-full" disabled={sel === null} onClick={() => setFet(true)}>{d.comprovar}</button> : <button type="button" className="boton mt-4 w-full" onClick={() => onResposta(sel === p.resposta)}>{d.seguent}</button>}
    </div>
  );
}
