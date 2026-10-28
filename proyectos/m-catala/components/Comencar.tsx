'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Convocatoria, Examen, Idioma, IdiomaExpl, Motiu, Nivell } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { avuiISO } from '@/lib/motor/ratxa';

type Props = { idioma: Idioma; examens: Record<string, Examen>; convocatories: Convocatoria[] };
const fmt = (iso: string, idioma: Idioma) => new Date(iso + 'T12:00:00').toLocaleDateString(idioma === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

/** Entrada en 3 pantalles i menys de 90 segons, sense registre: certificat i convocatòria; motiu i llengua habitual; minuts i idioma de les explicacions. */
export default function Comencar({ idioma, examens, convocatories }: Props) {
  const d = t(idioma).comencar;
  const router = useRouter();
  const [, actualitzar] = useEstat();
  const [pas, setPas] = useState(1);
  const [nivell, setNivell] = useState<Nivell | null>(null);
  const [conv, setConv] = useState<string | null>(null);
  const [motiu, setMotiu] = useState<Motiu | null>(null);
  const [l1, setL1] = useState<string | null>(null);
  const [minuts, setMinuts] = useState<10 | 15 | 20 | null>(null);
  const [expl, setExpl] = useState<IdiomaExpl>(idioma);
  const avui = avuiISO();
  const convs = nivell ? convocatories.filter((c) => (c.nivell === nivell || c.nivells?.includes(nivell)) && c.prova >= avui) : [];
  const dies = (iso: string) => Math.round((new Date(iso + 'T12:00:00').getTime() - new Date(avui + 'T12:00:00').getTime()) / 864e5);

  const acabar = () => {
    if (!nivell || !motiu || !l1 || !minuts) return;
    actualitzar((e) => ({ ...e, perfil: { nivell, convocatoria: conv ?? '', motiu, l1, minuts, idiomaExpl: expl, creat: new Date().toISOString() } }));
    router.push(`/${idioma}/diagnostic`);
  };

  const Opcio = ({ sel, onClick, children, dis }: { sel: boolean; onClick: () => void; children: React.ReactNode; dis?: boolean }) => (
    <button type="button" disabled={dis} onClick={onClick} className={`opcio ${sel ? 'border-nit bg-ocre-claro ring-1 ring-nit' : ''} ${dis ? 'opacity-50' : ''}`}>{children}</button>
  );

  return (
    <div className="contenedor py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-suave">{d.pas(pas)}</p>
      <div className="barra my-3"><span style={{ width: `${(pas / 3) * 100}%` }} /></div>
      {pas === 1 ? (
        <>
          <h1 className="text-2xl font-bold">{d.quin}</h1>
          <div className="mt-4 grid gap-2">
            {(Object.keys(examens) as Nivell[]).map((n) => <Opcio key={n} sel={nivell === n} dis={!examens[n].actiu} onClick={() => { setNivell(n); setConv(null); }}><span><span className="font-semibold">{examens[n].nom[idioma]}</span><br /><span className="text-sm text-suave">{examens[n].usos[idioma]}{!examens[n].actiu ? ` · ${d.proximament}` : ''}</span></span></Opcio>)}
          </div>
          {nivell ? (
            <>
              <h2 className="mt-6 text-xl font-bold">{d.convocatoria}</h2>
              <div className="mt-3 grid gap-2">
                {convs.map((c) => <Opcio key={c.id} sel={conv === c.id} onClick={() => setConv(c.id)}><span><span className="font-semibold">{c.nom[idioma]}</span><br /><span className="text-sm text-suave">{fmt(c.prova, idioma)} · {d.dies(dies(c.prova))}{!c.verificat ? ` · ${t(idioma).convocatories.prevista}` : ''}</span></span></Opcio>)}
                <Opcio sel={conv === ''} onClick={() => setConv('')}><span className="text-suave">{d.senseData}</span></Opcio>
              </div>
            </>
          ) : null}
          <button type="button" className="boton mt-6 w-full" disabled={!nivell || conv === null} onClick={() => setPas(2)}>{d.seguent}</button>
        </>
      ) : pas === 2 ? (
        <>
          <h1 className="text-2xl font-bold">{d.motiu}</h1>
          <div className="mt-4 grid grid-cols-2 gap-2">{(Object.keys(d.motius) as Motiu[]).map((m) => <Opcio key={m} sel={motiu === m} onClick={() => setMotiu(m)}><span>{d.motius[m]}</span></Opcio>)}</div>
          <h2 className="mt-6 text-xl font-bold">{d.l1}</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">{Object.keys(d.llengues).map((l) => <Opcio key={l} sel={l1 === l} onClick={() => { setL1(l); if (['es', 'en', 'ar', 'ro', 'fr'].includes(l)) setExpl(l as IdiomaExpl); }}><span>{d.llengues[l]}</span></Opcio>)}</div>
          <div className="mt-6 flex gap-2"><button type="button" className="boton-sec" onClick={() => setPas(1)}>{d.enrere}</button><button type="button" className="boton flex-1" disabled={!motiu || !l1} onClick={() => setPas(3)}>{d.seguent}</button></div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">{d.minuts}</h1>
          <div className="mt-4 grid grid-cols-3 gap-2">{([10, 15, 20] as const).map((m) => <Opcio key={m} sel={minuts === m} onClick={() => setMinuts(m)}><span className="w-full text-center text-lg font-semibold">{m} {t(idioma).comu.minuts}</span></Opcio>)}</div>
          <h2 className="mt-6 text-xl font-bold">{d.idiomaExpl}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">{(['ca', 'es', 'en', 'ar', 'ro', 'fr'] as IdiomaExpl[]).map((l) => <Opcio key={l} sel={expl === l} onClick={() => setExpl(l)}><span className="w-full text-center">{{ ca: 'Català', es: 'Castellano', en: 'English', ar: 'العربية', ro: 'Română', fr: 'Français' }[l]}</span></Opcio>)}</div>
          <div className="mt-6 flex gap-2"><button type="button" className="boton-sec" onClick={() => setPas(2)}>{d.enrere}</button><button type="button" className="boton-ocre flex-1" disabled={!minuts} onClick={acabar}>{d.comencar}</button></div>
        </>
      )}
    </div>
  );
}
