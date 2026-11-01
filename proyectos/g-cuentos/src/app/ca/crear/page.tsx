import { Suspense } from "react";
import type { Metadata } from "next";
import { meta } from "@/lib/meta";
import { Formulario } from "@/components/Formulario";
import { Pagina } from "@/components/Marco";
import { t } from "@/i18n/textos";
import { PLANTILLAS } from "@/lib/plantillas";
export const metadata: Metadata = meta({ idioma: "ca", es: "/crear", ca: "/ca/crear", title: t("ca").form.titulo, description: "Crea gratis el seu conte personalitzat i mira la portada, la dedicatòria i 3 pàgines abans de pagar.", noindex: true });
const titulos = Object.fromEntries(Object.entries(PLANTILLAS).map(([id, p]) => [id, p.titulo])) as Record<keyof typeof PLANTILLAS, { es: string; ca: string }>;
export default function Page() {
  const x = t("ca").form;
  return (
    <Pagina idioma="ca">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl sm:text-4xl mb-1">{x.titulo}</h1>
        <p className="text-suave mb-6">{x.sub}</p>
        <Suspense><Formulario idioma="ca" titulos={titulos} /></Suspense>
      </div>
    </Pagina>
  );
}
