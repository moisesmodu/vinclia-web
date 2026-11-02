"use client";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

type Plan = { id: "suscripcion" | "pack"; titulo: string; precio: string; periodo: string; iva: string; nota: string; texto: string; destacado?: boolean };
type Textos = { eligePlan: string; pagar: string; desistimiento: string; condiciones: string; marcaCasillas: string; errorPago: string; enlaceCondiciones: string };

// Un solo flujo: elegir plan → marcar el consentimiento de contenido digital (art. 103.m TRLGDCU) → un botón de pago.
// Antes había dos botones «Pagar» y las casillas encima de ambos: el error solo aparecía tras pulsar.
export default function BotonesPago({ idioma, planes, textos }: { idioma: string; planes: Plan[]; textos: Textos }) {
  const [plan, setPlan] = useState<Plan["id"]>(planes.find((p) => p.destacado)?.id ?? planes[0].id);
  // ?plan=pack|suscripcion (viene del aviso de recuperación): se preselecciona el plan que se quedó a medias.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("plan");
    if (q === "pack" || q === "suscripcion") setPlan(q);
  }, []);
  const [desist, setDesist] = useState(false);
  const [cond, setCond] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const elegido = planes.find((p) => p.id === plan)!;

  async function pagar() {
    if (!desist || !cond) { setError(textos.marcaCasillas); return; }
    setError(""); setCargando(true);
    const r = await fetch("/api/checkout", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan, idioma, desistimiento: desist, condiciones: cond })
    }).catch(() => null);
    const j = r?.ok ? await r.json() : null;
    if (j?.url) {
      try { localStorage.setItem("nee-pago-pendiente", JSON.stringify({ plan, ts: Date.now() })); } catch {}
      track("checkout_iniciado", { plan, idioma });
      (window as unknown as { plausible?: (e: string, o?: object) => void }).plausible?.("checkout", { props: { plan } });
      window.location.href = j.url;
    } else { setError(textos.errorPago); setCargando(false); }
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="font-bold text-lg mb-3">{textos.eligePlan}</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          {planes.map((p) => {
            const activo = p.id === plan;
            return (
              <label key={p.id} className={`tarjeta p-5 flex flex-col cursor-pointer transition-colors ${activo ? "border-2 border-marca bg-marca-claro/40" : "border-2 hover:border-marca"}`}>
                <span className="flex items-start justify-between gap-3">
                  <span className="font-bold text-lg">{p.titulo}</span>
                  <input type="radio" name="plan" value={p.id} checked={activo} onChange={() => setPlan(p.id)} className="w-5 h-5 mt-1 accent-[var(--marca-oscuro)]" />
                </span>
                <span className="mt-1 cifras"><span className="text-3xl font-bold">{p.precio}</span> <span className="text-suave">/ {p.periodo}</span></span>
                <span className="text-sm text-suave">{p.iva}</span>
                <span className="text-sm mt-3 flex-1">{p.texto}</span>
                <span className="text-sm font-semibold text-ok mt-3">✓ {p.nota}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-3 text-sm tarjeta p-4" aria-describedby={error ? "error-pago" : undefined}>
        <label className="flex gap-3 items-start"><input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-[var(--marca-oscuro)]" checked={desist} onChange={(e) => { setDesist(e.target.checked); setError(""); }} /><span>{textos.desistimiento}</span></label>
        <label className="flex gap-3 items-start"><input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-[var(--marca-oscuro)]" checked={cond} onChange={(e) => { setCond(e.target.checked); setError(""); }} /><span><a className="enlace" href={textos.enlaceCondiciones} target="_blank" rel="noopener">{textos.condiciones}</a></span></label>
      </div>

      <button type="button" onClick={pagar} disabled={cargando} className="boton boton-marca w-full text-lg cifras">
        {cargando ? "…" : `${textos.pagar} · ${elegido.precio}`}
      </button>
      {error ? <p id="error-pago" role="alert" className="text-marca-oscuro font-medium">{error}</p> : null}
    </div>
  );
}
