import { def, tt } from '../lib/def';
import { campoContrato, CONCEPTOS_SS } from '../lib/campos';
import { cotizacion } from '../lib/calc/ss';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'coste-empresa',
  anual: true,
  campos: [
    { id: 'bruto', tipo: 'numero', def: 25000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Salario bruto anual del trabajador', 'Salari brut anual del treballador') },
    campoContrato,
    { id: 'atep', tipo: 'numero', def: 1.5, min: 0, max: 8, paso: 0.05, sufijo: '%', etiqueta: tt('Tipo de accidentes de trabajo (según actividad)', 'Tipus d’accidents de treball (segons activitat)'), ayuda: tt('Depende del código CNAE: 1,5 % es una referencia de oficina.', 'Depèn del codi CNAE: 1,5 % és una referència d’oficina.') },
  ],
  calcular(v, { P }) {
    const L = { ...P.laboral, cotizacion: { ...P.laboral.cotizacion, empresa: { ...P.laboral.cotizacion.empresa, at_ep_referencia: v.atep } } };
    const ss = cotizacion({ brutoAnual: v.bruto, contrato: v.contrato }, L);
    const total = v.bruto + ss.empresa.anual;
    return {
      destacado: { e: tt('Coste anual para la empresa', 'Cost anual per a l’empresa'), v: r2(total) },
      secundarios: [
        { e: tt('Coste mensual (12 meses)', 'Cost mensual (12 mesos)'), v: r2(total / 12) },
        { e: tt('Seguridad Social a cargo de la empresa', 'Seguretat Social a càrrec de l’empresa'), v: ss.empresa.anual },
        { e: tt('Sobre el bruto', 'Sobre el brut'), v: r2(ss.empresa.anual / Math.max(1, v.bruto) * 100), f: 'pct' },
      ],
      reparto: [{ e: tt('Para el trabajador (antes de IRPF)', 'Per al treballador (abans d’IRPF)'), v: r2(v.bruto - ss.trabajador.anual) }, { e: tt('Seguridad Social del trabajador', 'Seguretat Social del treballador'), v: ss.trabajador.anual }, { e: tt('Seguridad Social de la empresa', 'Seguretat Social de l’empresa'), v: ss.empresa.anual }],
      filas: [
        ...ss.empresa.lineas.map((l) => ({ e: tt(`${CONCEPTOS_SS[l.concepto].es}${l.tipo ? ` (${l.tipo} %)` : ''}`, `${CONCEPTOS_SS[l.concepto].ca}${l.tipo ? ` (${l.tipo} %)` : ''}`), v: r2(l.importe * 12), sub: true })),
        { e: tt('Total cotización empresa al año', 'Total cotització empresa a l’any'), v: ss.empresa.anual, fuerte: true },
        { e: tt('Base de cotización mensual', 'Base de cotització mensual'), v: ss.base },
      ],
      avisos: [tt('No incluye convenios con seguros, formación, prevención de riesgos ni bonificaciones a la contratación.', 'No inclou convenis amb assegurances, formació, prevenció de riscos ni bonificacions a la contractació.')],
    };
  },
});
