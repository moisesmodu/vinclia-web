'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fechaLarga, type Clave } from '@/lib/i18n';
import { useEstado } from './Estado';

export function FormCuenta({ despues }: { despues?: () => void }) {
  const { t, locale, recargarUsuario } = useEstado();
  const [modo, setModo] = useState<'crear' | 'entrar' | 'olvide'>('crear');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const err = (c?: string) => t(`cuenta.err.${c}` as Clave) === `cuenta.err.${c}` ? t('cuenta.err.generico') : t(`cuenta.err.${c}` as Clave);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setMsg(null);
    try {
      if (modo === 'olvide') {
        const r = await fetch('/api/auth/recuperar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, locale }) });
        const d = await r.json();
        setMsg(r.ok ? t('cuenta.enlaceEnviado') : err(d.error));
        return;
      }
      let progreso: unknown = null;
      try { progreso = JSON.parse(localStorage.getItem('ccse.progreso.v1') || 'null'); } catch {}
      const r = await fetch(`/api/auth/${modo === 'crear' ? 'registro' : 'entrar'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, clave, idioma: locale, progreso }),
      });
      const d = await r.json();
      if (!r.ok) return setMsg(err(d.error));
      await recargarUsuario();
      despues?.();
    } catch {
      setMsg(t('cuenta.err.generico'));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="tarjeta grid gap-3 p-5">
      <h2 className="text-lg font-bold">{modo === 'crear' ? t('cuenta.crear') : modo === 'entrar' ? t('cuenta.entrar') : t('cuenta.olvide')}</h2>
      <label className="grid gap-1 text-sm">{t('cuenta.email')}
        <input required type="email" autoComplete="email" dir="ltr" className="rounded-lg border p-3 text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {modo !== 'olvide' && (
        <label className="grid gap-1 text-sm">{t('cuenta.clave')}
          <input required minLength={8} type="password" autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} dir="ltr" className="rounded-lg border p-3 text-base" value={clave} onChange={(e) => setClave(e.target.value)} />
        </label>
      )}
      {msg && <p className="rounded-lg bg-amber-50 p-2 text-sm" role="alert">{msg}</p>}
      <button disabled={ocupado} className="boton boton-1">{modo === 'olvide' ? t('cuenta.enviarEnlace') : modo === 'crear' ? t('cuenta.crear') : t('cuenta.entrar')}</button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        {modo !== 'entrar' ? (
          <button type="button" className="underline" onClick={() => setModo('entrar')}>{t('cuenta.tienes')} {t('cuenta.entrar')}</button>
        ) : (
          <button type="button" className="underline" onClick={() => setModo('crear')}>{t('cuenta.noTienes')} {t('cuenta.crear')}</button>
        )}
        {modo === 'entrar' && <button type="button" className="underline" onClick={() => setModo('olvide')}>{t('cuenta.olvide')}</button>}
      </div>
    </form>
  );
}

function NuevaClave({ token }: { token: string }) {
  const { t, recargarUsuario } = useEstado();
  const router = useRouter();
  const [clave, setClave] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form className="tarjeta grid gap-3 p-5" onSubmit={async (e) => {
      e.preventDefault();
      const r = await fetch('/api/auth/nueva-clave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, clave }) });
      if (!r.ok) return setMsg(t('cuenta.err.token_invalido'));
      await recargarUsuario();
      router.replace(location.pathname);
    }}>
      <label className="grid gap-1 text-sm">{t('cuenta.nuevaClave')}
        <input required minLength={8} type="password" autoComplete="new-password" className="rounded-lg border p-3" value={clave} onChange={(e) => setClave(e.target.value)} />
      </label>
      {msg && <p role="alert" className="text-sm">{msg}</p>}
      <button className="boton boton-1">{t('cuenta.guardar')}</button>
    </form>
  );
}

export function Cuenta() {
  const { t, locale, usuario, acceso, listo, recargarUsuario } = useEstado();
  const token = useSearchParams().get('token');
  if (!listo) return <p>{t('comun.cargando')}</p>;
  if (token && !usuario) return <NuevaClave token={token} />;
  if (!usuario) return <FormCuenta />;
  return (
    <div className="tarjeta grid gap-3 p-5">
      <p className="font-semibold" dir="ltr">{usuario.email}</p>
      <p>{acceso && usuario.accesoHasta ? t('cuenta.acceso', { f: fechaLarga(new Date(usuario.accesoHasta), locale) }) : t('cuenta.sinAcceso')}</p>
      {!acceso && <Link href={`/${locale}/precio`} className="boton boton-1">{t('nav.precio')}</Link>}
      <Link href={`/${locale}/progreso`} className="boton boton-2">{t('nav.progreso')}</Link>
      <button className="text-sm underline" onClick={async () => { await fetch('/api/auth/salir', { method: 'POST' }); await recargarUsuario(); }}>{t('cuenta.salir')}</button>
    </div>
  );
}
