import { def, tt } from '../lib/def';
import { gananciaPatrimonial } from '../lib/calc/fiscal';

export default def({
  id: 'ganancias-patrimoniales',
  anual: true,
  campos: [
    { id: 'compra', tipo: 'numero', def: 10000, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Precio de compra', 'Preu de compra') },
    { id: 'gastosCompra', tipo: 'numero', def: 20, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Gastos y comisiones de la compra', 'Despeses i comissions de la compra') },
    { id: 'venta', tipo: 'numero', def: 16000, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Precio de venta', 'Preu de venda') },
    { id: 'gastosVenta', tipo: 'numero', def: 20, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Gastos y comisiones de la venta', 'Despeses i comissions de la venda') },
  ],
  calcular(v, { P }) {
    const r = gananciaPatrimonial({ compra: v.compra, gastosCompra: v.gastosCompra, venta: v.venta, gastosVenta: v.gastosVenta }, P.fiscal);
    let desde = 0;
    return {
      destacado: { e: r.ganancia >= 0 ? tt('Impuesto estimado', 'Impost estimat') : tt('Pérdida patrimonial', 'Pèrdua patrimonial'), v: r.ganancia >= 0 ? r.cuota : -r.ganancia },
      secundarios: [{ e: tt('Ganancia', 'Guany'), v: r.ganancia }, { e: tt('Tipo medio', 'Tipus mitjà'), v: r.tipoMedio, f: 'pct' }, { e: tt('Te quedas', 'Et quedes'), v: r.neto }],
      tablas: [{ titulo: tt('Escala del ahorro', 'Escala de l’estalvi'), cab: [tt('Ganancia (€)', 'Guany (€)'), tt('Tipo', 'Tipus')], formatos: ['txt', 'pct'], filas: r.escala.map((t: any) => { const f = [`${desde.toLocaleString('es-ES')} – ${t.hasta == null ? '∞' : t.hasta.toLocaleString('es-ES')}`, t.tipo]; desde = t.hasta ?? desde; return f; }) }],
      avisos: [tt('Las pérdidas se compensan con ganancias del mismo año y de los 4 siguientes. No vale para la vivienda habitual con reinversión ni para mayores de 65 años que la venden: están exentos.', 'Les pèrdues es compensen amb guanys del mateix any i dels 4 següents. No val per a l’habitatge habitual amb reinversió ni per a majors de 65 anys que el venen: estan exempts.')],
    };
  },
});
