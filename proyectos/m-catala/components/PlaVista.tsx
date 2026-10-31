'use client';
import Link from 'next/link';
import type { Convocatoria, Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { avuiISO } from '@/lib/motor/ratxa';

const fmt = (iso: string, idioma: Idioma) => new Date(iso + 'T12:00:00').toLocaleDateString(idioma === 'ca' ? 'ca-ES' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

export default function PlaVista({ idioma, convocatories }: { idioma: Idioma; convocatories: Convocatoria[] }) {
  const d = t(idioma).pla;
  const [estat] = useEstat();
  if (!estat) return <p className="text-terciari">{t(idioma).comu.carregant}</p>;
  if (!estat.pla) return <div className="full"><p>{d.sense}</p><Link className="boton-primari mt-4" href={`/${idioma}/diagnostic`}>{t(idioma).diag.titol}</Link></div>;
  const pla = estat.pla;
  const conv = convocatories.find((c) => c.id === pla.convocatoria);
  const avui = avuiISO();
  const fets = new Set(estat.sessions.map((s) => s.data));
  const setmanes: typeof pla.sessions[] = [];
  for (let i = 0; i < pla.sessions.length; i += 7) setmanes.push(pla.sessions.slice(i, i + 7));
  return (
    <div className="grid gap-3">
      <div className="text-[15px]">
        <p><strong>{pla.nivell}</strong>{conv ? <> · {conv.nom[idioma]} · {d.prova}: <strong>{fmt(conv.prova, idioma)}</strong></> : null}</p>
        {conv?.inscripcio ? <p className="mt-1 text-secundari">{d.inscripcio}: {fmt(conv.inscripcio.inici, idioma)} – {fmt(conv.inscripcio.fi, idioma)}{conv.inscripcio.estimada ? ` (${t(idioma).convocatories.estimada})` : ''}</p> : null}
        <p className="mt-1 text-secundari">{pla.sessions.length} {d.sessions} · {pla.minuts} {t(idioma).comu.minuts}</p>
        <Link className="boton-text mt-2 text-[14px]" href={`/${idioma}/comencar`}>{d.canviar}</Link>
      </div>
      {setmanes.slice(0, 12).map((s, i) => (
        <div key={i} className="linia pt-3">
          <p className="text-[13px] font-semibold text-secundari">{d.setmana} {i + 1}</p>
          <ul className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px]">{s.map((x) => <li key={x.data} className={`rounded-[6px] p-1 ${x.data === avui ? 'ring-2 ring-boli' : ''} ${fets.has(x.data) ? 'bg-apte-tenue' : x.tipus === 'minisimulacre' ? 'bg-boli-tenue' : x.tipus === 'simulacre' ? 'bg-vermell-tenue' : 'bg-paper border border-linia'}`}><span className="block font-semibold">{fmt(x.data, idioma).split(' ')[1] ?? ''}</span><span className="block text-terciari">{x.tipus === 'normal' ? `${x.minuts}'` : x.tipus === 'minisimulacre' ? 'mini' : x.tipus === 'simulacre' ? 'SIM' : '·'}</span></li>)}</ul>
        </div>
      ))}
    </div>
  );
}
