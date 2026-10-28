'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Idioma, IdiomaExpl, Item, Regla } from '@/lib/tipos';
import { avaluar, ompleBuit, type Avaluacio } from '@/lib/motor/avaluar';
import { parlar, aturar, hiHaVeuNavegador } from '@/lib/client/veu';
import { t } from '@/lib/i18n';

type Props = {
  item: Item; regles: Record<string, Regla>; idioma: Idioma; idiomaExpl: IdiomaExpl;
  onResultat: (a: Avaluacio, resposta: string | number | null) => void; onSeguent?: () => void;
  retroaccio?: boolean; // false al simulacre: no corregeix a l'instant
  textLectura?: string; etiquetaSeguent?: string; numero?: string;
};

/** Un ítem de qualsevol tipus: respondre, comprovar, «Per què?» amb la regla citada i «Informar d'un error». */
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
      return <p className="text-lg leading-relaxed">{parts[0]}<span className="mx-1 inline-block min-w-16 border-b-2 border-ocre px-1 text-center font-semibold text-ocre-oscuro">{aval ? (aval.correcte ? String(resposta) : aval.esperada[0]) : (typeof resposta === 'string' && resposta) || ' '}</span>{parts.slice(1).join('___')}</p>;
    }
    return <p className="text-lg leading-relaxed">{item.enunciat}</p>;
  }, [item, resposta, aval]);

  const textRegla = regla ? regla.regla[idiomaExpl] || regla.regla.ca : '';

  return (
    <div className="tarjeta">
      <div className="mb-2 flex items-center gap-2 text-xs text-suave">
        {numero ? <span className="font-semibold">{numero}</span> : null}
        <span className="etiqueta">{d.tipus[item.tipus] ?? item.tipus}</span>
        <span className="ml-auto">{item.nivell}</span>
      </div>
      {textLectura ? <div className="prosa mb-4 max-h-72 overflow-y-auto rounded-xl bg-crema p-3 text-sm">{textLectura.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div> : null}

      {item.tipus === 'dictat' ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button type="button" className="boton-ocre" onClick={escoltar} disabled={!!aval}>{escoltes ? d.escoltarAltraVegada : d.escoltar} 🔊</button>
          {veu === 'cap' ? <span className="text-sm text-mal">{d.senseVeu}</span> : null}
          {!mostrarText && veu === 'cap' ? <button type="button" className="text-sm underline" onClick={() => setMostrarText(true)}>{d.mostrarText}</button> : null}
          {mostrarText ? <p className="w-full rounded-lg bg-crema p-2 text-sm">{item.text}</p> : null}
          {item.focus?.length ? <p className="w-full text-xs text-suave">{d.pista}: {item.focus.join(', ')}</p> : null}
        </div>
      ) : enunciat}

      {conOpc ? (
        <div className="mt-4 grid gap-2">
          {item.opcions!.map((o, i) => {
            const sel = resposta === i;
            const cls = aval ? (i === item.resposta ? 'opcio-ok' : sel ? 'opcio-mal' : '') : sel ? 'border-nit ring-1 ring-nit' : '';
            return <button type="button" key={i} className={`opcio ${cls}`} onClick={() => !aval && setResposta(i)} disabled={!!aval}><span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D8CDBB] text-xs font-semibold">{String.fromCharCode(97 + i)}</span><span>{o}</span></button>;
          })}
        </div>
      ) : item.tipus === 'dictat' || item.tipus === 'transformacio' ? (
        <textarea className="campo mt-3 min-h-24" placeholder={d.escriuAqui} value={typeof resposta === 'string' ? resposta : ''} onChange={(e) => setResposta(e.target.value)} disabled={!!aval} lang="ca" autoCapitalize="sentences" />
      ) : (
        <input className="campo mt-3" placeholder={d.escriuAqui} value={typeof resposta === 'string' ? resposta : ''} onChange={(e) => setResposta(e.target.value)} disabled={!!aval} lang="ca" autoCapitalize="none" autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter') comprovar(); }} />
      )}
      {item.pista && !aval ? <p className="mt-2 text-xs text-suave">{d.pista}: {item.pista}</p> : null}

      {!aval ? (
        <div className="mt-4 flex gap-2"><button type="button" className="boton flex-1" onClick={comprovar} disabled={resposta === null || resposta === ''}>{d.comprovar}</button></div>
      ) : retroaccio ? (
        <div className="mt-4">
          <p className={`font-semibold ${aval.correcte ? 'text-ok' : 'text-mal'}`}>{aval.correcte ? '✓ ' + d.correcte : '✗ ' + d.incorrecte}{aval.quasi ? ' (accents)' : ''}{aval.precisio !== undefined ? ` · ${Math.round(aval.precisio * 100)} %` : ''}</p>
          {!aval.correcte || item.tipus === 'dictat' ? (
            <div className="mt-1 text-sm">
              {item.tipus === 'dictat' && aval.detall ? <p className="leading-relaxed">{aval.detall.map((w, i) => <span key={i} className={w.ok ? '' : 'rounded bg-[#FBE7E9] px-0.5 font-semibold text-mal'}>{w.paraula} </span>)}</p>
                : <p><span className="text-suave">{d.respostaCorrecta}:</span> <strong>{item.tipus === 'buits' && item.enunciat && !conOpc ? ompleBuit(item.enunciat, aval.esperada[0]) : aval.esperada[0]}</strong>{aval.esperada.length > 1 && !conOpc ? <span className="text-suave"> · {d.acceptades}: {aval.esperada.slice(1, 4).join(' / ')}</span> : null}</p>}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {regla ? <button type="button" className="boton-sec" onClick={() => setPerque((v) => !v)}>{d.perque}</button> : null}
            {onSeguent ? <button type="button" className="boton flex-1" onClick={onSeguent} autoFocus>{etiquetaSeguent ?? d.seguent}</button> : null}
          </div>
          {perque && regla ? (
            <div className="mt-3 rounded-xl bg-ocre-claro p-4 text-sm" dir={idiomaExpl === 'ar' ? 'rtl' : 'ltr'} lang={idiomaExpl}>
              <p className="font-semibold" dir="ltr" lang="ca">{regla.titol.ca}</p>
              <p className="mt-1 leading-relaxed">{textRegla}</p>
              <ul className="mt-2 space-y-1" dir="ltr" lang="ca">{regla.exemples.slice(0, 3).map((e, i) => <li key={i}>{e.malament ? <><span className="text-mal line-through">{e.malament}</span> → </> : null}<span className="text-ok font-medium">{e.be}</span></li>)}</ul>
              <p className="mt-2 text-xs" dir="ltr"><a className="underline" href={regla.font.url} target="_blank" rel="noopener noreferrer">{d.font}: {regla.font.nom}</a></p>
            </div>
          ) : null}
          <div className="mt-3 text-xs">
            {errata === 'no' ? <button type="button" className="text-suave underline" onClick={() => setErrata('form')}>{d.informar}</button> : null}
            {errata === 'form' ? <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await fetch('/api/errata', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemId: item.id, text: textErrata }) }).catch(() => {}); setErrata('ok'); }}><input className="campo" value={textErrata} onChange={(e) => setTextErrata(e.target.value)} placeholder="…" required /><button className="boton-sec" type="submit">OK</button></form> : null}
            {errata === 'ok' ? <span className="text-ok">{d.gracies}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
