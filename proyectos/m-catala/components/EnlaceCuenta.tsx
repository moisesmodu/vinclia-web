'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { hiHaSessio } from '@/lib/estat';

/** Enlace Entrar / Mi cuenta según haya sesión (la cabecera es estática). */
export default function EnlaceCuenta({ idioma, entrar, cuenta }: { idioma: string; entrar: string; cuenta: string }) {
  const [sesion, setSesion] = useState<boolean | null>(null);
  // Primer la galeta llegible (sense xarxa); després /api/yo confirma (la sessió pot haver caducat o estar revocada).
  useEffect(() => { setSesion(hiHaSessio()); if (!hiHaSessio()) return; fetch('/api/yo').then((r) => r.json()).then((j) => setSesion(!!j?.usuari)).catch(() => setSesion(false)); }, []);
  return <Link href={`/${idioma}/${sesion ? 'compte' : 'entrar'}`} className="rounded-lg px-2 py-2 text-tinta no-underline hover:text-tinta">{sesion ? cuenta : entrar}</Link>;
}
