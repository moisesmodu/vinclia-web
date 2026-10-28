import type { Metadata } from "next";
import Link from "next/link";
import { dicc } from "@/lib/i18n";
import { config } from "@/lib/config";
import { modoPrueba } from "@/lib/stripe";
import BotonesPago from "@/components/BotonesPago";

export async function generateMetadata({ params }: { params: Promise<{ idioma: string }> }): Promise<Metadata> {
  const { idioma } = await params;
  return { title: dicc(idioma).precios.titulo, alternates: { canonical: `/${idioma}/precios` } };
}

export default async function Precios({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  const p = config.precios;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{d.precios.titulo}</h1>
        <p className="text-suave mt-2">{d.precios.subtitulo} <Link className="enlace" href={`/${idioma}/guias/${config.guiaGratis}`}>→</Link></p>
      </header>
      <div className="grid sm:grid-cols-2 gap-3">
        <section className="tarjeta p-5">
          <h2 className="font-bold text-lg">{d.precios.gratisTitulo}</h2>
          <p className="text-2xl font-bold mt-1">0 €</p>
          <ul className="mt-3 space-y-2">
            {d.precios.gratisIncluye.map((x) => <li key={x} className="flex gap-2"><span className="text-ok" aria-hidden>✓</span>{x}</li>)}
          </ul>
          <Link href={`/${idioma}/guias/${config.guiaGratis}`} className="boton boton-borde w-full mt-4">{d.inicio.ctaGratis}</Link>
        </section>
        <section className="tarjeta p-5 border-2 border-marca">
          <h2 className="font-bold text-lg">{d.precios.pagoTitulo}</h2>
          <ul className="mt-3 space-y-2">
            {d.precios.incluye.map((x) => <li key={x} className="flex gap-2"><span className="text-ok" aria-hidden>✓</span>{x}</li>)}
          </ul>
        </section>
      </div>
      <BotonesPago
        idioma={idioma}
        planes={[
          { id: "suscripcion", titulo: d.precios.suscripcion, precio: "4,99 €", periodo: d.precios.porMes, iva: d.precios.iva, nota: d.precios.cancela, texto: d.precios.suscripcionTexto },
          { id: "pack", titulo: d.precios.pack, precio: "19,90 €", periodo: "12 m", iva: d.precios.iva, nota: d.precios.sinRenovacion, texto: d.precios.packTexto, destacado: true }
        ]}
        textos={{ pagar: d.precios.pagar, desistimiento: d.precios.desistimiento, condiciones: d.precios.condiciones, marcaCasillas: d.precios.marcaCasillas, errorPago: d.precios.errorPago, enlaceCondiciones: `/${idioma}/legal/condiciones` }}
      />
      <p className="text-sm text-suave">🔒 {modoPrueba() ? d.precios.pruebaStripe : d.precios.pruebaStripe.split(".")[0] + "."}</p>
      <p className="text-sm bg-aviso-claro rounded-xl p-3">{d.precios.noAsesoria}</p>
      <p className="text-center font-semibold">{d.pie.sello}</p>
      <p className="text-sm"><Link className="enlace" href={`/${idioma}/acceso`}>{d.guia.yaTengoAcceso}</Link></p>
    </div>
  );
}
