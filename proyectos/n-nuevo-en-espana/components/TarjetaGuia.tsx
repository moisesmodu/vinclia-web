import Link from "next/link";
import type { Dicc } from "@/lib/i18n";
import type { ResumenGuia } from "@/lib/contenido";

export default function TarjetaGuia({ g, idioma, d }: { g: ResumenGuia; idioma: string; d: Dicc }) {
  return (
    <Link href={`/${idioma}/guias/${g.slug}`} className="tarjeta p-4 block hover:border-marca transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg leading-snug">{g.titulo}</h3>
          <p className="text-sm text-suave mt-1 line-clamp-3">{g.resumen}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold rounded-full px-2 py-1 ${g.gratis ? "bg-ok-claro text-ok" : "bg-marca-claro text-marca-oscuro"}`}>
          {g.gratis ? d.guia.gratis : "4,99 €"}
        </span>
      </div>
    </Link>
  );
}
