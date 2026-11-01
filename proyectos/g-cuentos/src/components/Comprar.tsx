"use client";

import Image from "next/image";
import { useState } from "react";
import type { Idioma } from "@/lib/catalogo";
import { t } from "@/i18n/textos";

export function Comprar({ idioma, pedidoId, precios, textos, aviso }: { idioma: Idioma; pedidoId: string; precios: { pdf: string; tapaDura: string }; textos: { envio: string }; aviso?: string }) {
  const x = t(idioma);
  const [formato, setFormato] = useState<"pdf" | "tapaDura">("tapaDura");
  const [email, setEmail] = useState("");
  const [recordatorio, setRecordatorio] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  async function pagar() {
    setCargando(true);
    setError("");
    const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pedidoId, formato, email, recordatorio, idiomaWeb: idioma }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) { setError(j.error ?? "error"); setCargando(false); return; }
    window.location.href = j.url;
  }
  const opcion = (f: "pdf" | "tapaDura", titulo: string, precio: string, nota: string, img: string) => (
    <label className={`formato has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[#F5C84C] ${formato === f ? "activo" : ""}`}>
      <input type="radio" name="formato" className="sr-only" checked={formato === f} onChange={() => setFormato(f)} />
      <Image src={img} alt="" width={128} height={128} sizes="64px" className="formato-img" />
      <span className="min-w-0">
        <span className="block font-bold text-noche leading-tight">{titulo}</span>
        <span className="block titulo text-2xl mt-0.5">{precio}</span>
        <span className="block text-sm text-suave mt-1">{nota}</span>
      </span>
      <span className="formato-check" aria-hidden />
    </label>
  );
  return (
    <div className="tarjeta p-5 sm:p-6 space-y-4 scroll-mt-24" id="comprar">
      <h2 className="text-3xl">{x.vista.elige}</h2>
      {aviso && <p className="text-sm font-bold text-[#FFF8EC] rounded-2xl bg-[#1B2444] px-4 py-3 flex gap-2.5 items-start"><span className="text-[#F5C84C] text-base leading-none mt-0.5" aria-hidden>☾</span><span>{aviso}</span></p>}
      {opcion("tapaDura", x.precios.tapaDura, precios.tapaDura, `${idioma === "ca" ? "20 × 20 cm · 30 pàgines" : "20 × 20 cm · 30 páginas"} · ${textos.envio}. ${x.vista.libroIncluyePdf}`, "/marca/libro-tapa-dura.webp")}
      {opcion("pdf", x.precios.pdf, precios.pdf, x.precios.entrega, "/marca/libro-pdf.webp")}
      <label className="block"><span className="etiqueta">{x.vista.email}</span>
        <input type="email" className="campo" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
      </label>
      <label className="flex gap-2 items-start text-sm text-suave cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-[#2B3A67]" checked={recordatorio} onChange={(e) => setRecordatorio(e.target.checked)} />
        <span>{idioma === "ca" ? "Si no acabo la compra, recorda-m'ho una sola vegada per correu." : "Si no termino la compra, recuérdamelo una sola vez por correo."}</span>
      </label>
      {error && <p className="text-primario-osc font-bold" role="alert">{error}</p>}
      <button className="boton-luna w-full text-lg disabled:opacity-60" onClick={pagar} disabled={cargando}>{x.vista.pagar} · {formato === "pdf" ? precios.pdf : precios.tapaDura}</button>
      <p className="text-xs text-suave text-center">{x.precio.iva} · {x.precio.unico}</p>
      <p className="text-xs text-suave text-center">{x.garantia}</p>
    </div>
  );
}
