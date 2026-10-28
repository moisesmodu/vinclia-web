import { def } from '../lib/def';
import { es, usd, num } from '../lib/camposUS';
import { envioRemesa } from '../lib/calc/us';

export default def({
  id: 'us-remesas',
  anual: true,
  campos: [
    { id: 'monto', tipo: 'numero', def: 500, min: 0, paso: 10, sufijo: '$', etiqueta: es('Dólares que quieres enviar') },
    { id: 'ref', tipo: 'numero', def: 18.5, min: 0, paso: 0.01, etiqueta: es('Tipo de cambio de referencia (moneda por dólar)'), ayuda: es('El tipo «medio del mercado» que ves en Google o en el banco central del país (Banxico FIX para pesos mexicanos). Es un ejemplo: escribe el de hoy.') },
    { id: 'c1', tipo: 'numero', def: 4.99, min: 0, paso: 0.01, sufijo: '$', etiqueta: es('Empresa A: comisión') },
    { id: 't1', tipo: 'numero', def: 18.1, min: 0, paso: 0.01, etiqueta: es('Empresa A: tipo de cambio que te ofrece') },
    { id: 'c2', tipo: 'numero', def: 0, min: 0, paso: 0.01, sufijo: '$', etiqueta: es('Empresa B: comisión') },
    { id: 't2', tipo: 'numero', def: 17.8, min: 0, paso: 0.01, etiqueta: es('Empresa B: tipo de cambio que te ofrece') },
    { id: 'pago', tipo: 'select', def: 'cuenta', etiqueta: es('¿Cómo pagas el envío?'), opciones: [{ v: 'cuenta', t: es('Desde cuenta bancaria o con tarjeta de débito o crédito de EE. UU.') }, { v: 'efectivo', t: es('En efectivo, money order o cheque de caja') }] },
  ],
  calcular(v, { P }) {
    const ef = v.pago === 'efectivo';
    const a = envioRemesa({ monto: v.monto, comision: v.c1, tasaOfrecida: v.t1, tasaReferencia: v.ref, efectivo: ef }, P.fiscal);
    const b = envioRemesa({ monto: v.monto, comision: v.c2, tasaOfrecida: v.t2, tasaReferencia: v.ref, efectivo: ef }, P.fiscal);
    const mejor = a.costeTotal <= b.costeTotal ? 'A' : 'B';
    const m = mejor === 'A' ? a : b, o = mejor === 'A' ? b : a;
    const avisos = [es('La comisión «$0» no significa gratis: el coste suele estar escondido en un tipo de cambio peor. Compara siempre cuánto recibe la otra persona.')];
    if (ef) avisos.push(es(`Desde el 1/1/2026 los envíos pagados en efectivo, money order o cheque de caja llevan un impuesto federal del ${P.fiscal.remesas.impuesto_pct}% (${usd(a.impuesto, 2)} en este envío). Pagando desde una cuenta bancaria o con tarjeta de EE. UU. no se paga.`));
    return {
      destacado: { e: es(`Conviene la empresa ${mejor}`), v: m.recibe, f: 'num', nota: es(`La otra persona recibe ${num(m.recibe, 2)} frente a ${num(o.recibe, 2)}: ${num(Math.abs(m.recibe - o.recibe), 2)} más, y el envío te cuesta en total ${usd(m.costeTotal, 2)} (${m.costePct}%)`) },
      secundarios: [
        { e: es('Coste total con A'), v: a.costeTotal },
        { e: es('Coste total con B'), v: b.costeTotal },
        { e: es('Recibiría al tipo de referencia'), v: a.recibeIdeal, f: 'num' },
      ],
      tablas: [{
        titulo: es('Comparación'), cab: [es('Concepto'), es('Empresa A'), es('Empresa B')], formatos: ['txt', 'txt', 'txt'],
        filas: [
          [es('Comisión'), usd(v.c1, 2), usd(v.c2, 2)],
          [es('Impuesto del 1% (efectivo)'), usd(a.impuesto, 2), usd(b.impuesto, 2)],
          [es('Pagas en total'), usd(a.pagaTotal, 2), usd(b.pagaTotal, 2)],
          [es('Tipo de cambio'), num(v.t1, 4), num(v.t2, 4)],
          [es('Margen sobre el tipo de referencia'), `${a.margenPct}%`, `${b.margenPct}%`],
          [es('Coste escondido en el tipo de cambio'), usd(a.costeTipo, 2), usd(b.costeTipo, 2)],
          [es('Coste total del envío'), usd(a.costeTotal, 2), usd(b.costeTotal, 2)],
          [es('Coste total en % del envío'), `${a.costePct}%`, `${b.costePct}%`],
          [es('Recibe la otra persona'), num(a.recibe, 2), num(b.recibe, 2)],
        ],
      }],
      avisos,
    };
  },
});
