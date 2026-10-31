import { def, tt } from '../lib/def';
import { gastosCompra, alquilarOComprar } from '../lib/calc/vivienda';
import { campoComunidadViv, iravDef, criterioDef, ineDef, tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-alquilar-o-comprar',
  campos: [
    { id: 'precio', tipo: 'numero', def: 250000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de la vivienda', 'Preu de l’habitatge') },
    { id: 'alquiler', tipo: 'numero', def: 1000, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Alquiler de una vivienda parecida', 'Lloguer d’un habitatge semblant') },
    campoComunidadViv(),
    { id: 'horizonte', tipo: 'numero', def: 15, min: 1, max: 40, paso: 1, etiqueta: tt('Años que piensas vivir allí', 'Anys que penses viure-hi') },
    { id: 'financiacion', tipo: 'numero', def: criterioDef('financiacion_habitual_sobre_tasacion_pct'), min: 0, max: 100, paso: 5, sufijo: '%', etiqueta: tt('Hipoteca sobre el precio', 'Hipoteca sobre el preu') },
    { id: 'tin', tipo: 'numero', def: ineDef('tipo_interes_medio_pct'), min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Interés de la hipoteca', 'Interès de la hipoteca') },
    { id: 'anios', tipo: 'numero', def: 30, min: 5, max: 40, paso: 1, etiqueta: tt('Plazo de la hipoteca', 'Termini de la hipoteca') },
    { id: 'costes', tipo: 'numero', def: 2000, min: 0, paso: 50, sufijo: '€', etiqueta: tt('IBI, comunidad, seguro y mantenimiento al año', 'IBI, comunitat, assegurança i manteniment l’any') },
    { id: 'subida', tipo: 'numero', def: iravDef(), min: -5, max: 15, paso: 0.1, sufijo: '%', etiqueta: tt('Subida anual del alquiler (hipótesis)', 'Pujada anual del lloguer (hipòtesi)'), ayuda: tt('Por defecto, el último IRAV.', 'Per defecte, l’últim IRAV.') },
    { id: 'revalorizacion', tipo: 'numero', def: 2, min: -10, max: 15, paso: 0.1, sufijo: '%', etiqueta: tt('Revalorización anual de la vivienda (hipótesis)', 'Revaloració anual de l’habitatge (hipòtesi)') },
    { id: 'rentabilidad', tipo: 'numero', def: 3, min: -5, max: 15, paso: 0.1, sufijo: '%', etiqueta: tt('Rentabilidad anual del ahorro invertido (hipótesis)', 'Rendibilitat anual de l’estalvi invertit (hipòtesi)') },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const g = gastosCompra({ precio: n(v.precio), ccaa: v.ccaa, nueva: false, gestoria: 300, tasacion: 350 }, V);
    const r = alquilarOComprar({ precio: n(v.precio), gastos: g.total, financiacionPct: n(v.financiacion), tin: n(v.tin), aniosHipoteca: Math.max(1, n(v.anios)), costesAnuales: n(v.costes), alquilerMes: n(v.alquiler), subidaAlquilerPct: n(v.subida), revalorizacionPct: n(v.revalorizacion), rentabilidadPct: n(v.rentabilidad), horizonte: Math.max(1, Math.round(n(v.horizonte))) });
    const comprar = r.diferencia >= 0;
    const cruce = r.filas.find((f) => f.comprar >= f.alquilar)?.anio;
    return {
      destacado: { e: comprar ? tt('Comprar te deja más patrimonio', 'Comprar et deixa més patrimoni') : tt('Alquilar te deja más patrimonio', 'Llogar et deixa més patrimoni'), v: Math.abs(r.diferencia), f: 'eur0', nota: tx((l) => `${l === 'es' ? 'de diferencia a los' : 'de diferència als'} ${Math.round(n(v.horizonte))} ${l === 'es' ? 'años, con tus hipótesis' : 'anys, amb les teves hipòtesis'}${cruce ? (l === 'es' ? `. Comprar empieza a compensar el año ${cruce}.` : `. Comprar comença a compensar l’any ${cruce}.`) : ''}`) },
      secundarios: [
        { e: tt('Patrimonio si compras', 'Patrimoni si compres'), v: r.comprar, f: 'eur0' },
        { e: tt('Patrimonio si alquilas e inviertes', 'Patrimoni si llogues i inverteixes'), v: r.alquilar, f: 'eur0' },
        { e: tt('Dinero inicial para comprar', 'Diners inicials per comprar'), v: r.inicial, f: 'eur0' },
      ],
      filas: [
        { e: tt('Cuota de la hipoteca', 'Quota de la hipoteca'), v: r.cuota },
        { e: tt('Impuestos y gastos de compra', 'Impostos i despeses de compra'), v: g.total },
        { e: tt('Alquiler el último año', 'Lloguer l’últim any'), v: r.alquilerFinal },
        { e: tt('Pagado en total si compras (entrada, gastos, cuotas y costes)', 'Pagat en total si compres (entrada, despeses, quotes i costos)'), v: r.pagadoComprar },
        { e: tt('Pagado en total en alquiler', 'Pagat en total en lloguer'), v: r.pagadoAlquilar },
      ],
      tablas: [{ titulo: tt('Patrimonio año a año', 'Patrimoni any a any'), cab: [tt('Año', 'Any'), tt('Comprar: casa − deuda', 'Comprar: casa − deute'), tt('Alquilar: ahorro invertido', 'Llogar: estalvi invertit'), tt('Diferencia', 'Diferència')], formatos: ['num0', 'eur0', 'eur0', 'eur0'], filas: r.filas.map((f) => [f.anio, f.comprar, f.alquilar, f.comprar - f.alquilar]) }],
      avisos: [
        tx((l) => l === 'es' ? `Hipótesis tuyas, no previsiones: la casa se revaloriza un ${pct(n(v.revalorizacion), l)} al año, el alquiler sube un ${pct(n(v.subida), l)} y el ahorro rinde un ${pct(n(v.rentabilidad), l)}. Cambia cualquiera y el resultado puede darse la vuelta.` : `Hipòtesis teves, no previsions: la casa es revalora un ${pct(n(v.revalorizacion), l)} l’any, el lloguer puja un ${pct(n(v.subida), l)} i l’estalvi rendeix un ${pct(n(v.rentabilidad), l)}. Canvia’n qualsevol i el resultat es pot capgirar.`),
        tt('Si alquilas, se supone que inviertes la entrada y cada mes la diferencia entre lo que costaría comprar y el alquiler. No incluye impuestos sobre la rentabilidad ni los gastos de vender la casa.', 'Si llogues, se suposa que inverteixes l’entrada i cada mes la diferència entre el que costaria comprar i el lloguer. No inclou impostos sobre la rendibilitat ni les despeses de vendre la casa.'),
      ],
    };
  },
});
