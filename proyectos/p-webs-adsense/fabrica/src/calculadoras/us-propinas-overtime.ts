import { def } from '../lib/def';
import { es, campoEstadoCivil, usd } from '../lib/camposUS';
import { impuestoFederal, estadoCivil } from '../lib/calc/us';

export default def({
  id: 'us-propinas-overtime',
  anual: true,
  campos: [
    { id: 'salarios', tipo: 'numero', def: 40000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salarios del año, con propinas y horas extra (W-2)') },
    { id: 'propinas', tipo: 'numero', def: 8000, min: 0, paso: 100, sufijo: '$', etiqueta: es('Propinas declaradas'), ayuda: es('En efectivo o con tarjeta, en un oficio donde es habitual recibir propina (meseros, bartenders, estilistas, repartidores…).') },
    { id: 'prima', tipo: 'numero', def: 2000, min: 0, paso: 100, sufijo: '$', etiqueta: es('Prima de horas extra'), ayuda: es('Solo la «media» del tiempo y medio: si cobras $20/h y la hora extra a $30, son $10 por hora extra.') },
    campoEstadoCivil(),
  ],
  calcular(v, { P }) {
    const ec = estadoCivil(v.ec);
    const con = impuestoFederal({ ec, salarios: v.salarios, propinas: v.propinas, primaHorasExtra: v.prima, anio: P.anio }, P);
    const sin = impuestoFederal({ ec, salarios: v.salarios, anio: P.anio }, P);
    const ahorro = Math.round((sin.impuestoRenta - con.impuestoRenta) * 100) / 100;
    const avisos = [];
    if (con.propinas.excluido) avisos.push(es('Casados que declaran por separado no pueden usar estas deducciones: tendrían que declarar en conjunto.'));
    if (!con.propinas.vigente) avisos.push(es(`Estas deducciones solo existen de 2025 a 2028; en ${P.anio} no se aplican.`));
    if (con.propinas.reduccion || con.horasExtra.reduccion) avisos.push(es('Tu ingreso pasa del umbral ($150,000, o $300,000 en conjunta): la deducción se reduce.'));
    avisos.push(es('Siguen pagando Seguro Social, Medicare e impuesto estatal: la deducción solo baja el impuesto federal sobre la renta. Necesitas número de Seguro Social válido para trabajar.'));
    return {
      destacado: { e: es('Te ahorras en el impuesto federal'), v: ahorro, nota: es(`Deduces ${usd(con.propinas.deduccion)} de propinas y ${usd(con.horasExtra.deduccion)} de horas extra`) },
      secundarios: [
        { e: es('Deducción por propinas'), v: con.propinas.deduccion },
        { e: es('Deducción por horas extra'), v: con.horasExtra.deduccion },
        { e: es('Tu tipo marginal'), v: sin.marginal, f: 'pct' },
      ],
      filas: [
        { e: es('Impuesto federal sin las deducciones'), v: sin.impuestoRenta },
        { e: es('Deducción por propinas (tope $25,000)'), v: con.propinas.deduccion, signo: '-' },
        { e: es(`Deducción por horas extra (tope ${usd(con.horasExtra.tope || 12500)})`), v: con.horasExtra.deduccion, signo: '-' },
        { e: es('Renta imponible con las deducciones'), v: con.imponible },
        { e: es('Impuesto federal con las deducciones'), v: con.impuestoRenta, fuerte: true },
        { e: es('Ahorro'), v: ahorro, fuerte: true },
      ],
      avisos,
    };
  },
});
