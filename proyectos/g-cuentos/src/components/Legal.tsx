import { notFound } from "next/navigation";
import type { Idioma } from "@/lib/catalogo";
import { legal, sustituirLegal } from "@/lib/contenido";
import { Pagina } from "./Marco";

export function Legal({ idioma, doc }: { idioma: Idioma; doc: string }) {
  const d = legal(idioma).find((x) => x.slug === doc);
  if (!d) notFound();
  return (
    <Pagina idioma={idioma} alternativa={`${idioma === "ca" ? "" : "/ca"}/legal/${doc}`}>
      <article className="mx-auto max-w-3xl px-4 py-10 prosa">
        <h1 className="text-3xl mb-6">{d.titulo}</h1>
        {d.secciones.map((s) => (
          <section key={s.h2}><h2>{s.h2}</h2>{s.parrafos.map((p) => <p key={p}>{sustituirLegal(p)}</p>)}</section>
        ))}
        <p className="text-sm text-suave">{idioma === "ca" ? "Última actualització: 28 d'octubre de 2026." : "Última actualización: 28 de octubre de 2026."}</p>
      </article>
    </Pagina>
  );
}
