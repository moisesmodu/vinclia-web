import { def, tt } from '../lib/def';
import { modelo303 } from '../lib/calc/fiscal';

export default def({
  id: 'modelo-303',
  anual: true,
  campos: [
    { id: 'trimestre', tipo: 'select', def: '4', etiqueta: tt('Trimestre', 'Trimestre'), opciones: [{ v: '1', t: '1T' }, { v: '2', t: '2T' }, { v: '3', t: '3T' }, { v: '4', t: '4T' }] },
    { id: 'v21', tipo: 'numero', def: 9000, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Ventas al 21 % (base)', 'Vendes al 21 % (base)') },
    { id: 'v10', tipo: 'numero', def: 0, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Ventas al 10 % (base)', 'Vendes al 10 % (base)') },
    { id: 'v4', tipo: 'numero', def: 0, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Ventas al 4 % (base)', 'Vendes al 4 % (base)') },
    { id: 'soportado', tipo: 'numero', def: 600, min: 0, paso: 1, sufijo: '€', etiqueta: tt('IVA soportado deducible (cuotas de tus facturas de gasto)', 'IVA suportat deduïble (quotes de les factures de despesa)') },
    { id: 'compensar', tipo: 'numero', def: 0, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Cuotas a compensar de trimestres anteriores', 'Quotes a compensar de trimestres anteriors') },
  ],
  calcular(v, { P }) {
    const r = modelo303({ ventas: [{ base: v.v21, tipo: 21 }, { base: v.v10, tipo: 10 }, { base: v.v4, tipo: 4 }], soportado: v.soportado, compensar: v.compensar, trimestre: Number(v.trimestre) });
    const plazo = P.fiscal.modelos['303'].plazos[Number(v.trimestre) - 1];
    return {
      destacado: { e: r.resultado >= 0 ? tt('A ingresar', 'A ingressar') : r.devolucion ? tt('A devolver (4T)', 'A retornar (4T)') : tt('A compensar', 'A compensar'), v: Math.abs(r.resultado), nota: { es: `Plazo: ${plazo}`, ca: `Termini: ${plazo}` } },
      filas: [
        { e: tt('IVA devengado (repercutido)', 'IVA meritat (repercutit)'), v: r.devengado },
        { e: tt('IVA soportado deducible', 'IVA suportat deduïble'), v: r.soportado, signo: '-' },
        ...(r.compensar ? [{ e: tt('Cuotas a compensar', 'Quotes a compensar'), v: r.compensar, signo: '-' as const }] : []),
        { e: tt('Resultado', 'Resultat'), v: r.resultado, fuerte: true },
      ],
      avisos: [tt('Solo es deducible el IVA de gastos afectos a la actividad con factura completa a tu nombre. Si sale negativo en los trimestres 1 a 3, se compensa después; en el 4T puedes pedir la devolución.', 'Només és deduïble l’IVA de despeses afectes a l’activitat amb factura completa al teu nom. Si surt negatiu els trimestres 1 a 3, es compensa després; al 4T pots demanar-ne la devolució.')],
    };
  },
});
