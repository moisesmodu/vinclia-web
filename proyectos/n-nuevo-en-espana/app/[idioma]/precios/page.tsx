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
      <ul className="tarjeta p-5 space-y-2">
        {d.precios.incluye.map((x) => <li key={x} className="flex gap-2"><span className="text-ok" aria-hidden>✓</span>{x}</li>)}
      </ul>
      <BotonesPago
        idioma={idioma}
        planes={[
          { id: "suscripcion", titulo: d.precios.suscripcion, precio: p.suscripcion.texto, texto: d.precios.suscripcionTexto },
          { id: "pack", titulo: d.precios.pack, precio: p.pack.texto, texto: d.precios.packTexto, destacado: true }
        ]}
        textos={{ pagar: d.precios.pagar, desistimiento: d.precios.desistimiento, condiciones: d.precios.condiciones, marcaCasillas: d.precios.marcaCasillas, errorPago: d.precios.errorPago, enlaceCondiciones: `/${idioma}/legal/condiciones` }}
      />
      <p className="text-sm text-suave">🔒 {modoPrueba() ? d.precios.pruebaStripe : d.precios.pruebaStripe.split(".")[0] + "."}</p>
      <p className="text-sm bg-aviso-claro rounded-xl p-3">{d.precios.noAsesoria}</p>
      <p className="text-sm"><Link className="enlace" href={`/${idioma}/acceso`}>{d.guia.yaTengoAcceso}</Link></p>
    </div>
  );
}
