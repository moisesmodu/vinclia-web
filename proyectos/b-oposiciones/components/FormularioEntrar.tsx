'use client';
import { useState } from 'react';
import Link from 'next/link';
import { t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';

export default function FormularioEntrar({ idioma, siguiente, plan }: { idioma: Idioma; siguiente: string; plan?: string }) {
  const d = t(idioma).login;
  const [modo, setModo] = useState<'entrar' | 'crear'>('crear');
  const ca = idioma === 'ca';
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [acepto, setAcepto] = useState(false);
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setCargando(true);
    const r = await fetch(`/api/auth/${modo === 'crear' ? 'registro' : 'entrar'}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, clave, acepto, idioma }) });
    const j = await r.json().catch(() => ({}));
    setCargando(false);
    if (r.ok) {
      // Viene de «quiero pagar»: tras crear la cuenta, directo a Stripe (dos pantallas entre quererlo y pagarlo).
      if (plan) {
        const c = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan, idioma }) }).then((x) => x.json()).catch(() => ({}));
        if (c.url) { location.href = c.url; return; }
      }
      location.href = siguiente; return;
    }
    setErr(j.error === 'existe' ? d.existe : j.error === 'corta' ? d.corta : j.error === 'acepto' ? d.acepto : j.error === 'credenciales' ? d.error : (j.error ?? 'Error'));
    if (j.error === 'existe') setModo('entrar');
  };
  return (
    <form onSubmit={enviar} className="tarjeta mt-6 max-w-md space-y-3">
      {plan ? <p className="rounded-lg bg-marca-claro p-3 text-sm text-marca-oscuro">{ca ? 'Crea el compte i passes directament al pagament segur amb Stripe. 9,99 €/mes, cancel·la amb un clic.' : 'Crea la cuenta y pasas directamente al pago seguro con Stripe. 9,99 €/mes, cancela en un clic.'}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setModo('crear')} className={`rounded-lg py-2 text-sm font-semibold ${modo === 'crear' ? 'bg-marca-claro text-marca-oscuro' : 'text-slate-500'}`}>{d.crear}</button>
        <button type="button" onClick={() => setModo('entrar')} className={`rounded-lg py-2 text-sm font-semibold ${modo === 'entrar' ? 'bg-marca-claro text-marca-oscuro' : 'text-slate-500'}`}>{d.entrar}</button>
      </div>
      <label className="block text-sm">{d.email}<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5" /></label>
      <label className="block text-sm">{d.clave}<input type="password" required minLength={8} autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} value={clave} onChange={(e) => setClave(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5" /></label>
      {modo === 'crear' ? (
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} required className="mt-1" />
          <span><Link href={`/${idioma}/legal/condiciones`}>{d.acepto}</Link></span></label>
      ) : null}
      {err ? <p className="text-sm text-mal">{err}</p> : null}
      <button className="boton w-full" disabled={cargando}>{cargando ? '…' : modo === 'crear' ? d.crear : d.entrar}</button>
      {modo === 'entrar' ? <p className="text-center text-sm"><Link href={`/${idioma}/recuperar`}>{idioma === 'ca' ? 'He oblidat la contrasenya' : 'He olvidado la contraseña'}</Link></p> : null}
    </form>
  );
}
