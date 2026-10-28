import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IDIOMAS, config } from "@/lib/config";
import { dicc } from "@/lib/i18n";

const DOCS = ["aviso-legal", "privacidad", "cookies", "condiciones"];
type Doc = { titulo: string; secciones: { titulo: string; parrafos: string[] }[] };

function cargar(doc: string): Doc | null {
  if (!DOCS.includes(doc)) return null;
  const crudo = fs.readFileSync(path.join(process.cwd(), "content", "legal", `${doc}.json`), "utf8")
    .replaceAll("{titular}", config.titular.nombre).replaceAll("{nif}", config.titular.nif)
    .replaceAll("{domicilio}", config.titular.domicilio).replaceAll("{correo}", config.titular.correo);
  return JSON.parse(crudo);
}

export function generateStaticParams() {
  return IDIOMAS.flatMap((idioma) => DOCS.map((doc) => ({ idioma, doc })));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const d = cargar((await params).doc);
  return d ? { title: d.titulo } : {};
}

// Los textos legales vinculantes están en castellano; en los demás idiomas se muestra el aviso traducido arriba.
export default async function Legal({ params }: { params: Promise<{ idioma: string; doc: string }> }) {
  const { idioma, doc } = await params;
  const d = cargar(doc);
  if (!d) notFound();
  const dic = dicc(idioma);
  return (
    <article className="space-y-5" lang="es">
      {idioma !== "es" ? <p className="bg-aviso-claro rounded-xl p-3 text-sm" lang={idioma}>{dic.aviso.largo}</p> : null}
      <h1 className="text-3xl font-bold">{d.titulo}</h1>
      {d.secciones.map((s) => (
        <section key={s.titulo}>
          <h2 className="text-lg font-bold mb-2">{s.titulo}</h2>
          {s.parrafos.map((p, i) => <p key={i} className="leading-relaxed mb-2">{p}</p>)}
        </section>
      ))}
      <p className="text-sm text-suave">Última actualización: 28 de octubre de 2026.</p>
    </article>
  );
}
