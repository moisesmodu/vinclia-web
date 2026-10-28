import { def, tt } from '../lib/def';
import { indemnizacion } from '../lib/calc/laboral';

export default def({
  id: 'indemnizacion-despido',
  anual: true,
  campos: [
    { id: 'inicio', tipo: 'fecha', def: '2010-05-03', etiqueta: tt('Fecha de inicio de la relación laboral', 'Data d’inici de la relació laboral') },
    { id: 'fin', tipo: 'fecha', def: '2026-11-30', etiqueta: tt('Fecha del despido', 'Data de l’acomiadament') },
    { id: 'bruto', tipo: 'numero', def: 28000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Salario bruto anual (con pagas extra y complementos)', 'Salari brut anual (amb pagues extra i complements)') },
    { id: 'tipo', tipo: 'select', def: 'improcedente', etiqueta: tt('Tipo de despido o extinción', 'Tipus d’acomiadament o extinció'), opciones: [
      { v: 'improcedente', t: tt('Improcedente (33 días; 45 antes de 2012)', 'Improcedent (33 dies; 45 abans del 2012)') },
      { v: 'objetivo', t: tt('Objetivo o ERE (20 días, máx. 12 mensualidades)', 'Objectiu o ERO (20 dies, màx. 12 mensualitats)') },
      { v: 'temporal', t: tt('Fin de contrato temporal (12 días)', 'Fi de contracte temporal (12 dies)') },
      { v: 'procedente', t: tt('Disciplinario procedente (sin indemnización)', 'Disciplinari procedent (sense indemnització)') },
    ] },
  ],
  calcular(v, { P }) {
    const r = indemnizacion({ inicio: v.inicio, fin: v.fin, brutoAnual: v.bruto, tipo: v.tipo }, P.laboral);
    const avisos = [];
    if (r.tope === '24') avisos.push(tt('Se aplica el tope de 24 mensualidades (720 días).', 'S’aplica el límit de 24 mensualitats (720 dies).'));
    if (r.tope === 'tramo1') avisos.push(tt('Lo generado antes del 12/02/2012 supera 720 días: se cobra eso sin sumar el segundo tramo.', 'El que s’ha generat abans del 12/02/2012 supera 720 dies: es cobra això sense sumar el segon tram.'));
    if (r.tope === '42') avisos.push(tt('Se aplica el tope máximo de 42 mensualidades (1.260 días).', 'S’aplica el límit màxim de 42 mensualitats (1.260 dies).'));
    if (r.tope === 'objetivo') avisos.push(tt('Se aplica el tope de 12 mensualidades del despido objetivo.', 'S’aplica el límit de 12 mensualitats de l’acomiadament objectiu.'));
    avisos.push(tt('La indemnización legal por despido está exenta de IRPF hasta 180.000 €.', 'La indemnització legal per acomiadament està exempta d’IRPF fins a 180.000 €.'));
    return {
      destacado: { e: tt('Indemnización', 'Indemnització'), v: r.importe },
      secundarios: [{ e: tt('Días de salario', 'Dies de salari'), v: r.dias, f: 'dias' }, { e: tt('Salario diario', 'Salari diari'), v: r.diario }],
      tablas: r.tramos.length ? [{ titulo: tt('Detalle por tramos', 'Detall per trams'), cab: [tt('Desde', 'Des de'), tt('Hasta', 'Fins a'), tt('Meses', 'Mesos'), tt('Días/año', 'Dies/any'), tt('Días', 'Dies')], formatos: ['fecha', 'fecha', 'num0', 'num0', 'num'], filas: r.tramos.map((t) => [t.desde, t.hasta, t.meses, t.diasPorAno, t.dias]) }] : [],
      avisos,
    };
  },
});
