'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONES: Record<string, React.ReactNode> = {
  avui: <path d="M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4" />,
  practica: <path d="M5 20l9-9 M13 6l5 5 M9 10l5 5 M3 21l3-1 1-3 M17 3l4 4" />,
  escriure: <path d="M4 20h16 M15 4l4 4L8 19H4v-4z" />,
  simulacre: <path d="M12 7v5l3 2 M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0" />,
  oral: <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M6 11a6 6 0 0 0 12 0 M12 17v4 M9 21h6" />,
};

/** Barra inferior al mòbil: cinc llocs, el lloc actual marcat amb una línia ocre, no amb color de text cridaner. */
export default function BarraMovil({ idioma, etiquetas }: { idioma: string; etiquetas: Record<string, string> }) {
  const ruta = usePathname() || '';
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-linia bg-paper pb-[env(safe-area-inset-bottom)] sm:hidden" aria-label="Menú">
      {Object.entries(etiquetas).map(([k, v]) => {
        const actiu = ruta.startsWith(`/${idioma}/${k}`);
        return (
          <Link key={k} href={`/${idioma}/${k}`} aria-current={actiu ? 'page' : undefined} className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold no-underline ${actiu ? 'text-tinta' : 'text-terciari'}`}>
            {actiu ? <span className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-boli" aria-hidden="true" /> : null}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONES[k]}</svg>
            {v}
          </Link>
        );
      })}
    </nav>
  );
}
