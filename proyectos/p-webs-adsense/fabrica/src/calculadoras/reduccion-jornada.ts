import { def, tt } from '../lib/def';
import { campoComunidad, campoPagas, camposFamilia, familia } from '../lib/campos';
import { sueldoNeto } from '../lib/calc/laboral';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'reduccion-jornada',
  anual: true,
  campos: [
    { id: 'bruto', tipo: 'numero', def: 30000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Bruto anual a jornada completa', 'Brut anual a jornada completa') },
    { id: 'reduccion', tipo: 'numero', def: 25, min: 1, max: 87.5, paso: 0.5, sufijo: '%', etiqueta: tt('Reducción de jornada', 'Reducció de jornada'), ayuda: tt('Por guarda legal: entre un octavo (12,5 %) y la mitad (50 %) de la jornada.', 'Per guarda legal: entre un vuitè (12,5 %) i la meitat (50 %) de la jornada.') },
    campoPagas, campoComunidad(), ...camposFamilia,
  ],
  calcular(v, { P }) {
    const pagas = Number(v.pagas) as 12 | 14;
    const fam = familia(v);
    const nuevo = v.bruto * (1 - v.reduccion / 100);
    const a = sueldoNeto({ brutoAnual: v.bruto, pagas, ccaa: v.ccaa, ...fam }, P);
    const b = sueldoNeto({ brutoAnual: nuevo, pagas, ccaa: v.ccaa, parcial: true, ...fam }, P);
    const perdida = a.netoAnual - b.netoAnual;
    return {
      destacado: { e: tt('Nuevo neto en cada nómina', 'Nou net a cada nòmina'), v: b.netoOrdinaria },
      secundarios: [{ e: tt('Pierdes al mes', 'Perds al mes'), v: r2(a.netoOrdinaria - b.netoOrdinaria) }, { e: tt('Pérdida neta real', 'Pèrdua neta real'), v: r2(perdida / Math.max(1, a.netoAnual) * 100), f: 'pct' }],
      tablas: [{ cab: [tt('Concepto', 'Concepte'), tt('Jornada completa', 'Jornada completa'), tt('Con reducción', 'Amb reducció')], formatos: ['txt', 'eur', 'eur'], filas: [
        [tt('Bruto anual', 'Brut anual'), v.bruto, r2(nuevo)],
        [tt('Retención IRPF', 'Retenció IRPF'), `${String(a.ret.tipo).replace(".", ",")} %`, `${String(b.ret.tipo).replace(".", ",")} %`],
        [tt('Neto anual', 'Net anual'), a.netoAnual, b.netoAnual],
        [tt('Neto nómina ordinaria', 'Net nòmina ordinària'), a.netoOrdinaria, b.netoOrdinaria],
      ] }],
      avisos: [tt('Pierdes menos neto que el porcentaje que reduces porque baja también tu tipo de IRPF. En la reducción por cuidado de menores, las cotizaciones de los primeros años se computan como si trabajaras a jornada completa para la jubilación y otras prestaciones (art. 237 LGSS).', 'Perds menys net que el percentatge que redueixes perquè també baixa el teu tipus d’IRPF. En la reducció per cura de menors, les cotitzacions dels primers anys es computen com si treballessis a jornada completa per a la jubilació i altres prestacions (art. 237 LGSS).')],
    };
  },
});
