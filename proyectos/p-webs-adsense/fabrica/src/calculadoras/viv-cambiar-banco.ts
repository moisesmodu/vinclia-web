import { def, tt } from '../lib/def';
import { subrogacion } from '../lib/calc/vivienda';
import { tx, eur, pct, n, avisoFEIN } from '../lib/camposVivienda';

export default def({
  id: 'viv-cambiar-banco',
  campos: [
    { id: 'pendiente', tipo: 'numero', def: 150000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Capital pendiente', 'Capital pendent') },
    { id: 'anios', tipo: 'numero', def: 22, min: 1, max: 40, paso: 1, etiqueta: tt('Años que te quedan', 'Anys que et queden') },
    { id: 'tinActual', tipo: 'numero', def: 3.85, min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Interés actual (TIN)', 'Interès actual (TIN)') },
    { id: 'tinNuevo', tipo: 'numero', def: 2.95, min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Interés que te ofrece el otro banco', 'Interès que t’ofereix l’altre banc') },
    { id: 'tipo', tipo: 'select', def: 'variable', etiqueta: tt('Tu hipoteca actual es', 'La teva hipoteca actual és'), opciones: [{ v: 'variable', t: tt('Variable', 'Variable') }, { v: 'fijo', t: tt('Fija', 'Fixa') }] },
    { id: 'firma', tipo: 'numero', def: 6, min: 0, max: 40, paso: 1, etiqueta: tt('Años desde la firma', 'Anys des de la signatura') },
    { id: 'tasacion', tipo: 'numero', def: 350, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Tasación nueva (precio libre, ejemplo)', 'Taxació nova (preu lliure, exemple)') },
    { id: 'otros', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Otros gastos que te cobren', 'Altres despeses que et cobrin'), ayuda: tt('Pregunta al banco nuevo qué paga él: notaría y gestoría suelen correr de su cuenta.', 'Pregunta al banc nou què paga ell: notaria i gestoria solen anar a càrrec seu.') },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const meses = Math.round(n(v.anios) * 12);
    const r = subrogacion({ pendiente: n(v.pendiente), tinActual: n(v.tinActual), tinNuevo: n(v.tinNuevo), mesesRestantes: meses, tipo: v.tipo, aniosDesdeFirma: n(v.firma), tasacion: n(v.tasacion), otros: n(v.otros) }, V);
    const compensa = r.neto > 0;
    return {
      destacado: { e: compensa ? tt('Ahorro neto por cambiar de banco', 'Estalvi net per canviar de banc') : tt('Te costaría cambiar de banco', 'Et costaria canviar de banc'), v: Math.abs(r.ahorroBruto - r.costes), f: 'eur0', nota: tx((l) => r.ahorroMes > 0
        ? (l === 'es' ? `Recuperas los gastos en ${r.mesesRecuperar} meses y después ahorras ${eur(r.ahorroMes, l, 2)} cada mes.` : `Recuperes les despeses en ${r.mesesRecuperar} mesos i després estalvies ${eur(r.ahorroMes, l, 2)} cada mes.`)
        : (l === 'es' ? 'Con este interés la cuota nueva no es más baja.' : 'Amb aquest interès la quota nova no és més baixa.')) },
      secundarios: [
        { e: tt('Cuota actual', 'Quota actual'), v: r.cuotaActual },
        { e: tt('Cuota con el banco nuevo', 'Quota amb el banc nou'), v: r.cuotaNueva },
        { e: tt('Gastos del cambio', 'Despeses del canvi'), v: r.costes },
      ],
      filas: [
        { e: tx((l) => `${l === 'es' ? 'Ahorro de cuotas en' : 'Estalvi de quotes en'} ${n(v.anios)} ${l === 'es' ? 'años' : 'anys'}`), v: r.ahorroBruto },
        { e: tx((l) => `${l === 'es' ? 'Comisión de subrogación (tope legal)' : 'Comissió de subrogació (topall legal)'}`), v: r.comision, signo: '-' },
        { e: tx((l) => `${l === 'es' ? 'Registro de la subrogación (con la reducción del' : 'Registre de la subrogació (amb la reducció del'} ${pct(V.arancel_registral.reduccion_subrogacion_pct, l)})`), v: r.registroSub, signo: '-' },
        { e: tt('Tasación', 'Taxació'), v: n(v.tasacion), signo: '-' },
        { e: tt('Otros gastos', 'Altres despeses'), v: n(v.otros), signo: '-' },
        { e: tt('Ahorro neto', 'Estalvi net'), v: r.ahorroBruto - r.costes, fuerte: true },
      ],
      avisos: [
        tx((l) => l === 'es' ? `Pasar del ${pct(n(v.tinActual), l)} al ${pct(n(v.tinNuevo), l)} con ${eur(n(v.pendiente), l)} pendientes cambia la cuota en ${eur(r.ahorroMes, l, 2)} al mes.` : `Passar del ${pct(n(v.tinActual), l)} al ${pct(n(v.tinNuevo), l)} amb ${eur(n(v.pendiente), l)} pendents canvia la quota en ${eur(r.ahorroMes, l, 2)} al mes.`),
        tt('Antes de cambiar, pide a tu banco que iguale la oferta (novación): te ahorras la tasación y el registro. Compara siempre la TAE con las vinculaciones de cada oferta.', 'Abans de canviar, demana al teu banc que igualï l’oferta (novació): t’estalvies la taxació i el registre. Compara sempre la TAE amb les vinculacions de cada oferta.'),
        tt('La comisión de novación de variable a fija no se calcula: las fuentes discrepan y está pendiente de cotejo.', 'La comissió de novació de variable a fixa no es calcula: les fonts discrepen i està pendent de confrontació.'),
        avisoFEIN,
      ],
    };
  },
});
