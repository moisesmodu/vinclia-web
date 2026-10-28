"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dicc } from "@/lib/i18n";
import type { Guia } from "@/lib/contenido";
import GuiaCompleta from "./GuiaCompleta";

// Las guías de pago no van en el HTML: se piden a /api/guia, que comprueba la sesión.
export default function CargarGuia({ slug, idioma, d }: { slug: string; idioma: string; d: Dicc }) {
  const [estado, setEstado] = useState<"cargando" | "bloqueada" | "ok">("cargando");
  const [g, setG] = useState<Guia | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch(`/api/guia?slug=${encodeURIComponent(slug)}&idioma=${idioma}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (!vivo) return;
        if (r.ok) { setG((await r.json()).guia); setEstado("ok"); } else setEstado("bloqueada");
      })
      .catch(() => vivo && setEstado("bloqueada"));
    return () => { vivo = false; };
  }, [slug, idioma]);

  if (estado === "cargando") return <p className="text-suave">{d.guia.cargando}</p>;
  if (estado === "ok" && g) return <GuiaCompleta g={g} idioma={idioma} d={d} />;
  return (
    <section className="tarjeta p-5 border-2 border-marca text-center no-imprimir">
      <div className="text-4xl" aria-hidden>🔒</div>
      <h2 className="font-bold text-xl mt-2">{d.guia.bloqueadaTitulo}</h2>
      <p className="text-suave mt-2">{d.guia.bloqueadaTexto}</p>
      <div className="mt-4 flex flex-col gap-2">
        <Link href={`/${idioma}/precios?guia=${slug}`} className="boton boton-marca">{d.guia.verPrecios}</Link>
        <Link href={`/${idioma}/acceso`} className="enlace text-sm">{d.guia.yaTengoAcceso}</Link>
      </div>
    </section>
  );
}
