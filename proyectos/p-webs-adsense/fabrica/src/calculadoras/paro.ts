import { def, tt } from '../lib/def';
import { paro } from '../lib/calc/laboral';

export default def({
  id: 'paro',
  anual: true,
  campos: [
    { id: 'dias', tipo: 'numero', def: 1100, min: 0, max: 2190, paso: 1, etiqueta: tt('Días cotizados en los últimos 6 años (sin paro ya cobrado)', 'Dies cotitzats en els últims 6 anys (sense atur ja cobrat)') },
    { id: 'base', tipo: 'numero', def: 1900, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Base de cotización media mensual de los últimos 180 días', 'Base de cotització mitjana mensual dels últims 180 dies'), ayuda: tt('La ves en tus nóminas («base de contingencias profesionales»). Aproximación: bruto anual / 12.', 'La veus a les nòmines («base de contingències professionals»). Aproximació: brut anual / 12.') },
    { id: 'hijos', tipo: 'numero', def: 0, min: 0, max: 10, paso: 1, etiqueta: tt('Hijos menores de 26 años a cargo', 'Fills menors de 26 anys a càrrec') },
    { id: 'parcial', tipo: 'numero', def: 100, min: 10, max: 100, paso: 1, sufijo: '%', etiqueta: tt('Jornada media trabajada', 'Jornada mitjana treballada') },
  ],
  calcular(v, { P }) {
    const r = paro({ diasCotizados: v.dias, baseMensual: v.base, hijos: v.hijos, parcialPct: v.parcial }, P.laboral);
    if (!r.derecho) return {
      destacado: { e: tt('Sin derecho a prestación contributiva', 'Sense dret a prestació contributiva'), v: 0 },
      avisos: [tt('Hacen falta al menos 360 días cotizados. Mira la calculadora del subsidio por desempleo.', 'Calen almenys 360 dies cotitzats. Mira la calculadora del subsidi per atur.')],
    };
    return {
      destacado: { e: tt('Paro mensual los primeros 6 meses', 'Atur mensual els primers 6 mesos'), v: r.periodos[0].mensualBruto, nota: tt(`Neto aproximado: ${r.periodos[0].mensualNeto} €`, `Net aproximat: ${r.periodos[0].mensualNeto} €`) },
      secundarios: [{ e: tt('Duración', 'Durada'), v: r.duracion, f: 'dias' }, { e: tt('Total bruto', 'Total brut'), v: r.total }],
      tablas: [{ cab: [tt('Días', 'Dies'), tt('Porcentaje', 'Percentatge'), tt('Bruto al mes', 'Brut al mes'), tt('Neto aprox.', 'Net aprox.')], formatos: ['txt', 'pct', 'eur', 'eur'], filas: r.periodos.map((p: any) => [`${p.desde}–${p.hasta}`, p.pct, p.mensualBruto, p.mensualNeto]) }],
      filas: [
        { e: tt('Base reguladora diaria', 'Base reguladora diària'), v: r.baseReguladoraDiaria },
        { e: tt('Mínimo mensual que te corresponde', 'Mínim mensual que et correspon'), v: r.min, sub: true },
        { e: tt('Máximo mensual que te corresponde', 'Màxim mensual que et correspon'), v: r.max, sub: true },
      ],
      avisos: [tt('El neto descuenta tu cotización a la Seguridad Social. Si el SEPE te retiene IRPF, el neto será algo menor.', 'El net descompta la teva cotització a la Seguretat Social. Si el SEPE et reté IRPF, el net serà una mica menor.')],
    };
  },
});
