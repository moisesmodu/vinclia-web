"use client";

import { useState } from "react";
import type { Idioma } from "@/lib/catalogo";
import { pref } from "@/i18n/textos";

// Pasarela de prueba local (solo sin claves de Stripe). Dispara el webhook firmado.
export function PagoSimulado({ idioma, pedidoId, sessionId, formato, importe }: { idioma: Idioma; pedidoId: string; sessionId: string; formato: "pdf" | "tapaDura"; importe: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  async function pagar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch("/api/simulador/pagar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, pedidoId, sessionId, formato }) });
    if (!r.ok) { setError(JSON.stringify(await r.json().catch(() => ({})))); setCargando(false); return; }
    window.location.href = `${pref(idioma)}/pedido/${pedidoId}?ok=1`;
  }
  return (
    <form onSubmit={pagar} className="tarjeta p-6 space-y-4 max-w-md mx-auto">
      <p className="rounded-xl bg-[#fff4d6] p-3 text-sm"><b>Modo de prueba.</b> Pasarela simulada: no se cobra nada. Con claves de Stripe esta pantalla es Stripe Checkout.</p>
      <p className="titulo text-3xl">{importe}</p>
      <label className="block"><span className="etiqueta">Correo</span><input name="email" type="email" required className="campo" defaultValue="prueba@example.com" /></label>
      <label className="block"><span className="etiqueta">Nombre</span><input name="nombre" required className="campo" defaultValue="Cliente de Prueba" /></label>
      {formato === "tapaDura" && (
        <>
          <label className="block"><span className="etiqueta">Dirección</span><input name="linea1" required className="campo" defaultValue="Plaça de la Paeria 1" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="etiqueta">Ciudad</span><input name="ciudad" required className="campo" defaultValue="Lleida" /></label>
            <label><span className="etiqueta">Código postal</span><input name="cp" required pattern="\d{5}" className="campo" defaultValue="25007" /></label>
          </div>
          <label className="block"><span className="etiqueta">Teléfono</span><input name="telefono" className="campo" defaultValue="600000000" /></label>
        </>
      )}
      <p className="text-sm text-suave">Tarjeta de prueba: 4242 4242 4242 4242 (no se pide aquí).</p>
      {error && <p className="text-terracota-osc text-sm break-all">{error}</p>}
      <button className="boton w-full" disabled={cargando}>{cargando ? "Procesando…" : `Pagar ${importe} (prueba)`}</button>
    </form>
  );
}
