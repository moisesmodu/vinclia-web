'use client';
import Link from 'next/link';
import type { Examen, Idioma, Punt, So } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import type { ResultatDiagnostic } from '@/lib/motor/diagnostic';
import { fraseResultat } from '@/lib/motor/narrativa';
import Volat from '@/components/Volat';
import Dial from './ui/Dial';
import Escala from './ui/Escala';

/** Resultat: el dial (l'únic moment orquestrat), una frase que diu què vol dir, i les notes en l'escala real amb la marca del mínim. */
export default function ResultatDiag({ idioma, resultat, examen, punts, sons, compacte }: { idioma: Idioma; resultat: ResultatDiagnostic; examen: Examen; punts: Punt[]; sons: So[]; compacte?: boolean }) {
  const d = t(idioma).diag;
  const nomArea = (id: string) => examen.arees.find((x) => x.id === id)?.nom[idioma] ?? id;
  const nomPunt = (id: string) => punts.find((x) => x.id === id)?.nom[idioma] ?? id;
  const frase = fraseResultat(resultat, examen, idioma, nomArea, nomPunt);
  const llindar = examen.aptoGlobal ?? examen.parts.escrita.minim ?? 60;
  return (
    <div>
      {!compacte ? <>
        <Dial valor={resultat.probabilitat} etiqueta={((resultat as { oralMesurat?: boolean }).oralMesurat === false ? t(idioma).nou.probEscrita : d.probabilitat).toLowerCase()} llindar={llindar} />
        <div className="mx-auto mt-3 flex max-w-[40ch] items-start justify-center gap-3"><Volat mida={44} postura={resultat.probabilitat >= llindar ? 'content' : 'pensa'} aterra className="mt-0.5 shrink-0" /><p className="text-left text-[19px] leading-snug">{frase}</p></div>
        <p className="mt-2 text-center text-[13px] text-terciari">{examen.curt} · {d.repetir}</p>
        {(resultat as { oralMesurat?: boolean }).oralMesurat === false ? <p className="mx-auto mt-2 max-w-[44ch] text-center text-[14px] text-secundari">{t(idioma).nou.oralNoMesurat}</p> : null}
      </> : null}

      <div className={`${compacte ? '' : 'mt-8'} grid gap-5`}>
        {resultat.arees.map((a) => {
          const def = examen.arees.find((x) => x.id === a.id)!;
          const part = examen.parts[def.part];
          const minim = a.minim ?? part.minim ?? undefined;
          const punts2 = def.puntsMax ? Math.round((a.nota / 100) * def.puntsMax * 2) / 2 : undefined;
          return <Escala key={a.id} nom={def.nom[idioma]} valor={a.nota} minim={minim} punts={punts2} max={def.puntsMax} extra={a.estimada ? <span className="xip ml-2 align-middle">{t(idioma).simulacre.estimat.replace(/[()]/g, '')}</span> : null} />;
        })}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 text-[15px] sm:grid-cols-3">
        {(['escrita', 'oral'] as const).map((p) => <div key={p} className="flex items-baseline justify-between border-b border-linia py-2"><dt className="text-secundari">{t(idioma).simulacre.part[p]}{resultat.parts[p].estimada || (p === 'oral' && (resultat as { oralMesurat?: boolean }).oralMesurat === false) ? <span className="xip ml-2">{t(idioma).simulacre.estimat.replace(/[()]/g, '')}</span> : null}</dt><dd className="num text-[17px]"><span className={resultat.parts[p].estimada || (p === 'oral' && (resultat as { oralMesurat?: boolean }).oralMesurat === false) ? 'text-terciari' : resultat.parts[p].ok ? 'text-apte' : 'text-vermell'}>{resultat.parts[p].nota} %</span>{resultat.parts[p].minim !== null ? <span className="text-[13px] font-normal text-terciari"> / {resultat.parts[p].minim}</span> : null}</dd></div>)}
        {examen.aptoGlobal ? <div className="flex items-baseline justify-between border-b border-linia py-2"><dt className="text-secundari">{t(idioma).simulacre.global}</dt><dd className="num text-[17px]"><span className={resultat.global >= examen.aptoGlobal ? 'text-apte' : 'text-vermell'}>{resultat.global} %</span><span className="text-[13px] font-normal text-terciari"> / {examen.aptoGlobal}</span></dd></div> : null}
      </dl>

      {resultat.febles.length || resultat.sons.length ? <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {resultat.febles.length ? <div>
          <h2 className="text-[20px]">{d.febles}</h2>
          <ol className="mt-3 space-y-2">{resultat.febles.map((f, i) => <li key={f.punt} className="flex items-center gap-3 text-[16px]"><span className="num w-5 text-boli">{i + 1}</span><span className="min-w-0 flex-1">{nomPunt(f.punt)}</span><span className="num text-[14px] text-terciari">{f.confianca} %</span></li>)}</ol>
        </div> : null}
        {resultat.sons.length ? <div>
          <h2 className="text-[20px]">{d.sons}</h2>
          {resultat.oralNota === null || resultat.oralNota === undefined ? <p className="mt-1 text-[13px] text-terciari">{d.senseOral}</p> : null}
          <ol className="mt-3 space-y-2">{resultat.sons.map((id, i) => { const s = sons.find((x) => x.id === id); return <li key={id} className="flex items-start gap-3 text-[16px]"><span className="num w-5 text-boli">{i + 1}</span><span><span className="font-semibold">{s?.nom[idioma] ?? id}</span>{s ? <span className="block text-[14px] text-terciari">{s.paraules.slice(0, 4).join(' · ')}</span> : null}</span></li>; })}</ol>
        </div> : null}
      </div> : null}
      {!compacte ? <>
        <Link className="boton-primari mt-10 w-full text-[18px]" href={`/${idioma}/avui`}>{d.crearPla}</Link>
        <details className="mt-4 text-[14px] text-secundari"><summary className="cursor-pointer font-semibold">{idioma === 'ca' ? 'Com es calcula' : 'Cómo se calcula'}</summary><p className="mt-2 leading-relaxed">{d.explicacio}</p></details>
      </> : null}
    </div>
  );
}
