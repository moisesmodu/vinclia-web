'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Convocatoria, Examen, Idioma, Punt, So } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { ratxaActual, consolidarCongelacions, progresCompromis, avuiISO } from '@/lib/motor/ratxa';
import { sessioDe, estatInscripcio, diesFinsProva, generarPla, recalibrar } from '@/lib/motor/pla';
import { pendents } from '@/lib/motor/repas';
import { confiancaPunts } from '@/lib/motor/diagnostic';

type Props = { idioma: Idioma; examens: Record<string, Examen>; convocatories: Convocatoria[]; punts: Punt[]; sons: So[] };
const fmt = (iso: string, idioma: Idioma, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(idioma === 'ca' ? 'ca-ES' : 'es-ES', o).format(new Date(iso + 'T12:00:00'));

/** Avui: una sola acció. Capçalera amb probabilitat, ratxa i dies; la sessió del dia com a full; la resta, en una línia. */
export default function Avui({ idioma, examens, convocatories, punts }: Props) {
  const d = t(idioma).avui; const n = t(idioma).nou;
  const [estat, actualitzar] = useEstat();
  const [premium, setPremium] = useState<boolean | null>(null);
  const [compromisSel, setCompromisSel] = useState<7 | 14 | 30 | null>(null);
  useEffect(() => { fetch('/api/yo').then((r) => r.json()).then((j) => setPremium(!!j?.usuari?.premium)).catch(() => setPremium(false)); }, []);
  useEffect(() => {
    if (!estat?.perfil || !estat.diagnostic) return;
    const ex = examens[estat.perfil.nivell];
    const conv = convocatories.find((c) => c.id === estat.perfil!.convocatoria);
    if (!estat.pla || estat.pla.convocatoria !== (conv?.id ?? null)) actualitzar((e) => ({ ...e, pla: generarPla(ex, e.perfil!.nivell, conv, e.perfil!.minuts, e.diagnostic) }));
    else {
      const recents = estat.respostes.slice(-60);
      const notes = recents.length >= 10 ? { us: Math.round((100 * recents.filter((r) => r.correcte).length) / recents.length) } : {};
      const nou = recalibrar(estat.pla, ex, estat.diagnostic, notes);
      if (nou !== estat.pla) actualitzar((e) => ({ ...e, pla: nou, ratxa: consolidarCongelacions(e.ratxa) }));
    }
  }, [estat, examens, convocatories, actualitzar]);

  if (!estat) return <p className="text-terciari">{t(idioma).comu.carregant}</p>;
  if (!estat.perfil) return <div className="full"><p className="text-[17px]">{d.senseDiag}</p><Link className="boton-primari mt-4" href={`/${idioma}/comencar`}>{t(idioma).nav.comencar}</Link></div>;
  if (!estat.diagnostic) return <div className="full"><p className="text-[17px]">{d.senseDiag}</p><Link className="boton-primari mt-4" href={`/${idioma}/diagnostic`}>{t(idioma).diag.titol}</Link></div>;

  const perfil = estat.perfil;
  const ex = examens[perfil.nivell];
  const conv = convocatories.find((c) => c.id === perfil.convocatoria);
  const ratxa = ratxaActual(estat.ratxa);
  const sessio = sessioDe(estat.pla);
  const insc = estatInscripcio(conv);
  const diesProva = diesFinsProva(conv);
  const avui = avuiISO();
  const feta = estat.sessions.some((s) => s.data === avui && (s.tipus === 'sessio' || s.tipus === 'simulacre'));
  const miniFeta = estat.sessions.some((s) => s.data === avui);
  const nPendents = pendents(estat.targetes).length;
  const compromis = progresCompromis(estat.ratxa);
  const pFeble = confiancaPunts(estat.respostes, punts.filter((p) => p.nivells.includes(perfil.nivell))).filter((c) => c.n > 0).sort((a, b) => a.confianca - b.confianca)[0];
  const nomPunt = (id: string) => punts.find((p) => p.id === id)?.nom[idioma] ?? id;

  if (!estat.ratxa.compromisVist) return (
    <div>
      <h1>{d.compromis}</h1>
      <p className="mt-3 max-w-[44ch] text-[17px] leading-relaxed text-secundari">{d.compromisText}</p>
      <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label={d.compromis}>{([7, 14, 30] as const).map((k, i) => <button key={k} type="button" role="radio" aria-checked={compromisSel === k} className={`opcio justify-center py-5 ${compromisSel === k ? 'opcio-sel' : ''}`} onClick={() => setCompromisSel(k)}><span className="num text-[26px]">{k}</span><span className="sr-only">{d.compromisDies[i]}</span></button>)}</div>
      <p className="mt-1 text-center text-[13px] text-terciari">{d.dies}</p>
      <div className="mt-6 flex gap-2"><button type="button" className="boton-sec" onClick={() => actualitzar((e) => ({ ...e, ratxa: { ...e.ratxa, compromisVist: true } }))}>{d.mesTard}</button><button type="button" className="boton-primari flex-1" disabled={!compromisSel} onClick={() => actualitzar((e) => ({ ...e, ratxa: { ...e.ratxa, compromisVist: true, compromis: { dies: compromisSel!, inici: avui } } }))}>{d.compromisBoto}</button></div>
    </div>
  );

  const blocNom = (b: { tipus: string; area: string }) => b.tipus === 'repas' ? (nPendents ? `${d.repas} · ${nPendents}` : n.repasBuit) : b.tipus === 'feble' ? (pFeble ? nomPunt(pFeble.punt) : ex.arees.find((a) => a.id === b.area)?.nom[idioma] ?? b.area) : (b.area === 'escrit' ? t(idioma).nav.escriure : t(idioma).nav.oral);
  const titolSessio = sessio?.tipus === 'minisimulacre' ? d.minisimulacre : sessio?.tipus === 'simulacre' ? t(idioma).simulacre.titol : n.sessioTitol;
  const hrefPrimari = sessio?.tipus === 'minisimulacre' || sessio?.tipus === 'simulacre' ? `/${idioma}/simulacre` : premium ? `/${idioma}/practica/sessio` : `/${idioma}/practica/mini`;

  return (
    <div>
      <p className="text-[15px] text-secundari">{fmt(avui, idioma, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1 className="sr-only">{d.titol}</h1>
      <div className="mt-3">
        <p><span className="num text-[44px] leading-none">{estat.diagnostic.probabilitat}<span className="text-[22px]">%</span></span><span className="block text-[13px] text-secundari">{(estat.diagnostic as { oralMesurat?: boolean }).oralMesurat === false ? n.probEscrita : d.probabilitat}</span></p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1 text-[15px]">
          {diesProva !== null ? <><dt className="num text-[22px] leading-none">{diesProva}</dt><dd className="text-secundari">{d.diesExamen(diesProva).replace(/^\d+ /, '')}, {perfil.nivell}{conv ? ` (${fmt(conv.prova, idioma, { day: 'numeric', month: 'short' })})` : ''}</dd></> : null}
          <dt className="num flex items-center gap-1 text-[22px] leading-none">{ratxa.dies >= 3 ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#E03A2F" aria-hidden="true"><path d="M12 2c1 4 5 5 5 11a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c0-4-1-6 2-10z" /></svg> : null}{ratxa.dies}</dt><dd className="text-secundari">{ratxa.dies === 1 ? (idioma === 'ca' ? 'dia seguit' : 'día seguido') : (idioma === 'ca' ? 'dies seguits' : 'días seguidos')}. {n.congelacionsRestants(Math.max(0, 2 - ratxa.congelacionsMes))}</dd>
        </dl>
      </div>
      {insc.estat === 'oberta' ? <p className="mt-4 rounded-[6px] bg-vermell-tenue px-3 py-2 text-[15px] font-semibold text-vermell">{d.inscripcioOberta} {conv?.inscripcio ? d.inscripcio(fmt(conv.inscripcio.inici, idioma, { day: 'numeric', month: 'short' }), fmt(conv.inscripcio.fi, idioma, { day: 'numeric', month: 'short' })) : ''} <a className="underline" href={conv?.url} target="_blank" rel="noopener noreferrer">{conv?.organisme.toUpperCase()}</a></p> : null}
      {insc.estat === 'abans' && insc.dies <= 21 ? <p className="mt-4 rounded-[6px] bg-boli-tenue px-3 py-2 text-[15px]">{d.inscripcioAviat(insc.dies)}</p> : null}

      <div className="full mt-6">
        <div className="full-cap"><span>{titolSessio}</span><span className="tab">{sessio?.minuts ?? perfil.minuts} {t(idioma).comu.minuts}{feta ? ` · ✓ ${d.feta}` : ''}</span></div>
        {sessio?.tipus === 'normal' || !sessio ? (
          <div className="mt-3 flex h-3 w-full gap-1 overflow-hidden rounded-full" aria-hidden="true">{(sessio?.blocs ?? []).map((b, i) => <span key={i} className={b.tipus === 'repas' ? 'bg-tinta' : b.tipus === 'feble' ? 'bg-boli' : 'bg-apte'} style={{ flex: b.minuts }} />)}</div>
        ) : null}
        <ul className="mt-3 space-y-1.5 text-[16px]">
          {(sessio?.blocs ?? []).map((b, i) => <li key={i} className="flex items-baseline gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${b.tipus === 'repas' ? 'bg-tinta' : b.tipus === 'feble' ? 'bg-boli' : 'bg-apte'}`} aria-hidden="true" /><span className="min-w-0 flex-1">{blocNom(b)}</span><span className="tab text-[14px] text-terciari">{b.minuts}′</span></li>)}
        </ul>
        {premium === false && sessio?.tipus === 'normal' ? <p className="mt-4 text-[14px] leading-relaxed text-secundari">{d.bloquejat} {conv ? n.passiFins(fmt(conv.prova, idioma, { day: 'numeric', month: 'long' })) : ''} <Link className="font-semibold text-tinta underline decoration-boli decoration-2" href={`/${idioma}/preus`}>{d.veurePreus}</Link></p> : null}
        <Link className="boton-primari mt-5 w-full text-[18px]" href={hrefPrimari}>{sessio?.tipus === 'minisimulacre' || sessio?.tipus === 'simulacre' ? d.comencar : premium ? d.comencar : d.mini}</Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
        {hrefPrimari.endsWith('/practica/mini') ? null : <Link className="boton-text" href={`/${idioma}/practica/mini`}>{d.mini}{miniFeta ? ' ✓' : ''}</Link>}
        <Link className="boton-text" href={`/${idioma}/practica/repas`}>{d.repas}{nPendents ? ` · ${nPendents}` : ''}</Link>
        <Link className="boton-text" href={`/${idioma}/escriure`}>{t(idioma).nav.escriure}</Link>
        <Link className="boton-text" href={`/${idioma}/oral`}>{t(idioma).nav.oral}</Link>
        <Link className="boton-text" href={`/${idioma}/mapa`}>{t(idioma).nav.mapa}</Link>
      </div>
      {compromis ? <div className="mt-8"><div className="flex items-baseline justify-between text-[14px] text-secundari"><span>{d.compromis.replace('?', '')}: {compromis.total} {d.dies}</span><span className="tab">{compromis.fets}/{compromis.total}</span></div><div className="barra mt-2"><span style={{ width: `${(100 * compromis.fets) / compromis.total}%` }} /></div></div> : null}
    </div>
  );
}
