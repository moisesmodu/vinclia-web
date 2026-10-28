'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONOS: Record<string, string> = {
  avui: 'M4 5h16v14H4z M8 3v4 M16 3v4 M4 9h16', practica: 'M4 19l6-6 M14 5l5 5 M9 10l5 5 M3 21l3-1 1-3 M15 4l1-1 5 5-1 1', escriure: 'M12 20h9 M16.5 3.5l4 4L7 21H3v-4z', simulacre: 'M12 8v4l3 3 M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0', oral: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M19 11a7 7 0 0 1-14 0 M12 18v3',
};

/** Barra inferior fija en móvil: una sola tarea por pantalla, nada de menús escondidos. */
export default function BarraMovil({ idioma, etiquetas }: { idioma: string; etiquetas: Record<string, string> }) {
  const ruta = usePathname() || '';
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[#EADFCF] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden" aria-label="Menú">
      {Object.entries(etiquetas).map(([k, v]) => {
        const activo = ruta.startsWith(`/${idioma}/${k}`);
        return (
          <Link key={k} href={`/${idioma}/${k}`} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium no-underline ${activo ? 'text-marca' : 'text-suave'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONOS[k]} /></svg>
            {v}
          </Link>
        );
      })}
    </nav>
  );
}
