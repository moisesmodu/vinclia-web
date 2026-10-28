"use client";
import { useState } from "react";

export default function AccionesCuenta({ idioma, puedeCancelar, textos }: { idioma: string; puedeCancelar: boolean; textos: { cancelar: string; canceladaOk: string; salir: string } }) {
  const [cancelada, setCancelada] = useState(false);
  return (
    <div className="space-y-2">
      {puedeCancelar && !cancelada ? (
        <button className="boton boton-borde w-full" onClick={async () => {
          const r = await fetch("/api/cuenta/cancelar", { method: "POST" });
          if (r.ok) setCancelada(true);
        }}>{textos.cancelar}</button>
      ) : null}
      {cancelada ? <p className="bg-ok-claro text-ok rounded-xl p-3">{textos.canceladaOk}</p> : null}
      <button className="enlace text-sm" onClick={async () => { await fetch("/api/salir", { method: "POST" }); window.location.href = `/${idioma}`; }}>{textos.salir}</button>
    </div>
  );
}
