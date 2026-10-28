import type { Metadata } from "next";
import Link from "next/link";
import { dicc, NOMBRES_IDIOMA } from "@/lib/i18n";
import { preguntas } from "@/lib/contenido";

export async function generateMetadata({ params }: { params: Promise<{ idioma: string }> }): Promise<Metadata> {
  const { idioma } = await params;
  return { title: dicc(idioma).preguntas.titulo, alternates: { canonical: `/${idioma}/preguntas` } };
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
          <li key={p.slug}><Link className="tarjeta p-4 block font-medium" href={`/${idioma}/preguntas/${p.slug}`}>{p.pregunta}</Link></li>
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
