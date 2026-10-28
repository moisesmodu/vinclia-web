"use client";
import { useState } from "react";
import type { Dicc } from "@/lib/i18n";
import { t } from "@/lib/texto";

type R = { pregunta: string; avisos: { dias: number; texto: string }[] };

export default function FormRecordatorio({ slug, idioma, r, d }: { slug: string; idioma: string; r: R; d: Dicc }) {
  const [email, setEmail] = useState("");
  const [fecha, setFecha] = useState("");
  const [acepto, setAcepto] = useState(false);
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error" | "pago">("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const res = await fetch("/api/recordatorio", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, fecha, guia: slug, idioma, consentimiento: acepto })
    }).catch(() => null);
    if (res?.ok) setEstado("ok");
    else if (res?.status === 402) setEstado("pago");
    else setEstado("error");
  }

  // Intl conjuga «día/días» correctamente en cada idioma (árabe, ucraniano y rumano tienen varios plurales).
  const fmt = new Intl.NumberFormat(idioma === "zh" ? "zh-Hans" : idioma, { style: "unit", unit: "day", unitDisplay: "long" });
  const cuando = (dias: number) =>
    dias === 0 ? d.recordatorio.elDia : t(dias < 0 ? d.recordatorio.diasAntes : d.recordatorio.diasDespues, { n: fmt.format(Math.abs(dias)) });

  return (
    <section className="tarjeta p-5 no-imprimir" id="recordatorio">
      <h2 className="font-bold text-xl">⏰ {d.guia.recordatorio}</h2>
      {estado === "ok" ? (
        <p className="mt-3 bg-ok-claro text-ok rounded-xl p-3" role="status">{d.recordatorio.ok}</p>
      ) : (
        <form onSubmit={enviar} className="mt-3 space-y-3">
          <label className="block">
            <span className="font-medium">{r.pregunta}</span>
            <input type="date" required className="campo mt-1" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <div className="text-sm text-suave">
            <p>{d.recordatorio.avisos}</p>
            <ul className="list-disc ps-5">
              {r.avisos.map((a) => <li key={a.dias}><strong>{cuando(a.dias)}</strong>: {a.texto}</li>)}
            </ul>
          </div>
          <label className="block">
            <span className="font-medium">{d.recordatorio.email}</span>
            <input type="email" required autoComplete="email" className="campo mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="flex gap-3 items-start text-sm">
            <input type="checkbox" required className="mt-1 w-5 h-5 shrink-0" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
            <span>{d.recordatorio.consentimiento}</span>
          </label>
          <button className="boton boton-marca w-full" disabled={estado === "enviando"}>{d.recordatorio.boton}</button>
          {estado === "error" ? <p className="text-marca-oscuro" role="alert">{d.recordatorio.error}</p> : null}
          {estado === "pago" ? <p className="text-marca-oscuro" role="alert">{d.recordatorio.soloSuscriptores}</p> : null}
        </form>
      )}
    </section>
  );
}
