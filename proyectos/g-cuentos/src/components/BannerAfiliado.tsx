"use client";

import { useEffect, useState } from "react";

// Aviso de la cookie de afiliación: solo aparece si se llega con ?ref=código.
export function BannerAfiliado({ idioma }: { idioma: "es" | "ca" }) {
  const [codigo, setCodigo] = useState<string | null>(null);
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[a-z0-9]{3,20}$/.test(ref)) setCodigo(ref);
  }, []);
  if (!codigo) return null;
  const cerrar = () => {
    setCodigo(null);
    const u = new URL(window.location.href);
    u.searchParams.delete("ref");
    window.history.replaceState(null, "", u.toString());
  };
  const aceptar = async () => {
    await fetch("/api/afiliados/aceptar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ codigo }) }).catch(() => null);
    cerrar();
  };
  const ca = idioma === "ca";
  return (
    <div role="dialog" aria-live="polite" className="fixed bottom-3 inset-x-3 z-30 mx-auto max-w-xl tarjeta p-4 text-sm flex flex-col sm:flex-row gap-3 sm:items-center">
      <p className="flex-1">
        {ca
          ? "Arribes per la recomanació d'una col·laboradora. Ens deixes guardar una galeta 30 dies per atribuir-li la venda?"
          : "Llegas por la recomendación de una colaboradora. ¿Nos dejas guardar una cookie 30 días para atribuirle la venta?"}{" "}
        <a href={ca ? "/ca/legal/cookies" : "/legal/cookies"} className="underline">{ca ? "Més info" : "Más info"}</a>
      </p>
      <div className="flex gap-2">
        <button onClick={cerrar} className="boton-sec !min-h-0 !py-2">{ca ? "No" : "No"}</button>
        <button onClick={aceptar} className="boton !min-h-0 !py-2">{ca ? "D'acord" : "Vale"}</button>
      </div>
    </div>
  );
}
