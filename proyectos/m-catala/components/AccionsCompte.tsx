'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { llegirEstat, esborrarTotLocal } from '@/lib/estat';

export default function AccionsCompte({ idioma, cancelaAlFinal, premium, teStripe }: { idioma: Idioma; cancelaAlFinal: boolean; premium: boolean; teStripe: boolean }) {
  const d = t(idioma).compte;
  const ca = idioma === 'ca';
  const router = useRouter();
  const [c, setC] = useState(false);
  const [esborrant, setEsborrant] = useState(false);
  const [clau, setClau] = useState('');
  const [err, setErr] = useState('');
  const crida = async (url: string, body?: object) => { setC(true); try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idioma, ...body }) }); const j = await r.json().catch(() => ({})); if (j.url) { location.href = j.url; return; } router.refresh(); } finally { setC(false); } };
  const exportar = () => { const blob = new Blob([JSON.stringify(llegirEstat(), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'aprova-historial.json'; a.click(); };
  const sortir = async (tot: boolean) => { setC(true); try { await fetch('/api/auth/sortir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tot }) }); } catch {} esborrarTotLocal(); router.push(`/${idioma}`); router.refresh(); };
  const esborrarCompte = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setC(true);
    try {
      const r = await fetch('/api/auth/compte', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clau }) });
      if (r.status === 401) { setErr(ca ? 'La contrasenya no és correcta.' : 'La contraseña no es correcta.'); setC(false); return; }
      if (!r.ok) { setErr(t(idioma).comu.error); setC(false); return; }
      esborrarTotLocal(); router.push(`/${idioma}?esborrat=1`); router.refresh();
    } catch { setErr(t(idioma).comu.error); setC(false); }
  };
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {premium && !cancelaAlFinal ? <button className="boton-sec" disabled={c} onClick={() => confirm(ca ? 'Vols cancel·lar la renovació? Mantens l\'accés fins al final del període pagat.' : '¿Quieres cancelar la renovación? Mantienes el acceso hasta el final del periodo pagado.') && crida('/api/subscripcio/cancelar')}>{d.cancelar}</button> : null}
        {premium && cancelaAlFinal ? <button className="boton-sec" disabled={c} onClick={() => crida('/api/subscripcio/reactivar')}>{d.reactivar}</button> : null}
        {teStripe ? <button className="boton-sec" disabled={c} onClick={() => crida('/api/portal')}>{d.gestionar}</button> : null}
        <button className="boton-sec" onClick={exportar}>{d.exportar}</button>
        <button className="boton-sec" disabled={c} onClick={() => sortir(false)}>{d.sortir}</button>
        <button className="boton-sec" disabled={c} onClick={() => sortir(true)}>{ca ? 'Sortir de tots els dispositius' : 'Salir de todos los dispositivos'}</button>
      </div>
      <div className="mt-8 border-t border-linia pt-4">
        {!esborrant ? <button type="button" className="text-sm text-vermell underline" onClick={() => setEsborrant(true)}>{ca ? 'Esborrar el meu compte' : 'Borrar mi cuenta'}</button> : (
          <form onSubmit={esborrarCompte} className="grid gap-2 text-sm">
            <p>{ca ? 'S\'esborraran el compte, el progrés sincronitzat, les correccions i els simulacres. No es pot desfer. Si tens una subscripció, es cancel·la.' : 'Se borrarán la cuenta, el progreso sincronizado, las correcciones y los simulacros. No se puede deshacer. Si tienes una suscripción, se cancela.'}</p>
            <input className="campo" type="password" aria-label={ca ? 'Contrasenya' : 'Contraseña'} placeholder={ca ? 'Contrasenya per confirmar' : 'Contraseña para confirmar'} value={clau} onChange={(e) => setClau(e.target.value)} required autoComplete="current-password" />
            {err ? <p className="text-vermell" role="alert">{err}</p> : null}
            <div className="flex gap-2"><button type="submit" className="boton-sec text-vermell" disabled={c || !clau}>{ca ? 'Esborrar definitivament' : 'Borrar definitivamente'}</button><button type="button" className="boton-sec" onClick={() => { setEsborrant(false); setClau(''); setErr(''); }}>{t(idioma).comu.tancar}</button></div>
          </form>
        )}
      </div>
    </div>
  );
}
