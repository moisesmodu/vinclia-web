import { def } from '../lib/def';
import { es, campoEstadoCivil, campoHijos, campoOtrosDep, usd } from '../lib/camposUS';
import { creditoHijos, impuestoFederal, estadoCivil } from '../lib/calc/us';

export default def({
  id: 'us-credito-hijos',
  anual: true,
  campos: [
    { ...campoHijos, def: 2 },
    campoOtrosDep,
    { id: 'ingreso', tipo: 'numero', def: 40000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Ingresos del trabajo del año (salarios y 1099)') },
    campoEstadoCivil(),
  ],
  calcular(v, { P }) {
    const ec = estadoCivil(v.ec);
    const C = P.fiscal.credito_hijos;
    const f = impuestoFederal({ ec, salarios: v.ingreso, hijos: v.ninos, otrosDependientes: v.otros, anio: P.anio }, P);
    const r = f.ctc;
    const avisos = [
      es(`El hijo debe tener menos de 17 años al terminar ${P.anio}, vivir contigo más de la mitad del año y tener número de Seguro Social. Desde 2025 tú (o tu cónyuge, si declaran juntos) también necesitas SSN: con ITIN no se puede pedir el crédito por hijos.`),
    ];
    if (r.reduccion) avisos.push(es(`Tu ingreso pasa de ${usd(C.umbral_reduccion[ec])}: el crédito baja ${usd(C.reduccion_por_1000)} por cada $1,000 de más.`));
    if (v.ingreso <= C.umbral_ingreso_ganado && v.ninos > 0) avisos.push(es(`Con ingresos del trabajo de ${usd(C.umbral_ingreso_ganado)} o menos no hay parte reembolsable.`));
    const tabla = [10000, 20000, 30000, 40000, 60000, 100000, 250000, 450000].map((i) => {
      const x = impuestoFederal({ ec, salarios: i, hijos: v.ninos, otrosDependientes: v.otros, anio: P.anio }, P).ctc;
      return [i, x.noReembolsable, x.reembolsable, x.total];
    });
    return {
      destacado: { e: es('Crédito por hijos que recibes'), v: r.total, nota: es(`${usd(C.por_hijo)} por hijo menor de 17; hasta ${usd(C.reembolsable_max)} por hijo se cobran aunque no debas impuesto`) },
      secundarios: [
        { e: es('Baja tu impuesto'), v: r.noReembolsable },
        { e: es('Te lo devuelven (ACTC)'), v: r.reembolsable },
        { e: es('Crédito máximo posible'), v: r.bruto },
      ],
      filas: [
        { e: es(`Hijos menores de 17 × ${usd(C.por_hijo)}`), v: v.ninos * C.por_hijo },
        { e: es(`Otros dependientes × ${usd(C.otros_dependientes)}`), v: v.otros * C.otros_dependientes },
        { e: es('Reducción por ingresos altos'), v: r.reduccion, signo: '-' },
        { e: es('Impuesto federal antes del crédito'), v: f.impuestoEscala },
        { e: es('Parte que reduce tu impuesto'), v: r.noReembolsable },
        { e: es(`Parte reembolsable (15% de lo ganado por encima de ${usd(C.umbral_ingreso_ganado)})`), v: r.reembolsable },
        { e: es('Crédito total'), v: r.total, fuerte: true },
      ],
      tablas: [{ titulo: es('Crédito según tus ingresos (mismos hijos y estado civil)'), cab: [es('Ingresos'), es('Baja el impuesto'), es('Reembolsable'), es('Total')], formatos: ['eur0', 'eur0', 'eur0', 'eur0'], filas: tabla }],
      avisos,
    };
  },
});
