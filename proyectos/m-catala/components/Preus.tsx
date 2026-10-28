'use client';
import { useState } from 'react';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import BotonPlan from './BotonPlan';

type Pla = { id: string; importe: number; tipo: string; intervalo?: string; porMes?: number; diasPrueba?: number; destacado?: boolean; dies?: number };
const eur = (c: number, idioma: Idioma) => new Intl.NumberFormat(idioma === 'ca' ? 'ca-ES' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);

/** Preus: un sol preu gran; es tria com pagar amb un selector; a sota, què inclou cada cosa. */
export default function Preus({ idioma, planes, modeProva }: { idioma: Idioma; planes: Pla[]; modeProva: boolean }) {
  const d = t(idioma).preus; const n = t(idioma).nou;
  const [sel, setSel] = useState(planes.find((p) => p.destacado)?.id ?? planes[0].id);
  const p = planes.find((x) => x.id === sel)!;
  const sufix = p.tipo === 'unic' ? (idioma === 'ca' ? '3 mesos' : '3 meses') : p.intervalo === 'year' ? n.perAny : n.perMes;
  return (
    <div>
      <h1>{d.titol}</h1>
      <p className="mt-2 max-w-[44ch] text-[17px] text-secundari">{n.unPreu} {d.premium[4]}.</p>

      <div className="mt-8 grid grid-cols-3 gap-1 rounded-[8px] border border-linia bg-paper p-1" role="radiogroup" aria-label={n.triaPla}>
        {planes.map((x) => <button key={x.id} type="button" role="radio" aria-checked={sel === x.id} onClick={() => setSel(x.id)} className={`rounded-[6px] px-2 py-2.5 text-[14px] font-semibold transition-[background-color,color] duration-150 ${sel === x.id ? 'bg-nit text-white' : 'text-secundari hover:bg-ocre-pal'}`}>{d.plans[x.id]}{x.destacado ? <span className="block text-[11px] font-normal opacity-80">{n.mesBarat}</span> : null}</button>)}
      </div>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="num text-[56px] leading-none">{eur(p.importe, idioma)}</span>
        <span className="text-[17px] text-secundari">{sufix}</span>
      </div>
      <p className="mt-2 text-[15px] text-secundari">{p.diasPrueba ? `${n.diesGratis} ${eur(p.importe, idioma)} ${sufix}. ` : ''}{p.porMes && p.id !== 'mensual' ? `≈ ${eur(p.porMes, idioma)} ${n.perMes}. ` : ''}{p.tipo === 'unic' ? n.senseRenovacio + '. ' : ''}{d.ivaInclos}.</p>
      <BotonPlan plan={p.id} idioma={idioma} texto={`${n.comenca} ${d.plans[p.id].toLowerCase()}`} destacado />
      {modeProva ? <p className="mt-2 text-[13px] text-terciari">{d.modoPrueba}</p> : null}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div><h2 className="text-[20px]">{d.premiumTitol}</h2><ul className="mt-3 space-y-2 text-[16px]">{d.premium.map((x) => <li key={x} className="flex gap-2"><span className="text-oliva" aria-hidden="true">✓</span>{x}</li>)}</ul></div>
        <div><h2 className="text-[20px]">{d.gratisTitol}</h2><ul className="mt-3 space-y-2 text-[16px] text-secundari">{d.gratis.map((x) => <li key={x} className="flex gap-2"><span aria-hidden="true">·</span>{x}</li>)}</ul></div>
      </div>
      <div className="linia mt-10 pt-6 text-[15px] leading-relaxed text-secundari">
        <p>{d.avis}</p><p className="mt-2">{d.garantia}</p><p className="mt-2">{d.referencia}</p>
      </div>
    </div>
  );
}
