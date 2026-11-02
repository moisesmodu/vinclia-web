import type { Metadata } from "next";
import Link from "next/link";
import { dicc, LOCALE_BCP47, NOMBRES_IDIOMA } from "@/lib/i18n";
import { IDIOMAS } from "@/lib/config";
import { preguntas } from "@/lib/contenido";

export async function generateMetadata({ params }: { params: Promise<{ idioma: string }> }): Promise<Metadata> {
  const { idioma } = await params;
  const d = dicc(idioma);
  const propias = preguntas(idioma).map((p) => p.pregunta);
  return {
    title: d.preguntas.titulo,
    description: (propias.length ? propias.slice(0, 3).join(" · ") : d.meta.descripcion).slice(0, 155),
    alternates: {
      canonical: `/${idioma}/preguntas`,
      languages: { ...Object.fromEntries(IDIOMAS.map((i) => [LOCALE_BCP47[i], `/${i}/preguntas`])), "x-default": "/es/preguntas" }
    }
  };
}

export default async function Preguntas({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  const propias = preguntas(idioma);
  const otras = preguntas().filter((p) => p.idioma !== idioma);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{d.preguntas.titulo}</h1>
      <ul className="grid gap-2">
        {propias.map((p) => (
          <li key={p.slug}><Link className="tarjeta tarjeta-enlace p-4 block font-medium" href={`/${idioma}/preguntas/${p.slug}`}>{p.pregunta}</Link></li>
        ))}
      </ul>
      {otras.length ? (
        <section>
          <h2 className="font-bold text-lg mb-2">{d.preguntas.masPreguntas}</h2>
          <ul className="space-y-1 text-sm">
            {otras.map((p) => (
              <li key={`${p.idioma}-${p.slug}`} lang={p.idioma}>
                <Link className="enlace" href={`/${p.idioma}/preguntas/${p.slug}`}>{p.pregunta}</Link> <span className="text-suave">· {NOMBRES_IDIOMA[p.idioma]}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
