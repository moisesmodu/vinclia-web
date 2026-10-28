import { def, tt } from '../lib/def';
import { campoComunidad, campoPagas, camposFamilia, familia } from '../lib/campos';
import { sueldoNeto } from '../lib/calc/laboral';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'subida-sueldo',
  anual: true,
  campos: [
    { id: 'bruto', tipo: 'numero', def: 30000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Bruto anual actual', 'Brut anual actual') },
    { id: 'modo', tipo: 'select', def: 'pct', etiqueta: tt('Subida en', 'Pujada en'), opciones: [{ v: 'pct', t: tt('Porcentaje', 'Percentatge') }, { v: 'eur', t: tt('Euros brutos al año', 'Euros bruts l’any') }] },
    { id: 'subida', tipo: 'numero', def: 5, min: 0, paso: 0.1, etiqueta: tt('Subida', 'Pujada') },
    campoPagas, campoComunidad(), ...camposFamilia,
  ],
  calcular(v, { P }) {
    const nuevo = v.modo === 'pct' ? v.bruto * (1 + v.subida / 100) : v.bruto + v.subida;
    const pagas = Number(v.pagas) as 12 | 14;
    const fam = familia(v);
    const a = sueldoNeto({ brutoAnual: v.bruto, pagas, ccaa: v.ccaa, ...fam }, P);
    const b = sueldoNeto({ brutoAnual: nuevo, pagas, ccaa: v.ccaa, ...fam }, P);
    const dB = nuevo - v.bruto, dN = b.netoAnual - a.netoAnual;
    return {
      destacado: { e: tt('Neto extra al año', 'Net extra a l’any'), v: r2(dN), nota: tt(`De cada 100 € brutos de subida te quedan ${r2(dN / Math.max(1, dB) * 100)} €`, `De cada 100 € bruts de pujada te’n queden ${r2(dN / Math.max(1, dB) * 100)} €`) },
      secundarios: [{ e: tt('Más en cada nómina', 'Més a cada nòmina'), v: r2(b.netoOrdinaria - a.netoOrdinaria) }, { e: tt('Nuevo bruto anual', 'Nou brut anual'), v: r2(nuevo) }],
      tablas: [{ cab: [tt('Concepto', 'Concepte'), tt('Antes', 'Abans'), tt('Después', 'Després')], formatos: ['txt', 'eur', 'eur'], filas: [
        [tt('Bruto anual', 'Brut anual'), v.bruto, r2(nuevo)],
        [tt('Retención IRPF (%)', 'Retenció IRPF (%)'), `${a.ret.tipo} %`, `${b.ret.tipo} %`],
        [tt('Neto anual', 'Net anual'), a.netoAnual, b.netoAnual],
        [tt('Neto nómina ordinaria', 'Net nòmina ordinària'), a.netoOrdinaria, b.netoOrdinaria],
      ] }],
      avisos: [tt('Una subida nunca te hace cobrar menos neto: el IRPF es progresivo por tramos y solo la parte nueva tributa al tipo más alto.', 'Una pujada mai et fa cobrar menys net: l’IRPF és progressiu per trams i només la part nova tributa al tipus més alt.')],
    };
  },
});
