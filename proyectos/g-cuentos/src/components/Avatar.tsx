import type { Genero } from "@/lib/catalogo";
import type { Aspecto } from "@/lib/rellenar";

// Avatar del protagonista en SVG: lo que la familia elige en el formulario (no es la ilustración final,
// que pinta el taller con la misma piel, pelo, peinado, gafas, pecas y color de ropa).
export const PIEL_HEX: Record<Aspecto["piel"], string> = { clara: "#F6D7C3", media: "#E2B48E", morena: "#B07A52", oscura: "#6E4630" };
export const PELO_HEX: Record<Aspecto["pelo"], string> = { rubio: "#E3B95A", castano: "#7A4A2A", pelirrojo: "#C2582C", negro: "#2A211D" };
export const COLOR_HEX: Record<string, string> = { azul: "#5B8DD6", rojo: "#D9534F", verde: "#6FBF8E", amarillo: "#F5C84C", rosa: "#F2A7C0", morado: "#9B7FD1", naranja: "#F29A4A", turquesa: "#3FBFB8" };

export function Avatar({ aspecto, genero, color = "azul", tam = 160, pijama = false }: { aspecto: Aspecto; genero: Genero; color?: string; tam?: number; pijama?: boolean }) {
  const piel = PIEL_HEX[aspecto.piel];
  const pelo = PELO_HEX[aspecto.pelo];
  const ropa = COLOR_HEX[color] ?? COLOR_HEX.azul;
  const sombraPiel = "rgba(0,0,0,.08)";
  return (
    <svg viewBox="0 0 160 170" width={tam} height={(tam * 170) / 160} role="img" aria-label="avatar">
      {/* Pelo largo por detrás */}
      {aspecto.peinado === "largo" && <path d="M38 70c-6 30 0 58 10 66h64c10-8 16-36 10-66z" fill={pelo} />}
      {/* Cuerpo */}
      <path d="M36 170c2-28 18-44 44-44s42 16 44 44z" fill={ropa} />
      {pijama ? (
        <g fill="#fff" opacity=".85"><circle cx="58" cy="150" r="2.5" /><circle cx="100" cy="146" r="2.5" /><circle cx="80" cy="160" r="2.5" /></g>
      ) : (
        <path d="M62 132c6 8 30 8 36 0" stroke="#fff" strokeWidth="3" fill="none" opacity=".6" strokeLinecap="round" />
      )}
      <rect x="70" y="112" width="20" height="18" rx="8" fill={piel} />
      {/* Orejas y cara */}
      <ellipse cx="42" cy="80" rx="8" ry="10" fill={piel} />
      <ellipse cx="118" cy="80" rx="8" ry="10" fill={piel} />
      <ellipse cx="80" cy="78" rx="38" ry="40" fill={piel} />
      <ellipse cx="80" cy="96" rx="30" ry="18" fill={sombraPiel} opacity=".25" />
      {/* Pelo */}
      {aspecto.peinado === "corto" && <path d="M42 70c0-26 18-38 38-38s38 12 38 38c-8-10-22-16-38-16S50 60 42 70z" fill={pelo} />}
      {aspecto.peinado === "rizado" && (
        <g fill={pelo}>
          {[[46, 62, 12], [58, 46, 13], [76, 40, 14], [94, 44, 13], [108, 56, 12], [114, 70, 9], [44, 76, 8]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} />)}
        </g>
      )}
      {aspecto.peinado === "largo" && <path d="M40 76c0-30 18-44 40-44s40 14 40 44c-10-14-26-20-40-20s-30 6-40 20z" fill={pelo} />}
      {aspecto.peinado === "coletas" && (
        <g fill={pelo}>
          <path d="M42 70c0-26 18-38 38-38s38 12 38 38c-8-10-22-16-38-16S50 60 42 70z" />
          {genero === "f" ? (
            <>
              <circle cx="34" cy="58" r="15" /><circle cx="126" cy="58" r="15" />
              <circle cx="44" cy="62" r="4" fill="#E8735A" /><circle cx="116" cy="62" r="4" fill="#E8735A" />
            </>
          ) : (
            <circle cx="80" cy="30" r="11" />
          )}
        </g>
      )}
      {/* Ojos, mejillas, boca */}
      <ellipse cx="66" cy="82" rx="4.5" ry="5.5" fill="#2B1E17" />
      <ellipse cx="94" cy="82" rx="4.5" ry="5.5" fill="#2B1E17" />
      <circle cx="67.5" cy="80" r="1.4" fill="#fff" /><circle cx="95.5" cy="80" r="1.4" fill="#fff" />
      <ellipse cx="56" cy="96" rx="7" ry="4.5" fill="#F29BA6" opacity=".55" />
      <ellipse cx="104" cy="96" rx="7" ry="4.5" fill="#F29BA6" opacity=".55" />
      <path d="M72 100q8 7 16 0" stroke="#7A3B2E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {aspecto.pecas && (
        <g fill="#9C5B3B" opacity=".55">
          {[[62, 92], [67, 94], [64, 97], [93, 94], [98, 92], [96, 97]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" />)}
        </g>
      )}
      {aspecto.gafas && (
        <g stroke="#2B3A67" strokeWidth="2.4" fill="none">
          <circle cx="66" cy="82" r="10" /><circle cx="94" cy="82" r="10" /><path d="M76 82h8M56 80l-12-4M104 80l12-4" />
        </g>
      )}
    </svg>
  );
}
