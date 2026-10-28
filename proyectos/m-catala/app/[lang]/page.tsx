import Link from 'next/link';
import type { Metadata } from 'next';
import { esIdioma, t } from '@/lib/i18n';
import { marca, examens, nivellsActius, pais, preu, BANC } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
import DemoItem from '@/components/DemoItem';
import BotoSeguir from '@/components/BotoSeguir';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma;
  return { title: `${marca.nombre} · ${marca.lema[l]}`, description: t(l).nou.ganxo };
}

export default async function Inici({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma;
  const d = t(idioma); const h = d.hero; const l = (s: string) => `/${idioma}${s}`;
  const anual = pais.planes.find((p) => p.id === 'anual')!;
  // La pregunta de mostra: un castellanisme de C1 amb opcions, gratuït (cada dia una de diferent).
  const dia = Math.floor(Date.now() / 86400000);
  const pool = BANC.items.filter((i) => i.gratis && Array.isArray(i.opcions) && i.tipus === 'castellanismes' && i.nivell === 'C1');
  const demo = pool[dia % Math.max(1, pool.length)];
  const regla = demo ? BANC.regles[demo.regla] : null;
  return (
    <div className="contenedor lg:max-w-[1040px]">
      <div className="lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-12">
      <section className="pt-10 sm:pt-16">
        <h1 className="max-w-[16ch] text-[40px] leading-[1.05] sm:text-[56px]">{marca.lema[idioma]}</h1>
        <p className="mt-5 max-w-[46ch] text-[19px] leading-relaxed text-secundari">{d.nou.ganxo}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href={l('/comencar')} className="boton-ocre text-[18px]">{h.cta}</Link>
          <BotoSeguir idioma={idioma} text={h.seguir} />
        </div>
        <p className="mt-2 text-[14px] text-terciari">{h.ctaSub}</p>
      </section>

      {demo && regla ? <section className="mt-12 lg:mt-16"><DemoItem idioma={idioma} item={demo} regla={regla} /></section> : null}
      </div>
      <div className="lg:mx-auto lg:max-w-[640px]">

      <section className="seccio linia mt-12">
        <h2>{h.com}</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2">
          {h.comLlista.map(([ti, tx], i) => <li key={i} className="grid grid-cols-[32px_1fr] gap-3"><span className="num text-[26px] leading-none text-ocre-fosc">{i + 1}</span><div><h3 className="text-[19px]">{ti}</h3><p className="mt-1 text-[15px] leading-relaxed text-secundari">{tx}</p></div></li>)}
        </ol>
      </section>

      <section className="seccio linia">
        <h2>{h.examens}</h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded-[14px] border border-linia bg-linia sm:grid-cols-2">
          {(['B1', 'B2', 'C1', 'C2'] as const).map((n) => { const e = examens[n]; return (
            <div key={n} className="bg-paper p-5">
              <div className="flex items-baseline justify-between"><span className="num text-[28px]">{n}</span>{!e.actiu ? <span className="xip">{d.comencar.proximament}</span> : null}</div>
              <p className="mt-1 text-[15px] text-secundari">{e.usos[idioma]}</p>
              <ul className="mt-3 space-y-1 text-[14px]">{e.arees.map((a) => <li key={a.id} className="flex justify-between gap-2"><span className="min-w-0 truncate">{a.nom[idioma].replace(/^Àrea \d · |^Área \d · /, '')}</span><span className="num shrink-0">{a.pes} %</span></li>)}</ul>
              <p className="mt-3 text-[13px] text-terciari">{idioma === 'ca' ? 'Apte' : 'Apto'}: {e.aptoGlobal ? `${e.aptoGlobal} % global` : ''}{e.parts.escrita.minim ? `${e.aptoGlobal ? ' · ' : ''}${e.parts.escrita.minim} % ${idioma === 'ca' ? 'escrita i' : 'escrita y'} ${e.parts.oral.minim} % oral` : ''}{e.parts.escrita.minimPunts ? ` · ${e.parts.escrita.minimPunts} ${idioma === 'ca' ? 'i' : 'y'} ${e.parts.oral.minimPunts}` : ''}</p>
            </div>); })}
        </div>
      </section>

      <section className="seccio linia grid gap-8 sm:grid-cols-2">
        <div><h2>{h.per}</h2><ul className="mt-4 space-y-2 text-[16px] leading-relaxed">{h.perLlista.map((x) => <li key={x} className="border-l-2 border-ocre pl-3">{x}</li>)}</ul></div>
        <div>
          <h2>{d.nou.unPreu}</h2>
          <p className="mt-4 text-[16px] leading-relaxed">{d.preus.gratisTitol}: {d.preus.gratis.slice(0, 3).join(', ').toLowerCase()}.</p>
          <p className="mt-2 text-[16px] leading-relaxed">Premium: <span className="num text-[22px]">{preu(999)}</span> {d.nou.perMes}, <span className="num text-[22px]">{preu(anual.importe)}</span> {d.nou.perAny} {idioma === 'ca' ? 'o passi de convocatòria' : 'o pase de convocatoria'} <span className="num text-[22px]">{preu(2499)}</span>.</p>
          <p className="mt-2 text-[14px] text-terciari">{d.preus.avis}</p>
          <Link href={l('/preus')} className="boton-text mt-3">{d.nav.preus}</Link>
        </div>
      </section>

      <section className="seccio linia">
        <p className="max-w-[40ch] text-[22px] leading-snug sm:text-[26px]">{h.noCopiem}</p>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-secundari">{idioma === 'ca' ? `${BANC.resum.total} exercicis, ${Object.keys(BANC.textos).length} textos i ${Object.keys(BANC.tasques).length} tasques escrites, validats amb LanguageTool i revisats per mostreig. Explicacions en català, castellà, anglès, àrab, romanès i francès.` : `${BANC.resum.total} ejercicios, ${Object.keys(BANC.textos).length} textos y ${Object.keys(BANC.tasques).length} tareas escritas, validados con LanguageTool y revisados por muestreo. Explicaciones en catalán, castellano, inglés, árabe, rumano y francés.`}</p>
        <div className="mt-5 flex flex-wrap gap-2">{nivellsActius().map((n) => <Link key={n} href={l(`/guia/examen-${n.toLowerCase()}-catala-2027${n === 'C1' ? '-model' : n === 'B2' ? '-prova' : ''}`)} className="xip no-underline hover:border-nit">{`Examen ${n} 2027`}</Link>)}<Link href={l('/convocatories')} className="xip-ocre no-underline">{d.nav.convocatories}</Link></div>
      </section>
      </div>
    </div>
  );
}
