'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Idioma, Item, Regla } from '@/lib/tipos';
import { t } from '@/lib/i18n';

/** El ganxo de la portada: una pregunta real del banc que es respon aquí mateix, amb correcció i la regla citada. */
export default function DemoItem({ idioma, item, regla }: { idioma: Idioma; item: Item; regla: Regla }) {
  const d = t(idioma);
  const [sel, setSel] = useState<number | null>(null);
  const [fet, setFet] = useState(false);
  const [perque, setPerque] = useState(false);
  const opcions = item.opcions ?? [];
  const enun = item.enunciat ?? '';
  const frase = (() => {
    if (item.tipus === 'castellanismes' && item.error) {
      const i = enun.toLowerCase().indexOf(item.error.toLowerCase());
      if (i >= 0) return <>{enun.slice(0, i)}<span className={fet ? 'marcat-ok' : 'marcat'}>{fet ? opcions[item.resposta as number] : enun.slice(i, i + item.error.length)}</span>{enun.slice(i + item.error.length)}</>;
    }
    const parts = enun.split('___');
    return <>{parts[0]}<span className="buit">{fet ? opcions[item.resposta as number] : sel !== null ? opcions[sel] : '\u00a0'}</span>{parts.slice(1).join('___')}</>;
  })();
  return (
    <div className="full" aria-live="polite">
      <div className="full-cap"><span>{d.nou.provaho}</span><span>{item.nivell}</span></div>
      <p className="mt-3 text-[20px] leading-snug">{frase}</p>
      {item.tipus === 'castellanismes' && !fet ? <p className="mt-1 text-[14px] text-secundari">{idioma === 'ca' ? 'Quina és la forma correcta?' : '¿Cuál es la forma correcta?'}</p> : null}
      <div className="mt-4 grid gap-2">
        {opcions.map((o, i) => <button key={i} type="button" className={`opcio ${fet ? (i === item.resposta ? 'opcio-ok' : sel === i ? 'opcio-mal' : '') : ''}`} aria-pressed={sel === i} disabled={fet} onClick={() => setSel(i)}><span className="lletra" aria-hidden="true">{String.fromCharCode(97 + i)}</span><span>{o}</span></button>)}
      </div>
      {!fet ? <button type="button" className="boton-primari mt-4 w-full" disabled={sel === null} onClick={() => setFet(true)}>{d.practica.comprovar}</button> : (
        <div className="mt-4">
          <p className={`font-semibold ${sel === item.resposta ? 'text-apte' : 'text-vermell'}`}>{sel === item.resposta ? d.practica.correcte : d.practica.incorrecte}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="boton-sec" onClick={() => setPerque((v) => !v)} aria-expanded={perque}>{d.practica.perque}</button>
            <Link href={`/${idioma}/comencar`} className="boton-primari flex-1">{d.hero.cta}</Link>
          </div>
          {perque ? <div className="regla mt-3 text-[15px]"><p className="font-semibold">{regla.titol.ca}</p><p className="mt-1 leading-relaxed">{regla.regla[idioma] ?? regla.regla.ca}</p><p className="mt-2 text-[13px]"><a className="underline" href={regla.font.url} target="_blank" rel="noopener noreferrer">{regla.font.nom}</a></p></div> : null}
          <p className="mt-3 text-[13px] text-terciari">{d.nou.seguentPas}</p>
        </div>
      )}
      {!fet ? <p className="mt-2 text-[13px] text-terciari">{d.nou.demoNota}</p> : null}
    </div>
  );
}
