'use client';
import { useState } from 'react';
import type { Idioma, Tasca } from '@/lib/tipos';

/** Formulari de la prova de validesa: el candidat (codi V01…V20) escriu la redacció; l'app la corregeix i guarda la nota. El professor
 *  hi afegeix després la seva nota per criteri amb el mateix codi. */
export default function FormValidesa({ idioma, tasques }: { idioma: Idioma; tasques: Tasca[] }) {
  const ca = idioma === 'ca';
  const [rol, setRol] = useState<'candidat' | 'professor'>('candidat');
  const [codi, setCodi] = useState(''); const [tascaId, setTascaId] = useState(tasques[0]?.id ?? ''); const [text, setText] = useState('');
  const [notes, setNotes] = useState({ adequacio: 5, coherencia: 5, correccio: 5, riquesa: 5 }); const [obs, setObs] = useState('');
  const [res, setRes] = useState<{ nota?: { punts: number; max: number }; criteris?: Record<string, number> } | null>(null); const [err, setErr] = useState('');
  const tasca = tasques.find((x) => x.id === tascaId);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    const r = await fetch('/api/validesa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ codi, tascaId, text, ...(rol === 'professor' ? { notaProfe: notes, observacions: obs } : {}) }) });
    const j = await r.json(); if (!r.ok) { setErr(j.error ?? 'error'); return; } setRes(j.notaApp);
  };
  if (res) return <div className="tarjeta"><p className="font-semibold text-apte">{ca ? 'Rebut. Gràcies!' : 'Recibido. ¡Gracias!'}</p>{rol === 'candidat' ? <p className="mt-2 text-sm">{ca ? 'Nota de l\'app' : 'Nota de la app'}: <strong>{res.nota?.punts} / {res.nota?.max}</strong> · {Object.entries(res.criteris ?? {}).map(([k, v]) => `${k} ${v}`).join(' · ')}</p> : null}</div>;
  return (
    <form onSubmit={enviar} className="tarjeta grid gap-3">
      <div className="flex gap-2">{(['candidat', 'professor'] as const).map((r) => <button type="button" key={r} className={`opcio justify-center ${rol === r ? 'border-tinta bg-boli-tenue' : ''}`} onClick={() => setRol(r)}>{r === 'candidat' ? (ca ? 'Soc candidat/a' : 'Soy candidato/a') : (ca ? 'Soc professor/a' : 'Soy profesor/a')}</button>)}</div>
      <input className="campo" placeholder={ca ? 'Codi (V01 … V20)' : 'Código (V01 … V20)'} value={codi} onChange={(e) => setCodi(e.target.value.toUpperCase())} pattern="V\d{2}" required />
      <select className="campo" value={tascaId} onChange={(e) => setTascaId(e.target.value)}>{tasques.map((x) => <option key={x.id} value={x.id}>{x.nivell} · {x.titol}</option>)}</select>
      {tasca ? <div className="rounded-xl bg-paper p-3 text-sm"><p>{tasca.enunciat}</p>{tasca.fonts?.map((f, i) => <details key={i} className="mt-2"><summary className="cursor-pointer font-semibold">{f.titol}</summary><p className="mt-1">{f.text}</p></details>)}<p className="mt-2 text-xs text-secundari">{tasca.paraulesMin}–{tasca.paraulesMax} {ca ? 'paraules' : 'palabras'} · {tasca.minuts} min</p></div> : null}
      <textarea className="campo min-h-56" value={text} onChange={(e) => setText(e.target.value)} required lang="ca" placeholder={rol === 'candidat' ? (ca ? 'Escriu aquí la teva redacció' : 'Escribe aquí tu redacción') : (ca ? 'Enganxa aquí la redacció del candidat' : 'Pega aquí la redacción del candidato')} />
      {rol === 'professor' ? <div className="grid grid-cols-2 gap-2">{(Object.keys(notes) as (keyof typeof notes)[]).map((k) => <label key={k} className="text-sm">{k} (0–10)<input className="campo mt-1" type="number" min={0} max={10} value={notes[k]} onChange={(e) => setNotes({ ...notes, [k]: Number(e.target.value) })} /></label>)}<textarea className="campo col-span-2" placeholder={ca ? 'Observacions' : 'Observaciones'} value={obs} onChange={(e) => setObs(e.target.value)} /></div> : null}
      {err ? <p className="text-sm text-vermell">{err}</p> : null}
      <button className="boton" type="submit">{ca ? 'Enviar' : 'Enviar'}</button>
    </form>
  );
}
