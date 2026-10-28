import { def, tt } from '../lib/def';
import { porcentajePension } from '../lib/calc/laboral';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'pension-jubilacion',
  anual: true,
  campos: [
    { id: 'anios', tipo: 'numero', def: 33, min: 0, max: 50, paso: 1, etiqueta: tt('Años cotizados al jubilarte', 'Anys cotitzats en jubilar-te') },
    { id: 'meses', tipo: 'numero', def: 0, min: 0, max: 11, paso: 1, etiqueta: tt('Meses adicionales', 'Mesos addicionals') },
    { id: 'base', tipo: 'numero', def: 2000, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Media mensual de tus bases de cotización (últimos 25 años)', 'Mitjana mensual de les teves bases de cotització (últims 25 anys)'), ayuda: tt('La calculadora la convierte en base reguladora: 300 bases mensuales entre 350, porque la pensión se cobra en 14 pagas.', 'La calculadora la converteix en base reguladora: 300 bases mensuals entre 350, perquè la pensió es cobra en 14 pagues.') },
  ],
  calcular(v, { P }) {
    const meses = v.anios * 12 + v.meses;
    const pct = porcentajePension(meses, P.laboral);
    const max = P.laboral.jubilacion.pension_maxima_mensual;
    const br = v.base * 300 / 350;
    let pension = br * pct / 100;
    const topada = pension > max;
    if (topada) pension = max;
    const tabla = [15, 20, 25, 30, 33, 35, 36, 37, 38].map((a) => [`${a}`, porcentajePension(a * 12, P.laboral)]);
    return {
      destacado: { e: tt('Pensión mensual estimada (14 pagas)', 'Pensió mensual estimada (14 pagues)'), v: r2(pension) },
      secundarios: [{ e: tt('Base reguladora', 'Base reguladora'), v: Math.round(br * 100) / 100 }, { e: tt('Porcentaje sobre la base', 'Percentatge sobre la base'), v: pct, f: 'pct' }, { e: tt('Pensión anual', 'Pensió anual'), v: r2(pension * 14) }],
      tablas: [{ titulo: tt('Porcentaje según años cotizados', 'Percentatge segons anys cotitzats'), cab: [tt('Años', 'Anys'), tt('Porcentaje', 'Percentatge')], formatos: ['txt', 'pct'], filas: tabla }],
      avisos: [
        ...(topada ? [tt(`Se aplica la pensión máxima de ${max} € al mes.`, `S’aplica la pensió màxima de ${max} € al mes.`)] : []),
        ...(pct === 0 ? [tt('Con menos de 15 años cotizados no hay pensión contributiva.', 'Amb menys de 15 anys cotitzats no hi ha pensió contributiva.')] : []),
        tt('Estimación para jubilación a la edad ordinaria, sin coeficientes reductores, complementos por mínimos ni complemento por brecha de género.', 'Estimació per a jubilació a l’edat ordinària, sense coeficients reductors, complements per mínims ni complement per bretxa de gènere.'),
      ],
    };
  },
});
