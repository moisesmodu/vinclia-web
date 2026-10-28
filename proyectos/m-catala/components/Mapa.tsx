'use client';
import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { confiancaPunts } from '@/lib/motor/diagnostic';
import { retencio } from '@/lib/motor/repas';
import puntsJson from '@/config/punts.json';

/** Mapa de domini: confiança de 0 a 100 % per punt del programa (respostes + retenció FSRS), ordenat pel pes a l'examen. */
export default function Mapa({ idioma }: { idioma: Idioma }) {
  const d = t(idioma).mapa;
  const [estat] = useEstat();
  if (!estat) return <p className="text-terciari">{t(idioma).comu.carregant}</p>;
  if (!estat.perfil) return <div><p>{t(idioma).avui.senseDiag}</p><Link className="boton-ocre mt-4" href={`/${idioma}/comencar`}>{t(idioma).nav.comencar}</Link></div>;
  const punts = puntsJson.punts.filter((p) => p.nivells.includes(estat.perfil!.nivell));
  const conf = confiancaPunts(estat.respostes, punts as never);
  const files = punts.map((p) => {
    const c = conf.find((x) => x.punt === p.id)!;
    const targetes = Object.values(estat.targetes).filter((tg) => tg.punt === p.id);
    const ret = targetes.length ? targetes.reduce((s, tg) => s + retencio(tg), 0) / targetes.length : null;
    const valor = c.n === 0 ? null : Math.round(ret === null ? c.confianca : 0.6 * c.confianca + 40 * ret);
    return { ...p, valor, n: c.n };
  }).sort((a, b) => b.pes - a.pes);
  const ambDades = files.some((f) => f.valor !== null);
  return (
    <div>
      {!ambDades ? <p className="text-[15px] text-secundari">{d.sense}</p> : null}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {files.map((f) => {
          const v = f.valor;
          const fons = v === null ? '#FFFFFF' : v < 50 ? '#F7E3E1' : v < 75 ? '#F6E7BF' : '#E9EFD6';
          const vora = v === null ? '#E8DECB' : v < 50 ? '#B9342E' : v < 75 ? '#E0B23A' : '#7A8F3C';
          return <li key={f.id} className="flex min-h-24 flex-col justify-between rounded-[6px] border p-3" style={{ background: fons, borderColor: vora }}><span className="text-[14px] leading-snug">{f.nom[idioma]}</span><span className="num mt-2 text-[22px]">{v === null ? '—' : `${v}%`}<span className="ml-1 text-[12px] font-normal text-secundari">{f.n ? `· ${f.n}` : ''}</span></span></li>;
        })}
      </ul>
    </div>
  );
}
