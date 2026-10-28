/** Logotipo de Plaça: el SVG de marcas/logos/b-oposiciones.svg, en línea para que use la fuente de la marca. */
export default function Logo({ alto = 32 }: { alto?: number }) {
  return (
    <svg viewBox="0 0 260 56" height={alto} width={(alto * 260) / 56} role="img" aria-label="Plaça" className="block">
      <rect x="6" y="6" width="44" height="44" rx="10" fill="#3B3FD8" />
      <circle cx="28" cy="28" r="8" fill="#FFFFFF" />
      <text x="68" y="37" fontFamily="Space Grotesk, Avenir Next, Segoe UI, sans-serif" fontWeight="700" fontSize="28" fill="#14142B">Plaça</text>
    </svg>
  );
}
