'use client';
import { useState } from 'react';
import type { Idioma, Tasca } from '@/lib/tipos';

/** Formulari de la prova de validesa: el candidat (codi de la tanda, V01…V20 per defecte) escriu la redacció; l'app la corregeix i guarda la nota.
 *  El professor hi afegeix després la seva nota per criteri amb el mateix codi i la clau de la prova (VALIDESA_CLAU). Els textos s'esborren als 90 dies. */
export default function FormValidesa({ idioma, tasques }: { idioma: Idioma; tasques: Tasca[] }) {
  const ca = idioma === 'ca';
  const [rol, setRol] = useState<'candidat' | 'professor'>('candidat');
  const [codi, setCodi] = useState(''); const [tascaId, setTascaId] = useState(tasques[0]?.id ?? ''); const [text, setText] = useState('');
  const [clau, setClau] = useState('');
  const [notes, setNotes] = useState({ adequacio: 5, coherencia: 5, correccio: 5, riquesa: 5 }); const [obs, setObs] = useState('');
  const [res, setRes] = useState<{ nota?: { punts: number; max: number }; criteris?: Record<string, number> } | null>(null); const [err, setErr] = useState('');
  const [enviant, setEnviant] = useState(false);
  const tasca = tasques.find((x) => x.id === tascaId);
  const MAX = 6000;
  const missatge = (codi: string) => ({
    dades: ca ? 'Revisa el codi, la tasca i la llargada (mínim 60 paraules).' : 'Revisa el código, la tarea y la longitud (mínimo 60 palabras).',
    llarg: ca ? `El text supera els ${MAX} caràcters.` : `El texto supera los ${MAX} caracteres.`,
    clau: ca ? 'La clau de professor no és correcta.' : 'La clave de profesor no es correcta.',
    'massa peticions': ca ? 'Massa enviaments seguits: espera un minut.' : 'Demasiados envíos seguidos: espera un minuto.',
  })[codi] ?? (ca ? 'Hi ha hagut un error. Torna-ho a provar.' : 'Ha habido un error. Vuelve a intentarlo.');
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setEnviant(true);
    try {
      const r = await fetch('/api/validesa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ codi, tascaId, text, ...(rol === 'professor' ? { notaProfe: notes, observacions: obs, clau } : {}) }) });
      const j = await r.json(); if (!r.ok) { setErr(missatge(j.error ?? '')); return; } setRes(j.notaApp);
    } catch { setErr(missatge('')); } finally { setEnviant(false); }
  };
  if (res) return <div className="tarjeta"><p className="font-semibold text-apte">{ca ? 'Rebut. Gràcies!' : 'Recibido. ¡Gracias!'}</p>{rol === 'candidat' ? <p className="mt-2 text-sm">{ca ? 'Nota de l\'app' : 'Nota de la app'}: <strong>{res.nota?.punts} / {res.nota?.max}</strong> · {Object.entries(res.criteris ?? {}).map(([k, v]) => `${k} ${v}`).join(' · ')}</p> : null}</div>;
  return (
    <form onSubmit={enviar} className="tarjeta grid gap-3">
      <div className="flex gap-2">{(['candidat', 'professor'] as const).map((r) => <button type="button" key={r} className={`opcio justify-center ${rol === r ? 'border-tinta bg-boli-tenue' : ''}`} onClick={() => setRol(r)}>{r === 'candidat' ? (ca ? 'Soc candidat/a' : 'Soy candidato/a') : (ca ? 'Soc professor/a' : 'Soy profesor/a')}</button>)}</div>
      <input className="campo" aria-label={ca ? 'Codi de candidat' : 'Código de candidato'} placeholder={ca ? 'Codi (V01 … V20)' : 'Código (V01 … V20)'} value={codi} onChange={(e) => setCodi(e.target.value.toUpperCase())} pattern="V\d{2}" required />
      {rol === 'professor' ? <input className="campo" type="password" aria-label={ca ? 'Clau de la prova' : 'Clave de la prueba'} placeholder={ca ? 'Clau de la prova (la té l\'organitzador)' : 'Clave de la prueba (la tiene el organizador)'} value={clau} onChange={(e) => setClau(e.target.value)} required autoComplete="off" /> : null}
      <select className="campo" aria-label={ca ? 'Tasca' : 'Tarea'} value={tascaId} onChange={(e) => setTascaId(e.target.value)}>{tasques.map((x) => <option key={x.id} value={x.id}>{x.nivell} · {x.titol}</option>)}</select>
      {tasca ? <div className="rounded-xl bg-paper p-3 text-sm"><p>{tasca.enunciat}</p>{tasca.fonts?.map((f, i) => <details key={i} className="mt-2"><summary className="cursor-pointer font-semibold">{f.titol}</summary><p className="mt-1">{f.text}</p></details>)}<p className="mt-2 text-xs text-secundari">{tasca.paraulesMin}–{tasca.paraulesMax} {ca ? 'paraules' : 'palabras'} · {tasca.minuts} min</p></div> : null}
      <textarea className="campo min-h-56" aria-label={ca ? 'Redacció' : 'Redacción'} value={text} onChange={(e) => setText(e.target.value.slice(0, MAX))} maxLength={MAX} required lang="ca" placeholder={rol === 'candidat' ? (ca ? 'Escriu aquí la teva redacció' : 'Escribe aquí tu redacción') : (ca ? 'Enganxa aquí la redacció del candidat' : 'Pega aquí la redacción del candidato')} />
      <p className="text-xs text-secundari">{text.length} / {MAX} · {ca ? 'El text es guarda sense nom i s\'esborra als 90 dies.' : 'El texto se guarda sin nombre y se borra a los 90 días.'}</p>
      {rol === 'professor' ? <div className="grid grid-cols-2 gap-2">{(Object.keys(notes) as (keyof typeof notes)[]).map((k) => <label key={k} className="text-sm">{k} (0–10)<input className="campo mt-1" type="number" min={0} max={10} value={notes[k]} onChange={(e) => setNotes({ ...notes, [k]: Number(e.target.value) })} /></label>)}<textarea className="campo col-span-2" aria-label={ca ? 'Observacions' : 'Observaciones'} placeholder={ca ? 'Observacions' : 'Observaciones'} value={obs} onChange={(e) => setObs(e.target.value)} /></div> : null}
      {err ? <p className="text-sm text-vermell" role="alert">{err}</p> : null}
      <button className="boton" type="submit" disabled={enviant}>{enviant ? '…' : 'Enviar'}</button>
    </form>
  );
}
