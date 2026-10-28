import { def, tt } from '../lib/def';
import { campoContrato, camposFamilia, familia, CONCEPTOS_SS } from '../lib/campos';
import { cotizacion } from '../lib/calc/ss';
import { retencion } from '../lib/calc/irpf';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'nomina',
  anual: true,
  campos: [
    { id: 'base', tipo: 'numero', def: 1500, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Salario base mensual', 'Salari base mensual') },
    { id: 'complementos', tipo: 'numero', def: 200, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Complementos salariales al mes (antigüedad, plus…)', 'Complements salarials al mes (antiguitat, plus…)') },
    { id: 'extras', tipo: 'select', def: 'aparte', etiqueta: tt('Pagas extra', 'Pagues extra'), opciones: [
      { v: 'aparte', t: tt('2 pagas extra aparte (junio y diciembre)', '2 pagues extra a part (juny i desembre)') },
      { v: 'prorrata', t: tt('Prorrateadas en cada nómina', 'Prorratejades a cada nòmina') },
    ] },
    { id: 'importeExtra', tipo: 'numero', def: 1500, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Importe de cada paga extra', 'Import de cada paga extra'), ayuda: tt('Normalmente el salario base más la antigüedad: mira tu convenio.', 'Normalment el salari base més l’antiguitat: mira el teu conveni.') },
    { id: 'noSalarial', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Percepciones no salariales (dietas, plus transporte exentos)', 'Percepcions no salarials (dietes, plus transport exempts)') },
    campoContrato, ...camposFamilia,
  ],
  calcular(v, { P }) {
    const anual = (v.base + v.complementos) * 12 + v.importeExtra * 2;
    const ss = cotizacion({ brutoAnual: anual, contrato: v.contrato }, P.laboral);
    const ret = retencion({ brutoAnual: anual, ssAnual: ss.trabajador.anual, contratoInferiorAno: v.contrato === 'temporal', ...familia(v) }, P.fiscal);
    const prorrata = v.extras === 'prorrata' ? v.importeExtra * 2 / 12 : 0;
    const devengado = v.base + v.complementos + prorrata + v.noSalarial;
    const irpf = (devengado - v.noSalarial) * ret.tipo / 100;
    const liquido = devengado - ss.trabajador.mensual - irpf;
    const lineasSS = ss.trabajador.lineas.map((l) => ({ e: tt(`${CONCEPTOS_SS[l.concepto].es}${l.tipo ? ` (${l.tipo} %)` : ''}`, `${CONCEPTOS_SS[l.concepto].ca}${l.tipo ? ` (${l.tipo} %)` : ''}`), v: l.importe, sub: true, signo: '-' as const }));
    return {
      destacado: { e: tt('Líquido a percibir', 'Líquid a percebre'), v: r2(liquido) },
      secundarios: [
        { e: tt('Total devengado', 'Total meritat'), v: r2(devengado) },
        { e: tt('Base de cotización', 'Base de cotització'), v: ss.base },
        { e: tt('Retención IRPF', 'Retenció IRPF'), v: ret.tipo, f: 'pct' },
      ],
      filas: [
        { e: tt('Salario base', 'Salari base'), v: v.base, sub: true },
        { e: tt('Complementos salariales', 'Complements salarials'), v: v.complementos, sub: true },
        ...(prorrata ? [{ e: tt('Prorrata de pagas extra', 'Prorrata de pagues extra'), v: r2(prorrata), sub: true }] : []),
        ...(v.noSalarial ? [{ e: tt('Percepciones no salariales', 'Percepcions no salarials'), v: v.noSalarial, sub: true }] : []),
        { e: tt('A. Total devengado', 'A. Total meritat'), v: r2(devengado), fuerte: true },
        ...lineasSS,
        { e: tt(`Retención IRPF (${ret.tipo} %)`, `Retenció IRPF (${ret.tipo} %)`), v: r2(irpf), sub: true, signo: '-' },
        { e: tt('B. Total a deducir', 'B. Total a deduir'), v: r2(ss.trabajador.mensual + irpf), fuerte: true },
        { e: tt('Líquido (A − B)', 'Líquid (A − B)'), v: r2(liquido), fuerte: true },
        { e: tt('Aportación de la empresa a la Seguridad Social', 'Aportació de l’empresa a la Seguretat Social'), v: ss.empresa.mensual },
      ],
      avisos: v.extras === 'aparte' ? [tt(`En junio y diciembre cobrarás además la paga extra: unos ${Math.round(v.importeExtra * (1 - ret.tipo / 100))} € netos, porque solo lleva IRPF.`, `Al juny i al desembre cobraràs a més la paga extra: uns ${Math.round(v.importeExtra * (1 - ret.tipo / 100))} € nets, perquè només porta IRPF.`)] : [],
    };
  },
});
