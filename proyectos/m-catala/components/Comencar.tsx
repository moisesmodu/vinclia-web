'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Convocatoria, Examen, Idioma, IdiomaExpl, Motiu, Nivell } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { avuiISO } from '@/lib/motor/ratxa';
import Segments from './ui/Segments';

type Props = { idioma: Idioma; examens: Record<string, Examen>; convocatories: Convocatoria[] };
const fmt = (iso: string, idioma: Idioma) => new Intl.DateTimeFormat(idioma === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T12:00:00'));

/** Entrada en 3 pantalles i menys de 90 segons, sense registre. Cada pantalla: una pregunta, opcions grans, un botó. */
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

  const Opcio = ({ sel, onClick, children, dis, centre }: { sel: boolean; onClick: () => void; children: React.ReactNode; dis?: boolean; centre?: boolean }) => (
    <button type="button" role="radio" aria-checked={sel} disabled={dis} onClick={onClick} className={`opcio ${centre ? 'justify-center' : ''} ${sel ? 'opcio-sel' : ''} ${dis ? 'opacity-40' : ''}`}>{children}</button>
  );

  return (
    <div className="contenedor py-6">
      <div className="flex items-center justify-between text-[14px] text-secundari"><span>{d.pas(pas)}</span><span>{t(idioma).hero.ctaSub}</span></div>
      <Segments total={3} actual={pas - 1} className="my-4" />
      {pas === 1 ? (
        <>
          <h1>{d.quin}</h1>
          <div className="mt-5 grid gap-2" role="radiogroup" aria-label={d.quin}>
            {(Object.keys(examens) as Nivell[]).map((n) => <Opcio key={n} sel={nivell === n} dis={!examens[n].actiu} onClick={() => { setNivell(n); setConv(null); }}><span className="num w-9 shrink-0 text-[22px]">{n}</span><span className="min-w-0"><span className="block font-semibold">{examens[n].nom[idioma].replace(/^\w\d · /, '')}</span><span className="block text-[14px] text-secundari">{examens[n].usos[idioma]}{!examens[n].actiu ? ` · ${d.proximament}` : ''}</span></span></Opcio>)}
          </div>
          {nivell ? (
            <>
              <h2 className="mt-8">{d.convocatoria}</h2>
              <div className="mt-4 grid gap-2" role="radiogroup" aria-label={d.convocatoria}>
                {convs.map((c) => <Opcio key={c.id} sel={conv === c.id} onClick={() => setConv(c.id)}><span className="min-w-0"><span className="block font-semibold">{c.nom[idioma]}</span><span className="block text-[14px] text-secundari">{fmt(c.prova, idioma)} · {d.dies(dies(c.prova))}{!c.verificat ? ` · ${t(idioma).convocatories.prevista}` : ''}</span></span></Opcio>)}
                <Opcio sel={conv === ''} onClick={() => setConv('')}><span className="text-secundari">{d.senseData}</span></Opcio>
              </div>
            </>
          ) : null}
          <button type="button" className="boton mt-8 w-full" disabled={!nivell || conv === null} onClick={() => setPas(2)}>{d.seguent}</button>
        </>
      ) : pas === 2 ? (
        <>
          <h1>{d.motiu}</h1>
          <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label={d.motiu}>{(Object.keys(d.motius) as Motiu[]).map((m) => <Opcio key={m} sel={motiu === m} onClick={() => setMotiu(m)}><span>{d.motius[m]}</span></Opcio>)}</div>
          <h2 className="mt-8">{d.l1}</h2>
          <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label={d.l1}>{Object.keys(d.llengues).map((l) => <Opcio key={l} sel={l1 === l} onClick={() => { setL1(l); if (['es', 'en', 'ar', 'ro', 'fr'].includes(l)) setExpl(l as IdiomaExpl); }}><span>{d.llengues[l]}</span></Opcio>)}</div>
          <div className="mt-8 flex gap-2"><button type="button" className="boton-sec" onClick={() => setPas(1)}>{d.enrere}</button><button type="button" className="boton flex-1" disabled={!motiu || !l1} onClick={() => setPas(3)}>{d.seguent}</button></div>
        </>
      ) : (
        <>
          <h1>{d.minuts}</h1>
          <div className="mt-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label={d.minuts}>{([10, 15, 20] as const).map((m) => <Opcio key={m} centre sel={minuts === m} onClick={() => setMinuts(m)}><span className="num text-[26px]">{m}<span className="ml-1 text-[14px] font-normal text-secundari">{t(idioma).comu.minuts}</span></span></Opcio>)}</div>
          <h2 className="mt-8">{d.idiomaExpl}</h2>
          <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label={d.idiomaExpl}>{(['ca', 'es', 'en', 'ar', 'ro', 'fr'] as IdiomaExpl[]).map((l) => <Opcio key={l} centre sel={expl === l} onClick={() => setExpl(l)}><span lang={l}>{{ ca: 'Català', es: 'Castellano', en: 'English', ar: 'العربية', ro: 'Română', fr: 'Français' }[l]}</span></Opcio>)}</div>
          <div className="mt-8 flex gap-2"><button type="button" className="boton-sec" onClick={() => setPas(2)}>{d.enrere}</button><button type="button" className="boton-primari flex-1" disabled={!minuts} onClick={acabar}>{d.comencar}</button></div>
        </>
      )}
    </div>
  );
}
