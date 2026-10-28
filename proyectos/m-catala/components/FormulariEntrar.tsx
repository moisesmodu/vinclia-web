'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { llegirEstat } from '@/lib/estat';

export default function FormulariEntrar({ idioma }: { idioma: Idioma }) {
  const d = t(idioma).login;
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get('token');
  const seguent = sp.get('seguent') || `/${idioma}/compte`;
  const [mode, setMode] = useState<'entrar' | 'crear' | 'recuperar' | 'nova'>(token ? 'nova' : 'entrar');
  const [email, setEmail] = useState(''); const [clau, setClau] = useState(''); const [accepto, setAccepto] = useState(false);
  const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [carregant, setCarregant] = useState(false);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setOk(''); setCarregant(true);
    try {
      if (mode === 'recuperar') { await fetch('/api/auth/recuperar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, idioma }) }); setOk(d.enviat); setCarregant(false); return; }
      if (mode === 'nova') { const r = await fetch('/api/auth/nova-clau', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, clau }) }); if (!r.ok) { setErr(t(idioma).comu.error); setCarregant(false); return; } router.push(seguent); return; }
      const perfil = llegirEstat().perfil;
      const r = await fetch(`/api/auth/${mode === 'crear' ? 'registre' : 'entrar'}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, clau, idioma, accepto, nivell: perfil?.nivell, convocatoria: perfil?.convocatoria }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error === 'existeix' ? d.existe : j.error === 'curta' ? d.corta : j.error === 'accepto' ? d.acepto : d.error); setCarregant(false); return; }
      router.push(seguent); router.refresh();
    } catch { setErr(t(idioma).comu.error); setCarregant(false); }
  };
  return (
    <form onSubmit={enviar} className="tarjeta grid gap-3">
      <h1 className="text-xl font-bold">{mode === 'recuperar' ? d.recuperar : mode === 'nova' ? d.nova : d.titulo}</h1>
      {mode === 'recuperar' ? <p className="text-sm text-secundari">{d.recuperarText}</p> : null}
      {mode !== 'nova' ? <input className="campo" type="email" placeholder={d.email} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /> : null}
      {mode !== 'recuperar' ? <input className="campo" type="password" placeholder={d.clave} value={clau} onChange={(e) => setClau(e.target.value)} required minLength={8} autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} /> : null}
      {mode === 'crear' ? <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={accepto} onChange={(e) => setAccepto(e.target.checked)} required className="mt-1" /><span>{d.acepto} (<a className="underline" href={`/${idioma}/legal/condicions`} target="_blank">·</a>)</span></label> : null}
      {err ? <p className="text-sm text-vermell">{err}</p> : null}
      {ok ? <p className="text-sm text-apte">{ok}</p> : null}
      <button className="boton" type="submit" disabled={carregant}>{mode === 'crear' ? d.crear : mode === 'recuperar' ? d.recuperar : mode === 'nova' ? d.canviar : d.entrar}</button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        {mode === 'entrar' ? <><button type="button" className="underline" onClick={() => setMode('crear')}>{d.crear}</button><button type="button" className="text-secundari underline" onClick={() => setMode('recuperar')}>{d.recuperar}</button></> : <button type="button" className="underline" onClick={() => setMode('entrar')}>{d.entrar}</button>}
      </div>
      <p className="text-xs text-secundari">{d.perQue}</p>
    </form>
  );
}
