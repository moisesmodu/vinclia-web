'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/lib/config';
import { formatear, type Clave, type Mensajes } from '@/lib/i18n';
import { esProgreso, fusionar, progresoVacio, type Progreso, type Simulacro } from '@/lib/progreso';
import { registrarRespuesta } from '@/lib/repaso';

type Usuario = { email: string; accesoHasta: string | null; acceso: boolean; simulacros: number } | null;
type Ctx = {
  locale: Locale;
  t: (k: Clave, v?: Record<string, string | number>) => string;
  progreso: Progreso;
  listo: boolean;
  usuario: Usuario;
  acceso: boolean;
  responder: (id: number, acierto: boolean) => void;
  guardarSimulacro: (s: Simulacro) => void;
  setConvocatoria: (f: string) => void;
  simulacrosLocales: number;
  recargarUsuario: () => Promise<void>;
  sincronizar: () => Promise<void>;
};
const C = createContext<Ctx | null>(null);
const CLAVE = 'ccse.progreso.v1';
const CLAVE_SIM = 'ccse.simulacros.gratis';

function leer(): Progreso {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    return esProgreso(d) ? d : progresoVacio();
  } catch {
    return progresoVacio();
  }
}

export function EstadoProvider({ locale, mensajes, children }: { locale: Locale; mensajes: Mensajes; children: React.ReactNode }) {
  const [progreso, setProgreso] = useState<Progreso>(progresoVacio);
  const [listo, setListo] = useState(false);
  const [usuario, setUsuario] = useState<Usuario>(null);
  const [simulacrosLocales, setSimLoc] = useState(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useCallback((k: Clave, v?: Record<string, string | number>) => formatear(mensajes[k] ?? k, v), [mensajes]);

  const sincronizar = useCallback(async () => {
    try {
      const r = await fetch('/api/progreso', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leer()) });
      if (r.ok) {
        const d = await r.json();
        if (esProgreso(d)) {
          localStorage.setItem(CLAVE, JSON.stringify(d));
          setProgreso(d);
        }
      }
    } catch {}
  }, []);

  const recargarUsuario = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/yo', { cache: 'no-store' });
      const d = await r.json();
      setUsuario(d.anonimo ? null : d);
      if (!d.anonimo) await sincronizar();
    } catch {
      setUsuario(null);
    }
  }, [sincronizar]);

  useEffect(() => {
    setProgreso(leer());
    try {
      setSimLoc(Number(localStorage.getItem(CLAVE_SIM) || 0));
    } catch {}
    setListo(true);
    recargarUsuario();
    const alVolver = () => setProgreso((p) => fusionar(p, leer()));
    window.addEventListener('storage', alVolver);
    return () => window.removeEventListener('storage', alVolver);
  }, [recargarUsuario]);

  const persistir = useCallback(
    (p: Progreso) => {
      try {
        localStorage.setItem(CLAVE, JSON.stringify(p));
      } catch {}
      if (usuario) {
        if (temporizador.current) clearTimeout(temporizador.current);
        temporizador.current = setTimeout(sincronizar, 3000);
      }
    },
    [usuario, sincronizar],
  );

  const responder = useCallback(
    (id: number, acierto: boolean) =>
      setProgreso((p) => {
        const n = registrarRespuesta(p, id, acierto);
        persistir(n);
        return n;
      }),
    [persistir],
  );
  const guardarSimulacro = useCallback(
    (s: Simulacro) => {
      setProgreso((p) => {
        const n = { ...p, actualizado: Date.now(), simulacros: [...p.simulacros, s].slice(-100) };
        persistir(n);
        return n;
      });
      setSimLoc((x) => {
        try {
          localStorage.setItem(CLAVE_SIM, String(x + 1));
        } catch {}
        return x + 1;
      });
    },
    [persistir],
  );
  const setConvocatoria = useCallback(
    (f: string) =>
      setProgreso((p) => {
        const n = { ...p, actualizado: Date.now(), convocatoria: f };
        persistir(n);
        return n;
      }),
    [persistir],
  );

  const valor = useMemo<Ctx>(
    () => ({
      locale, t, progreso, listo, usuario, acceso: !!usuario?.acceso, responder, guardarSimulacro, setConvocatoria,
      simulacrosLocales, recargarUsuario, sincronizar,
    }),
    [locale, t, progreso, listo, usuario, responder, guardarSimulacro, setConvocatoria, simulacrosLocales, recargarUsuario, sincronizar],
  );
  return <C.Provider value={valor}>{children}</C.Provider>;
}

export function useEstado() {
  const c = useContext(C);
  if (!c) throw new Error('useEstado fuera de EstadoProvider');
  return c;
}
