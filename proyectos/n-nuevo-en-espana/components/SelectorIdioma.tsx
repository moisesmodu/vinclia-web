"use client";
import { usePathname, useRouter } from "next/navigation";
import cfg from "@/config/paises/es.json";

const NOMBRES: Record<string, string> = { es: "Castellano", ar: "العربية", fr: "Français", en: "English", ro: "Română", zh: "中文", uk: "Українська", ca: "Català" };

export default function SelectorIdioma({ idioma, etiqueta }: { idioma: string; etiqueta: string }) {
  const ruta = usePathname();
  const router = useRouter();
  return (
    <label className="relative">
      <span className="sr-only">{etiqueta}</span>
      <select
        className="appearance-none bg-marca-claro text-marca-oscuro font-semibold rounded-lg px-2 py-2 text-sm"
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
