import { def, tt } from '../lib/def';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'retenciones-111-115',
  anual: true,
  campos: [
    { id: 'trimestre', tipo: 'select', def: '4', etiqueta: tt('Trimestre', 'Trimestre'), opciones: [{ v: '1', t: '1T' }, { v: '2', t: '2T' }, { v: '3', t: '3T' }, { v: '4', t: '4T' }] },
    { id: 'nominas', tipo: 'numero', def: 0, min: 0, paso: 1, sufijo: '€', etiqueta: tt('IRPF retenido en nóminas del trimestre', 'IRPF retingut a les nòmines del trimestre') },
    { id: 'profesionales', tipo: 'numero', def: 1500, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Base de facturas de profesionales recibidas', 'Base de factures de professionals rebudes') },
    { id: 'tipoProf', tipo: 'select', def: '15', etiqueta: tt('Retención de esos profesionales', 'Retenció d’aquests professionals'), opciones: [{ v: '15', t: '15 %' }, { v: '7', t: '7 %' }] },
    { id: 'alquiler', tipo: 'numero', def: 2400, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Alquiler del local en el trimestre (base sin IVA)', 'Lloguer del local al trimestre (base sense IVA)') },
  ],
  calcular(v, { P }) {
    const R = P.fiscal.irpf.retenciones;
    const prof = v.profesionales * Number(v.tipoProf) / 100;
    const m111 = v.nominas + prof;
    const m115 = v.alquiler * R.alquiler_pct / 100;
    const plazo = P.fiscal.modelos['111'].plazos[Number(v.trimestre) - 1];
    return {
      destacado: { e: tt('Total a ingresar (111 + 115)', 'Total a ingressar (111 + 115)'), v: r2(m111 + m115), nota: { es: `Plazo: ${plazo}`, ca: `Termini: ${plazo}` } },
      secundarios: [{ e: tt('Modelo 111', 'Model 111'), v: r2(m111) }, { e: tt('Modelo 115', 'Model 115'), v: r2(m115) }],
      filas: [
        { e: tt('Retenciones de trabajo', 'Retencions de treball'), v: v.nominas },
        { e: tt(`Retenciones de profesionales (${v.tipoProf} %)`, `Retencions de professionals (${v.tipoProf} %)`), v: r2(prof) },
        { e: tt('Modelo 111', 'Model 111'), v: r2(m111), fuerte: true },
        { e: tt(`Retención del alquiler (${R.alquiler_pct} %)`, `Retenció del lloguer (${R.alquiler_pct} %)`), v: r2(m115) },
        { e: tt('Modelo 115', 'Model 115'), v: r2(m115), fuerte: true },
      ],
      avisos: [tt('Si en un trimestre no tienes retenciones, el 111 y el 115 no se presentan (salvo que estés dado de alta en esas obligaciones y tu Administración te lo pida). El resumen anual va en los modelos 190 y 180 en enero.', 'Si en un trimestre no tens retencions, el 111 i el 115 no es presenten (llevat que hi estiguis donat d’alta i la teva Administració t’ho demani). El resum anual va als models 190 i 180 al gener.')],
    };
  },
});
