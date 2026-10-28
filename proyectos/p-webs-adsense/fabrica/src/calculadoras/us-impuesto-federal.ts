import { def } from '../lib/def';
import { es, campoEstadoCivil, ETIQUETA_EC } from '../lib/camposUS';
import { impuestoFederal, estadoCivil, tramosFederales } from '../lib/calc/us';

export default def({
  id: 'us-impuesto-federal',
  anual: true,
  campos: [
    { id: 'ingreso', tipo: 'numero', def: 60000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salarios del año (W-2, casilla 1)'), ayuda: es('Ya sin lo que aportas al 401(k) antes de impuestos.') },
    { id: 'otros_ing', tipo: 'numero', def: 0, min: 0, paso: 100, sufijo: '$', etiqueta: es('Otros ingresos (intereses, desempleo…)') },
    campoEstadoCivil(),
    { id: 'detallada', tipo: 'numero', def: 0, min: 0, paso: 100, sufijo: '$', etiqueta: es('Deducciones detalladas (si las tienes)'), ayuda: es('Déjalo en 0 para usar la deducción estándar. Solo conviene detallar si la suma de intereses de hipoteca, impuestos estatales y locales y donativos es mayor.') },
  ],
  calcular(v, { P, }) {
    const ec = estadoCivil(v.ec);
    const anio = P.anio;
    const r = impuestoFederal({ ec, salarios: v.ingreso, otrosIngresos: v.otros_ing, deduccionDetallada: v.detallada, anio }, P);
    let desde = 0;
    const filasT = tramosFederales(ec, P.fiscal).map((t) => {
      const hasta = t.hasta ?? Infinity;
      const enTramo = Math.max(0, Math.min(r.imponible, hasta) - desde);
      const f = [`${desde.toLocaleString('es-US')} – ${t.hasta == null ? 'en adelante' : t.hasta.toLocaleString('es-US')}`, t.tipo, enTramo, Math.round(enTramo * t.tipo) / 100];
      desde = hasta;
      return f;
    });
    return {
      destacado: { e: es(`Impuesto federal sobre la renta ${anio}`), v: r.impuestoRenta, nota: es(`${ETIQUETA_EC[ec]} · tipo efectivo ${r.tipoEfectivoRenta}% sobre tus ingresos`) },
      secundarios: [
        { e: es('Tramo (tipo marginal)'), v: r.marginal, f: 'pct' },
        { e: es('Tipo efectivo'), v: r.tipoEfectivoRenta, f: 'pct' },
        { e: es('Renta imponible'), v: r.imponible },
      ],
      filas: [
        { e: es('Ingresos totales'), v: r.ingresoTotal },
        { e: es('Ingreso bruto ajustado (AGI)'), v: r.agi },
        { e: es(r.usaEstandar ? 'Deducción estándar' : 'Deducciones detalladas'), v: r.deduccion, signo: '-' },
        { e: es('Renta imponible (taxable income)'), v: r.imponible, fuerte: true },
        { e: es('Impuesto según los tramos'), v: r.impuestoEscala },
        { e: es('Impuesto federal sobre la renta'), v: r.impuestoRenta, fuerte: true },
      ],
      tablas: [{ titulo: es('Cuánto pagas en cada tramo'), cab: [es('Tramo de renta imponible ($)'), es('Tipo'), es('Tu renta en el tramo'), es('Impuesto')], formatos: ['txt', 'pct', 'eur0', 'eur'], filas: filasT }],
      avisos: [
        es('Tu tipo marginal solo se aplica a los dólares que caen en el último tramo: pasar a un tramo superior nunca reduce lo que te queda.'),
        es('No incluye créditos (por hijos, EITC, educación), ganancias de capital ni impuesto de trabajo por cuenta propia: para eso usa la calculadora de reembolso o la de 1099.'),
      ],
    };
  },
});
