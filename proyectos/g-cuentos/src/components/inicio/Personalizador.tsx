"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Idioma } from "@/lib/catalogo";
import { articuloCa } from "@/lib/rellenar";

// Portada en vivo: el título se recompone con lo que escribe la familia. Usa las dos portadas reales
// de las muestras (niño · Dormir, niña · Mi ciudad).
const PORTADAS = {
  m: { img: "/muestras/leo-y-la-luz-de-la-luna/00.webp", coleccion: "dormir", def: "Leo" },
  f: { img: "/muestras/la-martina-i-els-secrets-de-lleida/00.webp", coleccion: "ciudad", def: "Martina" },
} as const;

function titulo(nombre: string, genero: "m" | "f", ciudad: string, idioma: Idioma) {
  const n = nombre.trim() || PORTADAS[genero].def;
  const c = ciudad.trim() || (idioma === "ca" ? "la teva ciutat" : "tu ciudad");
  if (idioma === "ca") {
    const art = articuloCa(n, genero);
    const El = art[0].toUpperCase() + art.slice(1);
    const de = /^[aeiouàèéíòóú]/i.test(c) ? `d'${c}` : `de ${c}`;
    return genero === "m" ? `${El} i la llum de la lluna` : `${El} i els secrets ${de}`;
  }
  return genero === "m" ? `${n} y la luz de la luna` : `${n} y los secretos de ${c}`;
}

export function Personalizador({ idioma }: { idioma: Idioma }) {
  const ca = idioma === "ca";
  const [nombre, setNombre] = useState("");
  const [genero, setGenero] = useState<"m" | "f">("m");
  const [ciudad, setCiudad] = useState("");
  const t = useMemo(() => titulo(nombre, genero, ciudad, idioma), [nombre, genero, ciudad, idioma]);
  const p = PORTADAS[genero];
  const destino = `${ca ? "/ca" : ""}/crear?${new URLSearchParams({
    coleccion: p.coleccion, genero, ...(nombre.trim() ? { nombre: nombre.trim() } : {}), ...(ciudad.trim() ? { ciudad: ciudad.trim() } : {}),
  }).toString()}`;
  const nombreVisible = nombre.trim() || p.def;

  return (
    <div className="personalizador">
      <div className="libro3d" aria-live="polite">
        <div className="libro3d-tapa">
          <Image src={p.img} alt={t} width={900} height={900} priority sizes="(max-width: 768px) 80vw, 420px" />
          <div className="libro3d-titulo">
            <span key={t} className="libro3d-texto">{t}</span>
            <span className="libro3d-marca">{ca ? "Un conte de Lunilla" : "Un cuento de Lunilla"}</span>
          </div>
        </div>
        <div className="libro3d-lomo" aria-hidden />
        <div className="libro3d-paginas" aria-hidden />
      </div>

      <form className="personalizador-form" onSubmit={(e) => { e.preventDefault(); window.location.href = destino; }}>
        <label htmlFor="p-nombre" className="sr-only">{ca ? "Nom" : "Nombre"}</label>
        <input id="p-nombre" className="campo-noche" placeholder={ca ? "Escriu el seu nom" : "Escribe su nombre"} maxLength={24}
          value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
        <div className="flex gap-2">
          <div className="segmento" role="radiogroup" aria-label={ca ? "Protagonista" : "Protagonista"}>
            {(["m", "f"] as const).map((g) => (
              <button key={g} type="button" role="radio" aria-checked={genero === g} onClick={() => setGenero(g)} className={genero === g ? "activo" : ""}>
                {g === "m" ? (ca ? "Nen" : "Niño") : ca ? "Nena" : "Niña"}
              </button>
            ))}
          </div>
          <label htmlFor="p-ciudad" className="sr-only">{ca ? "Ciutat" : "Ciudad"}</label>
          <input id="p-ciudad" className="campo-noche flex-1 min-w-0" placeholder={ca ? "Ciutat o poble" : "Ciudad o pueblo"} maxLength={40}
            value={ciudad} onChange={(e) => setCiudad(e.target.value)} autoComplete="off" />
        </div>
        <button className="boton-luna w-full text-lg" type="submit">
          {ca ? `Crear el conte ${nombre.trim() ? `de ${nombreVisible}` : ""} gratis` : `Crear el cuento ${nombre.trim() ? `de ${nombreVisible}` : ""} gratis`}
        </button>
        <p className="text-xs opacity-80 text-center">
          {ca ? "Portada d'exemple. Al conte hi surten també la seva mascota, la seva ciutat i el que li agrada." : "Portada de ejemplo. En su cuento salen también su mascota, su ciudad y lo que le gusta."}
        </p>
      </form>
    </div>
  );
}
