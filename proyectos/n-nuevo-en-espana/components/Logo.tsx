// Logotipo de marcas/logos/n-nuevo-en-espana.svg en línea, sin redibujar: así el texto usa Outfit (la fuente de la
// página) y el azul noche pasa a crema en modo oscuro.
export default function Logo({ etiqueta, className }: { etiqueta: string; className?: string }) {
  return (
    <svg viewBox="0 0 331 56" role="img" aria-label={etiqueta} className={className}>
      <path d="M8 52V28a20 20 0 0 1 40 0v24h-10V28a10 10 0 0 0-20 0v24z" fill="#D9603B" />
      <rect x="24" y="36" width="8" height="16" rx="2" style={{ fill: "var(--tinta)" }} />
      <text x="68" y="37" fontFamily="var(--font-titulo), Outfit, Avenir Next, Segoe UI, sans-serif" fontWeight={700} fontSize={28} style={{ fill: "var(--tinta)" }}>Nuevo en España</text>
    </svg>
  );
}
