'use client';
import { useState } from 'react';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';

export default function FormAlerta({ idioma }: { idioma: Idioma }) {
  const d = t(idioma).convocatories;
  const [email, setEmail] = useState(''); const [nivell, setNivell] = useState('C1'); const [estat, setEstat] = useState<'' | 'ok' | 'err'>('');
  return (
    <form className="tarjeta grid gap-2" onSubmit={async (e) => { e.preventDefault(); const r = await fetch('/api/alerta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, nivell, idioma }) }); setEstat(r.ok ? 'ok' : 'err'); }}>
      <p className="font-semibold">{d.alerta}</p>
      <p className="text-sm text-suave">{d.alertaText}</p>
      <div className="flex gap-2"><input className="campo" type="email" required placeholder={d.correu} value={email} onChange={(e) => setEmail(e.target.value)} /><select className="campo w-28" value={nivell} onChange={(e) => setNivell(e.target.value)} aria-label={d.nivell}>{['B1', 'B2', 'C1', 'C2'].map((n) => <option key={n}>{n}</option>)}</select></div>
      <button className="boton" type="submit">{d.enviar}</button>
      {estat === 'ok' ? <p className="text-sm text-ok">{d.gracies}</p> : null}{estat === 'err' ? <p className="text-sm text-mal">{d.error}</p> : null}
    </form>
  );
}
