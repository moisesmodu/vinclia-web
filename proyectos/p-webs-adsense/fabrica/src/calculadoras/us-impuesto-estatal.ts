import { def } from '../lib/def';
import { es, campoEstado, campoEstadoCivil, nombreEstado, ESTADOS_FISCAL } from '../lib/camposUS';
import { impuestoEstatal, estadoCivil, deduccionEstandar } from '../lib/calc/us';

export default def({
  id: 'us-impuesto-estatal',
  anual: true,
  campos: [
    { id: 'ingreso', tipo: 'numero', def: 60000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Ingreso bruto ajustado (AGI) del año') },
    campoEstado('CA'), campoEstadoCivil(),
    { id: 'dep', tipo: 'numero', def: 0, min: 0, max: 10, paso: 1, etiqueta: es('Dependientes') },
  ],
  calcular(v, { P }) {
    const ec = estadoCivil(v.ec);
    const F = P.fiscal;
    const fedImp = Math.max(0, v.ingreso - deduccionEstandar(ec, F));
    const calc = (e: string) => impuestoEstatal({ estado: e, ec, agi: v.ingreso, salarioBruto: v.ingreso, imponibleFederal: fedImp, dependientes: v.dep }, F);
    const r = calc(v.estado);
    const d = F.estados[v.estado];
    const comp = ESTADOS_FISCAL.map((e) => ({ e, r: calc(e) })).sort((a, b) => a.r.impuesto - b.r.impuesto);
    const tipo = d.tipo === 'ninguno' ? 'Sin impuesto sobre la renta' : d.tipo === 'plano' ? `Tipo único del ${d.pct}%` : `Progresivo, del ${d.tramos.single[0].tipo}% al ${d.tramos.single[d.tramos.single.length - 1].tipo}%`;
    return {
      destacado: { e: es(`Impuesto estatal de ${nombreEstado(v.estado)}`), v: r.impuesto, nota: es(tipo) },
      secundarios: [
        { e: es('Tipo efectivo'), v: r.efectivo, f: 'pct' },
        { e: es('Tipo marginal estatal'), v: r.marginal, f: 'pct' },
        { e: es('Al mes'), v: Math.round(r.impuesto / 12 * 100) / 100 },
      ],
      filas: r.ninguno ? [{ e: es('Impuesto estatal sobre la renta'), v: 0, fuerte: true }] : [
        { e: es('Ingreso de partida'), v: d.base === 'federal_imponible' ? fedImp : v.ingreso },
        { e: es('Deducciones y exenciones del estado'), v: r.deducciones, signo: '-' },
        { e: es('Renta imponible estatal'), v: r.imponible },
        ...(r.creditos ? [{ e: es('Créditos personales y por dependientes'), v: r.creditos, signo: '-' as const }] : []),
        { e: es('Impuesto estatal'), v: r.impuesto, fuerte: true },
      ],
      tablas: [{ titulo: es('Comparación entre estados con el mismo ingreso'), cab: [es('Estado'), es('Impuesto anual'), es('Tipo efectivo'), es('Marginal')], formatos: ['txt', 'eur0', 'pct', 'pct'], filas: comp.map((x) => [nombreEstado(x.e), x.r.impuesto, x.r.efectivo, x.r.marginal]) }],
      avisos: [es('Simplificado: parte de tu AGI federal y aplica la deducción estándar o las exenciones, los tramos y los créditos personales del estado. No incluye impuestos locales (NYC, Yonkers, condados de Maryland, EIT de Pensilvania) ni créditos especiales.')],
    };
  },
});
