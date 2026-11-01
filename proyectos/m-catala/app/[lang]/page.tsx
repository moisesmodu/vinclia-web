import Link from 'next/link';
import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
import { esIdioma, t } from '@/lib/i18n';
import { marca, examens, nivellsActius, pais, preu, BANC, convocatories, urlBase } from '@/lib/datos';
import type { Idioma, Nivell } from '@/lib/tipos';
import DemoItem from '@/components/DemoItem';
import BotoSeguir from '@/components/BotoSeguir';
import Volat from '@/components/Volat';

export const revalidate = 86400; // els comptes enrere de les inscripcions es refan cada dia

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma;
  return { ...meta(l, '', t(l).nou.heroTitol, t(l).nou.heroText), title: { absolute: `${marca.nombre} · ${t(l).nou.heroTitol}` } };
}

/** Portada: el ganxo és la necessitat (taxa, mesos, plaça) amb la data real de la propera inscripció, i una pregunta real per respondre. */
export default async function Inici({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma;
  const d = t(idioma); const h = d.hero; const n = d.nou; const l = (s: string) => `/${idioma}${s}`;
  const anual = pais.planes.find((p) => p.id === 'anual')!;
  const dia = Math.floor(Date.now() / 86400000);
  const pool = BANC.items.filter((i) => i.gratis && Array.isArray(i.opcions) && i.tipus === 'castellanismes' && i.nivell === 'C1');
  const demo = pool[dia % Math.max(1, pool.length)];
  const regla = demo ? BANC.regles[demo.regla] : null;

  // Properes inscripcions: per nivell actiu, la primera convocatòria de la DPL que encara no ha tancat la inscripció.
  const avui = new Date(); avui.setHours(0, 0, 0, 0);
  const dies = (iso: string) => Math.round((new Date(iso).getTime() - avui.getTime()) / 86400000);
  const data = (iso: string) => new Intl.DateTimeFormat(idioma === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'long' }).format(new Date(iso));
  const properes = nivellsActius().map((niv: Nivell) => {
    const c = convocatories.filter((x) => (x.nivell === niv || x.nivells?.includes(niv)) && x.inscripcio && dies(x.inscripcio.fi) >= 0).sort((a, b) => a.inscripcio!.inici.localeCompare(b.inscripcio!.inici))[0];
    return c ? { niv, c } : null;
  }).filter(Boolean) as { niv: Nivell; c: (typeof convocatories)[number] }[];
  const agrupades = properes.reduce<{ nivs: Nivell[]; c: (typeof convocatories)[number] }[]>((acc, { niv, c }) => {
    const g = acc.find((x) => x.c.id === c.id); if (g) g.nivs.push(niv); else acc.push({ nivs: [niv], c }); return acc;
  }, []);

  // Dades estructurades: qui som i què oferim (preus reals de config/paises/es.json; sense valoracions inventades)
  const base = urlBase();
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': `${base}/#org`, name: marca.nombre, url: base, logo: `${base}/icons/icon-512.png`, slogan: marca.lema[idioma], address: { '@type': 'PostalAddress', addressLocality: 'Lleida', addressCountry: 'ES' } },
    { '@type': 'WebSite', '@id': `${base}/#web`, url: `${base}/${idioma}`, name: marca.nombre, inLanguage: idioma === 'ca' ? 'ca' : 'es', publisher: { '@id': `${base}/#org` } },
    { '@type': 'WebApplication', name: marca.nombre, url: `${base}/${idioma}`, applicationCategory: 'EducationalApplication', operatingSystem: 'Web', inLanguage: ['ca', 'es'], description: n.heroText, publisher: { '@id': `${base}/#org` },
      offers: [{ '@type': 'Offer', name: idioma === 'ca' ? 'Diagnòstic' : 'Diagnóstico', price: '0', priceCurrency: 'EUR' }, ...pais.planes.map((p) => ({ '@type': 'Offer', name: d.preus.plans[p.id] ?? p.id, price: (p.importe / 100).toFixed(2), priceCurrency: 'EUR' }))] },
  ] };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld).replace(/</g, '\\u003c') }} />
      {/* Portada: llibreta quadriculada de boli; en Volat és el punt final de la frase */}
      <section className="quadricula-boli text-white">
        <div className="contenedor-portada flow-root pt-12 sm:pt-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center lg:gap-12 lg:pb-20">
          <div>
            <h1 className="display max-w-[14ch] text-[42px] sm:text-[60px] lg:text-[56px]">
              {n.heroTitol}<span className="ml-[0.1em] inline-block align-baseline"><Volat mida={0.6 * 42} to="#FFFFFF" cara="#2140D6" reflex="#FFFFFF" aterra className="inline-block h-[0.6em] w-[0.6em] translate-y-[0.06em]" titol="Volat" /></span>
            </h1>
            <p className="mt-7 max-w-[44ch] text-[19px] leading-relaxed text-white/85 sm:text-[21px] lg:text-[19px]">{n.heroText}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={l('/comencar')} className="boton-invers text-[18px]">{h.cta}</Link>
              <BotoSeguir idioma={idioma} text={h.seguir} className="boton-sec border-white text-[18px] text-white hover:border-marcador hover:text-marcador" />
            </div>
            <p className="mt-3 text-[14px] text-white/70">{n.heroSub}</p>
          </div>
          {/* El full de respostes real: al mòbil trepitja la vora del blau; a l'escriptori, al costat del titular */}
          {demo && regla ? <div className="relative z-10 mt-10 -mb-10 text-tinta sm:-mb-14 lg:my-0"><DemoItem idioma={idioma} item={demo} regla={regla} /></div> : <div className="pb-16" />}
        </div>
      </section>
      {demo && regla ? <div className="h-10 sm:h-14 lg:hidden" aria-hidden="true" /> : null}

      <div className="contenedor-portada">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          {/* Properes inscripcions: la data real, el compte enrere i la taxa */}
          {agrupades.length ? <section className="seccio">
            <h2>{n.properes}</h2>
            <ul className="mt-5 divide-y divide-linia border-y border-linia">
              {agrupades.map(({ nivs, c }) => { const ini = dies(c.inscripcio!.inici); const oberta = ini <= 0; return (
                <li key={c.id} className="grid grid-cols-[72px_1fr] items-start gap-4 py-4">
                  <span className="flex flex-col gap-1">{nivs.map((nv) => <span key={nv} className={`num leading-none ${nivs.length > 1 ? 'text-[30px]' : 'text-[40px]'}`}>{nv}</span>)}</span>
                  <div className="min-w-0 text-[15px] leading-relaxed">
                    <p className="text-[17px] font-bold">{c.nom[idioma].replace(/ ·.*$/, '')}: <span className={oberta ? 'marcat' : ''}>{oberta ? n.obertaFins(data(c.inscripcio!.fi)) : n.obreEn(ini)}</span></p>
                    <p className="text-secundari">{n.provaEl(data(c.prova))}{c.taxa ? `, ${n.taxaDe(preu(Math.round(c.taxa * 100)))}` : ''}{c.inscripcio!.estimada || !c.verificat ? ` (${d.convocatories.prevista})` : ''}.</p>
                  </div>
                </li>); })}
            </ul>
            <Link href={l('/convocatories')} className="boton-text mt-3">{n.totesConvocatories}</Link>
          </section> : null}

          {/* Què t'hi jugues: la necessitat, amb números */}
          <section className="seccio">
            <h2>{n.enJoc}</h2>
            <ul className="mt-5 space-y-5">
              {n.enJocLlista.map(([ti, tx]) => <li key={ti}><p className="ample text-[20px]">{ti}</p><p className="mt-1 max-w-[52ch] text-[16px] leading-relaxed text-secundari">{tx}</p></li>)}
            </ul>
          </section>
        </div>

        {/* Com funciona: és una seqüència, per això va numerada */}
        <section className="seccio linia">
          <h2>{h.com}</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2">
            {h.comLlista.map(([ti, tx], i) => <li key={i} className="grid grid-cols-[40px_1fr] gap-3"><span className="num text-[30px] leading-none text-boli">{i + 1}</span><div><h3>{ti}</h3><p className="mt-1 text-[15px] leading-relaxed text-secundari">{tx}</p></div></li>)}
          </ol>
        </section>

        {/* En Volat es presenta */}
        <section className="seccio linia grid grid-cols-[88px_1fr] items-start gap-5 sm:grid-cols-[128px_1fr]">
          <Volat mida={128} postura="content" className="h-[88px] w-[88px] sm:h-[128px] sm:w-[128px]" titol="Volat" />
          <div>
            <p className="ample text-[22px] leading-tight sm:text-[26px]">{n.volatPresenta}</p>
            <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-secundari">{n.volatDiu}</p>
            <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed">{h.noCopiem}</p>
          </div>
        </section>

        <section className="seccio linia">
          <h2>{h.examens}</h2>
          <div className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {(['B1', 'B2', 'C1', 'C2'] as const).map((nv) => { const e = examens[nv]; return (
              <div key={nv} className="border-t-[1.5px] border-tinta pt-3">
                <div className="flex items-baseline justify-between"><span className="num text-[32px]">{nv}</span>{!e.actiu ? <span className="xip">{d.comencar.proximament}</span> : null}</div>
                <p className="mt-1 text-[15px] text-secundari">{e.usos[idioma]}</p>
                <ul className="mt-3 space-y-1 text-[14px]">{e.arees.map((a) => <li key={a.id} className="flex justify-between gap-2"><span className="min-w-0 truncate">{a.nom[idioma].replace(/^Àrea \d · |^Área \d · /, '')}</span><span className="num shrink-0">{String(a.pes).replace(".", ",")} %</span></li>)}</ul>
                <p className="mt-3 text-[13px] text-terciari">{idioma === 'ca' ? 'Apte' : 'Apto'}: {e.aptoGlobal ? `${e.aptoGlobal} % global` : ''}{e.parts.escrita.minim ? `${e.aptoGlobal ? ' i ' : ''}${e.parts.escrita.minim} % ${idioma === 'ca' ? 'escrita i' : 'escrita y'} ${e.parts.oral.minim} % oral` : ''}{e.parts.escrita.minimPunts ? ` · ${e.parts.escrita.minimPunts} ${idioma === 'ca' ? 'i' : 'y'} ${e.parts.oral.minimPunts} ${idioma === 'ca' ? 'punts' : 'puntos'}` : ''}</p>
              </div>); })}
          </div>
        </section>

        <section className="seccio linia grid gap-10 sm:grid-cols-2">
          <div><h2>{h.per}</h2><ul className="mt-4 space-y-2 text-[16px] leading-relaxed">{h.perLlista.map((x) => <li key={x} className="border-l-[3px] border-boli pl-3">{x}</li>)}</ul></div>
          <div>
            <h2>{n.unPreu}</h2>
            <p className="mt-4 text-[16px] leading-relaxed">{d.preus.gratisTitol}: {d.preus.gratis.slice(0, 3).join(', ').toLowerCase()}.</p>
            <p className="mt-2 text-[16px] leading-relaxed">Premium: <span className="num text-[22px]">{preu(999)}</span> {n.perMes}, <span className="num text-[22px]">{preu(anual.importe)}</span> {n.perAny} {idioma === 'ca' ? 'o passi de convocatòria' : 'o pase de convocatoria'} <span className="num text-[22px]">{preu(2499)}</span>.</p>
            <p className="mt-2 text-[14px] text-terciari">{d.preus.ivaInclos}. {d.preus.avis}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={l('/comencar')} className="boton-primari">{h.cta}</Link>
              <Link href={l('/preus')} className="boton-text">{idioma === 'ca' ? 'Veure els preus' : 'Ver los precios'}</Link>
            </div>
          </div>
        </section>

        <section className="seccio linia">
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-secundari">{idioma === 'ca' ? `${BANC.resum.total} exercicis, ${Object.keys(BANC.textos).length} textos i ${Object.keys(BANC.tasques).length} tasques escrites, validats amb LanguageTool i revisats per mostreig. Explicacions en català, castellà, anglès, àrab, romanès i francès.` : `${BANC.resum.total} ejercicios, ${Object.keys(BANC.textos).length} textos y ${Object.keys(BANC.tasques).length} tareas escritas, validados con LanguageTool y revisados por muestreo. Explicaciones en catalán, castellano, inglés, árabe, rumano y francés.`}</p>
          <div className="mt-5 flex flex-wrap gap-2">{nivellsActius().map((nv) => <Link key={nv} href={l(`/guia/examen-${nv.toLowerCase()}-catala-2027${nv === 'C1' ? '-model' : nv === 'B2' ? '-prova' : ''}`)} className="xip no-underline hover:border-boli hover:text-boli">{`Examen ${nv} 2027`}</Link>)}<Link href={l('/convocatories')} className="xip-boli no-underline">{d.nav.convocatories}</Link></div>
        </section>
      </div>

      {/* Tancament: una sola acció, la mateixa que a dalt */}
      <section className="quadricula-boli mt-4 text-white">
        <div className="contenedor-portada flex flex-col gap-6 py-14 sm:flex-row sm:items-center sm:justify-between sm:py-16">
          <div className="flex items-center gap-5">
            <Volat mida={72} postura="content" to="#FFFFFF" cara="#2140D6" reflex="#FFFFFF" className="h-[56px] w-[56px] shrink-0 sm:h-[72px] sm:w-[72px]" titol="Volat" />
            <div>
              <p className="ample text-[24px] leading-tight sm:text-[30px]">{idioma === 'ca' ? 'Quant et falta per a l\'apte?' : '¿Cuánto te falta para el apto?'}</p>
              <p className="mt-1 text-[15px] text-white/80">{n.heroSub}</p>
            </div>
          </div>
          <Link href={l('/comencar')} className="boton-invers shrink-0 text-[18px]">{h.cta}</Link>
        </div>
      </section>
    </div>
  );
}
