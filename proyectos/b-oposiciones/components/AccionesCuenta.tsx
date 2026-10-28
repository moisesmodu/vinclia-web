'use client';
import { useState } from 'react';

export default function AccionesCuenta({ idioma, accion, texto, secundario }: { idioma: string; accion: 'portal' | 'cancelar' | 'reactivar'; texto: string; secundario?: boolean }) {
  const [c, setC] = useState(false);
  return (
    <button className={secundario ? 'boton-sec' : 'boton'} disabled={c} onClick={async () => {
      setC(true);
      const r = await fetch(accion === 'portal' ? '/api/portal' : `/api/suscripcion/${accion}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idioma }) });
      const j = await r.json().catch(() => ({}));
      if (j.url) location.href = j.url; else location.reload();
    }}>{c ? '…' : texto}</button>
  );
}
