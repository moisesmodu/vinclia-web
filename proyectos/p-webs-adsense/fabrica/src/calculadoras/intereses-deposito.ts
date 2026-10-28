import { def, tt } from '../lib/def';
import { interesesDeposito } from '../lib/calc/fiscal';

export default def({
  id: 'intereses-deposito',
  anual: true,
  campos: [
    { id: 'capital', tipo: 'numero', def: 20000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Capital', 'Capital') },
    { id: 'tin', tipo: 'numero', def: 2.5, min: 0, max: 20, paso: 0.01, sufijo: '%', etiqueta: tt('Interés nominal anual (TIN)', 'Interès nominal anual (TIN)') },
    { id: 'meses', tipo: 'numero', def: 12, min: 1, max: 120, paso: 1, etiqueta: tt('Plazo en meses', 'Termini en mesos') },
  ],
  calcular(v, { P }) {
    const r = interesesDeposito({ capital: v.capital, tin: v.tin, meses: v.meses }, P.fiscal);
    return {
      destacado: { e: tt('Intereses netos (tras retención)', 'Interessos nets (després de retenció)'), v: r.neto },
      secundarios: [{ e: tt('Intereses brutos', 'Interessos bruts'), v: r.bruto }, { e: tt('Retención del 19 %', 'Retenció del 19 %'), v: r.retencion }],
      filas: [{ e: tt('Impuesto final en la renta (escala del ahorro)', 'Impost final a la renda (escala de l’estalvi)'), v: r.cuotaFinal }, { e: tt('Diferencia a pagar en la renta', 'Diferència a pagar a la renda'), v: r.diferencia }],
      avisos: [tt('Si los intereses de todos tus productos superan 6.000 € al año, el exceso tributa al 21 % o más y en la renta pagarás la diferencia.', 'Si els interessos de tots els teus productes superen 6.000 € l’any, l’excés tributa al 21 % o més i a la renda pagaràs la diferència.')],
    };
  },
});
