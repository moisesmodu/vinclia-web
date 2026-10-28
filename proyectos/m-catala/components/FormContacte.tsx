'use client';
import { useState } from 'react';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';

export default function FormContacte({ idioma }: { idioma: Idioma }) {
  const d = t(idioma).contacte;
  const [email, setEmail] = useState(''); const [text, setText] = useState(''); const [ok, setOk] = useState(false);
  if (ok) return <p className="tarjeta text-oliva">{d.gracies}</p>;
  return (
    <form className="tarjeta grid gap-2" onSubmit={async (e) => { e.preventDefault(); await fetch('/api/contacte', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, text }) }); setOk(true); }}>
      <input className="campo" type="email" placeholder={d.email} value={email} onChange={(e) => setEmail(e.target.value)} />
      <textarea className="campo min-h-32" placeholder={d.missatge} value={text} onChange={(e) => setText(e.target.value)} required minLength={5} />
      <button className="boton" type="submit">{d.enviar}</button>
    </form>
  );
}
