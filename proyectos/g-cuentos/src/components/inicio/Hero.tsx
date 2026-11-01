import { getImageProps } from "next/image";
import Link from "next/link";
import type { Idioma } from "@/lib/catalogo";
import { t } from "@/i18n/textos";

// Estrellas del cielo: [izquierda %, arriba %, tamaño px, duración s]. Solo parpadean (opacidad).
const ESTRELLAS: [number, number, number, number][] = [
  [8, 14, 3, 3.4], [16, 38, 2, 4.6], [27, 9, 2, 3.1], [34, 27, 3, 5.2], [42, 6, 2, 3.8], [51, 19, 2, 4.2],
  [6, 58, 2, 3.6], [22, 70, 2, 4.9], [38, 49, 2, 3.3], [47, 33, 3, 4.4], [12, 86, 2, 3.9], [30, 92, 2, 4.1],
];

const H = {
  es: {
    ojo: "Cuentos personalizados en castellano y català",
    sub: "Su nombre, su ciudad, su mascota y lo que le preocupa, en un álbum ilustrado que ves antes de pagar.",
    dentro: "Ver un cuento por dentro",
    alt: "Una niña y un niño leen su cuento bajo la luna, con Lunilla en el cielo",
  },
  ca: {
    ojo: "Contes personalitzats en català i castellano",
    sub: "El seu nom, la seva ciutat, la seva mascota i el que el preocupa, en un àlbum il·lustrat que veus abans de pagar.",
    dentro: "Veure un conte per dins",
    alt: "Una nena i un nen llegeixen el seu conte sota la lluna, amb la Lunilla al cel",
  },
};

/** Portada: la noche pintada a sangre. Dirección de arte con <picture>: 4:5 en móvil, panorámica en escritorio. */
export function Hero({ idioma }: { idioma: Idioma }) {
  const x = t(idioma);
  const k = H[idioma];
  const p = idioma === "ca" ? "/ca" : "";
  const comun = { alt: k.alt, priority: true, quality: 78 } as const;
  const { props: { srcSet: movil } } = getImageProps({ ...comun, src: "/marca/hero-movil.webp", width: 1200, height: 1624, sizes: "100vw" });
  const { props: { srcSet: ancho, ...img } } = getImageProps({ ...comun, src: "/marca/hero-ancho.webp", width: 2400, height: 1291, sizes: "100vw" });
  return (
    <section className="hero-noche">
      <div className="estrellas" aria-hidden>
        {ESTRELLAS.map(([l, tp, tam, d], i) => (
          <i key={i} style={{ left: `${l}%`, top: `${tp}%`, ["--t" as string]: `${tam}px`, ["--d" as string]: `${d}s`, ["--r" as string]: `${(i % 5) * 0.55}s` }} />
        ))}
      </div>
      <div className="hero-texto envoltura mx-auto w-full max-w-6xl">
        <p className="text-[#F5C84C] font-bold text-sm sm:text-base mb-4">{k.ojo}</p>
        <h1 className="hero-titulo max-w-[11.5em]">{x.promesa.replace(/\.$/, "")}</h1>
        <p className="hero-sub mt-5">{k.sub}</p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href={`${p}/crear`} className="boton-luna text-lg">
            {x.hero.cta}
            <span className="boton-icono" aria-hidden>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href={`${p}/#muestras`} className="hero-boton-sec">{k.dentro}</Link>
        </div>
      </div>
      <div className="hero-arte">
        <picture>
          <source media="(min-width: 1024px)" srcSet={ancho} sizes="100vw" />
          <source srcSet={movil} sizes="100vw" />
          <img {...img} alt={k.alt} fetchPriority="high" />
        </picture>
        <div className="hero-velo" aria-hidden />
      </div>
    </section>
  );
}
