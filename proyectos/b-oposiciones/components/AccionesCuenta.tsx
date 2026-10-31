'use client';
import { useState } from 'react';

export default function AccionesCuenta({ idioma, accion, texto, secundario }: { idioma: string; accion: 'portal' | 'cancelar' | 'reactivar'; texto: string; secundario?: boolean }) {
  const [c, setC] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <>
    <button className={secundario ? 'boton-sec' : 'boton'} disabled={c} onClick={async () => {
      setC(true);
      setAviso(null);
      const r = await fetch(accion === 'portal' ? '/api/portal' : `/api/suscripcion/${accion}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idioma }) });
      const j = await r.json().catch(() => ({}));
      if (j.url) location.href = j.url;
      else if (j.mensaje) { setAviso(j.mensaje); setC(false); }
      else location.reload();
    }}>{c ? '…' : texto}</button>
    {aviso ? <p role="alert" className="basis-full text-sm text-slate-600">{aviso}</p> : null}
    </>
  );
}
