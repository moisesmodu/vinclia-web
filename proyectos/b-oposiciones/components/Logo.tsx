/**
 * Logotipo de Oposita: el SVG de marcas/logos/b-oposiciones.svg, en línea para que use la fuente de la marca.
 * La O es una casilla de respuesta marcada (anillo blanco y punto verde) sobre el cuadrado índigo.
 */
export default function Logo({ alto = 32, soloIcono = false }: { alto?: number; soloIcono?: boolean }) {
  if (soloIcono)
    return (
      <svg viewBox="6 6 44 44" height={alto} width={alto} aria-hidden="true" className="block">
        <Icono />
      </svg>
    );
  return (
    <svg viewBox="0 0 236 56" height={alto} width={(alto * 236) / 56} role="img" aria-label="Oposita" className="block">
      <Icono />
      <text x="64" y="38" fontFamily="Space Grotesk, Avenir Next, Segoe UI, sans-serif" fontWeight="700" fontSize="30" letterSpacing="-0.6" fill="currentColor">oposita</text>
    </svg>
  );
}

function Icono() {
  return (
    <>
      <rect x="6" y="6" width="44" height="44" rx="11" fill="#3B3FD8" />
      <circle cx="28" cy="28" r="12" fill="none" stroke="#FFFFFF" strokeWidth="4.5" />
      <circle cx="28" cy="28" r="5" fill="#3DDC97" />
    </>
  );
}
