import Link from 'next/link';
import type { Metadata } from 'next';
import { esIdioma, t } from '@/lib/i18n';
import { marca, examens, nivellsActius, pais, preu, BANC } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
import DemoVeu from '@/components/DemoVeu';
import BotoSeguir from '@/components/BotoSeguir';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma;
  return { title: `${marca.nombre} · ${marca.lema[l]}`, description: t(l).hero.text };
}

export default async function Inici({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma;
  const d = t(idioma); const h = d.hero; const l = (s: string) => `/${idioma}${s}`;
  const anual = pais.planes.find((p) => p.id === 'anual')!;
  return (
    <div className="contenedor">
      <section className="py-10 sm:py-16">
        <span className="etiqueta">{idioma === 'ca' ? 'B1 · B2 · C1 · C2 (aviat)' : 'B1 · B2 · C1 · C2 (pronto)'}</span>
        <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{h.titol}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-suave">{h.text}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href={l('/comencar')} className="boton-ocre text-lg">{h.cta}</Link>
          <BotoSeguir idioma={idioma} text={h.seguir} />
        </div>
        <p className="mt-2 text-sm text-suave">{h.ctaSub}</p>
        <DemoVeu idioma={idioma} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {h.comLlista.map(([ti, tx], i) => <div key={i} className="tarjeta"><span className="titulos text-3xl font-bold text-ocre">{i + 1}</span><h2 className="mt-1 text-lg font-bold">{ti}</h2><p className="mt-1 text-sm leading-relaxed text-suave">{tx}</p></div>)}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{h.examens}</h2>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-suave"><th className="py-2 pr-3">{idioma === 'ca' ? 'Nivell' : 'Nivel'}</th><th className="py-2 pr-3">{idioma === 'ca' ? 'Parts i pesos' : 'Partes y pesos'}</th><th className="py-2 pr-3">{idioma === 'ca' ? 'Apte' : 'Apto'}</th><th className="py-2">{idioma === 'ca' ? 'Per a qui' : 'Para quién'}</th></tr></thead><tbody>
          {(['B1', 'B2', 'C1', 'C2'] as const).map((n) => { const e = examens[n]; return <tr key={n} className="border-t border-[#EADFCF] align-top"><td className="py-2 pr-3 font-semibold">{n}{!e.actiu ? <span className="block text-xs font-normal text-suave">{d.comencar.proximament}</span> : null}</td><td className="py-2 pr-3">{e.arees.map((a) => `${a.nom[idioma].replace(/^Àrea \d · |^Área \d · /, '')} ${a.pes} %`).join(' · ')}</td><td className="py-2 pr-3">{e.aptoGlobal ? `${e.aptoGlobal} % global` : ''}{e.parts.escrita.minim ? ` ${idioma === 'ca' ? 'i' : 'y'} ${e.parts.escrita.minim} %/${e.parts.oral.minim} %` : ''}{e.parts.escrita.minimPunts ? ` · ${e.parts.escrita.minimPunts}, ${e.parts.oral.minimPunts}` : ''}</td><td className="py-2">{e.usos[idioma]}</td></tr>; })}
        </tbody></table></div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <div><h2 className="text-2xl font-bold">{h.per}</h2><ul className="mt-3 space-y-2 text-sm">{h.perLlista.map((x) => <li key={x} className="flex gap-2"><span className="text-ocre">●</span><span>{x}</span></li>)}</ul></div>
        <div className="tarjeta"><h2 className="text-xl font-bold">{d.preus.titol}</h2><p className="mt-2 text-sm">{d.preus.gratisTitol}: {d.preus.gratis.slice(0, 3).join(', ').toLowerCase()}.</p><p className="mt-2 text-sm">{d.preus.premiumTitol}: <strong>{preu(999)}{d.preus.porMes}</strong>, <strong>{preu(anual.importe)}{d.preus.any}</strong> {idioma === 'ca' ? 'o passi de convocatòria' : 'o pase de convocatoria'} <strong>{preu(2499)}</strong>.</p><p className="mt-2 text-xs text-suave">{d.preus.avis}</p><Link href={l('/preus')} className="boton-sec mt-3">{d.nav.preus}</Link></div>
      </section>

      <section className="mt-12 rounded-2xl bg-nit p-6 text-white">
        <p className="text-lg font-semibold">{h.noCopiem}</p>
        <p className="mt-2 text-sm opacity-80">{idioma === 'ca' ? `${BANC.resum.total} exercicis, ${Object.keys(BANC.textos).length} textos i ${Object.keys(BANC.tasques).length} tasques escrites, validats amb LanguageTool i revisats per mostreig. Explicacions en català, castellà, anglès, àrab, romanès i francès.` : `${BANC.resum.total} ejercicios, ${Object.keys(BANC.textos).length} textos y ${Object.keys(BANC.tasques).length} tareas escritas, validados con LanguageTool y revisados por muestreo. Explicaciones en catalán, castellano, inglés, árabe, rumano y francés.`}</p>
        <div className="mt-4 flex flex-wrap gap-2">{nivellsActius().map((n) => <Link key={n} href={l(`/guia/examen-${n.toLowerCase()}-catala-2027${n === 'C1' ? '-model' : n === 'B2' ? '-prova' : ''}`)} className="rounded-full bg-white/10 px-3 py-1 text-sm no-underline hover:bg-white/20">{idioma === 'ca' ? `Examen ${n} 2027` : `Examen ${n} 2027`}</Link>)}<Link href={l('/convocatories')} className="rounded-full bg-ocre px-3 py-1 text-sm text-nit no-underline">{d.nav.convocatories}</Link></div>
      </section>
    </div>
  );
}
