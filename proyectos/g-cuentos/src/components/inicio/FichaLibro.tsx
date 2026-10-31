import type { Idioma } from "@/lib/catalogo";

// Ficha técnica del libro impreso (producto de Gelato «photobooks-hardcover 200x200 mm», 30 páginas interiores).
// Dibujo a escala: el libro de 20 × 20 cm sobre la silueta de un folio A4 (21 × 29,7 cm).
const C = {
  es: {
    titulo: "Ficha del libro impreso",
    filas: [
      ["Tamaño", "20 × 20 cm (formato cuadrado, 8 × 8 pulgadas)"],
      ["Tapa", "Dura, de cartón forrado con laminado mate"],
      ["Interior", "30 páginas a todo color (15 hojas)"],
      ["Papel", "Estucado satinado de 170 g, grueso y sin transparencias"],
      ["Encuadernación", "Encolada, con lomo recto y el título impreso"],
      ["Qué lleva dentro", "Portadilla, dedicatoria, «este libro pertenece a», la ficha del protagonista, las 18 o 22 páginas ilustradas del cuento, «Fin» y páginas para la familia"],
      ["Impresión", "Bajo demanda en una imprenta europea de la red de Gelato, una a una"],
    ],
    a4: "folio A4", libro: "su libro", ancho: "20 cm",
  },
  ca: {
    titulo: "Fitxa del llibre imprès",
    filas: [
      ["Mida", "20 × 20 cm (format quadrat, 8 × 8 polzades)"],
      ["Tapa", "Dura, de cartró folrat amb laminat mat"],
      ["Interior", "30 pàgines a tot color (15 fulls)"],
      ["Paper", "Estucat setinat de 170 g, gruixut i sense transparències"],
      ["Enquadernació", "Encolada, amb llom recte i el títol imprès"],
      ["Què hi ha a dins", "Portadella, dedicatòria, «aquest llibre és de», la fitxa del protagonista, les 18 o 22 pàgines il·lustrades del conte, «Fi» i pàgines per a la família"],
      ["Impressió", "Sota demanda en una impremta europea de la xarxa de Gelato, un a un"],
    ],
    a4: "full A4", libro: "el seu llibre", ancho: "20 cm",
  },
};

export function FichaLibro({ idioma }: { idioma: Idioma }) {
  const k = C[idioma];
  // Escala: 1 cm = 6 unidades. A4 = 126 × 178; libro = 120 × 120.
  return (
    <div className="tarjeta p-6 mt-6 grid gap-6 sm:grid-cols-[170px_1fr] items-start" id="ficha-libro">
      <svg viewBox="0 0 170 210" className="w-40 mx-auto" role="img" aria-label={`${k.libro}: 20 × 20 cm; ${k.a4}: 21 × 29,7 cm`}>
        <rect x="22" y="12" width="126" height="178" rx="2" fill="none" stroke="#9aa0b8" strokeDasharray="4 3" />
        <text x="85" y="184" textAnchor="middle" fontSize="9" fill="#5b6382">{k.a4}</text>
        <rect x="25" y="40" width="120" height="120" rx="3" fill="#2B3A67" />
        <rect x="25" y="40" width="7" height="120" fill="#1B2444" />
        <circle cx="128" cy="58" r="8" fill="#F5C84C" /><circle cx="132" cy="55" r="7" fill="#2B3A67" />
        <text x="88" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFF8EC">{k.libro}</text>
        <path d="M25 30h120M25 26v8M145 26v8" stroke="#F5C84C" strokeWidth="1.5" />
        <text x="85" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2B3A67">{k.ancho}</text>
        <path d="M155 40v120M151 40h8M151 160h8" stroke="#F5C84C" strokeWidth="1.5" />
        <text x="163" y="104" fontSize="9" fontWeight="700" fill="#2B3A67" transform="rotate(90 163 104)" textAnchor="middle">{k.ancho}</text>
      </svg>
      <div className="min-w-0">
        <h3 className="text-xl mb-3">{k.titulo}</h3>
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          {k.filas.map(([a, b]) => (
            <div key={a} className="contents">
              <dt className="font-bold text-noche">{a}</dt>
              <dd className="text-suave">{b}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
