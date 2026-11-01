import Link from "next/link";
import type { Dicc } from "@/lib/i18n";
import type { ResumenGuia } from "@/lib/contenido";

// Tarjeta de guía de la portada. La etiqueta dice si es gratis o si va con la suscripción (no «4,99 €» por guía:
// el precio es por todas, y ponerlo en cada una hacía pensar que se paga guía a guía).
export default function TarjetaGuia({ g, idioma, d, n }: { g: ResumenGuia; idioma: string; d: Dicc; n: number }) {
  return (
    <Link href={`/${idioma}/guias/${g.slug}`} className="tarjeta tarjeta-enlace p-4 sm:p-5 flex gap-4 group h-full">
      <span className="text-sm font-bold text-suave cifras pt-1 w-6 shrink-0" aria-hidden>{String(n).padStart(2, "0")}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col-reverse items-start gap-2">
          <h3 className="font-semibold text-lg leading-snug">{g.titulo}</h3>
          <span className={`sello ${g.gratis ? "bg-ok-claro text-ok" : "bg-marca-claro text-marca-oscuro"}`}>
            {g.gratis ? (
              d.guia.gratis
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                {d.guia.conSuscripcion}
              </>
            )}
          </span>
        </div>
        <p className="text-sm text-suave mt-1 line-clamp-2">{g.resumen}</p>
      </div>
    </Link>
  );
}
