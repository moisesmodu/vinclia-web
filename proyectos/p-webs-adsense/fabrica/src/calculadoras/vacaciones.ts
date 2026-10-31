import { def, tt } from '../lib/def';
import { r2, diasEntre } from '../lib/calc/base';

export default def({
  id: 'vacaciones',
  campos: [
    { id: 'desde', tipo: 'fecha', def: '2026-03-16', etiqueta: tt('Inicio del periodo trabajado (o 1 de enero)', 'Inici del període treballat (o 1 de gener)') },
    { id: 'hasta', tipo: 'fecha', def: '2026-12-31', etiqueta: tt('Fin del periodo (o 31 de diciembre)', 'Fi del període (o 31 de desembre)') },
    { id: 'tipoDias', tipo: 'select', def: 'naturales', etiqueta: tt('Tu convenio cuenta las vacaciones en', 'El teu conveni compta les vacances en'), opciones: [{ v: 'naturales', t: tt('Días naturales', 'Dies naturals') }, { v: 'laborables', t: tt('Días laborables', 'Dies laborables') }] },
    { id: 'diasAnio', tipo: 'numero', def: 30, min: 1, max: 40, paso: 1, etiqueta: tt('Días de vacaciones al año', 'Dies de vacances l’any') },
    { id: 'disfrutados', tipo: 'numero', def: 0, min: 0, paso: 1, etiqueta: tt('Días ya disfrutados', 'Dies ja gaudits') },
    { id: 'bruto', tipo: 'numero', def: 24000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Salario bruto anual (para valorar las no disfrutadas)', 'Salari brut anual (per valorar les no gaudides)') },
  ],
  calcular(v) {
    const y = +v.hasta.slice(0, 4);
    const diasAno = y % 4 === 0 ? 366 : 365;
    const trabajados = Math.max(0, diasEntre(v.desde, v.hasta));
    const generados = v.diasAnio * Math.min(trabajados, diasAno) / diasAno;
    const pendientes = Math.max(0, generados - v.disfrutados);
    const valorDia = v.tipoDias === 'naturales' ? v.bruto / 365 : v.bruto / 365 * 30 / 22;
    return {
      destacado: { e: tt('Días de vacaciones que te corresponden', 'Dies de vacances que et corresponen'), v: r2(generados), f: 'dias', nota: v.tipoDias === 'naturales' ? tt('naturales', 'naturals') : tt('laborables', 'laborables') },
      secundarios: [{ e: tt('Pendientes', 'Pendents'), v: r2(pendientes), f: 'dias' }, { e: tt('Valor si no las disfrutas', 'Valor si no les gaudeixes'), v: r2(pendientes * valorDia) }],
      filas: [
        { e: tt('Días del periodo', 'Dies del període'), v: trabajados, f: 'dias' },
        { e: tt('Generados (proporcional)', 'Generats (proporcional)'), v: r2(generados), f: 'dias' },
        { e: tt('Ya disfrutados', 'Ja gaudits'), v: v.disfrutados, f: 'dias' },
        { e: tt('Pendientes', 'Pendents'), v: r2(pendientes), f: 'dias', fuerte: true },
      ],
      avisos: [tt('El mínimo legal son 30 días naturales al año (art. 38 del Estatuto de los Trabajadores). Las vacaciones solo se pueden cobrar en lugar de disfrutarlas al terminar el contrato.', 'El mínim legal són 30 dies naturals l’any (art. 38 de l’Estatut dels Treballadors). Les vacances només es poden cobrar en lloc de gaudir-les en acabar el contracte.')],
    };
  },
});
