import { def, tt } from '../lib/def';
import { campoContrato, camposFamilia, familia } from '../lib/campos';
import { cotizacion } from '../lib/calc/ss';
import { retencion, limiteExento } from '../lib/calc/irpf';

export default def({
  id: 'retencion-irpf',
  anual: true,
  campos: [
    { id: 'bruto', tipo: 'numero', def: 28000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Retribución bruta anual', 'Retribució bruta anual') },
    campoContrato, ...camposFamilia,
  ],
  calcular(v, { P }) {
    const fam = familia(v);
    const ss = cotizacion({ brutoAnual: v.bruto, contrato: v.contrato }, P.laboral);
    const r = retencion({ brutoAnual: v.bruto, ssAnual: ss.trabajador.anual, contratoInferiorAno: v.contrato === 'temporal', ...fam }, P.fiscal);
    const lim = limiteExento(P.fiscal, fam);
    return {
      destacado: { e: tt('Tipo de retención de IRPF', 'Tipus de retenció d’IRPF'), v: r.tipo, f: 'pct' },
      secundarios: [
        { e: tt('Retención anual', 'Retenció anual'), v: r.importe },
        { e: tt('Retención al mes (12 pagas)', 'Retenció al mes (12 pagues)'), v: Math.round(r.importe / 12 * 100) / 100 },
      ],
      filas: [
        { e: tt('Retribución anual', 'Retribució anual'), v: v.bruto },
        { e: tt('Cotizaciones a la Seguridad Social', 'Cotitzacions a la Seguretat Social'), v: ss.trabajador.anual, signo: '-' },
        { e: tt('Otros gastos deducibles', 'Altres despeses deduïbles'), v: r.gastos, signo: '-' },
        { e: tt('Reducción por rendimientos del trabajo', 'Reducció per rendiments del treball'), v: r.reduccion, signo: '-' },
        { e: tt('Base para calcular el tipo de retención', 'Base per calcular el tipus de retenció'), v: r.base, fuerte: true },
        { e: tt('Mínimo personal y familiar', 'Mínim personal i familiar'), v: r.minimo },
        { e: tt('Cuota de retención', 'Quota de retenció'), v: r.cuota, fuerte: true },
        ...(lim ? [{ e: tt('Límite exento de retención para tu situación', 'Límit exempt de retenció per a la teva situació'), v: lim, sub: true }] : []),
      ],
      avisos: [
        ...(r.exento ? [tt('Por debajo del límite exento no se practica retención.', 'Per sota del límit exempt no es practica retenció.')] : []),
        ...(r.limite43 ? [tt('Se aplica el límite del 43 % del exceso sobre el mínimo exento.', 'S’aplica el límit del 43 % de l’excés sobre el mínim exempt.')] : []),
        tt('Puedes pedir a tu empresa una retención más alta (modelo 145) para que no te salga a pagar la renta, pero nunca una más baja.', 'Pots demanar a la teva empresa una retenció més alta (model 145) perquè no et surti a pagar la renda, però mai una de més baixa.'),
      ],
    };
  },
});
