import { def, tt } from '../lib/def';
import { gananciaPatrimonial } from '../lib/calc/fiscal';
import { tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-ganancia-venta',
  anual: true,
  campos: [
    { id: 'venta', tipo: 'numero', def: 260000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de venta', 'Preu de venda') },
    { id: 'gastosVenta', tipo: 'numero', def: 8000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Gastos de la venta (agencia, plusvalía, certificado…)', 'Despeses de la venda (agència, plusvàlua, certificat…)') },
    { id: 'compra', tipo: 'numero', def: 180000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de compra', 'Preu de compra') },
    { id: 'gastosCompra', tipo: 'numero', def: 18000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Impuestos y gastos de la compra y mejoras', 'Impostos i despeses de la compra i millores'), ayuda: tt('ITP o IVA y AJD, notaría, registro, gestoría y obras de mejora (no las de mantenimiento).', 'ITP o IVA i AJD, notaria, registre, gestoria i obres de millora (no les de manteniment).') },
    { id: 'habitual', tipo: 'casilla', def: true, etiqueta: tt('Es tu vivienda habitual', 'És el teu habitatge habitual') },
    { id: 'mayor65', tipo: 'casilla', def: false, etiqueta: tt('Tienes 65 años o más', 'Tens 65 anys o més'), si: (v) => !!v.habitual },
    { id: 'reinversion', tipo: 'numero', def: 0, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Lo que reinviertes en otra vivienda habitual (en 2 años)', 'El que reinverteixes en un altre habitatge habitual (en 2 anys)'), si: (v) => !!v.habitual && !v.mayor65 },
  ],
  calcular(v, { P }) {
    const ventaNeta = n(v.venta) - n(v.gastosVenta);
    const ganancia = ventaNeta - (n(v.compra) + n(v.gastosCompra));
    let exenta = 0, motivo: any = null;
    if (ganancia > 0 && v.habitual && v.mayor65) { exenta = ganancia; motivo = tt('exenta por tener 65 años o más (art. 33.4.b LIRPF)', 'exempta per tenir 65 anys o més (art. 33.4.b LIRPF)'); }
    else if (ganancia > 0 && v.habitual && n(v.reinversion) > 0) { exenta = ganancia * Math.min(1, n(v.reinversion) / Math.max(1, ventaNeta)); motivo = tt('exenta en la parte reinvertida (art. 38.1 LIRPF)', 'exempta en la part reinvertida (art. 38.1 LIRPF)'); }
    const gravable = Math.max(0, ganancia - exenta);
    const r = gananciaPatrimonial({ compra: 0, gastosCompra: 0, venta: gravable, gastosVenta: 0 }, P.fiscal);
    let desde = 0;
    return {
      destacado: { e: tt('IRPF por la venta', 'IRPF per la venda'), v: r.cuota, nota: ganancia <= 0 ? tt('No hay ganancia: la pérdida se puede compensar con otras ganancias del ahorro', 'No hi ha guany: la pèrdua es pot compensar amb altres guanys de l’estalvi') : tx((l) => `${l === 'es' ? 'Tipo medio del' : 'Tipus mitjà del'} ${pct(r.tipoMedio, l)} ${l === 'es' ? 'sobre' : 'sobre'} ${eur(gravable, l)} ${l === 'es' ? 'de ganancia que tributa' : 'de guany que tributa'}`) },
      secundarios: [
        { e: tt('Ganancia patrimonial', 'Guany patrimonial'), v: ganancia },
        { e: tt('Parte exenta', 'Part exempta'), v: exenta },
        { e: tt('Te queda después del IRPF', 'Et queda després de l’IRPF'), v: ventaNeta - r.cuota, f: 'eur0' },
      ],
      filas: [
        { e: tt('Precio de venta', 'Preu de venda'), v: n(v.venta) },
        { e: tt('Gastos de la venta', 'Despeses de la venda'), v: n(v.gastosVenta), signo: '-' },
        { e: tt('Valor de compra (precio + gastos)', 'Valor de compra (preu + despeses)'), v: n(v.compra) + n(v.gastosCompra), signo: '-' },
        { e: tt('Ganancia patrimonial', 'Guany patrimonial'), v: ganancia, fuerte: true },
        ...(exenta > 0 ? [{ e: motivo, v: exenta, signo: '-' as const }] : []),
        { e: tt('Ganancia que tributa', 'Guany que tributa'), v: gravable },
        { e: tt('IRPF (escala del ahorro)', 'IRPF (escala de l’estalvi)'), v: r.cuota, fuerte: true },
      ],
      tablas: [{ titulo: tt('Escala del ahorro (estatal + autonómica)', 'Escala de l’estalvi (estatal + autonòmica)'), cab: [tt('Ganancia', 'Guany'), tt('Tipo', 'Tipus')], formatos: ['txt', 'pct'], filas: r.escala.map((t: any) => { const f = [tx((l) => `${eur(desde, l)} – ${t.hasta == null ? '∞' : eur(t.hasta, l)}`), t.tipo]; desde = t.hasta ?? desde; return f; }) }],
      avisos: [
        tt('Si heredaste o te donaron la vivienda, el valor de compra es el declarado en el impuesto de sucesiones o donaciones. Si la compraste antes de 1995, puede haber coeficientes de abatimiento que no se calculan aquí.', 'Si vas heretar o et van donar l’habitatge, el valor de compra és el declarat a l’impost de successions o donacions. Si la vas comprar abans del 1995, hi pot haver coeficients d’abatiment que aquí no es calculen.'),
        tt('El RDL 29/2026 prevé una exención para ciertas ventas de vivienda entre el 8/10/2026 y el 31/12/2027, pendiente de convalidación y con requisitos aún sin confirmar: no se aplica.', 'El RDL 29/2026 preveu una exempció per a certes vendes d’habitatge entre el 8/10/2026 i el 31/12/2027, pendent de convalidació i amb requisits encara sense confirmar: no s’aplica.'),
        tt('Si eres no residente, el comprador retiene una parte del precio a cuenta del impuesto de no residentes. Para la declaración completa, usa la calculadora de la renta de ImpuestoClaro.', 'Si no ets resident, el comprador reté una part del preu a compte de l’impost de no residents. Per a la declaració completa, fes servir la calculadora de la renda d’ImpuestoClaro.'),
      ],
    };
  },
});
