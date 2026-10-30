import { def, tt } from '../lib/def';
import { hipotecaFija } from '../lib/calc/vivienda';
import { campoImporte, campoPlazo, ineDef, tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-tabla-amortizacion',
  campos: [
    campoImporte(150000),
    campoPlazo(25),
    { id: 'tin', tipo: 'numero', def: ineDef('tipo_interes_medio_pct'), min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Interés (TIN)', 'Interès (TIN)') },
    { id: 'detalle', tipo: 'select', def: 'anual', etiqueta: tt('Detalle de la tabla', 'Detall de la taula'), opciones: [{ v: 'anual', t: tt('Por años', 'Per anys') }, { v: 'mensual', t: tt('Mes a mes', 'Mes a mes') }] },
  ],
  calcular(v) {
    const capital = n(v.importe), anios = Math.max(1, n(v.anios));
    const h = hipotecaFija(capital, n(v.tin), anios);
    const cu = h.cuadro;
    const mitad = cu.meses.findIndex((m) => m.capital >= m.interes);
    const tablas = v.detalle === 'mensual'
      ? [{ titulo: tt('Cuadro de amortización mes a mes', 'Quadre d’amortització mes a mes'), cab: [tt('Mes', 'Mes'), tt('Cuota', 'Quota'), tt('Intereses', 'Interessos'), tt('Capital', 'Capital'), tt('Pendiente', 'Pendent')], formatos: ['num0', 'eur', 'eur', 'eur', 'eur'] as const, filas: cu.meses.map((m) => [m.mes, m.cuota, m.interes, m.capital, m.pendiente]) }]
      : [{ titulo: tt('Cuadro de amortización por años', 'Quadre d’amortització per anys'), cab: [tt('Año', 'Any'), tt('Pagado', 'Pagat'), tt('Intereses', 'Interessos'), tt('Capital', 'Capital'), tt('Pendiente', 'Pendent'), tt('Amortizado', 'Amortitzat')], formatos: ['num0', 'eur', 'eur', 'eur', 'eur0', 'pct'] as const, filas: cu.anios.map((a) => [a.anio, a.pagado, a.interes, a.capital, a.pendiente, Math.round((1 - a.pendiente / capital) * 1000) / 10]) }];
    return {
      destacado: { e: tt('Cuota mensual', 'Quota mensual'), v: h.cuota, nota: tx((l) => `${anios * 12} ${l === 'es' ? 'cuotas al' : 'quotes al'} ${pct(n(v.tin), l)}`) },
      secundarios: [
        { e: tt('Intereses del primer año', 'Interessos del primer any'), v: cu.anios[0]?.interes ?? 0 },
        { e: tt('Intereses totales', 'Interessos totals'), v: h.intereses },
        { e: tt('Mes en que ya pagas más capital que intereses', 'Mes en què ja pagues més capital que interessos'), v: mitad < 0 ? '—' : mitad + 1, f: 'num0' },
      ],
      reparto: [{ e: tt('Capital', 'Capital'), v: capital }, { e: tt('Intereses', 'Interessos'), v: h.intereses }],
      tablas: tablas as any,
      avisos: [tx((l) => l === 'es' ? `Sistema francés: la cuota es la misma todos los meses, pero al principio casi todo son intereses. El primer mes pagas ${eur(cu.meses[0]?.interes ?? 0, l, 2)} de intereses y ${eur(cu.meses[0]?.capital ?? 0, l, 2)} de capital.` : `Sistema francès: la quota és la mateixa cada mes, però al principi gairebé tot són interessos. El primer mes pagues ${eur(cu.meses[0]?.interes ?? 0, l, 2)} d’interessos i ${eur(cu.meses[0]?.capital ?? 0, l, 2)} de capital.`)],
    };
  },
});
