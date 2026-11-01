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
        <h1 className="text-[2.2rem] sm:text-5xl mb-2">{x.titulo}</h1>
        <p className="text-suave text-lg mb-8 max-w-2xl">{x.sub}</p>
        <Suspense><Formulario idioma="ca" titulos={titulos} /></Suspense>
      </div>
    </Pagina>
  );
}
