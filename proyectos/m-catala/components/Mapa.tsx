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
  if (!estat) return <p className="text-suave">{t(idioma).comu.carregant}</p>;
  if (!estat.perfil) return <div><p>{t(idioma).avui.senseDiag}</p><Link className="boton mt-4" href={`/${idioma}/comencar`}>{t(idioma).nav.comencar}</Link></div>;
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
    <div className="grid gap-2">
      {!ambDades ? <p className="text-suave">{d.sense}</p> : null}
      {files.map((f) => (
        <div key={f.id} className="tarjeta py-3">
          <div className="flex items-center justify-between text-sm"><span className="font-semibold">{f.nom[idioma]}</span><span className="text-suave">{f.valor === null ? '—' : `${f.valor} %`}{f.n ? <span className="ml-2 text-xs">({f.n})</span> : null}</span></div>
          <div className="barra mt-2"><span style={{ width: `${f.valor ?? 0}%`, background: f.valor === null ? '#EADFCF' : f.valor < 50 ? '#C62F3B' : f.valor < 75 ? '#E0B23A' : '#7A8F3C' }} /></div>
        </div>
      ))}
    </div>
  );
}
