import { def, tt } from '../lib/def';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'salario-hora',
  campos: [
    { id: 'importe', tipo: 'numero', def: 24000, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Salario', 'Salari') },
    { id: 'periodo', tipo: 'select', def: 'anual', etiqueta: tt('Ese salario es', 'Aquest salari és'), opciones: [{ v: 'anual', t: tt('Anual', 'Anual') }, { v: 'mensual14', t: tt('Mensual en 14 pagas', 'Mensual en 14 pagues') }, { v: 'mensual12', t: tt('Mensual en 12 pagas', 'Mensual en 12 pagues') }, { v: 'hora', t: tt('Por hora', 'Per hora') }] },
    { id: 'semana', tipo: 'numero', def: 40, min: 1, max: 60, paso: 0.5, etiqueta: tt('Horas semanales', 'Hores setmanals') },
    { id: 'vacaciones', tipo: 'numero', def: 22, min: 0, max: 40, paso: 1, etiqueta: tt('Días laborables de vacaciones', 'Dies laborables de vacances') },
    { id: 'festivos', tipo: 'numero', def: 14, min: 0, max: 20, paso: 1, etiqueta: tt('Festivos laborables al año', 'Festius laborables l’any') },
  ],
  calcular(v) {
    const diasLab = 261 - v.vacaciones - v.festivos;
    const horasAno = v.semana / 5 * diasLab;
    const anual = v.periodo === 'anual' ? v.importe : v.periodo === 'mensual14' ? v.importe * 14 : v.periodo === 'mensual12' ? v.importe * 12 : v.importe * horasAno;
    return {
      destacado: { e: tt('Salario bruto por hora', 'Salari brut per hora'), v: r2(anual / horasAno) },
      secundarios: [{ e: tt('Anual', 'Anual'), v: r2(anual) }, { e: tt('Horas efectivas al año', 'Hores efectives l’any'), v: r2(horasAno), f: 'horas' }],
      filas: [
        { e: tt('Mensual en 14 pagas', 'Mensual en 14 pagues'), v: r2(anual / 14) },
        { e: tt('Mensual en 12 pagas', 'Mensual en 12 pagues'), v: r2(anual / 12) },
        { e: tt('Semanal', 'Setmanal'), v: r2(anual / 52.14) },
        { e: tt('Por día laborable trabajado', 'Per dia laborable treballat'), v: r2(anual / diasLab) },
        { e: tt('Por día natural (base del finiquito)', 'Per dia natural (base de la quitança)'), v: r2(anual / 365) },
        { e: tt('Por hora efectiva', 'Per hora efectiva'), v: r2(anual / horasAno), fuerte: true },
      ],
    };
  },
});
