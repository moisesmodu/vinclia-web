import { def, tt } from '../lib/def';
import { capacidad } from '../lib/calc/vivienda';
import { campoComunidadViv, criterioDef, ineDef, avisoFEIN, tx, eur, pct, n, nomViv } from '../lib/camposVivienda';

export default def({
  id: 'viv-cuanta-hipoteca',
  campos: [
    { id: 'ingresos', tipo: 'numero', def: 2500, min: 0, paso: 50, sufijo: '€', etiqueta: tt('Ingresos netos al mes (de todos los titulares)', 'Ingressos nets al mes (de tots els titulars)'), ayuda: tt('En 12 pagas: si cobras 14, suma las extras y divide entre 12.', 'En 12 pagues: si en cobres 14, suma les extres i divideix entre 12.') },
    { id: 'deudas', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Otras cuotas de préstamos al mes', 'Altres quotes de préstecs al mes') },
    { id: 'ahorro', tipo: 'numero', def: 40000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Ahorro para la compra', 'Estalvi per a la compra') },
    { id: 'tin', tipo: 'numero', def: ineDef('tipo_interes_medio_pct'), min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Interés de la hipoteca (TIN)', 'Interès de la hipoteca (TIN)') },
    { id: 'anios', tipo: 'numero', def: 30, min: 5, max: 40, paso: 1, etiqueta: tt('Plazo en años', 'Termini en anys') },
    campoComunidadViv(),
    { id: 'esfuerzo', tipo: 'numero', def: criterioDef('esfuerzo_maximo_cuota_sobre_ingresos_netos_pct'), min: 10, max: 60, paso: 1, sufijo: '%', etiqueta: tt('Esfuerzo máximo: cuota sobre ingresos', 'Esforç màxim: quota sobre ingressos'), ayuda: tt('Criterio de la mayoría de bancos, no una norma.', 'Criteri de la majoria de bancs, no una norma.') },
    { id: 'financiacion', tipo: 'numero', def: criterioDef('financiacion_habitual_sobre_tasacion_pct'), min: 10, max: 100, paso: 5, sufijo: '%', etiqueta: tt('Financiación máxima sobre el precio', 'Finançament màxim sobre el preu'), ayuda: tt('Lo habitual es el 80 % del valor de tasación o de compra, el menor.', 'L’habitual és el 80 % del valor de taxació o de compra, el menor.') },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const e = { ingresos: n(v.ingresos), deudas: n(v.deudas), esfuerzoPct: n(v.esfuerzo), tin: n(v.tin), anios: Math.max(1, n(v.anios)), ahorro: n(v.ahorro), financiacionPct: n(v.financiacion), ccaa: v.ccaa, gestoria: 300, tasacion: 350 };
    const r = capacidad(e, V);
    const esfuerzos = [30, 35, 40].map((s) => { const x = capacidad({ ...e, esfuerzoPct: s }, V); return [s, x.cuotaMax, x.prestamoMax, x.precioMax]; });
    return {
      destacado: { e: tt('Precio máximo de vivienda', 'Preu màxim d’habitatge'), v: r.precioMax, f: 'eur0', nota: tx((l) => r.limitadoPor === 'cuota'
        ? (l === 'es' ? `Te limita la cuota: el banco te prestaría hasta ${eur(r.prestamoMax, l)}.` : `Et limita la quota: el banc et prestaria fins a ${eur(r.prestamoMax, l)}.`)
        : (l === 'es' ? `Te limita el ahorro: con ${eur(e.ahorro, l)} cubres la entrada y los gastos de una vivienda de este precio.` : `Et limita l’estalvi: amb ${eur(e.ahorro, l)} cobreixes l’entrada i les despeses d’un habitatge d’aquest preu.`)) },
      secundarios: [
        { e: tt('Hipoteca máxima por cuota', 'Hipoteca màxima per quota'), v: r.prestamoMax, f: 'eur0' },
        { e: tt('Cuota máxima al mes', 'Quota màxima al mes'), v: r.cuotaMax },
        { e: tt('Préstamo para ese precio', 'Préstec per a aquest preu'), v: r.prestamo, f: 'eur0' },
      ],
      filas: [
        { e: tt('Precio de la vivienda', 'Preu de l’habitatge'), v: r.precioMax, f: 'eur0' },
        { e: tx((l) => `${l === 'es' ? 'Impuestos y gastos de compra' : 'Impostos i despeses de compra'} (${nomViv(v.ccaa, l)}, ${l === 'es' ? 'segunda mano' : 'segona mà'})`), v: r.gastos, signo: '+' },
        { e: tt('Hipoteca', 'Hipoteca'), v: r.prestamo, signo: '-' },
        { e: tt('Lo que pones de tu ahorro', 'El que poses del teu estalvi'), v: r.entrada + r.gastos, fuerte: true },
      ],
      reparto: [{ e: tt('Hipoteca', 'Hipoteca'), v: r.prestamo }, { e: tt('Entrada', 'Entrada'), v: r.entrada }, { e: tt('Impuestos y gastos', 'Impostos i despeses'), v: r.gastos }],
      tablas: [{ titulo: tt('Según el esfuerzo que aceptes', 'Segons l’esforç que acceptis'), cab: [tt('Esfuerzo', 'Esforç'), tt('Cuota máxima', 'Quota màxima'), tt('Hipoteca máxima', 'Hipoteca màxima'), tt('Precio máximo', 'Preu màxim')], formatos: ['pct', 'eur', 'eur0', 'eur0'], filas: esfuerzos }],
      avisos: [
        tx((l) => l === 'es' ? `El ${pct(e.esfuerzoPct, l)} de esfuerzo y el ${pct(e.financiacionPct, l)} de financiación son criterios habituales de los bancos, no una norma: cada entidad aplica los suyos.` : `El ${pct(e.esfuerzoPct, l)} d’esforç i el ${pct(e.financiacionPct, l)} de finançament són criteris habituals dels bancs, no una norma: cada entitat aplica els seus.`),
        tt('Los gastos de compra incluyen un ejemplo de 300 € de gestoría y 350 € de tasación (precio libre).', 'Les despeses de compra inclouen un exemple de 300 € de gestoria i 350 € de taxació (preu lliure).'),
        avisoFEIN,
      ],
    };
  },
});
