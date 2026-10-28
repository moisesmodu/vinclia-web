import Link from "next/link";
import type { Dicc } from "@/lib/i18n";
import { config } from "@/lib/config";

export default function Pie({ idioma, d }: { idioma: string; d: Dicc }) {
  return (
    <footer className="border-t border-linea bg-white mt-10">
      <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-suave space-y-4">
        <p className="bg-aviso-claro text-tinta rounded-xl p-3">{d.aviso.largo}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href={`/${idioma}/legal/aviso-legal`}>{d.pie.avisoLegal}</Link>
          <Link href={`/${idioma}/legal/privacidad`}>{d.pie.privacidad}</Link>
          <Link href={`/${idioma}/legal/cookies`}>{d.pie.cookies}</Link>
          <Link href={`/${idioma}/legal/condiciones`}>{d.pie.condiciones}</Link>
          <Link href={`/${idioma}/preguntas`}>{d.nav.preguntas}</Link>
          <a href={`mailto:${config.titular.correo}`}>{d.pie.contacto}</a>
        </nav>
        <p>© 2026 {d.marca}</p>
      </div>
    </footer>
  );
}
