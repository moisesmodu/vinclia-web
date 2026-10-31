import { def, tt } from '../lib/def';
import { campoComunidad } from '../lib/campos';
import { tipoMarginalIRPF } from '../lib/calc/fiscal';
import { tipoMarginal, sumarEscalas } from '../lib/calc/base';
import { escalaAutonomica } from '../lib/calc/irpf';

export default def({
  id: 'tipo-marginal-irpf',
  anual: true,
  campos: [
    { id: 'base', tipo: 'numero', def: 35000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Base liquidable general', 'Base liquidable general'), ayuda: tt('Para un asalariado, aproximadamente el bruto menos la Seguridad Social y 2.000 €.', 'Per a un assalariat, aproximadament el brut menys la Seguretat Social i 2.000 €.') },
    campoComunidad(),
  ],
  calcular(v, { P }) {
    const r = tipoMarginalIRPF({ base: v.base, ccaa: v.ccaa }, P.fiscal);
    const esc = sumarEscalas(P.fiscal.irpf.escala_estatal, escalaAutonomica(P.fiscal, v.ccaa).escala);
    let desde = 0;
    const filas = esc.map((t) => { const fila = [`${desde.toLocaleString('es-ES')} – ${t.hasta == null ? '∞' : t.hasta.toLocaleString('es-ES')}`, t.tipo]; desde = t.hasta ?? desde; return fila; });
    return {
      destacado: { e: tt('Tu tipo marginal de IRPF', 'El teu tipus marginal d’IRPF'), v: r.tipoMarginal, f: 'pct', nota: tt(`De cada 100 € más, pagarías ${r.extraPor100} €`, `De cada 100 € més, pagaries ${r.extraPor100} €`) },
      secundarios: [{ e: tt('Tipo medio', 'Tipus mitjà'), v: r.tipoMedio, f: 'pct' }, { e: tt('Cuota total', 'Quota total'), v: r.total }],
      tablas: [{ titulo: tt('Escala combinada (estatal + autonómica)', 'Escala combinada (estatal + autonòmica)'), cab: [tt('Base (€)', 'Base (€)'), tt('Tipo marginal', 'Tipus marginal')], formatos: ['txt', 'pct'], filas }],
      avisos: [tt('Cálculo con el mínimo personal general y sin deducciones. El tipo marginal es el que se aplica al último euro: los euros anteriores tributan a tipos más bajos.', 'Càlcul amb el mínim personal general i sense deduccions. El tipus marginal és el que s’aplica a l’últim euro: els euros anteriors tributen a tipus més baixos.')],
    };
    void tipoMarginal;
  },
});
