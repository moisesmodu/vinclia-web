import { def } from '../lib/def';
import { es, campoEstadoCivil, campoFrecuencia, campoHijos, campoOtrosDep, usd } from '../lib/camposUS';
import { retencionFederal, impuestoFederal, estadoCivil } from '../lib/calc/us';

export default def({
  id: 'us-w4',
  anual: true,
  campos: [
    { id: 'salario', tipo: 'numero', def: 50000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salario anual de este trabajo') },
    campoFrecuencia, campoEstadoCivil(true), campoHijos, campoOtrosDep,
    { id: 'paso2', tipo: 'casilla', def: false, etiqueta: es('Marcar la casilla del paso 2 (dos trabajos)') },
    { id: 'extra', tipo: 'numero', def: 0, min: 0, paso: 5, sufijo: '$', etiqueta: es('Retención extra por cheque (paso 4c)') },
    { id: 'meta', tipo: 'numero', def: 0, min: 0, paso: 50, sufijo: '$', etiqueta: es('Reembolso que te gustaría recibir') },
  ],
  calcular(v, { P }) {
    const F = P.fiscal;
    const ec = estadoCivil(v.ec);
    const per = P.laboral.periodos_pago[v.frecuencia] ?? 26;
    const paso3 = v.ninos * F.credito_hijos.por_hijo + v.otros * F.credito_hijos.otros_dependientes;
    const ret = retencionFederal({ salarioAnual: v.salario, ec, paso2: !!v.paso2, paso3, extra4c: v.extra, periodos: per }, F);
    const dec = impuestoFederal({ ec, salarios: v.salario, hijos: v.ninos, otrosDependientes: v.otros, retenido: ret.anual, anio: P.anio }, P);
    // Diferencias de menos de $1 son redondeo de la retención por cheque
    const res = Math.abs(dec.resultado) < 1 ? 0 : dec.resultado;
    const falta = v.meta - res >= 1 ? v.meta - res : 0;
    const sobra = res - v.meta >= 1 ? res - v.meta : 0;
    const ajuste = Math.ceil(falta / per);
    const avisos = [];
    if (ajuste > 0) avisos.push(es(`Para llegar a ${usd(v.meta)} de reembolso escribe ${usd(ajuste + (v.extra || 0))} en el paso 4c del W-4.`));
    else if (sobra > 0 && v.extra > 0) avisos.push(es(`Te retienen ${usd(sobra)} más de lo que necesitas para tu meta: puedes bajar el paso 4c a ${usd(Math.max(0, v.extra - Math.floor(sobra / per)))}.`));
    else if (sobra > 0) avisos.push(es(`Te retienen ${usd(sobra)} más de lo necesario para tu meta: es un préstamo sin intereses al IRS. Para cobrarlo en cada cheque, revisa los pasos 3 y 4b del W-4.`));
    avisos.push(es('Supone un solo trabajo todo el año y la deducción estándar. Con dos trabajos, usa el estimador del IRS (Tax Withholding Estimator) o marca la casilla del paso 2 en los dos W-4.'));
    return {
      destacado: { e: es(res === 0 ? 'Tu retención cuadra: ni reembolso ni pago' : res > 0 ? 'Reembolso esperado con este W-4' : 'Deberías pagar con este W-4'), v: Math.abs(res), nota: es(`Te retienen ${usd(ret.porPeriodo, 2)} de impuesto federal por cheque`) },
      secundarios: [
        { e: es('Retención por cheque'), v: ret.porPeriodo },
        { e: es('Retención anual'), v: ret.anual },
        { e: es('Impuesto real del año'), v: dec.impuestoRenta },
      ],
      filas: [
        { e: es('Paso 3: créditos por dependientes'), v: paso3 },
        { e: es('Retención anual con este W-4'), v: ret.anual },
        { e: es('Impuesto federal del año'), v: dec.impuestoEscala },
        { e: es('Crédito por hijos (incluida la parte reembolsable)'), v: dec.ctc.total, signo: '-' },
        { e: es(res >= 0 ? 'Reembolso' : 'A pagar'), v: Math.abs(res), fuerte: true },
        { e: es('Paso 4c recomendado para tu meta'), v: ajuste + (v.extra || 0), sub: true },
      ],
      avisos,
    };
  },
});
