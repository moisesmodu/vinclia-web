"use client";
import Link from "next/link";
import { useState } from "react";

export default function PorDondeEmpiezo(props: {
  idioma: string;
  situaciones: Record<string, string>;
  orden: Record<string, string[]>;
  titulos: Record<string, string>;
  etiquetaOrden: string;
}) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-2" role="radiogroup">
        {Object.entries(props.situaciones).map(([k, texto]) => (
          <button
            key={k}
            role="radio"
            aria-checked={sel === k}
            onClick={() => setSel(k)}
            className={`text-start rounded-xl border-2 p-3 min-h-[56px] ${sel === k ? "border-marca bg-marca-claro" : "border-linea bg-white"}`}
          >
            {texto}
          </button>
        ))}
      </div>
      {sel ? (
        <div className="tarjeta p-4" aria-live="polite">
          <p className="font-semibold mb-2">{props.etiquetaOrden}</p>
          <ol className="space-y-2">
            {props.orden[sel].filter((s) => props.titulos[s]).map((s, i) => (
              <li key={s} className="flex gap-3 items-center">
                <span className="w-7 h-7 shrink-0 rounded-full bg-marca text-white grid place-items-center text-sm font-bold">{i + 1}</span>
                <Link className="enlace" href={`/${props.idioma}/guias/${s}`}>{props.titulos[s]}</Link>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
