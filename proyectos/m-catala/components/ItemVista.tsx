'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Idioma, IdiomaExpl, Item, Regla } from '@/lib/tipos';
import { avaluar, ompleBuit, type Avaluacio } from '@/lib/motor/avaluar';
import { parlar, aturar, hiHaVeuNavegador } from '@/lib/client/veu';
import { t } from '@/lib/i18n';

type Props = {
  item: Item; regles: Record<string, Regla>; idioma: Idioma; idiomaExpl: IdiomaExpl;
  onResultat: (a: Avaluacio, resposta: string | number | null) => void; onSeguent?: () => void;
  retroaccio?: boolean; textLectura?: string; etiquetaSeguent?: string; numero?: string;
};

/** Un ítem com al full de respostes: número, enunciat gran, opcions amb lletra en cercle; correcció al lloc; «Per què?» amb la regla. */
export default function ItemVista({ item, regles, idioma, idiomaExpl, onResultat, onSeguent, retroaccio = true, textLectura, etiquetaSeguent, numero }: Props) {
  const d = t(idioma).practica;
  const [resposta, setResposta] = useState<string | number | null>(null);
  const [aval, setAval] = useState<Avaluacio | null>(null);
  const [perque, setPerque] = useState(false);
  const [errata, setErrata] = useState<'no' | 'form' | 'ok'>('no');
  const [textErrata, setTextErrata] = useState('');
  const [veu, setVeu] = useState<'servidor' | 'navegador' | 'cap' | null>(null);
  const [mostrarText, setMostrarText] = useState(false);
  const [escoltes, setEscoltes] = useState(0);
  const camp = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const regla = regles[item.regla];
  const conOpc = Array.isArray(item.opcions);

  useEffect(() => { setResposta(null); setAval(null); setPerque(false); setErrata('no'); setMostrarText(false); setEscoltes(0); setVeu(null); aturar(); }, [item.id]);
  useEffect(() => () => aturar(), []);

  const comprovar = () => {
    if (resposta === null || resposta === '') return;
    const a = avaluar(item, resposta);
    setAval(a);
    onResultat(a, resposta);
    if (!retroaccio && onSeguent) onSeguent();
  };
  const escoltar = async () => { setEscoltes((n) => n + 1); const r = await parlar(item.text ?? '', 'central'); setVeu(r); if (r === 'cap') setMostrarText(true); };
  useEffect(() => { if (item.tipus === 'dictat' && typeof speechSynthesis !== 'undefined') { speechSynthesis.getVoices(); setTimeout(() => { if (!hiHaVeuNavegador()) setVeu((v) => v ?? 'cap'); }, 400); } }, [item.id, item.tipus]);

  const enunciat = useMemo(() => {
    if (item.tipus === 'buits' && item.enunciat) {
      const parts = item.enunciat.split('___');
      return <p className="text-[21px] leading-snug">{parts[0]}<span className="buit">{aval ? aval.esperada[0] : (typeof resposta === 'string' && resposta) || (typeof resposta === 'number' && item.opcions ? item.opcions[resposta] : '') || ' '}</span>{parts.slice(1).join('___')}</p>;
    }
    if (item.tipus === 'castellanismes' && item.error && item.enunciat && item.opcions) {
      const e = item.enunciat; const i = e.toLowerCase().indexOf(item.error.toLowerCase());
      if (i >= 0) return <><p className="text-[21px] leading-snug">{e.slice(0, i)}<span className={aval ? 'marcat-ok' : 'marcat'}>{aval ? item.opcions[item.resposta as number] : e.slice(i, i + item.error.length)}</span>{e.slice(i + item.error.length)}</p>{!aval ? <p className="mt-1 text-[14px] text-secundari">{idioma === 'ca' ? 'Quina és la forma correcta?' : '¿Cuál es la forma correcta?'}</p> : null}</>;
    }
    return <p className="text-[21px] leading-snug">{item.enunciat}</p>;
  }, [item, resposta, aval, idioma]);
  const textRegla = regla ? regla.regla[idiomaExpl] || regla.regla.ca : '';

  return (
    <div className="full" style={{ viewTransitionName: 'item' }}>
      <div className="full-cap"><span>{numero ? <span className="num text-[15px] text-tinta">{numero}</span> : null}{numero ? ' · ' : ''}{d.tipus[item.tipus] ?? item.tipus}</span><span>{item.nivell}</span></div>
      {textLectura ? <div className="prosa mt-4 max-h-72 overflow-y-auto rounded-[6px] bg-paper p-3 text-[15px]">{textLectura.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div> : null}

      <div className="mt-4">
        {item.tipus === 'dictat' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="boton-primari" onClick={escoltar} disabled={!!aval}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4z M15.5 8.5a5 5 0 0 1 0 7 M19 5a9 9 0 0 1 0 14" /></svg>{escoltes ? d.escoltarAltraVegada : d.escoltar}</button>
            {veu === 'cap' ? <span className="text-[14px] text-vermell">{d.senseVeu}</span> : null}
            {!mostrarText && veu === 'cap' ? <button type="button" className="boton-text text-[14px]" onClick={() => setMostrarText(true)}>{d.mostrarText}</button> : null}
            {mostrarText ? <p className="w-full rounded-[6px] bg-paper p-3 text-[16px]">{item.text}</p> : null}
            {item.focus?.length ? <p className="w-full text-[13px] text-terciari">{d.pista}: {item.focus.join(', ')}</p> : null}
          </div>
        ) : enunciat}
      </div>

      {conOpc ? (
        <div className="mt-5 grid gap-2" role={aval ? undefined : 'radiogroup'}>
          {item.opcions!.map((o, i) => {
            const sel = resposta === i;
            const cls = aval ? (i === item.resposta ? 'opcio-ok' : sel ? 'opcio-mal' : '') : '';
            return <button type="button" key={i} role={aval ? undefined : 'radio'} aria-checked={aval ? undefined : sel} aria-pressed={aval ? undefined : sel} className={`opcio ${cls}`} onClick={() => !aval && setResposta(i)} disabled={!!aval}><span className="lletra" aria-hidden="true">{String.fromCharCode(97 + i)}</span><span>{o}</span></button>;
          })}
        </div>
      ) : item.tipus === 'dictat' || item.tipus === 'transformacio' ? (
        <textarea ref={camp as React.RefObject<HTMLTextAreaElement>} className="campo mt-4 min-h-24" placeholder={`${d.escriuAqui}…`} value={typeof resposta === 'string' ? resposta : ''} onChange={(e) => setResposta(e.target.value)} disabled={!!aval} lang="ca" autoCapitalize="sentences" aria-label={d.escriuAqui} />
      ) : (
        <input ref={camp as React.RefObject<HTMLInputElement>} className="campo mt-4" placeholder={`${d.escriuAqui}…`} value={typeof resposta === 'string' ? resposta : ''} onChange={(e) => setResposta(e.target.value)} disabled={!!aval} lang="ca" autoCapitalize="none" autoComplete="off" spellCheck={false} aria-label={d.escriuAqui} onKeyDown={(e) => { if (e.key === 'Enter') comprovar(); }} />
      )}
      {item.pista && !aval ? <p className="mt-2 text-[13px] text-terciari">{d.pista}: {item.pista}</p> : null}

      {!aval ? (
        <button type="button" className="boton mt-5 w-full" onClick={comprovar} disabled={resposta === null || resposta === ''}>{d.comprovar}</button>
      ) : retroaccio ? (
        <div className="mt-5" aria-live="polite">
          <p className={`text-[17px] font-semibold ${aval.correcte ? 'text-apte' : 'text-vermell'}`}>{aval.correcte ? d.correcte : d.incorrecte}{aval.quasi ? ' · accents' : ''}{aval.precisio !== undefined ? ` · ${Math.round(aval.precisio * 100)} %` : ''}</p>
          {!aval.correcte || item.tipus === 'dictat' ? (
            <div className="mt-1 text-[16px]">
              {item.tipus === 'dictat' && aval.detall ? <p className="leading-relaxed">{aval.detall.map((w, i) => <span key={i} className={w.ok ? '' : 'rounded bg-vermell-tenue px-0.5 font-semibold text-vermell'}>{w.paraula} </span>)}</p>
                : <p><span className="text-secundari">{d.respostaCorrecta}:</span> <strong>{item.tipus === 'buits' && item.enunciat && !conOpc ? ompleBuit(item.enunciat, aval.esperada[0]) : aval.esperada[0]}</strong>{aval.esperada.length > 1 && !conOpc ? <span className="block text-[14px] text-terciari">{d.acceptades}: {aval.esperada.slice(1, 4).join(' / ')}</span> : null}</p>}
            </div>
          ) : null}
          <div className="mt-4 flex gap-2">
            {regla ? <button type="button" className="boton-sec" onClick={() => setPerque((v) => !v)} aria-expanded={perque}>{d.perque}</button> : null}
            {onSeguent ? <button type="button" className="boton-primari flex-1" onClick={onSeguent} autoFocus>{etiquetaSeguent ?? d.seguent}</button> : null}
          </div>
          {perque && regla ? (
            <div className="regla mt-4 text-[15px]" dir={idiomaExpl === 'ar' ? 'rtl' : 'ltr'} lang={idiomaExpl}>
              <p className="font-semibold" dir="ltr" lang="ca">{regla.titol.ca}</p>
              <p className="mt-1 leading-relaxed">{textRegla}</p>
              <ul className="mt-2 space-y-1" dir="ltr" lang="ca">{regla.exemples.slice(0, 3).map((e, i) => <li key={i}>{e.malament ? <><span className="text-vermell line-through decoration-2">{e.malament}</span> → </> : null}<span className="font-medium text-apte">{e.be}</span></li>)}</ul>
              <p className="mt-2 text-[13px]" dir="ltr"><a className="underline" href={regla.font.url} target="_blank" rel="noopener noreferrer">{d.font}: {regla.font.nom}</a></p>
            </div>
          ) : null}
          <div className="mt-4 text-[13px]">
            {errata === 'no' ? <button type="button" className="text-terciari underline" onClick={() => setErrata('form')}>{d.informar}</button> : null}
            {errata === 'form' ? <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await fetch('/api/errata', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemId: item.id, text: textErrata }) }).catch(() => {}); setErrata('ok'); }}><input className="campo" name="errata" value={textErrata} onChange={(e) => setTextErrata(e.target.value)} placeholder={`${d.reportarPlaceholder ?? d.informar}…`} aria-label={d.informar} required autoComplete="off" /><button className="boton-sec" type="submit">OK</button></form> : null}
            {errata === 'ok' ? <span className="text-apte">{d.gracies}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
