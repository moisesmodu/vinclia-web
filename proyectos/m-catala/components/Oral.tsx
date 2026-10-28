'use client';
import { useEffect, useRef, useState } from 'react';
import type { Idioma, LecturaOral, Nivell, So } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import type { ResultatOral } from '@/lib/oral';
import { puntuarLectura } from '@/lib/oral';

type SR = { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: ((e: unknown) => void) | null; onend: (() => void) | null };
const Reconeixedor = (): (new () => SR) | null => (typeof window === 'undefined' ? null : ((window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition ?? null));

/** Lectura en veu alta amb puntuació per so. Grava l'àudio (MediaRecorder) i, alhora, transcriu amb el reconeixement del navegador en català;
 *  el servidor fa servir Whisper català si està configurat (WHISPER_URL) i, si no, la transcripció del navegador. */
export default function Oral({ idioma, lectures, sons, nivell, compacte, onResultat }: { idioma: Idioma; lectures: LecturaOral[]; sons: So[]; nivell: Nivell; compacte?: boolean; onResultat?: (r: ResultatOral) => void }) {
  const d = t(idioma).oral;
  const [, actualitzar] = useEstat();
  const llista = lectures.filter((l) => l.nivell === nivell || l.nivell === 'general');
  const [lectura, setLectura] = useState<LecturaOral>(llista[0] ?? lectures[0]);
  const [estat, setEstat] = useState<'idle' | 'gravant' | 'analitzant' | 'fet'>('idle');
  const [res, setRes] = useState<ResultatOral | null>(null);
  const [err, setErr] = useState('');
  const [quota, setQuota] = useState<{ premium: boolean; segons: number; limit: number } | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const sr = useRef<SR | null>(null);
  const transcripcio = useRef('');
  const trossos = useRef<Blob[]>([]);
  const inici = useRef(0);

  useEffect(() => { fetch('/api/us').then((r) => r.json()).then((j) => setQuota({ premium: !!j.premium, segons: j.us?.oralSegons ?? 0, limit: (j.limits?.oralMinutsMes ?? 10) * 60 })).catch(() => {}); }, []);
  useEffect(() => { setRes(null); setEstat('idle'); setErr(''); }, [lectura?.id]);

  const gravar = async () => {
    setErr(''); setRes(null); transcripcio.current = ''; trossos.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size) trossos.current.push(e.data); };
      mr.onstop = () => { stream.getTracks().forEach((tk) => tk.stop()); analitzar(); };
      rec.current = mr; mr.start();
      const R = Reconeixedor();
      if (R) { const s = new R(); s.lang = 'ca-ES'; s.continuous = true; s.interimResults = true; s.maxAlternatives = 1; s.onresult = (e) => { let tx = ''; for (let i = 0; i < e.results.length; i++) tx += e.results[i][0].transcript + ' '; transcripcio.current = tx; }; s.onerror = () => {}; s.onend = () => {}; try { s.start(); sr.current = s; } catch {} }
      inici.current = Date.now(); setEstat('gravant');
    } catch { setErr(d.senseMicro); }
  };
  const parar = () => { try { sr.current?.stop(); } catch {} rec.current?.stop(); setEstat('analitzant'); };

  const analitzar = async () => {
    const segons = Math.round((Date.now() - inici.current) / 1000);
    await new Promise((r) => setTimeout(r, 600)); // deixa acabar el reconeixedor
    let r: ResultatOral | null = null;
    try {
      const fd = new FormData();
      fd.append('audio', new Blob(trossos.current, { type: 'audio/webm' }), 'lectura.webm');
      fd.append('lecturaId', lectura.id); fd.append('segons', String(segons));
      const x = await fetch('/api/oral', { method: 'POST', body: fd });
      if (x.status === 402) { setErr(d.quotaEsgotada); setEstat('idle'); return; }
      const j = await x.json();
      if (j?.metode === 'whisper' && j?.sons) r = j as ResultatOral;
      else {
        if (!Reconeixedor() && !transcripcio.current) { setErr(d.senseReconeixement); setEstat('idle'); return; }
        const y = await fetch('/api/oral', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lecturaId: lectura.id, transcripcio: transcripcio.current, segons }) });
        if (y.status === 402) { setErr(d.quotaEsgotada); setEstat('idle'); return; }
        const k = await y.json();
        r = k?.sons ? (k as ResultatOral) : puntuarLectura(lectura, transcripcio.current, sons, 'navegador');
      }
    } catch { r = puntuarLectura(lectura, transcripcio.current, sons, 'navegador'); }
    if (!r) { setEstat('idle'); return; }
    setRes(r); setEstat('fet'); onResultat?.(r);
    actualitzar((e) => ({ ...e, oral: [...e.oral.slice(-50), { data: new Date().toISOString(), lecturaId: lectura.id, global: r!.global, pitjors: r!.pitjors }], quotes: { ...e.quotes, oralSegons: e.quotes.oralSegons + segons } }));
  };

  if (!lectura) return null;
  const esgotada = quota && !quota.premium && quota.segons >= quota.limit;
  const paraulesClau = Object.keys(lectura.paraulesClau);
  return (
    <div className="grid gap-3">
      {!compacte && llista.length > 1 ? <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">{llista.map((l) => <button key={l.id} type="button" role="tab" aria-selected={l.id === lectura.id} className={`shrink-0 rounded-full border px-3 py-1.5 text-[14px] font-semibold ${l.id === lectura.id ? 'border-tinta bg-tinta text-white' : 'border-linia bg-paper text-secundari'}`} onClick={() => setLectura(l)}>{l.titol}</button>)}</div> : null}
      <div className="full">
        <p className="full-cap">{d.sons}: {lectura.sons.map((id) => sons.find((s) => s.id === id)?.nom[idioma] ?? id).join(' · ')}</p>
        <p className="mt-4 text-[21px] leading-relaxed">{lectura.text.split(/(\s+)/).map((w, i) => { const net = w.toLowerCase().replace(/[^\p{L}'·-]/gu, ''); const clau = paraulesClau.includes(net); const okR = res ? res.sons.flatMap((s) => s.paraules).find((p) => p.paraula.toLowerCase() === net) : null; return <span key={i} className={clau ? `rounded px-0.5 ${okR ? (okR.ok ? 'bg-apte-tenue' : 'bg-vermell-tenue text-vermell') : 'bg-boli-tenue'}` : ''}>{w}</span>; })}</p>
        <div className="mt-5 flex items-center gap-2">
          {estat === 'idle' || estat === 'fet' ? <button type="button" className="boton-primari" onClick={gravar} disabled={!!esgotada}><span className="inline-block h-2.5 w-2.5 rounded-full bg-vermell" aria-hidden="true" />{estat === 'fet' ? d.tornar : d.gravar}</button> : null}
          {estat === 'gravant' ? <button type="button" className="boton" onClick={parar}><span className="inline-block h-2.5 w-2.5 rounded-sm bg-white" aria-hidden="true" />{d.parar}</button> : null}
          {estat === 'analitzant' ? <span className="text-[15px] text-secundari" aria-live="polite">{d.analitzant}</span> : null}
          {quota ? <span className="ml-auto text-[13px] text-terciari">{quota.premium ? t(idioma).comu.premium : d.quota(Math.floor(quota.segons / 60), Math.floor(quota.limit / 60))}</span> : null}
        </div>
        {err ? <p className="mt-2 text-[15px] text-vermell" role="alert">{err}</p> : null}
      </div>
      {res ? (
        <div aria-live="polite">
          <div className="flex items-baseline justify-between"><p className="text-[15px] text-secundari">{d.resultat}</p><p className="num text-[40px] leading-none">{res.global}<span className="text-[20px] text-terciari">%</span></p></div>
          <p className="text-[13px] text-terciari">{d.paraulesBe(res.paraulesOk, res.paraulesTotal)} · {d.metode[res.metode]}</p>
          {res.transcripcio ? <p className="mt-3 rounded-[6px] bg-paper p-3 text-[15px] italic">{d.transcripcio}: «{res.transcripcio.trim()}»</p> : null}
          <div className="mt-5 grid gap-4">{res.sons.map((s) => { const def = sons.find((x) => x.id === s.id); return <div key={s.id}><div className="flex items-baseline justify-between text-[15px]"><span className="font-semibold">{def?.nom[idioma] ?? s.id}</span><span className="num">{s.puntuacio} %</span></div><div className="barra mt-1.5"><span style={{ width: `${s.puntuacio}%`, background: s.puntuacio < 50 ? '#B9342E' : s.puntuacio < 80 ? '#E0B23A' : '#7A8F3C' }} /></div><p className="mt-1 text-[14px] text-secundari">{s.paraules.map((p) => <span key={p.paraula} className={p.ok ? 'mr-2' : 'mr-2 text-vermell line-through'}>{p.paraula}</span>)}</p>{def && s.puntuacio < 80 ? <p className="regla mt-2 text-[14px]"><strong>{d.pista}:</strong> {def.pista?.[idioma] ?? def.descripcio[idioma]}</p> : null}</div>; })}</div>
          <p className="mt-4 text-[13px] text-terciari">{d.aproximat}</p>
        </div>
      ) : null}
    </div>
  );
}
