import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dicc, fechaLarga } from "@/lib/i18n";
import { pregunta, preguntas, resumen } from "@/lib/contenido";
import { urlBase } from "@/lib/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return preguntas().map((p) => ({ idioma: p.idioma, slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ idioma: string; slug: string }> }): Promise<Metadata> {
  const { idioma, slug } = await params;
  const p = pregunta(idioma, slug);
  if (!p) return {};
  return { title: p.pregunta, description: p.descripcion, alternates: { canonical: `/${idioma}/preguntas/${slug}` } };
}

export default async function PaginaPregunta({ params }: { params: Promise<{ idioma: string; slug: string }> }) {
  const { idioma, slug } = await params;
  const p = pregunta(idioma, slug);
  if (!p) notFound();
  const d = dicc(idioma);
  const g = resumen(p.guia, idioma);
  const ld = [
    { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: idioma, dateModified: p.actualizado,
      mainEntity: [{ "@type": "Question", name: p.pregunta, acceptedAnswer: { "@type": "Answer", text: p.respuestaCorta } },
        ...p.faq.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } }))] },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: d.marca, item: `${urlBase()}/${idioma}` },
      { "@type": "ListItem", position: 2, name: d.nav.preguntas, item: `${urlBase()}/${idioma}/preguntas` },
      { "@type": "ListItem", position: 3, name: p.pregunta }] }
  ];
  const cta = (
    <Link href={`/${idioma}/guias/${p.guia}`} className="tarjeta p-4 border-2 border-marca flex items-center justify-between gap-3">
      <span><span className="block text-sm text-suave">{d.preguntas.guiaRelacionada}</span><strong>{g?.titulo}</strong></span>
      <span className="text-marca text-2xl rtl:rotate-180" aria-hidden>→</span>
    </Link>
  );
  return (
    <article className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="text-sm text-suave"><Link href={`/${idioma}/preguntas`}>← {d.nav.preguntas}</Link></nav>
      <header>
        <h1 className="text-3xl font-bold leading-tight">{p.pregunta}</h1>
        <p className="text-sm text-suave mt-2">{d.guia.actualizado} {fechaLarga(p.actualizado, idioma)}</p>
      </header>
      <section className="tarjeta p-5 bg-marca-claro border-marca-claro">
        <h2 className="font-bold mb-1">{d.preguntas.respuestaCorta}</h2>
        <p className="leading-relaxed">{p.respuestaCorta}</p>
      </section>
      {cta}
      {p.secciones.map((s, i) => (
        <section key={i}>
          <h2 className="text-xl font-bold mb-2">{s.titulo}</h2>
          {s.texto.split(/\n\n+/).map((par, j) => <p key={j} className="leading-relaxed mb-3">{par}</p>)}
        </section>
      ))}
      <section className="tarjeta p-5">
        {p.faq.map((f, i) => (
          <details key={i} className="py-2 border-b border-linea last:border-0">
            <summary className="font-semibold cursor-pointer">{f.p}</summary>
            <p className="mt-2 leading-relaxed">{f.r}</p>
          </details>
        ))}
      </section>
      {cta}
      <section className="text-sm">
        <h2 className="font-bold mb-2">{d.guia.fuentes}</h2>
        <ul className="space-y-1">
          {p.fuentes.map((f) => <li key={f.url}><a className="enlace break-words" href={f.url} target="_blank" rel="noopener noreferrer">{f.nombre}</a> <span className="text-suave">· {d.guia.consultado} {fechaLarga(f.consultado, idioma)}</span></li>)}
        </ul>
        <p className="text-suave mt-3">{d.aviso.largo}</p>
      </section>
    </article>
  );
}
