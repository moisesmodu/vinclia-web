import { def, tt } from '../lib/def';
import { finiquito, indemnizacion } from '../lib/calc/laboral';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'finiquito',
  anual: true,
  campos: [
    { id: 'salario', tipo: 'numero', def: 1600, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Salario bruto mensual (una paga)', 'Salari brut mensual (una paga)') },
    { id: 'pagas', tipo: 'select', def: '14', etiqueta: tt('Pagas', 'Pagues'), opciones: [{ v: '14', t: tt('14 (extras aparte)', '14 (extres a part)') }, { v: '12', t: tt('12 (extras prorrateadas)', '12 (extres prorratejades)') }] },
    { id: 'inicio', tipo: 'fecha', def: '2022-03-01', etiqueta: tt('Fecha de inicio del contrato', 'Data d’inici del contracte') },
    { id: 'fin', tipo: 'fecha', def: '2026-11-15', etiqueta: tt('Último día trabajado', 'Últim dia treballat') },
    { id: 'disfrutadas', tipo: 'numero', def: 15, min: 0, max: 60, paso: 1, etiqueta: tt('Días de vacaciones ya disfrutados este año', 'Dies de vacances ja gaudits aquest any') },
    { id: 'vacAnuales', tipo: 'numero', def: 30, min: 30, max: 40, paso: 1, etiqueta: tt('Días naturales de vacaciones al año (convenio)', 'Dies naturals de vacances l’any (conveni)') },
    { id: 'devengo', tipo: 'select', def: 'semestral', etiqueta: tt('Devengo de las pagas extra', 'Meritació de les pagues extra'), opciones: [{ v: 'semestral', t: tt('Semestral', 'Semestral') }, { v: 'anual', t: tt('Anual', 'Anual') }], si: (v) => v.pagas === '14' },
    { id: 'motivo', tipo: 'select', def: 'voluntaria', etiqueta: tt('Motivo de la salida', 'Motiu de la sortida'), opciones: [
      { v: 'voluntaria', t: tt('Baja voluntaria (sin indemnización)', 'Baixa voluntària (sense indemnització)') },
      { v: 'temporal', t: tt('Fin de contrato temporal (12 días por año)', 'Fi de contracte temporal (12 dies per any)') },
      { v: 'objetivo', t: tt('Despido objetivo (20 días por año)', 'Acomiadament objectiu (20 dies per any)') },
      { v: 'improcedente', t: tt('Despido improcedente (33 días por año)', 'Acomiadament improcedent (33 dies per any)') },
    ] },
  ],
  calcular(v, { P }) {
    const pagas = Number(v.pagas) as 12 | 14;
    const f = finiquito({ salarioMensual: v.salario, pagas, inicioContrato: v.inicio, fin: v.fin, vacacionesDisfrutadas: v.disfrutadas, diasVacacionesAnuales: v.vacAnuales, devengoExtras: v.devengo }, P.laboral);
    const ind = v.motivo === 'voluntaria' ? null : indemnizacion({ inicio: v.inicio, fin: v.fin, brutoAnual: v.salario * pagas, tipo: v.motivo }, P.laboral);
    const total = f.total + (ind?.importe ?? 0);
    const N = { verano: tt('Parte proporcional paga de verano', 'Part proporcional paga d’estiu'), navidad: tt('Parte proporcional paga de Navidad', 'Part proporcional paga de Nadal') } as const;
    return {
      destacado: { e: ind ? tt('Finiquito más indemnización (bruto)', 'Quitança més indemnització (brut)') : tt('Finiquito bruto', 'Quitança bruta'), v: r2(total) },
      secundarios: [
        { e: tt('Vacaciones pendientes', 'Vacances pendents'), v: f.vacacionesPendientes, f: 'dias' },
        { e: tt('Salario diario', 'Salari diari'), v: f.diario },
        ...(ind ? [{ e: tt('Indemnización', 'Indemnització'), v: ind.importe }] : []),
      ],
      reparto: [{ e: tt('Salario del mes', 'Salari del mes'), v: f.salarioMes }, { e: tt('Vacaciones', 'Vacances'), v: f.importeVacaciones }, { e: tt('Pagas extra', 'Pagues extra'), v: r2(f.extras.reduce((a: number, x: any) => a + x.importe, 0)) }, ...(ind ? [{ e: tt('Indemnización', 'Indemnització'), v: ind.importe }] : [])],
      filas: [
        { e: tt(`Salario de los ${f.diasMes} días del último mes`, `Salari dels ${f.diasMes} dies de l’últim mes`), v: f.salarioMes },
        { e: tt(`Vacaciones no disfrutadas (${f.vacacionesPendientes} días)`, `Vacances no gaudides (${f.vacacionesPendientes} dies)`), v: f.importeVacaciones },
        ...f.extras.map((x) => ({ e: N[x.nombre as 'verano' | 'navidad'], v: x.importe, sub: true })),
        { e: tt('Finiquito', 'Quitança'), v: f.total, fuerte: true },
        ...(ind ? [{ e: tt(`Indemnización (${ind.dias} días de salario)`, `Indemnització (${ind.dias} dies de salari)`), v: ind.importe }, { e: tt('Total', 'Total'), v: r2(total), fuerte: true }] : []),
      ],
      avisos: [
        tt('El salario, las vacaciones y las pagas extra del finiquito cotizan y llevan IRPF; la indemnización legal está exenta.', 'El salari, les vacances i les pagues extra de la quitança cotitzen i porten IRPF; la indemnització legal està exempta.'),
        tt('Puedes firmar el finiquito como «no conforme» si no estás de acuerdo con las cifras.', 'Pots signar la quitança com a «no conforme» si no estàs d’acord amb les xifres.'),
      ],
    };
  },
});
