import { def, tt } from '../lib/def';
import { r2, diasEntre, clamp } from '../lib/calc/base';

export default def({
  id: 'paga-extra',
  anual: false,
  campos: [
    { id: 'importe', tipo: 'numero', def: 1600, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Importe de la paga extra completa', 'Import de la paga extra completa'), ayuda: tt('Según convenio: suele ser el salario base más antigüedad.', 'Segons conveni: sol ser el salari base més antiguitat.') },
    { id: 'paga', tipo: 'select', def: 'navidad', etiqueta: tt('Paga', 'Paga'), opciones: [{ v: 'verano', t: tt('Verano (junio o julio)', 'Estiu (juny o juliol)') }, { v: 'navidad', t: tt('Navidad (diciembre)', 'Nadal (desembre)') }] },
    { id: 'devengo', tipo: 'select', def: 'semestral', etiqueta: tt('Periodo de devengo', 'Període de meritació'), opciones: [{ v: 'semestral', t: tt('Semestral (lo más habitual)', 'Semestral (el més habitual)') }, { v: 'anual', t: tt('Anual', 'Anual') }] },
    { id: 'alta', tipo: 'fecha', def: '2026-09-15', etiqueta: tt('Fecha de alta en la empresa', 'Data d’alta a l’empresa') },
    { id: 'anio', tipo: 'numero', def: 2026, min: 2020, max: 2035, paso: 1, etiqueta: tt('Año de la paga', 'Any de la paga') },
    { id: 'irpf', tipo: 'numero', def: 15, min: 0, max: 47, paso: 0.01, sufijo: '%', etiqueta: tt('Tu retención de IRPF', 'La teva retenció d’IRPF') },
  ],
  calcular(v) {
    const y = v.anio;
    let ini: string, fin: string;
    if (v.devengo === 'semestral') { ini = v.paga === 'verano' ? `${y}-01-01` : `${y}-07-01`; fin = v.paga === 'verano' ? `${y}-06-30` : `${y}-12-31`; }
    else { ini = v.paga === 'verano' ? `${y - 1}-07-01` : `${y}-01-01`; fin = v.paga === 'verano' ? `${y}-06-30` : `${y}-12-31`; }
    const total = diasEntre(ini, fin);
    const desde = v.alta > ini ? v.alta : ini;
    const dias = clamp(diasEntre(desde, fin), 0, total);
    const bruto = v.importe * dias / total;
    return {
      destacado: { e: tt('Paga extra bruta', 'Paga extra bruta'), v: r2(bruto), nota: tt(`${dias} de ${total} días devengados`, `${dias} de ${total} dies meritats`) },
      secundarios: [{ e: tt('Neto aproximado', 'Net aproximat'), v: r2(bruto * (1 - v.irpf / 100)) }, { e: tt('IRPF de la paga', 'IRPF de la paga'), v: r2(bruto * v.irpf / 100) }],
      filas: [
        { e: tt('Periodo de devengo', 'Període de meritació'), v: `${ini.split('-').reverse().join('/')} – ${fin.split('-').reverse().join('/')}`, f: 'txt' },
        { e: tt('Días trabajados en el periodo', 'Dies treballats en el període'), v: dias, f: 'dias' },
        { e: tt('Paga completa', 'Paga completa'), v: v.importe },
        { e: tt('Parte proporcional', 'Part proporcional'), v: r2(bruto), fuerte: true },
      ],
      avisos: [tt('La paga extra no lleva cotización a la Seguridad Social en el mes en que se cobra: ya se cotiza prorrateada cada mes. Solo se le aplica el IRPF.', 'La paga extra no porta cotització a la Seguretat Social el mes que es cobra: ja es cotitza prorratejada cada mes. Només se li aplica l’IRPF.')],
    };
  },
});
