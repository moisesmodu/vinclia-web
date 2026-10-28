"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Idioma } from "@/lib/catalogo";
import type { Aspecto } from "@/lib/rellenar";
import { Avatar } from "../Avatar";

// «Tú decides cómo es»: el avatar cambia solo (o al tocarlo) para enseñar lo que se elige.
const VARIANTES: { a: Aspecto; g: "m" | "f"; c: string }[] = [
  { a: { piel: "media", pelo: "castano", peinado: "rizado", gafas: false, pecas: true }, g: "m", c: "azul" },
  { a: { piel: "morena", pelo: "negro", peinado: "coletas", gafas: false, pecas: false }, g: "f", c: "rojo" },
  { a: { piel: "clara", pelo: "pelirrojo", peinado: "largo", gafas: true, pecas: true }, g: "f", c: "verde" },
  { a: { piel: "oscura", pelo: "negro", peinado: "corto", gafas: false, pecas: false }, g: "m", c: "amarillo" },
  { a: { piel: "clara", pelo: "rubio", peinado: "corto", gafas: true, pecas: false }, g: "m", c: "morado" },
  { a: { piel: "media", pelo: "castano", peinado: "largo", gafas: false, pecas: true }, g: "f", c: "turquesa" },
];

const C = {
  es: {
    ojo: "Tú decides", titulo: "Diseña a su protagonista y su mundo",
    sub: "Nada de fotos del niño: tú eliges cómo es y el taller lo pinta igual en todas las páginas.",
    lista: [["Su aspecto", "Piel, pelo, peinado, gafas y pecas"], ["Su color favorito", "Lo lleva puesto en todo el cuento"], ["Su gente", "Quién le da las buenas noches y su mejor amigo"], ["Algo solo suyo", "Una manía, una palabra, un sueño: Lunilla lo teje en la historia"], ["Su texto", "Antes de pagar, lees y retocas cada página"]],
    cta: "Diseñar a su protagonista",
  },
  ca: {
    ojo: "Tu decideixes", titulo: "Dissenya el seu protagonista i el seu món",
    sub: "Res de fotos de l'infant: tu tries com és i el taller el pinta igual a totes les pàgines.",
    lista: [["El seu aspecte", "Pell, cabells, pentinat, ulleres i pigues"], ["El seu color preferit", "El porta posat a tot el conte"], ["La seva gent", "Qui li dona la bona nit i el seu millor amic"], ["Alguna cosa només seva", "Una mania, una paraula, un somni: la Lunilla ho teixeix a la història"], ["El seu text", "Abans de pagar, llegeixes i retoques cada pàgina"]],
    cta: "Dissenyar el seu protagonista",
  },
};

export function TuDecides({ idioma }: { idioma: Idioma }) {
  const k = C[idioma];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % VARIANTES.length), 2200);
    return () => clearInterval(t);
  }, []);
  const v = VARIANTES[i];
  return (
    <section className="cielo envoltura">
      <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center pt-16 pb-24 relative z-[1]">
        <button type="button" onClick={() => setI((i + 1) % VARIANTES.length)} className="mx-auto grid place-items-center rounded-full bg-crema/10 ring-8 ring-crema/5 w-72 h-72 sm:w-80 sm:h-80 avatar-baile" aria-label={k.titulo}>
          <Avatar aspecto={v.a} genero={v.g} color={v.c} tam={220} />
        </button>
        <div>
          <p className="ojo mb-2">{k.ojo}</p>
          <h2 className="text-3xl sm:text-5xl mb-3">{k.titulo}</h2>
          <p className="opacity-85 mb-7 max-w-xl">{k.sub}</p>
          <ul className="grid gap-4 sm:grid-cols-2 mb-8">
            {k.lista.map(([h, d]) => (
              <li key={h} className="rounded-2xl bg-crema/10 p-4"><b className="acento block">{h}</b><span className="text-sm opacity-85">{d}</span></li>
            ))}
          </ul>
          <Link href={`${idioma === "ca" ? "/ca" : ""}/crear`} className="boton-luna text-lg">{k.cta}</Link>
        </div>
      </div>
    </section>
  );
}
