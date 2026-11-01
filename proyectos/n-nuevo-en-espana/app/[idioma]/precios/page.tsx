import type { Metadata } from "next";
import Link from "next/link";
import { dicc, LOCALE_BCP47 } from "@/lib/i18n";
import { config, IDIOMAS } from "@/lib/config";
import { modoPrueba } from "@/lib/stripe";
import BotonesPago from "@/components/BotonesPago";

export async function generateMetadata({ params }: { params: Promise<{ idioma: string }> }): Promise<Metadata> {
  const { idioma } = await params;
  const d = dicc(idioma);
  return {
    title: d.precios.titulo,
    description: `${config.precios.suscripcion.texto} · ${config.precios.pack.texto}. ${d.precios.subtitulo}`,
    alternates: {
      canonical: `/${idioma}/precios`,
      languages: { ...Object.fromEntries(IDIOMAS.map((i) => [LOCALE_BCP47[i], `/${i}/precios`])), "x-default": "/es/precios" }
    }
  };
}

export default async function Precios({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  const prueba = modoPrueba();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold">{d.precios.titulo}</h1>
        <p className="text-suave mt-2 text-lg">{d.precios.pagoTitulo}</p>
        <ul className="mt-4 grid gap-2">
          {d.precios.incluye.map((x) => <li key={x} className="flex gap-2"><span className="text-ok font-bold" aria-hidden>✓</span>{x}</li>)}
        </ul>
      </header>

      <BotonesPago
        idioma={idioma}
        planes={[
          { id: "pack", titulo: d.precios.pack, precio: "19,90 €", periodo: d.precios.doceMeses, iva: d.precios.iva, nota: d.precios.sinRenovacion, texto: d.precios.packTexto, destacado: true },
          { id: "suscripcion", titulo: d.precios.suscripcion, precio: "4,99 €", periodo: d.precios.porMes, iva: d.precios.iva, nota: d.precios.cancela, texto: d.precios.suscripcionTexto }
        ]}
        textos={{ eligePlan: d.precios.eligePlan, pagar: d.precios.pagar, desistimiento: d.precios.desistimiento, condiciones: d.precios.condiciones, marcaCasillas: d.precios.marcaCasillas, errorPago: d.precios.errorPago, enlaceCondiciones: `/${idioma}/legal/condiciones` }}
      />

      <div className="grid gap-3 text-sm">
        <p className="flex gap-2 items-start">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 mt-0.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
          {/* En producción solo la primera frase («Pago seguro con Stripe.»); el aviso de modo prueba, solo con claves de prueba. */}
          <span>{prueba ? d.precios.pruebaStripe : d.precios.pruebaStripe.split(/(?<=[.。])\s*/)[0]}</span>
        </p>
        <p className="flex gap-2 items-start">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 mt-0.5"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
          <span>{d.precios.garantia}</span>
        </p>
        <p className="bg-aviso-claro rounded-xl p-3">{d.precios.noAsesoria}</p>
      </div>

      <section className="tarjeta p-5">
        <h2 className="font-bold text-lg">{d.precios.gratisTitulo} · 0 €</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {d.precios.gratisIncluye.map((x) => <li key={x} className="flex gap-2"><span className="text-ok" aria-hidden>✓</span>{x}</li>)}
        </ul>
        <Link href={`/${idioma}/guias/${config.guiaGratis}`} className="enlace font-semibold inline-block mt-4">{d.inicio.ctaGratis} <span className="inline-block rtl:rotate-180" aria-hidden>→</span></Link>
      </section>

      <p className="text-sm"><Link className="enlace" href={`/${idioma}/acceso`}>{d.guia.yaTengoAcceso}</Link></p>
    </div>
  );
}
