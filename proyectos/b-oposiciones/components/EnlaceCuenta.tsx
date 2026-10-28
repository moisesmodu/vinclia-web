'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EnlaceCuenta({ idioma, entrar, cuenta }: { idioma: string; entrar: string; cuenta: string }) {
  const [dentro, setDentro] = useState(false);
  useEffect(() => {
    fetch('/api/yo').then((r) => r.json()).then((j) => setDentro(!!j.usuario)).catch(() => {});
  }, []);
  return (
    <Link href={`/${idioma}/${dentro ? 'cuenta' : 'entrar'}`} className="rounded-lg px-2 py-2 text-slate-700 no-underline hover:text-marca">
      {dentro ? cuenta : entrar}
    </Link>
  );
}
