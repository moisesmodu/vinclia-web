'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { llegirEstat } from '@/lib/estat';
export default function BotoSeguir({ idioma, text, className = 'boton-sec text-lg' }: { idioma: string; text: string; className?: string }) {
  const [hi, setHi] = useState(false);
  useEffect(() => { setHi(!!llegirEstat().perfil); }, []);
  if (!hi) return null;
  return <Link href={`/${idioma}/avui`} className={className}>{text}</Link>;
}
