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
const fmt = (iso: string, idioma: Idioma) => new Date(iso + 'T12:00:00').toLocaleDateString(idioma === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'short' });

/** «Avui»: una sola tasca. Probabilitat, dies per a la prova, finestra d'inscripció, ratxa amb congelacions, la sessió del pla (40/40/20) i la
 *  minisessió de 2 minuts. Pantalla de compromís (7, 14, 30 dies, sense opció preseleccionada) el primer dia. */
export default function Avui({ idioma, examens, convocatories, punts }: Props) {
  const d = t(idioma).avui;
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

  if (!estat) return <p className="text-suave">{t(idioma).comu.carregant}</p>;
  if (!estat.perfil) return <div className="tarjeta"><p>{d.senseDiag}</p><Link className="boton mt-4" href={`/${idioma}/comencar`}>{t(idioma).nav.comencar}</Link></div>;
  if (!estat.diagnostic) return <div className="tarjeta"><p>{d.senseDiag}</p><Link className="boton mt-4" href={`/${idioma}/diagnostic`}>{t(idioma).diag.titol}</Link></div>;

  const perfil = estat.perfil;
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

  if (!estat.ratxa.compromisVist) return (
    <div className="tarjeta">
      <h1 className="text-2xl font-bold">{d.compromis}</h1>
      <p className="mt-2 text-sm text-suave">{d.compromisText}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">{([7, 14, 30] as const).map((n, i) => <button key={n} type="button" className={`opcio justify-center ${compromisSel === n ? 'border-nit bg-ocre-claro ring-1 ring-nit' : ''}`} onClick={() => setCompromisSel(n)}>{d.compromisDies[i]}</button>)}</div>
      <div className="mt-4 flex gap-2"><button type="button" className="boton-sec" onClick={() => actualitzar((e) => ({ ...e, ratxa: { ...e.ratxa, compromisVist: true } }))}>{d.mesTard}</button><button type="button" className="boton flex-1" disabled={!compromisSel} onClick={() => actualitzar((e) => ({ ...e, ratxa: { ...e.ratxa, compromisVist: true, compromis: { dies: compromisSel!, inici: avui } } }))}>{d.compromisBoto}</button></div>
    </div>
  );

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="tarjeta px-2 py-3"><p className="text-[11px] text-suave">{d.probabilitat}</p><p className="titulos text-2xl font-bold">{estat.diagnostic.probabilitat} %</p></div>
        <div className="tarjeta px-2 py-3"><p className="text-[11px] text-suave">{d.ratxa}</p><p className="titulos text-2xl font-bold">{ratxa.dies} <span className="text-sm font-normal">{d.dies}</span></p><p className="text-[10px] text-suave">{d.congelacions(2 - ratxa.congelacionsMes)}</p></div>
        <div className="tarjeta px-2 py-3"><p className="text-[11px] text-suave">{perfil.nivell}{conv ? ` · ${fmt(conv.prova, idioma)}` : ''}</p><p className="titulos text-2xl font-bold">{diesProva ?? '—'}</p><p className="text-[10px] text-suave">{diesProva !== null ? d.diesExamen(diesProva).replace(/^\d+ /, '') : ''}</p></div>
      </div>
      {insc.estat === 'oberta' ? <div className="rounded-xl bg-[#FBE7E9] p-3 text-sm font-semibold text-mal">{d.inscripcioOberta} {conv?.inscripcio ? d.inscripcio(fmt(conv.inscripcio.inici, idioma), fmt(conv.inscripcio.fi, idioma)) : ''} · <a className="underline" href={conv?.url} target="_blank" rel="noopener noreferrer">{conv?.organisme.toUpperCase()}</a></div> : null}
      {insc.estat === 'abans' && insc.dies <= 21 ? <div className="rounded-xl bg-ocre-claro p-3 text-sm">{d.inscripcioAviat(insc.dies)} {conv?.inscripcio ? d.inscripcio(fmt(conv.inscripcio.inici, idioma), fmt(conv.inscripcio.fi, idioma)) : ''}</div> : null}
      {compromis ? <div className="tarjeta py-3"><div className="flex items-center justify-between text-sm"><span>{d.compromis.replace('?', '')}: {compromis.total} {d.dies}</span><span>{compromis.fets}/{compromis.total}</span></div><div className="barra mt-2"><span style={{ width: `${(100 * compromis.fets) / compromis.total}%` }} /></div></div> : null}

      <div className="tarjeta">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{sessio?.tipus === 'minisimulacre' ? d.minisimulacre : sessio?.tipus === 'simulacre' ? t(idioma).simulacre.titol : d.sessio(sessio?.minuts ?? perfil.minuts)}</h2>{feta ? <span className="etiqueta">✓ {d.feta}</span> : null}</div>
        {sessio?.tipus === 'normal' || !sessio ? (
          <ul className="mt-3 space-y-2 text-sm">
            {(sessio?.blocs ?? []).map((b, i) => <li key={i} className="flex items-center justify-between"><span>{b.tipus === 'repas' ? `${d.repas} (${nPendents})` : b.tipus === 'feble' ? `${d.feble}: ${examens[perfil.nivell].arees.find((a) => a.id === b.area)?.nom[idioma] ?? b.area}${pFeble ? ` · ${punts.find((p) => p.id === pFeble.punt)?.nom[idioma]}` : ''}` : `${d.produccio}: ${b.area === 'escrit' ? t(idioma).nav.escriure : t(idioma).nav.oral}`}</span><span className="text-suave">{b.minuts} {t(idioma).comu.minuts}</span></li>)}
          </ul>
        ) : null}
        {premium === false && sessio?.tipus === 'normal' ? <p className="mt-3 rounded-lg bg-ocre-claro p-3 text-sm">{d.bloquejat} <Link className="font-semibold underline" href={`/${idioma}/preus`}>{d.veurePreus}</Link></p> : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {sessio?.tipus === 'minisimulacre' || sessio?.tipus === 'simulacre' ? <Link className="boton-ocre" href={`/${idioma}/simulacre`}>{d.comencar}</Link> : premium ? <Link className="boton-ocre" href={`/${idioma}/practica/sessio`}>{d.comencar}</Link> : <Link className="boton-ocre" href={`/${idioma}/practica/repas`}>{d.repas} ({nPendents})</Link>}
          <Link className="boton-sec" href={`/${idioma}/practica/mini`}>{d.mini}{miniFeta ? ' ✓' : ''}</Link>
          {sessio?.blocs.some((b) => b.tipus === 'produccio' && b.area === 'escrit') ? <Link className="boton-sec" href={`/${idioma}/escriure`}>{t(idioma).nav.escriure}</Link> : <Link className="boton-sec" href={`/${idioma}/oral`}>{t(idioma).nav.oral}</Link>}
          <Link className="boton-sec" href={`/${idioma}/mapa`}>{t(idioma).nav.mapa}</Link>
        </div>
      </div>
    </div>
  );
}
