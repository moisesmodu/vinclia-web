import { def, tt } from '../lib/def';
import { amortizacionAnticipada } from '../lib/calc/vivienda';
import { ineDef, opcionesComisionVariable, tx, eur, pct, n, plazoTxt } from '../lib/camposVivienda';

export default def({
  id: 'viv-amortizacion-anticipada',
  campos: [
    { id: 'pendiente', tipo: 'numero', def: 150000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Capital pendiente', 'Capital pendent') },
    { id: 'importe', tipo: 'numero', def: 20000, min: 0, paso: 500, sufijo: '€', etiqueta: tt('Dinero que quieres adelantar', 'Diners que vols avançar') },
    { id: 'anios', tipo: 'numero', def: 25, min: 1, max: 40, paso: 1, etiqueta: tt('Años que te quedan', 'Anys que et queden') },
    { id: 'tin', tipo: 'numero', def: ineDef('tipo_interes_medio_pct'), min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Interés actual (TIN)', 'Interès actual (TIN)') },
    { id: 'tipo', tipo: 'select', def: 'variable', etiqueta: tt('Tipo de hipoteca', 'Tipus d’hipoteca'), opciones: [{ v: 'variable', t: tt('Variable', 'Variable') }, { v: 'fijo', t: tt('Fija', 'Fixa') }] },
    { id: 'firma', tipo: 'numero', def: 2, min: 0, max: 40, paso: 1, etiqueta: tt('Años desde la firma', 'Anys des de la signatura') },
    { id: 'opcion', tipo: 'select', def: 'a', etiqueta: tt('Comisión de tu escritura (variable)', 'Comissió de la teva escriptura (variable)'), opciones: opcionesComisionVariable(), si: (v) => v.tipo === 'variable' },
    { id: 'antigua', tipo: 'casilla', def: false, etiqueta: tt('La firmé antes del 16 de junio de 2019', 'La vaig signar abans del 16 de juny de 2019') },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const r = amortizacionAnticipada({ pendiente: n(v.pendiente), tin: n(v.tin), mesesRestantes: Math.round(n(v.anios) * 12), importe: Math.min(n(v.importe), n(v.pendiente)), tipo: v.tipo, aniosDesdeFirma: n(v.firma), opcionVariable: v.opcion }, V);
    const plazoMejor = r.ahorroPlazo >= r.ahorroCuota;
    const avisos = [
      tx((l) => l === 'es'
        ? `Reducir plazo te ahorra ${eur(r.ahorroPlazo - r.ahorroCuota, l)} más de intereses que reducir cuota, pero la cuota sigue en ${eur(r.cuotaAntes, l, 2)}. Reducir cuota te deja ${eur(r.cuotaAntes - r.cuotaCuota, l, 2)} más al mes desde ya.`
        : `Reduir termini t’estalvia ${eur(r.ahorroPlazo - r.ahorroCuota, l)} més d’interessos que reduir quota, però la quota continua en ${eur(r.cuotaAntes, l, 2)}. Reduir quota et deixa ${eur(r.cuotaAntes - r.cuotaCuota, l, 2)} més al mes des d’ara.`),
      tx((l) => l === 'es' ? `Comisión: tope legal del ${pct(r.topePct, l)} sobre lo adelantado (Ley 5/2019, art. 23). El banco nunca puede cobrar más que la pérdida financiera que le causes.` : `Comissió: topall legal del ${pct(r.topePct, l)} sobre el que avances (Llei 5/2019, art. 23). El banc mai no pot cobrar més que la pèrdua financera que li causis.`),
    ];
    if (v.antigua) avisos.unshift(tt('En los préstamos anteriores al 16/6/2019 manda la comisión de tu escritura (la Ley 5/2019 no se aplica a la comisión). Revisa tu contrato.', 'En els préstecs anteriors al 16/6/2019 mana la comissió de la teva escriptura (la Llei 5/2019 no s’aplica a la comissió). Revisa el contracte.'));
    return {
      destacado: { e: plazoMejor ? tt('Ahorro de intereses reduciendo plazo', 'Estalvi d’interessos reduint termini') : tt('Ahorro de intereses reduciendo cuota', 'Estalvi d’interessos reduint quota'), v: Math.max(r.ahorroPlazo, r.ahorroCuota), f: 'eur0', nota: tx((l) => l === 'es' ? `Terminas ${plazoTxt(r.mesesMenos, l)} antes, sin cambiar la cuota.` : `Acabes ${plazoTxt(r.mesesMenos, l)} abans, sense canviar la quota.`) },
      secundarios: [
        { e: tt('Nueva cuota si reduces cuota', 'Nova quota si redueixes quota'), v: r.cuotaCuota },
        { e: tt('Ahorro reduciendo cuota', 'Estalvi reduint quota'), v: r.ahorroCuota, f: 'eur0' },
        { e: tt('Comisión máxima', 'Comissió màxima'), v: v.antigua ? '—' : r.comision },
      ],
      tablas: [{ titulo: tt('Reducir cuota o reducir plazo', 'Reduir quota o reduir termini'), cab: [tt('Opción', 'Opció'), tt('Cuota', 'Quota'), tt('Plazo restante', 'Termini restant'), tt('Intereses que te quedan', 'Interessos que et queden'), tt('Ahorro', 'Estalvi')], formatos: ['txt', 'eur', 'txt', 'eur0', 'eur0'],
        filas: [
          [tt('Sin adelantar nada', 'Sense avançar res'), r.cuotaAntes, tx((l) => plazoTxt(Math.round(n(v.anios) * 12), l)), r.interesesAntes, 0],
          [tt('Reducir cuota', 'Reduir quota'), r.cuotaCuota, tx((l) => plazoTxt(Math.round(n(v.anios) * 12), l)), r.interesesCuota, r.ahorroCuota],
          [tt('Reducir plazo', 'Reduir termini'), r.cuotaAntes, tx((l) => plazoTxt(r.mesesPlazo, l)), r.interesesPlazo, r.ahorroPlazo],
        ] }],
      avisos,
    };
  },
});
