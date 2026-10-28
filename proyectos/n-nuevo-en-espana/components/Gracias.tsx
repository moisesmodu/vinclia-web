"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type T = { graciasTitulo: string; graciasTexto: string; comprobando: string; pagoNoConfirmado: string };

export default function Gracias({ idioma, textos, irGuias }: { idioma: string; textos: T; irGuias: string }) {
  const [estado, setEstado] = useState<"comprobando" | "ok" | "pendiente">("comprobando");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session_id");
    if (!id) { setEstado("pendiente"); return; }
    let intentos = 0;
    const probar = () =>
      fetch(`/api/acceso/stripe?session_id=${encodeURIComponent(id)}`).then((r) => {
        if (r.ok) {
          setEstado("ok");
          try { localStorage.removeItem("nee-pago-pendiente"); } catch {}
          (window as unknown as { plausible?: (e: string) => void }).plausible?.("pago");
        }
        else if (++intentos < 5) setTimeout(probar, 2000);
        else setEstado("pendiente");
      }).catch(() => setEstado("pendiente"));
    probar();
  }, []);
  return (
    <div className="tarjeta p-6 text-center space-y-3">
      {estado === "comprobando" ? <p>{textos.comprobando}</p> : null}
      {estado === "ok" ? (
        <>
          <div className="text-5xl" aria-hidden>🎉</div>
          <h1 className="text-2xl font-bold">{textos.graciasTitulo}</h1>
          <p className="text-suave">{textos.graciasTexto}</p>
          <Link href={`/${idioma}#guias`} className="boton boton-marca">{irGuias}</Link>
        </>
      ) : null}
      {estado === "pendiente" ? <p>{textos.pagoNoConfirmado}</p> : null}
    </div>
  );
}
