"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Idioma } from "@/lib/catalogo";
import type { CuentoMuestra } from "@/lib/muestras-contenido";

// Palabras que cambian en cada cuento: se resaltan para enseñar la personalización de verdad.
const RESALTE: Record<string, string[]> = {
  "leo-y-la-luz-de-la-luna": ["Leo", "Bigotes", "Zaragoza", "dinosaurios", "dinosaurio enorme de cuello largo", "diplodocus", "cúpulas del Pilar", "la oscuridad", "La oscuridad"],
  "la-martina-i-els-secrets-de-lleida": ["Martina", "Núvol", "Lleida", "mercat del Pla", "riu Segre", "Camps Elisis", "Seu Vella", "dibuixar", "preguntar", "les preguntes", "Les preguntes"],
};

function resaltar(texto: string, palabras: string[]) {
  const orden = [...palabras].sort((a, b) => b.length - a.length).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const partes = texto.split(new RegExp(`(${orden.join("|")})`, "g"));
  return partes.map((p, i) => (palabras.includes(p) ? <mark key={i} className="resalte">{p}</mark> : <span key={i}>{p}</span>));
}

export function DentroDelLibro({ idioma, cuentos }: { idioma: Idioma; cuentos: CuentoMuestra[] }) {
  const ca = idioma === "ca";
  const [activo, setActivo] = useState(0);
  const pista = useRef<HTMLDivElement>(null);
  const c = cuentos[activo];
  const mover = (dir: number) => {
    const el = pista.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="segmento segmento-claro" role="tablist" aria-label={ca ? "Conte de mostra" : "Cuento de muestra"}>
          {cuentos.map((x, i) => (
            <button key={x.slug} role="tab" aria-selected={i === activo} className={i === activo ? "activo" : ""}
              onClick={() => { setActivo(i); pista.current?.scrollTo({ left: 0 }); }}>
              {x.titulo}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flecha" onClick={() => mover(-1)} aria-label={ca ? "Pàgines anteriors" : "Páginas anteriores"}>‹</button>
          <button className="flecha" onClick={() => mover(1)} aria-label={ca ? "Pàgines següents" : "Páginas siguientes"}>›</button>
        </div>
      </div>
      <p className="text-sm text-suave mb-4">
        <mark className="resalte">{ca ? "Subratllat" : "Subrayado"}</mark>{" "}
        {ca ? "el que canvia en cada conte: nom, mascota, ciutat, afició i la por o el valor que tria la família." : "lo que cambia en cada cuento: nombre, mascota, ciudad, afición y el miedo o valor que elige la familia."}
      </p>
      <div ref={pista} className="pista" key={c.slug} lang={c.idioma}>
        {c.paginas.map((texto, i) => (
          <figure key={i} className="doble">
            <div className="doble-texto">
              <p>{resaltar(texto, RESALTE[c.slug] ?? [])}</p>
              <span className="doble-num">{4 + i * 2}</span>
            </div>
            <div className="doble-ilus">
              <Image src={`/muestras/${c.slug}/${String(i + 1).padStart(2, "0")}.webp`} alt="" width={1200} height={1200} sizes="(max-width: 768px) 45vw, 340px" loading={i < 2 ? "eager" : "lazy"} />
            </div>
          </figure>
        ))}
      </div>
      <p className="text-xs text-suave mt-3">{ca ? "Desplaça per veure les 12 dobles pàgines del conte sencer." : "Desliza para ver las 12 dobles páginas del cuento entero."}</p>
    </div>
  );
}
