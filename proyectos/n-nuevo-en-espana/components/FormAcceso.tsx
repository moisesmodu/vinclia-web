"use client";
import { useState } from "react";

export default function FormAcceso({ idioma, textos }: { idioma: string; textos: { email: string; boton: string; enviado: string } }) {
  const [email, setEmail] = useState("");
  const [hecho, setHecho] = useState(false);
  if (hecho) return <p className="bg-ok-claro text-ok rounded-xl p-3" role="status">{textos.enviado}</p>;
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await fetch("/api/acceso", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, idioma }) }).catch(() => null);
        setHecho(true);
      }}
    >
      <label className="block"><span className="font-medium">{textos.email}</span>
        <input type="email" required autoComplete="email" className="campo mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button className="boton boton-marca w-full">{textos.boton}</button>
    </form>
  );
}
