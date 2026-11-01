/** Logotipo de CCSE Fácil: el arco de la familia Nuevo en España y el nombre en Outfit («Fácil» en terracota). */
export function Logo({ por, clase = '' }: { por?: string; clase?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${clase}`} dir="ltr">
      <svg viewBox="0 0 56 56" className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" aria-hidden="true">
        <path d="M8 52V28a20 20 0 0 1 40 0v24h-10V28a10 10 0 0 0-20 0v24z" fill="#D9603B" />
        <rect x="24" y="36" width="8" height="16" rx="2" fill="#1F2A44" />
      </svg>
      <span className="grid leading-none">
        <span className="titulos text-[1.2rem] font-bold tracking-[-0.02em] text-tinta sm:text-[1.35rem]">
          CCSE <span className="text-marca">Fácil</span>
        </span>
        {por && <span className="mt-1 text-[0.68rem] font-medium text-suave">{por}</span>}
      </span>
    </span>
  );
}
