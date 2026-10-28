import { def } from '../lib/def';
import { es, campoEstadoCivil, campoHijos, campoOtrosDep, usd } from '../lib/camposUS';
import { impuestoFederal, estadoCivil } from '../lib/calc/us';

export default def({
  id: 'us-reembolso',
  anual: true,
  campos: [
    { id: 'salarios', tipo: 'numero', def: 45000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salarios del año (W-2, casilla 1)') },
    { id: 'retenido', tipo: 'numero', def: 3500, min: 0, paso: 50, sufijo: '$', etiqueta: es('Impuesto federal retenido (W-2, casilla 2)'), ayuda: es('Suma la casilla 2 de todos tus W-2 y los pagos estimados que hayas hecho.') },
    campoEstadoCivil(), campoHijos, campoOtrosDep,
    { id: 'g1099', tipo: 'numero', def: 0, min: 0, paso: 100, sufijo: '$', etiqueta: es('Ganancia neta de trabajos 1099 (si tienes)'), ayuda: es('Ingresos 1099 menos gastos del negocio.') },
    { id: 'otros_ing', tipo: 'numero', def: 0, min: 0, paso: 100, sufijo: '$', etiqueta: es('Otros ingresos (intereses, desempleo…)') },
    { id: 'propinas', tipo: 'numero', def: 0, min: 0, paso: 100, sufijo: '$', etiqueta: es('Propinas declaradas incluidas en tus salarios') },
    { id: 'prima_he', tipo: 'numero', def: 0, min: 0, paso: 100, sufijo: '$', etiqueta: es('Prima de horas extra (la «media» del tiempo y medio)') },
  ],
  calcular(v, { P }) {
    const r = impuestoFederal({ ec: estadoCivil(v.ec), salarios: v.salarios, retenido: v.retenido, hijos: v.ninos, otrosDependientes: v.otros, gananciaAutonomo: v.g1099, otrosIngresos: v.otros_ing, propinas: v.propinas, primaHorasExtra: v.prima_he, anio: P.anio }, P);
    const reembolso = r.resultado >= 0;
    const avisos = [
      es('No incluye el crédito por ingreso del trabajo (EITC), los créditos por educación o cuidado de niños ni los impuestos estatales: tu reembolso real puede ser mayor.'),
    ];
    if (r.ctc.reembolsable > 0) avisos.push(es(`Incluye ${usd(r.ctc.reembolsable)} de la parte reembolsable del crédito por hijos (ACTC): te los devuelven aunque no debas impuesto.`));
    if (r.propinas.excluido || r.horasExtra.excluido) avisos.push(es('Casados que declaran por separado no pueden usar las deducciones por propinas y horas extra.'));
    return {
      destacado: { e: es(reembolso ? 'Reembolso estimado' : 'Te tocaría pagar'), v: Math.abs(r.resultado), nota: es(`Declaración del año fiscal ${P.anio}, que se presenta en ${P.anio + 1}`) },
      secundarios: [
        { e: es('Impuesto federal total'), v: r.impuestoTotal },
        { e: es('Crédito por hijos aplicado'), v: r.ctc.total },
        { e: es('Tipo efectivo'), v: r.tipoEfectivo, f: 'pct' },
      ],
      filas: [
        { e: es('Ingreso bruto ajustado (AGI)'), v: r.agi },
        { e: es(r.usaEstandar ? 'Deducción estándar' : 'Deducciones detalladas'), v: r.deduccion, signo: '-' },
        ...(r.propinas.deduccion ? [{ e: es('Deducción por propinas (ley de 2025)'), v: r.propinas.deduccion, signo: '-' as const }] : []),
        ...(r.horasExtra.deduccion ? [{ e: es('Deducción por horas extra (ley de 2025)'), v: r.horasExtra.deduccion, signo: '-' as const }] : []),
        ...(r.qbi ? [{ e: es('Deducción por ingreso de negocio (QBI, 20%)'), v: r.qbi, signo: '-' as const }] : []),
        { e: es('Renta imponible'), v: r.imponible },
        { e: es('Impuesto según los tramos'), v: r.impuestoEscala },
        { e: es('Crédito por hijos y dependientes (no reembolsable)'), v: r.ctc.noReembolsable, signo: '-' },
        ...(r.se.total ? [{ e: es('Impuesto de trabajo por cuenta propia'), v: r.se.total, signo: '+' as const }] : []),
        { e: es('Impuesto total'), v: r.impuestoTotal, fuerte: true },
        { e: es('Retenido y pagado'), v: v.retenido },
        { e: es('Crédito reembolsable (ACTC)'), v: r.ctc.reembolsable },
        { e: es(reembolso ? 'Reembolso' : 'A pagar'), v: Math.abs(r.resultado), fuerte: true },
      ],
      avisos,
    };
  },
});
