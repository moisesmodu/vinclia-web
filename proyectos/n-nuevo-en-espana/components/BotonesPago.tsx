"use client";
import { useState } from "react";

type Plan = { id: "suscripcion" | "pack"; titulo: string; precio: string; texto: string; destacado?: boolean };
type Textos = { pagar: string; desistimiento: string; condiciones: string; marcaCasillas: string; errorPago: string; enlaceCondiciones: string };

export default function BotonesPago({ idioma, planes, textos }: { idioma: string; planes: Plan[]; textos: Textos }) {
  const [desist, setDesist] = useState(false);
  const [cond, setCond] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState<string | null>(null);

  async function pagar(plan: string) {
    if (!desist || !cond) { setError(textos.marcaCasillas); return; }
    setError(""); setCargando(plan);
    const r = await fetch("/api/checkout", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan, idioma, desistimiento: desist, condiciones: cond })
    }).catch(() => null);
    const j = r?.ok ? await r.json() : null;
    if (j?.url) window.location.href = j.url;
    else { setError(textos.errorPago); setCargando(null); }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-sm">
        <label className="flex gap-3 items-start"><input type="checkbox" className="mt-1 w-5 h-5 shrink-0" checked={desist} onChange={(e) => setDesist(e.target.checked)} /><span>{textos.desistimiento}</span></label>
        <label className="flex gap-3 items-start"><input type="checkbox" className="mt-1 w-5 h-5 shrink-0" checked={cond} onChange={(e) => setCond(e.target.checked)} /><span><a className="enlace" href={textos.enlaceCondiciones} target="_blank">{textos.condiciones}</a></span></label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {planes.map((p) => (
          <div key={p.id} className={`tarjeta p-5 flex flex-col ${p.destacado ? "border-2 border-marca" : ""}`}>
            <h2 className="font-bold text-lg">{p.titulo}</h2>
            <p className="text-2xl font-bold mt-1">{p.precio}</p>
            <p className="text-sm text-suave mt-2 flex-1">{p.texto}</p>
            <button onClick={() => pagar(p.id)} disabled={cargando !== null} className="boton boton-marca mt-4 w-full">
              {cargando === p.id ? "…" : textos.pagar}
            </button>
          </div>
        ))}
      </div>
      {error ? <p role="alert" className="text-marca-oscuro font-medium">{error}</p> : null}
    </div>
  );
}
