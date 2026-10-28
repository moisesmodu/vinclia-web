import { def, tt } from '../lib/def';
import { interesesDemora } from '../lib/calc/fiscal';

export default def({
  id: 'intereses-demora',
  anual: true,
  campos: [
    { id: 'importe', tipo: 'numero', def: 3000, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Deuda', 'Deute') },
    { id: 'desde', tipo: 'fecha', def: '2026-01-30', etiqueta: tt('Fin del plazo de pago', 'Fi del termini de pagament') },
    { id: 'hasta', tipo: 'fecha', def: '2026-11-15', etiqueta: tt('Fecha de pago', 'Data de pagament') },
    { id: 'clase', tipo: 'select', def: 'demora', etiqueta: tt('Tipo de interés', 'Tipus d’interès'), opciones: [{ v: 'demora', t: tt('Interés de demora tributario', 'Interès de demora tributari') }, { v: 'legal', t: tt('Interés legal del dinero', 'Interès legal dels diners') }] },
  ],
  calcular(v, { P }) {
    const tipo = v.clase === 'legal' ? P.fiscal.interes_legal_dinero_pct : P.fiscal.interes_demora_pct;
    const r = interesesDemora({ importe: v.importe, desde: v.desde, hasta: v.hasta, tipo }, P.fiscal);
    return {
      destacado: { e: tt('Intereses', 'Interessos'), v: r.intereses, nota: { es: `${r.dias} días al ${r.tipo} % anual`, ca: `${r.dias} dies al ${r.tipo} % anual` } },
      secundarios: [{ e: tt('Total con intereses', 'Total amb interessos'), v: Math.round((v.importe + r.intereses) * 100) / 100 }],
      filas: [{ e: tt('Interés de demora del año', 'Interès de demora de l’any'), v: P.fiscal.interes_demora_pct, f: 'pct' }, { e: tt('Interés legal del dinero del año', 'Interès legal dels diners de l’any'), v: P.fiscal.interes_legal_dinero_pct, f: 'pct' }],
      avisos: [tt('Cálculo con el tipo del año seleccionado para todo el periodo. Si la deuda abarca varios años, Hacienda aplica el tipo de cada año a sus días.', 'Càlcul amb el tipus de l’any seleccionat per a tot el període. Si el deute abasta diversos anys, Hisenda aplica el tipus de cada any als seus dies.')],
    };
  },
});
