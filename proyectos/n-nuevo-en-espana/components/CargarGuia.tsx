"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import type { Dicc } from "@/lib/i18n";
import type { Guia } from "@/lib/contenido";
import GuiaCompleta from "./GuiaCompleta";

// Las guías de pago no van en el HTML: se piden a /api/guia, que comprueba la sesión.
type Cuenta = { pasos: number; documentos: number; errores: number; checklist: number };

export default function CargarGuia({ slug, idioma, d, cuenta }: { slug: string; idioma: string; d: Dicc; cuenta: Cuenta }) {
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

  // Mientras se comprueba la sesión, un esqueleto con la forma del muro (sin salto de diseño al resolverse).
  if (estado === "cargando") return <div className="tarjeta h-72 animate-pulse" aria-busy="true"><span className="sr-only">{d.guia.cargando}</span></div>;
  if (estado === "ok" && g) return <GuiaCompleta g={g} idioma={idioma} d={d} />;
  const incluye: [number, string][] = [
    [cuenta.pasos, d.guia.pasos],
    [cuenta.documentos, d.guia.documentos],
    [cuenta.errores, d.guia.errores],
    [cuenta.checklist, d.guia.checklist]
  ];
  return (
    <section className="tarjeta overflow-hidden border-2 border-marca no-imprimir">
      <div className="p-5 sm:p-6">
        <p className="sello bg-marca-claro text-marca-oscuro">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
          {d.guia.conSuscripcion}
        </p>
        <h2 className="font-bold text-2xl mt-3">{d.guia.bloqueadaTitulo}</h2>
        <p className="text-suave mt-2">{d.guia.bloqueadaTexto}</p>
        <p className="font-semibold mt-5 mb-2">{d.guia.incluyeGuia}</p>
        <dl className="grid grid-cols-2 gap-2">
          {incluye.map(([n, etiqueta]) => (
            <div key={etiqueta} className="rounded-xl bg-fondo p-3">
              <dt className="sr-only">{etiqueta}</dt>
              <dd className="flex items-baseline gap-2"><span className="text-2xl font-bold cifras text-marca-oscuro">{n}</span><span className="text-sm leading-tight">{etiqueta}</span></dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="bg-marca-claro p-5 sm:p-6 flex flex-col gap-2">
        <Link href={`/${idioma}/precios?guia=${slug}`} onClick={() => track("muro_ver_precios", { guia: slug, idioma })} className="boton boton-marca">{d.guia.verPrecios}</Link>
        <p className="text-sm text-center">{d.oferta.precio}</p>
        <Link href={`/${idioma}/acceso`} className="enlace text-sm text-center">{d.guia.yaTengoAcceso}</Link>
      </div>
    </section>
  );
}
