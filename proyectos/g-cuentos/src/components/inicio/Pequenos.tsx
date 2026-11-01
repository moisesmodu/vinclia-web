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
    <div className="bg-[#141B36] text-[#FFF8EC] text-center text-xs sm:text-sm font-bold pt-1 pb-2 envoltura">
      <span className="inline-flex flex-wrap justify-center items-center gap-x-2 rounded-full px-4 py-1.5 bg-[rgba(255,248,236,.07)] ring-1 ring-[rgba(255,248,236,.1)]">
        <span><span style={{ color: "#F5C84C" }} aria-hidden>☾ </span>{texto}</span>
        <span className="hidden sm:inline opacity-75 font-normal">{ca ? "El PDF arriba en menys de 2 hores" : "El PDF llega en menos de 2 horas"}</span>
      </span>
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
