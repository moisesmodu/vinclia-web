"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Recuperación (SESIONES.md, «Monetizar primero»): quien abrió el pago y no lo terminó ve UN aviso, una sola vez,
// con el mismo plan. Todo en el navegador (localStorage): sin correos comerciales sin consentimiento.
export const CLAVE_PENDIENTE = "nee-pago-pendiente";
const CLAVE_MOSTRADO = "nee-recuperacion-mostrada";

export default function AvisoRecuperacion({ idioma, textos }: { idioma: string; textos: { texto: string; boton: string; cerrar: string } }) {
  const ruta = usePathname();
  const [plan, setPlan] = useState<string | null>(null);
  useEffect(() => {
    try {
      if (/\/(gracias|precios)$/.test(ruta) || localStorage.getItem(CLAVE_MOSTRADO)) return;
      const p = JSON.parse(localStorage.getItem(CLAVE_PENDIENTE) ?? "null");
      if (p && Date.now() - p.ts > 2 * 60 * 1000 && Date.now() - p.ts < 30 * 864e5) {
        setPlan(p.plan);
        localStorage.setItem(CLAVE_MOSTRADO, String(Date.now())); // máximo uno
      }
    } catch { /* sin almacenamiento */ }
  }, [ruta]);
  if (!plan) return null;
  return (
    <div role="status" className="fixed bottom-3 inset-x-3 z-20 max-w-xl mx-auto tarjeta p-4 shadow-lg border-2 border-marca no-imprimir">
      <p>{textos.texto}</p>
      <div className="flex gap-2 mt-3">
        <Link href={`/${idioma}/precios?plan=${plan}&desde=recuperacion`} onClick={() => setPlan(null)} className="boton boton-marca flex-1">{textos.boton}</Link>
        <button onClick={() => setPlan(null)} className="boton boton-borde">{textos.cerrar}</button>
      </div>
    </div>
  );
}
