'use client';
import { useState } from 'react';
import type { Idioma } from '@/lib/tipos';

export default function FormularioRecuperar({ idioma, token }: { idioma: Idioma; token?: string }) {
  const ca = idioma === 'ca';
  const [valor, setValor] = useState('');
  const [estado, setEstado] = useState<'' | 'enviado' | 'error' | 'cargando'>('');
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado('cargando');
    const r = await fetch(token ? '/api/auth/nueva-clave' : '/api/auth/recuperar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(token ? { t: token, clave: valor } : { email: valor, idioma }) });
    if (r.ok && token) { location.href = `/${idioma}/cuenta`; return; }
    setEstado(r.ok ? 'enviado' : 'error');
  };
  return (
    <form onSubmit={enviar} className="tarjeta mt-6 max-w-md space-y-3">
      <label className="block text-sm">
        {token ? (ca ? 'Contrasenya nova (mínim 8 caràcters)' : 'Contraseña nueva (mínimo 8 caracteres)') : (ca ? 'Correu electrònic del compte' : 'Correo electrónico de la cuenta')}
        <input type={token ? 'password' : 'email'} required minLength={token ? 8 : undefined} autoComplete={token ? 'new-password' : 'email'} value={valor} onChange={(e) => setValor(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5" />
      </label>
      {estado === 'enviado' ? <p className="text-sm text-ok">{ca ? 'Si el correu té compte, t\'hem enviat un enllaç. Mira també el correu brossa.' : 'Si el correo tiene cuenta, te hemos enviado un enlace. Mira también el correo no deseado.'}</p> : null}
      {estado === 'error' ? <p className="text-sm text-mal">{token ? (ca ? 'L\'enllaç ha caducat. Demana\'n un altre.' : 'El enlace ha caducado. Pide otro.') : (ca ? 'Ara no podem enviar correus: escriu-nos des de Contacte.' : 'Ahora no podemos enviar correos: escríbenos desde Contacto.')}</p> : null}
      <button className="boton w-full" disabled={estado === 'cargando'}>{token ? (ca ? 'Desar la contrasenya' : 'Guardar la contraseña') : (ca ? 'Enviar l\'enllaç' : 'Enviar el enlace')}</button>
    </form>
  );
}
