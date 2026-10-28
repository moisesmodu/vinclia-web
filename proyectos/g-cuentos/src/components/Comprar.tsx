"use client";

import { useState } from "react";
import type { Idioma } from "@/lib/catalogo";
import { t } from "@/i18n/textos";

export function Comprar({ idioma, pedidoId, precios, textos }: { idioma: Idioma; pedidoId: string; precios: { pdf: string; tapaDura: string }; textos: { envio: string } }) {
  const x = t(idioma);
  const [formato, setFormato] = useState<"pdf" | "tapaDura">("tapaDura");
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  async function pagar() {
    setCargando(true);
    setError("");
    const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pedidoId, formato, email, idiomaWeb: idioma }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) { setError(j.error ?? "error"); setCargando(false); return; }
    window.location.href = j.url;
  }
  const opcion = (f: "pdf" | "tapaDura", titulo: string, precio: string, nota: string) => (
    <label className={`block rounded-2xl border-2 p-4 cursor-pointer ${formato === f ? "border-terracota bg-[#fdf0e6]" : "border-[#e2d6c1] bg-white"}`}>
      <input type="radio" name="formato" className="sr-only" checked={formato === f} onChange={() => setFormato(f)} />
      <span className="flex justify-between items-baseline gap-2"><span className="font-bold text-noche">{titulo}</span><span className="titulo text-2xl">{precio}</span></span>
      <span className="block text-sm text-suave mt-1">{nota}</span>
    </label>
  );
  return (
    <div className="tarjeta p-5 sm:p-6 space-y-4" id="comprar">
      <h2 className="text-2xl">{x.vista.elige}</h2>
      {opcion("tapaDura", x.precios.tapaDura, precios.tapaDura, `${textos.envio}. ${x.vista.libroIncluyePdf}`)}
      {opcion("pdf", x.precios.pdf, precios.pdf, x.precios.entrega)}
      <label className="block"><span className="etiqueta">{x.vista.email}</span>
        <input type="email" className="campo" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
      </label>
      {error && <p className="text-terracota-osc font-bold" role="alert">{error}</p>}
      <button className="boton w-full text-lg" onClick={pagar} disabled={cargando}>{x.vista.pagar} · {formato === "pdf" ? precios.pdf : precios.tapaDura}</button>
      <p className="text-xs text-suave text-center">{x.garantia}</p>
    </div>
  );
}
