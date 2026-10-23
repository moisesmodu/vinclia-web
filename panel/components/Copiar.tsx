'use client';
import { useState } from 'react';

export default function Copiar({ texto }: { texto: string }) {
  const [hecho, setHecho] = useState(false);
  return (
    <button
      type="button"
      className="boton"
      onClick={async () => {
        try { await navigator.clipboard.writeText(texto); setHecho(true); setTimeout(() => setHecho(false), 1800); } catch {}
      }}
    >
      {hecho ? 'Copiado' : 'Copiar prompt'}
    </button>
  );
}
