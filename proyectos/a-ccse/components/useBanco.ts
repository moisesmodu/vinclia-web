'use client';
import { useEffect, useState } from 'react';
import { lenguaExplicacion, type Locale } from '@/lib/config';

export type Trad = { texto?: string; opciones?: string[]; explicacion?: string; nota?: string };
export type Banco = { es: Record<string, Trad>; propia: Record<string, Trad>; bloqueadas: Set<number>; cargando: boolean };

/** Pide al servidor explicaciones (es + lengua del usuario) de las preguntas indicadas. */
export function useBanco(ids: number[], locale: Locale, clave: string | number = '') {
  const lengua = lenguaExplicacion(locale);
  const [b, setB] = useState<Banco>({ es: {}, propia: {}, bloqueadas: new Set(), cargando: true });
  const idsTxt = ids.join(',');
  useEffect(() => {
    if (!idsTxt) return;
    let vivo = true;
    const pedir = (l: string) => fetch(`/api/banco?lengua=${l}&ids=${idsTxt}`).then((r) => r.json());
    Promise.all([pedir('es'), lengua === 'es' ? Promise.resolve(null) : pedir(lengua)])
      .then(([es, pr]) => {
        if (!vivo) return;
        setB({ es: es.datos ?? {}, propia: pr ? pr.datos ?? {} : es.datos ?? {}, bloqueadas: new Set<number>(es.bloqueadas ?? []), cargando: false });
      })
      .catch(() => vivo && setB((x) => ({ ...x, cargando: false })));
    return () => {
      vivo = false;
    };
  }, [idsTxt, lengua, clave]);
  return { ...b, lengua };
}
