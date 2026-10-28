/** Logotip d'Aprova: el SVG de marcas/logos/m-catala.svg, en línia perquè faci servir la font de la marca. No es redibuixa. */
export default function Logo({ alto = 32, nomes = false }: { alto?: number; nomes?: boolean }) {
  if (nomes) return (
    <svg viewBox="0 0 56 56" height={alto} width={alto} role="img" aria-label="Aprova" className="block">
      <rect width="56" height="56" rx="12" fill="#FBF5EC" /><path d="M8 52V28a20 20 0 0 1 40 0v24h-10V28a10 10 0 0 0-20 0v24z" fill="#E0B23A" /><rect x="24" y="36" width="8" height="16" rx="2" fill="#1F2A44" />
    </svg>
  );
  return (
    <svg viewBox="0 0 260 56" height={alto} width={(alto * 260) / 56} role="img" aria-label="Aprova" className="block">
      <path d="M8 52V28a20 20 0 0 1 40 0v24h-10V28a10 10 0 0 0-20 0v24z" fill="#E0B23A" />
      <rect x="24" y="36" width="8" height="16" rx="2" fill="#1F2A44" />
      <text x="68" y="37" fontFamily="Outfit, Avenir Next, Segoe UI, sans-serif" fontWeight="700" fontSize="28" fill="#1F2A44">Aprova</text>
    </svg>
  );
}
