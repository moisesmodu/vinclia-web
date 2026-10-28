import { def, tt } from '../lib/def';
import { campoComunidad, campoPagas, campoContrato, camposFamilia, familia } from '../lib/campos';
import { brutoDesdeNeto, sueldoNeto } from '../lib/calc/laboral';

export default def({
  id: 'sueldo-bruto',
  anual: true,
  campos: [
    { id: 'neto', tipo: 'numero', def: 1700, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Neto que quieres cobrar al mes', 'Net que vols cobrar al mes') },
    { id: 'base', tipo: 'select', def: 'pagas', etiqueta: tt('Ese neto es…', 'Aquest net és…'), opciones: [
      { v: 'pagas', t: tt('Lo que cobro en cada una de las pagas', 'El que cobro a cada una de les pagues') },
      { v: 'medio', t: tt('Una media mensual (neto anual / 12)', 'Una mitjana mensual (net anual / 12)') },
    ] },
    campoPagas, campoComunidad(), campoContrato, ...camposFamilia,
  ],
  calcular(v, { P }) {
    const pagas = Number(v.pagas) as 12 | 14;
    const fam = familia(v);
    // Si el neto es por paga, aproximamos el anual con el número de pagas y afinamos con la nómina ordinaria
    const objetivoAnual = v.base === 'medio' ? v.neto * 12 : v.neto * pagas;
    let bruto = brutoDesdeNeto(objetivoAnual, { pagas, contrato: v.contrato, ccaa: v.ccaa, ...fam }, P);
    if (v.base === 'pagas' && pagas === 14) {
      let lo = bruto * 0.8, hi = bruto * 1.3;
      for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (sueldoNeto({ brutoAnual: m, pagas, contrato: v.contrato, ...fam }, P).netoOrdinaria < v.neto) lo = m; else hi = m; }
      bruto = Math.round(hi * 100) / 100;
    }
    const r = sueldoNeto({ brutoAnual: bruto, pagas, contrato: v.contrato, ccaa: v.ccaa, ...fam }, P);
    return {
      destacado: { e: tt('Salario bruto anual necesario', 'Salari brut anual necessari'), v: bruto },
      secundarios: [
        { e: tt('Bruto de cada paga', 'Brut de cada paga'), v: r.brutoPaga },
        { e: tt('Retención de IRPF', 'Retenció d’IRPF'), v: r.ret.tipo, f: 'pct' },
        { e: tt('Coste para la empresa', 'Cost per a l’empresa'), v: r.costeEmpresa },
      ],
      reparto: [{ e: tt('Neto', 'Net'), v: r.netoAnual }, { e: tt('Seguridad Social', 'Seguretat Social'), v: r.ss.trabajador.anual }, { e: tt('IRPF', 'IRPF'), v: r.ret.importe }],
      filas: [
        { e: tt('Neto en nómina ordinaria', 'Net en nòmina ordinària'), v: r.netoOrdinaria },
        ...(pagas === 14 ? [{ e: tt('Neto en paga extra', 'Net en paga extra'), v: r.netoExtra }] : []),
        { e: tt('Neto anual', 'Net anual'), v: r.netoAnual, fuerte: true },
        { e: tt('Seguridad Social anual', 'Seguretat Social anual'), v: r.ss.trabajador.anual },
        { e: tt('Retención de IRPF anual', 'Retenció d’IRPF anual'), v: r.ret.importe },
      ],
      avisos: [tt('Para negociar una oferta, pide siempre el bruto anual y el número de pagas por escrito.', 'Per negociar una oferta, demana sempre el brut anual i el nombre de pagues per escrit.')],
    };
  },
});
