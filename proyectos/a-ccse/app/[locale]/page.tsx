import Link from 'next/link';
import { PAIS, precioTexto, type Locale, lenguaExplicacion } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { TAREAS, deTarea, FUENTE, IDS_GRATIS, POR_ID } from '@/lib/preguntas';
import { traducciones } from '@/lib/banco';
import { CuentaAtras } from '@/components/home/CuentaAtras';
import { MiniTest } from '@/components/home/MiniTest';
import { BarraFija } from '@/components/home/BarraFija';

const SALUDOS = [
  { l: 'ar', s: 'مرحبا', n: 'العربية' },
  { l: 'fr', s: 'Bonjour', n: 'Français' },
  { l: 'ro', s: 'Bună', n: 'Română' },
  { l: 'zh', s: '你好', n: '中文' },
  { l: 'uk', s: 'Привіт', n: 'Українська' },
  { l: 'en', s: 'Hello', n: 'English' },
  { l: 'es', s: 'Hola', n: 'Español' },
];
const RETRATOS = [
  { src: '/img/rumano.webp', l: 'ro', etiqueta: 'Română' },
  { src: '/img/china.webp', l: 'zh', etiqueta: '中文' },
  { src: '/img/ucraniana.webp', l: 'uk', etiqueta: 'Українська' },
  { src: '/img/senegal.webp', l: 'fr', etiqueta: 'Français' },
];

function Check({ si }: { si: boolean | 'parcial' }) {
  if (si === 'parcial') return <span className="text-suave">~</span>;
  return si ? <span className="font-bold text-ok">✓</span> : <span className="text-black/30">—</span>;
}

