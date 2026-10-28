"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Idioma } from "@/lib/catalogo";

const C = {
  es: { titulo: "Lee y retoca todo su cuento", sub: "Cambia lo que quieras: un apodo, una frase de casa, el nombre de la abuela. Las ilustraciones siguen la historia, así que mejor no cambiar lo que pasa en cada página.", pagina: "Página", guardar: "Guardar cambios", guardado: "Guardado ✓", tituloL: "Título", dedicatoria: "Dedicatoria", error: "No se ha podido guardar", abrir: "Leer y retocar las {n} páginas", cerrar: "Cerrar el editor" },
  ca: { titulo: "Llegeix i retoca tot el seu conte", sub: "Canvia el que vulguis: un sobrenom, una frase de casa, el nom de l'àvia. Les il·lustracions segueixen la història, així que millor no canviar el que passa a cada pàgina.", pagina: "Pàgina", guardar: "Desar els canvis", guardado: "Desat ✓", tituloL: "Títol", dedicatoria: "Dedicatòria", error: "No s'ha pogut desar", abrir: "Llegir i retocar les {n} pàgines", cerrar: "Tancar l'editor" },
};

export function EditorCuento({ id, idioma, titulo, dedicatoria, paginas, max }: { id: string; idioma: Idioma; titulo: string; dedicatoria: string; paginas: string[]; max: number }) {
  const k = C[idioma];
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [t, setT] = useState(titulo);
  const [d, setD] = useState(dedicatoria);
  const [p, setP] = useState(paginas);
  const [estado, setEstado] = useState<"" | "guardando" | "ok" | string>("");
  const cambiado = t !== titulo || d !== dedicatoria || p.some((x, i) => x !== paginas[i]);

  async function guardar() {
    setEstado("guardando");
    const r = await fetch(`/api/cuentos/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ titulo: t, dedicatoria: d, paginas: p }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setEstado(`${k.error}: ${j.error ?? r.status}`);
    setEstado("ok");
    router.refresh();
  }

  if (!abierto)
    return (
      <button type="button" onClick={() => setAbierto(true)} className="tarjeta w-full p-5 text-left flex items-center gap-4 hover:border-luna border-2 border-transparent transition">
        <span className="text-3xl" aria-hidden>✎</span>
        <span><b className="text-noche text-lg">{k.abrir.replace("{n}", String(paginas.length))}</b><span className="block text-sm text-suave">{k.sub}</span></span>
      </button>
    );

  return (
    <section className="tarjeta p-5 sm:p-7 space-y-4" aria-labelledby="editor-t">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="editor-t" className="text-2xl">{k.titulo}</h2><p className="text-sm text-suave">{k.sub}</p></div>
        <button type="button" className="text-sm underline text-suave flex-none" onClick={() => setAbierto(false)}>{k.cerrar}</button>
      </div>
      <label className="block"><span className="etiqueta">{k.tituloL}</span><input className="campo" maxLength={80} value={t} onChange={(e) => setT(e.target.value)} /></label>
      <label className="block"><span className="etiqueta">{k.dedicatoria}</span><textarea className="editor-pagina" maxLength={240} value={d} onChange={(e) => setD(e.target.value)} /></label>
      <ol className="space-y-3">
        {p.map((x, i) => (
          <li key={i}>
            <label className="block">
              <span className="etiqueta !flex justify-between gap-4"><span>{k.pagina} {i + 1}</span><span className={`text-xs ${x.length > max ? "text-primario-osc" : "text-suave font-normal"}`}>{x.length}/{max}</span></span>
              <textarea className="editor-pagina" maxLength={max} value={x} onChange={(e) => setP((o) => o.map((y, j) => (j === i ? e.target.value : y)))} />
            </label>
          </li>
        ))}
      </ol>
      <div className="sticky bottom-3 flex items-center gap-3 bg-crema/95 rounded-full p-1.5 shadow">
        <button type="button" className="boton flex-1" disabled={!cambiado || estado === "guardando"} onClick={guardar}>{estado === "ok" && !cambiado ? k.guardado : k.guardar}</button>
        {estado && estado !== "ok" && estado !== "guardando" && <p role="alert" className="text-sm text-primario-osc px-2">{estado}</p>}
      </div>
    </section>
  );
}
