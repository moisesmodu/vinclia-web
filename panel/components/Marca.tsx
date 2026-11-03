import type { Identidad } from '@/lib/data';

export default function Marca({ m }: { m: Identidad }) {
  const colores = Object.entries(m.colores).filter(([k]) => k !== 'texto');
  return (
    <section className="identidad">
      <h2>Marca e identidad</h2>
      <div className="marca-cab">
        <div className="marca-logo" dangerouslySetInnerHTML={{ __html: m.logo }} />
        <div>
          <p className="marca-promesa">{m.promesa.es ?? Object.values(m.promesa)[0]}</p>
          <p className="marca-meta">Familia <b>{m.familiaNombre}</b> · {m.dominio}{m.alternativas.length ? ` · alternativas: ${m.alternativas.join(', ')}` : ''}</p>
        </div>
      </div>
      <div className="marca-grid">
        <div>
          <h3>Colores</h3>
          <ul className="muestras">
            {colores.map(([k, v]) => <li key={k}><span style={{ background: v }} /><code>{v}</code><small>{k}</small></li>)}
            <li><span style={{ background: m.acento }} /><code>{m.acento}</code><small>acento del producto</small></li>
          </ul>
          <h3>Tipografía</h3>
          <p><b style={{ fontFamily: `'${m.tipografia.titulos}', sans-serif` }}>{m.tipografia.titulos}</b> para títulos · {m.tipografia.texto} para texto</p>
        </div>
        <div>
          <h3>Promesa</h3>
          <ul>{Object.entries(m.promesa).map(([k, v]) => <li key={k}><small>{k}</small> {v}</li>)}</ul>
          <h3>Personalidad y voz</h3>
          <p>{m.personalidad}</p>
          <p>{m.voz}</p>
          <p className="marca-meta">Motivo: {m.motivo}</p>
        </div>
      </div>
    </section>
  );
}
