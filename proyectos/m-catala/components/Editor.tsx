'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Idioma, Regla, Tasca } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import type { ResultatCorreccio } from '@/lib/correccio';
import Correccio from './Correccio';

export function Temporitzador({ segons, onFi }: { segons: number; onFi?: () => void }) {
  const [resta, setResta] = useState(segons);
  const fi = useRef(onFi); fi.current = onFi;
  useEffect(() => { const id = setInterval(() => setResta((r) => { if (r <= 1) { clearInterval(id); fi.current?.(); return 0; } return r - 1; }), 1000); return () => clearInterval(id); }, [segons]);
  const m = Math.floor(resta / 60), s = resta % 60;
  return <span className={`tabular-nums font-semibold ${resta < 120 ? 'text-mal' : ''}`}>{m}:{String(s).padStart(2, '0')}</span>;
}

/** Editor d'expressió escrita amb cronòmetre i límit de paraules; correcció per criteris en menys de 60 segons. */
export default function Editor({ idioma, tasca, regles, context, onCorregit, senseQuota }: { idioma: Idioma; tasca: Tasca; regles: Record<string, Regla>; context?: 'simulacre'; onCorregit?: (r: ResultatCorreccio, text: string) => void; senseQuota?: boolean }) {
  const d = t(idioma).escriure;
  const [estat, actualitzar] = useEstat();
  const [text, setText] = useState('');
  const [enviant, setEnviant] = useState(false);
  const [res, setRes] = useState<ResultatCorreccio | null>(null);
  const [err, setErr] = useState('');
  const [quota, setQuota] = useState<{ premium: boolean; correccions: number; limit: number } | null>(null);
  const [fontsObertes, setFontsObertes] = useState(false);
  const paraules = text.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => { fetch('/api/us').then((r) => r.json()).then((j) => setQuota({ premium: !!j.premium, correccions: j.us?.correccions ?? 0, limit: j.limits?.correccionsMes ?? 3 })).catch(() => {}); }, []);
  const esgotada = !senseQuota && quota && !quota.premium && quota.correccions >= quota.limit;

  const enviar = async () => {
    setEnviant(true); setErr('');
    try {
      const r = await fetch('/api/corregir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, nivell: tasca.nivell, tascaId: tasca.id, idiomaExpl: estat?.perfil?.idiomaExpl ?? idioma, context }) });
      if (r.status === 402) { setErr(d.quotaEsgotada); setEnviant(false); return; }
      const j = (await r.json()) as ResultatCorreccio & { error?: string };
      if (j.error) { setErr(t(idioma).comu.error); setEnviant(false); return; }
      setRes(j);
      actualitzar((e) => ({ ...e, correccions: [...e.correccions.slice(-100), { data: new Date().toISOString(), tascaId: tasca.id, percent: j.nota.percent }], quotes: { ...e.quotes, correccions: e.quotes.correccions + (context ? 0 : 1) } }));
      onCorregit?.(j, text);
    } catch { setErr(t(idioma).comu.error); }
    setEnviant(false);
  };

  if (res) return (
    <div>
      <Correccio idioma={idioma} r={res} text={text} regles={regles} onReescriure={() => setRes(null)} />
      {!context ? <div className="mt-4 flex gap-2"><Link className="boton-sec flex-1" href={`/${idioma}/escriure`}>{d.altraTasca}</Link><Link className="boton flex-1" href={`/${idioma}/avui`}>{t(idioma).nav.avui}</Link></div> : null}
    </div>
  );

  return (
    <div className="tarjeta">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs uppercase tracking-wide text-suave">{tasca.nivell} · {tasca.tipus} · {tasca.paraulesMin}–{tasca.paraulesMax} {d.paraules}</p><h2 className="mt-1 text-lg font-bold">{tasca.titol}</h2></div>
        <div className="text-right text-sm"><p className="text-xs text-suave">{d.temps}</p><Temporitzador segons={tasca.minuts * 60} /></div>
      </div>
      <p className="mt-3 leading-relaxed">{tasca.enunciat}</p>
      {tasca.fonts?.length ? (
        <div className="mt-3">
          <button type="button" className="text-sm font-semibold underline" onClick={() => setFontsObertes((v) => !v)}>{d.fonts} ({tasca.fonts.length})</button>
          {fontsObertes ? <div className="mt-2 grid gap-2">{tasca.fonts.map((f, i) => <div key={i} className="rounded-xl bg-crema p-3 text-sm"><p className="font-semibold">{f.titol}</p><p className="mt-1 leading-relaxed">{f.text}</p></div>)}</div> : null}
        </div>
      ) : null}
      <textarea className="campo mt-4 min-h-64" value={text} onChange={(e) => setText(e.target.value)} lang="ca" spellCheck={false} placeholder={t(idioma).diag.escriu} />
      <div className="mt-2 flex items-center justify-between text-sm text-suave">
        <span className={paraules < tasca.paraulesMin || paraules > tasca.paraulesMax ? 'text-mal' : 'text-ok'}>{paraules} {d.paraules}</span>
        {quota && !senseQuota ? <span>{quota.premium ? t(idioma).comu.premium : d.quota(quota.correccions, quota.limit)}</span> : null}
      </div>
      {err ? <p className="mt-2 text-sm text-mal">{err}</p> : null}
      {esgotada ? <p className="mt-2 rounded-lg bg-ocre-claro p-3 text-sm">{d.quotaEsgotada} <Link className="underline" href={`/${idioma}/preus`}>{t(idioma).avui.veurePreus}</Link></p> : null}
      <button type="button" className="boton mt-3 w-full" disabled={enviant || paraules < Math.round(tasca.paraulesMin * 0.6) || !!esgotada} onClick={enviar}>{enviant ? d.corregint : d.enviar}</button>
    </div>
  );
}
