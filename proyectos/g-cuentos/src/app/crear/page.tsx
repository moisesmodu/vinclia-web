import { Suspense } from "react";
import type { Metadata } from "next";
import { Formulario } from "@/components/Formulario";
import { Pagina } from "@/components/Marco";
import { t } from "@/i18n/textos";
export const metadata: Metadata = { title: t("es").form.titulo, robots: { index: false } };
export default function Page() {
  const x = t("es").form;
  return (
    <Pagina idioma="es">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl sm:text-4xl mb-1">{x.titulo}</h1>
        <p className="text-suave mb-6">{x.sub}</p>
        <Suspense><Formulario idioma="es" /></Suspense>
      </div>
    </Pagina>
  );
}
