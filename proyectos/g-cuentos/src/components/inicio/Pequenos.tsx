"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Idioma } from "@/lib/catalogo";

/** Aviso superior con la cuenta atrás real hasta la fecha límite del libro impreso. */
export function AvisoCampana({ idioma, navidad, reyes }: { idioma: Idioma; navidad: string; reyes: string }) {
  const ca = idioma === "ca";
  const [hoy, setHoy] = useState<number | null>(null);
  useEffect(() => setHoy(Date.now()), []);
  const dias = (iso: string) => (hoy === null ? null : Math.ceil((new Date(`${iso}T23:59:59`).getTime() - hoy) / 86_400_000));
  const dn = dias(navidad);
  const dr = dias(reyes);
  let texto: string;
  if (dn !== null && dn >= 0) texto = ca ? `Llibre imprès per Nadal: queden ${dn} dies per demanar-lo` : `Libro impreso para Navidad: quedan ${dn} días para pedirlo`;
  else if (dr !== null && dr >= 0) texto = ca ? `Llibre imprès per Reis: queden ${dr} dies per demanar-lo` : `Libro impreso para Reyes: quedan ${dr} días para pedirlo`;
  else texto = ca ? "Llibre imprès en tapa dura amb enviament inclòs" : "Libro impreso en tapa dura con envío incluido";
  return (
    <div className="banda-noche text-center text-sm font-bold py-2 envoltura">
      <span className="acento" style={{ color: "#F5C84C" }}>☾</span> {texto} · {ca ? "el PDF arriba en menys de 2 hores" : "el PDF llega en menos de 2 horas"}
    </div>
  );
}

/** Barra fija inferior en móvil. */
export function BarraMovil({ idioma, desde }: { idioma: Idioma; desde: string }) {
  const ca = idioma === "ca";
  return (
    <div className="barra-movil">
      <div className="text-sm leading-tight flex-1 min-w-0">
        <b className="text-noche">{ca ? "Vista prèvia gratis" : "Vista previa gratis"}</b>
        <span className="block text-suave">{ca ? `PDF des de ${desde}` : `PDF desde ${desde}`}</span>
      </div>
      <Link href={`${ca ? "/ca" : ""}/crear`} className="boton !min-h-[46px] !py-2 !px-5">{ca ? "Crear el conte" : "Crear su cuento"}</Link>
    </div>
  );
}
