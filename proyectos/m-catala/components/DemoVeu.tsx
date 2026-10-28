'use client';
import { useState } from 'react';
/** Demo de veu de la landing: l'única crida a ElevenLabs (si hi ha clau); si no, la veu del navegador. */
export default function DemoVeu({ idioma }: { idioma: string }) {
  const [estat, setEstat] = useState('');
  const frase = 'Hi ha que acabar-ho avui. — No: cal acabar-ho avui. Hi ha que és un calc del castellà.';
  return <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm text-suave underline" onClick={async () => { setEstat('…'); const { parlar } = await import('@/lib/client/veu'); try { const r = await fetch(`/api/tts?demo=1&text=${encodeURIComponent(frase)}`); if (r.status === 200) { const a = new Audio(URL.createObjectURL(await r.blob())); await a.play(); setEstat(''); return; } } catch {} const m = await parlar(frase); setEstat(m === 'cap' ? (idioma === 'ca' ? 'Sense veu en català al navegador' : 'Sin voz en catalán en el navegador') : ''); }}>🔊 {idioma === 'ca' ? 'Escolta com corregeix un castellanisme' : 'Escucha cómo corrige un castellanismo'} {estat}</button>;
}
