"use client";

import { useState } from "react";

export function FormAfiliada({ idioma }: { idioma: "es" | "ca" }) {
  const ca = idioma === "ca";
  const [res, setRes] = useState<{ enlace?: string; panel?: string; reenviado?: boolean; error?: string } | null>(null);
  const [cargando, setCargando] = useState(false);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    const datos = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch("/api/afiliados", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(datos) });
    setRes(await r.json().catch(() => ({ error: "error" })));
    setCargando(false);
  }
  if (res?.enlace)
    return (
      <div className="tarjeta p-6 space-y-3">
        <p className="font-bold text-noche">{ca ? "Ja hi ets! El teu enllaç:" : "¡Ya estás dentro! Tu enlace:"}</p>
        <p className="font-mono bg-white rounded-lg p-3 break-all">{res.enlace}</p>
        <a href={res.panel} className="boton">{ca ? "Anar al meu panell" : "Ir a mi panel"}</a>
        <p className="text-sm text-suave">{ca ? "T'ho hem enviat també per correu." : "Te lo hemos enviado también por correo."}</p>
      </div>
    );
  if (res?.reenviado) return <p className="tarjeta p-6">{ca ? "Ja estaves registrada: t'hem reenviat l'accés per correu." : "Ya estabas registrada: te hemos reenviado el acceso por correo."}</p>;
  return (
    <form onSubmit={enviar} className="tarjeta p-6 space-y-4">
      <label className="block"><span className="etiqueta">{ca ? "Nom" : "Nombre"}</span><input name="nombre" required className="campo" /></label>
      <label className="block"><span className="etiqueta">{ca ? "Correu" : "Correo"}</span><input name="email" type="email" required className="campo" /></label>
      <label className="block"><span className="etiqueta">{ca ? "El teu compte (Instagram, TikTok, blog…)" : "Tu cuenta (Instagram, TikTok, blog…)"}</span><input name="redSocial" required className="campo" placeholder="@" /></label>
      <label className="block"><span className="etiqueta">{ca ? "Seguidors (aprox.)" : "Seguidores (aprox.)"}</span><input name="seguidores" className="campo" /></label>
      <input name="web" className="hidden" tabIndex={-1} autoComplete="off" />
      <label className="flex gap-2 items-start text-sm"><input type="checkbox" name="acepto" required className="mt-1" />
        <span>{ca ? "Accepto les condicions del programa i la política de privacitat." : "Acepto las condiciones del programa y la política de privacidad."}</span></label>
      {res?.error && <p className="text-terracota-osc font-bold">{res.error}</p>}
      <button className="boton w-full" disabled={cargando}>{ca ? "Vull el meu enllaç" : "Quiero mi enlace"}</button>
    </form>
  );
}
