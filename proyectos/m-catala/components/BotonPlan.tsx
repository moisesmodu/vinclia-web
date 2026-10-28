'use client';
import { useState } from 'react';

export default function BotonPlan({ plan, idioma, texto, destacado }: { plan: string; idioma: string; texto: string; destacado?: boolean }) {
  const [cargando, setCargando] = useState(false);
  const [err, setErr] = useState('');
  return (
    <>
      <button className={`${destacado ? 'boton-primari' : 'boton-sec'} mt-4 w-full`} disabled={cargando} onClick={async () => {
        setCargando(true); setErr('');
        try { const r = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan, idioma }) }); const j = await r.json(); if (j.url) location.href = j.url; else { setErr(j.error ?? 'Error'); setCargando(false); } } catch { setErr('Error'); setCargando(false); }
      }}>{cargando ? '…' : texto}</button>
      {err ? <p className="mt-2 text-xs text-vermell">{err}</p> : null}
    </>
  );
}