export default async function Inicio({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = traductor(locale);
  const p = precioTexto(locale);
  const reparto = PAIS.simulacro.reparto as Record<string, number>;
  // Tarjeta flotante del hero con una pregunta gratis real y su explicación en el idioma del visitante (o en árabe).
  const muestra = POR_ID.get(IDS_GRATIS[2])!;
  const lMuestra = locale === 'es' || locale === 'ca' ? 'ar' : lenguaExplicacion(locale);
  const trMuestra = traducciones(lMuestra)[muestra.id];
  const faq = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`faq.${n}.q` as 'faq.1.q'),
    a: t(`faq.${n}.a` as 'faq.1.a', { p, d: PAIS.accesoDias }),
  }));
  const comp: [string, boolean | 'parcial', boolean | 'parcial', boolean][] = [
    [t('home.comp1'), true, true, true],
    [t('home.comp2'), false, false, true],
    [t('home.comp3'), false, false, true],
    [t('home.comp4'), false, true, true],
    [t('home.comp5'), false, false, true],
    [t('home.comp6'), false, false, true],
    [t('home.comp7'), false, false, true],
  ];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: t('marca'), applicationCategory: 'EducationalApplication', operatingSystem: 'Web, Android', inLanguage: locale, offers: { '@type': 'Offer', price: (PAIS.precioCentimos / 100).toFixed(2), priceCurrency: PAIS.moneda } },
  ];

  return (
    <div className="-mt-6">
      {/* HERO */}
      <section className="relative -mx-4 overflow-hidden bg-gradient-to-b from-[#F4E3CF] to-fondo px-4 pb-12 pt-6 sm:pt-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-terracota/15 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="text-center lg:text-start">
            <CuentaAtras />
            <h1 className="mt-5 text-[1.85rem] font-bold leading-[1.1] sm:text-5xl">{t('home.h1')}</h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-suave sm:text-lg lg:mx-0">{t('home.sub')}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <a href="#test" className="boton boton-1 text-lg shadow-lg shadow-marca/25">{t('home.ctaTest')}</a>
              <Link href={`/${locale}/simulacro`} className="boton boton-2 text-lg">{t('home.ctaSim')}</Link>
            </div>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold lg:justify-start">
              {['home.confianza1', 'home.confianza2', 'home.confianza3'].map((k) => (
                <li key={k} className="flex items-center gap-1.5"><span className="text-ok">✓</span>{t(k as 'home.confianza1')}</li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <img src="/img/hero.webp" alt="" width={896} height={1120} className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl" fetchPriority="high" />
            {trMuestra?.explicacion && (
              <div className="absolute -bottom-6 left-3 right-3 rounded-2xl border border-[#EADFCD] bg-white/95 p-4 shadow-xl backdrop-blur sm:-left-8 sm:right-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-marca">{t('tarea.n', { n: muestra.tarea })} · nº {muestra.id}</p>
                <p className="mt-1 font-semibold" lang="es" dir="ltr">{muestra.texto}</p>
                <p className="mt-1 rounded-lg bg-green-50 px-2 py-1 text-sm font-semibold text-ok" lang="es" dir="ltr">✓ {muestra.opciones[muestra.respuesta]}</p>
                <p className="mt-2 line-clamp-3 text-sm text-suave" lang={lMuestra} dir={lMuestra === 'ar' ? 'rtl' : 'ltr'}>{trMuestra.explicacion}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* IDIOMAS */}
      <section className="mt-12 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">{t('home.idiomasT')}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-suave">{t('home.idiomasD')}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {SALUDOS.map((s) => (
            <Link key={s.l} href={`/${s.l}`} lang={s.l} className="rounded-full border border-[#EADFCD] bg-white px-4 py-2 shadow-sm hover:border-terracota">
              <span className="titulos font-bold">{s.s}</span> <span className="text-sm text-suave">· {s.n}</span>
            </Link>
          ))}
        </div>
        <div className="mx-auto mt-6 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
          {RETRATOS.map((r) => (
            <figure key={r.src} className="relative overflow-hidden rounded-2xl">
              <img src={r.src} alt="" width={560} height={560} loading="lazy" className="aspect-square w-full object-cover" />
              <figcaption className="absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold" lang={r.l}>{r.etiqueta}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* MINI TEST */}
      <section id="test" className="mx-auto mt-14 max-w-2xl scroll-mt-4">
        <div className="text-center">
          <p className="titulos text-sm font-bold uppercase tracking-widest text-marca">{t('home.miniEtiqueta')}</p>
          <h2 className="mt-1 text-3xl font-bold">{t('home.miniT')}</h2>
          <p className="mt-2 text-suave">{t('home.miniD')}</p>
        </div>
        <div className="mt-5"><MiniTest /></div>
      </section>

      {/* CÓMO */}
      <section className="mt-16">
        <h2 className="text-center text-3xl font-bold">{t('home.comoT')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="tarjeta p-6">
              <span className="titulos grid h-11 w-11 place-items-center rounded-full bg-terracota text-xl font-bold text-white">{n}</span>
              <h3 className="mt-3 text-lg font-bold">{t(`home.como${n}t` as 'home.como1t')}</h3>
              <p className="mt-1 text-suave">{t(`home.como${n}d` as 'home.como1d')}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CIFRAS */}
      <section className="-mx-4 mt-16 bg-tinta px-4 py-10 text-white">
        <h2 className="text-center text-2xl font-bold">{t('home.cifrasT')}</h2>
        <dl className="mx-auto mt-6 grid max-w-5xl grid-cols-2 gap-6 text-center sm:grid-cols-5">
          {[['300', 'home.cifra1'], ['25', 'home.cifra2'], ['15', 'home.cifra3'], ['45', 'home.cifra4'], [`${PAIS.convocatoria.tasaEuros} €`, 'home.cifra5']].map(([n, k]) => (
            <div key={k}>
              <dt className="titulos text-4xl font-bold text-terracota">{n}</dt>
              <dd className="mt-1 text-sm text-white/80">{t(k as 'home.cifra1')}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* TEMAS */}
      <section className="mt-16">
        <h2 className="mb-4 text-2xl font-bold">{t('inicio.temas')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TAREAS.map((n) => (
            <Link key={n} href={`/${locale}/temas/${n}`} className="tarjeta block p-5 transition hover:-translate-y-0.5 hover:border-terracota hover:shadow-md">
              <p className="text-sm font-semibold text-marca">{t('tarea.n', { n })}</p>
              <h3 className="mt-1 font-bold leading-snug">{t(`tarea.${n}` as 'tarea.1')}</h3>
              <p className="mt-2 text-sm text-suave">{t('tarea.preguntas', { n: deTarea(n).length })} · {t('tarea.enExamen', { n: reparto[n] })}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* COMPARATIVA */}
      <section className="mt-16">
        <h2 className="text-center text-3xl font-bold">{t('home.compT')}</h2>
        <div className="tarjeta mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[#EADFCD]">
                <th className="p-3 text-start" />
                <th className="p-3 text-center font-semibold text-suave">{t('home.compPdf')}</th>
                <th className="p-3 text-center font-semibold text-suave">{t('home.compOficial')}</th>
                <th className="bg-terracota/10 p-3 text-center font-bold text-marca">{t('home.compNos')}</th>
              </tr>
            </thead>
            <tbody>
              {comp.map(([f, a, b, c]) => (
                <tr key={f} className="border-b border-[#F1E8DA] last:border-0">
                  <td className="p-3">{f}</td>
                  <td className="p-3 text-center"><Check si={a} /></td>
                  <td className="p-3 text-center"><Check si={b} /></td>
                  <td className="bg-terracota/10 p-3 text-center"><Check si={c} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRECIO */}
      <section className="mt-16 overflow-hidden rounded-[2rem] bg-gradient-to-br from-terracota to-marca-osc p-8 text-white sm:p-12">
        <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{t('home.precioT')}</h2>
            <p className="mt-3 text-white/90">{t('home.precioD')}</p>
            <p className="mt-3 font-semibold">✓ {t('precio.garantia', { p })}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 text-center text-tinta shadow-xl">
            <p className="titulos text-5xl font-bold">{p}</p>
            <p className="mt-1 text-sm text-suave">{t('precio.iva', { d: PAIS.accesoDias })}</p>
            <Link href={`/${locale}/precio`} className="boton boton-1 mt-4 w-full">{t('nav.precio')}</Link>
            <a href="#test" className="mt-3 block text-sm underline">{t('home.precioCta')}</a>
          </div>
        </div>
      </section>

      {/* DESPUÉS */}
      <section className="mt-16 grid items-center gap-6 md:grid-cols-2">
        <img src="/img/familia.webp" alt="" width={1400} height={783} loading="lazy" className="aspect-video w-full rounded-[2rem] object-cover" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-marca">Nuevo en España</p>
          <h2 className="mt-1 text-3xl font-bold">{t('home.despuesT')}</h2>
          <p className="mt-2 text-suave">{t('home.despuesD')}</p>
          <a href="/nuevo-en-espana" className="boton boton-2 mt-4">{t('sig.cta')} →</a>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-4 text-center text-3xl font-bold">{t('inicio.faq')}</h2>
        <div className="grid gap-2">
          {faq.map((f) => (
            <details key={f.q} className="tarjeta group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                {f.q}<span className="text-marca transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-suave">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-14 text-center">
        <a href="#test" className="boton boton-1 text-lg">{t('home.ctaTest')}</a>
        <p className="mt-6 text-sm text-suave">
          {t('inicio.fuente')}: <a className="underline" href={FUENTE.url}>{FUENTE.titulo}</a> ({FUENTE.autor}).
        </p>
      </section>
      <BarraFija />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </div>
  );
}
