'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { llegirEstat, esborrarEstat } from '@/lib/estat';

export default function AccionsCompte({ idioma, cancelaAlFinal, premium, teStripe }: { idioma: Idioma; cancelaAlFinal: boolean; premium: boolean; teStripe: boolean }) {
  const d = t(idioma).compte;
  const router = useRouter();
  const [c, setC] = useState(false);
  const crida = async (url: string, body?: object) => { setC(true); try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idioma, ...body }) }); const j = await r.json().catch(() => ({})); if (j.url) { location.href = j.url; return; } router.refresh(); } finally { setC(false); } };
  const exportar = () => { const blob = new Blob([JSON.stringify(llegirEstat(), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'aprova-historial.json'; a.click(); };
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {premium && !cancelaAlFinal ? <button className="boton-sec" disabled={c} onClick={() => confirm('?') && crida('/api/subscripcio/cancelar')}>{d.cancelar}</button> : null}
      {premium && cancelaAlFinal ? <button className="boton-sec" disabled={c} onClick={() => crida('/api/subscripcio/reactivar')}>{d.reactivar}</button> : null}
      {teStripe ? <button className="boton-sec" disabled={c} onClick={() => crida('/api/portal')}>{d.gestionar}</button> : null}
      <button className="boton-sec" onClick={exportar}>{d.exportar}</button>
      <button className="boton-sec" disabled={c} onClick={async () => { await fetch('/api/auth/sortir', { method: 'POST' }); esborrarEstat(); router.push(`/${idioma}`); router.refresh(); }}>{d.sortir}</button>
    </div>
  );
}
