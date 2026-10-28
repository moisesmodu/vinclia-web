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
  if (!estat) return <p className="text-suave">{t(idioma).comu.carregant}</p>;
  if (!estat.pla) return <div className="tarjeta"><p>{d.sense}</p><Link className="boton mt-4" href={`/${idioma}/diagnostic`}>{t(idioma).diag.titol}</Link></div>;
  const pla = estat.pla;
  const conv = convocatories.find((c) => c.id === pla.convocatoria);
  const avui = avuiISO();
  const fets = new Set(estat.sessions.map((s) => s.data));
  const setmanes: typeof pla.sessions[] = [];
  for (let i = 0; i < pla.sessions.length; i += 7) setmanes.push(pla.sessions.slice(i, i + 7));
  return (
    <div className="grid gap-3">
      <div className="tarjeta text-sm">
        <p><strong>{pla.nivell}</strong>{conv ? <> · {conv.nom[idioma]} · {d.prova}: <strong>{fmt(conv.prova, idioma)}</strong></> : null}</p>
        {conv?.inscripcio ? <p className="mt-1 text-suave">{d.inscripcio}: {fmt(conv.inscripcio.inici, idioma)} – {fmt(conv.inscripcio.fi, idioma)}{conv.inscripcio.estimada ? ` (${t(idioma).convocatories.estimada})` : ''}</p> : null}
        <p className="mt-1 text-suave">{pla.sessions.length} {d.sessions} · {pla.minuts} {t(idioma).comu.minuts}</p>
        <Link className="mt-2 inline-block text-xs underline" href={`/${idioma}/comencar`}>{d.canviar}</Link>
      </div>
      {setmanes.slice(0, 12).map((s, i) => (
        <div key={i} className="tarjeta py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-suave">{d.setmana} {i + 1}</p>
          <ul className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px]">{s.map((x) => <li key={x.data} className={`rounded-lg p-1 ${x.data === avui ? 'ring-2 ring-nit' : ''} ${fets.has(x.data) ? 'bg-oliva-claro' : x.tipus === 'minisimulacre' ? 'bg-ocre-claro' : x.tipus === 'simulacre' ? 'bg-marca-claro' : 'bg-crema'}`}><span className="block font-semibold">{fmt(x.data, idioma).split(' ')[1] ?? ''}</span><span className="block text-suave">{x.tipus === 'normal' ? `${x.minuts}'` : x.tipus === 'minisimulacre' ? 'mini' : x.tipus === 'simulacre' ? 'SIM' : '·'}</span></li>)}</ul>
        </div>
      ))}
    </div>
  );
}
