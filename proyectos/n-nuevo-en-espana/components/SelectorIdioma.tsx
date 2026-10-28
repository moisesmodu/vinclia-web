"use client";
import { usePathname, useRouter } from "next/navigation";
import cfg from "@/config/paises/es.json";

const NOMBRES: Record<string, string> = { es: "Castellano", ar: "العربية", fr: "Français", en: "English", ro: "Română", zh: "中文", uk: "Українська", ca: "Català" };

export default function SelectorIdioma({ idioma, etiqueta }: { idioma: string; etiqueta: string }) {
  const ruta = usePathname();
  const router = useRouter();
  return (
    <label className="relative flex items-center bg-marca-claro text-marca-oscuro rounded-lg ps-2">
      <span className="sr-only">{etiqueta}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>
      <select
        className="appearance-none bg-transparent font-semibold py-2 ps-1 pe-2 text-sm w-[5.25rem] sm:w-auto truncate"
        value={idioma}
        onChange={(e) => {
          const partes = ruta.split("/");
          partes[1] = e.target.value;
          // Las páginas de preguntas existen solo en su idioma: al cambiar, se vuelve a la portada.
          const destino = partes[2] === "preguntas" && partes[3] ? `/${e.target.value}/preguntas` : partes.join("/");
          router.push(destino);
        }}
      >
        {cfg.idiomas.map((i) => (
          <option key={i} value={i}>{NOMBRES[i]}</option>
        ))}
      </select>
    </label>
  );
}
