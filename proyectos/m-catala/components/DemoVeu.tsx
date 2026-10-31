'use client';
import { useState } from 'react';
/** Demo de veu de la landing: l'única crida a ElevenLabs (si hi ha clau). El text no viatja: el servidor té la frase fixa (/api/tts?demo=1);
 *  si no hi ha àudio del servidor, la veu del navegador llegeix la mateixa frase. */
const FRASE = 'Hi ha que acabar-ho avui. — No: cal acabar-ho avui. Hi ha que és un calc del castellà.';
export default function DemoVeu({ idioma }: { idioma: string }) {
  const [estat, setEstat] = useState('');
  return <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm text-secundari underline" onClick={async () => { setEstat('…'); const { parlar, reproduirServidor } = await import('@/lib/client/veu'); if (await reproduirServidor('/api/tts?demo=1')) { setEstat(''); return; } const m = await parlar(FRASE, 'central', 0.92, 'demo'); setEstat(m === 'cap' ? (idioma === 'ca' ? 'Sense veu en català al navegador' : 'Sin voz en catalán en el navegador') : ''); }}>🔊 {idioma === 'ca' ? 'Escolta com corregeix un castellanisme' : 'Escucha cómo corrige un castellanismo'} {estat}</button>;
}
