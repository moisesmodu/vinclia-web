import Link from "next/link";
import type { Dicc } from "@/lib/i18n";

// Monetizar primero (SESIONES.md): al acabar la guía gratis, el siguiente paso con su precio y un motivo concreto.
// Dos pantallas hasta pagar: esta tarjeta → /precios (marca casillas y elige plan) → Stripe.
export default function OfertaTrasGuia({ idioma, d }: { idioma: string; d: Dicc }) {
  return (
    <section className="rounded-2xl p-5 bg-marca-claro border-2 border-marca no-imprimir" id="siguiente">
      <h2 className="font-bold text-xl">{d.oferta.titulo}</h2>
      <p className="mt-2 leading-relaxed">{d.oferta.texto}</p>
      <Link href={`/${idioma}/precios?desde=guia-gratis`} className="boton boton-marca w-full mt-4">{d.oferta.boton}</Link>
      <p className="text-sm text-center mt-2">{d.oferta.precio}</p>
    </section>
  );
}
