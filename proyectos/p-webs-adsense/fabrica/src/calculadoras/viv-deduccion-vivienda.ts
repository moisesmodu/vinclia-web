import { def, tt } from '../lib/def';
import { r2 } from '../lib/calc/base';
import { tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-deduccion-vivienda',
  campos: [
    { id: 'pagado', tipo: 'numero', def: 9500, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Pagado en el año por la hipoteca (capital + intereses + seguros vinculados)', 'Pagat l’any per la hipoteca (capital + interessos + assegurances vinculades)') },
    { id: 'titulares', tipo: 'select', def: '1', etiqueta: tt('Titulares que pagan y tienen derecho', 'Titulars que paguen i hi tenen dret'), opciones: [{ v: '1', t: tt('Uno', 'Un') }, { v: '2', t: tt('Dos (50 % cada uno)', 'Dos (50 % cadascun)') }] },
    { id: 'antes2013', tipo: 'casilla', def: true, etiqueta: tt('Compré la vivienda antes del 1/1/2013 y ya me deduje antes de 2013', 'Vaig comprar l’habitatge abans de l’1/1/2013 i ja m’ho vaig deduir abans del 2013') },
  ],
  calcular(v, { P }) {
    const D = P.vivienda.deduccion_vivienda_habitual_transitoria;
    const tit = Number(v.titulares);
    const porTit = n(v.pagado) / tit;
    const base = Math.min(porTit, D.base_maxima_eur);
    const ded = v.antes2013 ? r2(base * D.porcentaje / 100) : 0;
    const total = ded * tit;
    const desperdicio = Math.max(0, porTit - D.base_maxima_eur) * tit;
    return {
      destacado: { e: tt('Deducción en la renta', 'Deducció a la renda'), v: total, nota: v.antes2013 ? tx((l) => tit > 1 ? `${eur(ded, l, 2)} ${l === 'es' ? 'por cada titular' : 'per cada titular'}` : `${pct(D.porcentaje, l)} ${l === 'es' ? 'de lo pagado, hasta' : 'del que s’ha pagat, fins a'} ${eur(D.base_maxima_eur, l)}`) : tt('Sin derecho: la deducción se suprimió para las compras desde 2013', 'Sense dret: la deducció es va suprimir per a les compres des del 2013') },
      secundarios: [
        { e: tt('Base de cada titular', 'Base de cada titular'), v: base },
        { e: tt('Deducción máxima por titular', 'Deducció màxima per titular'), v: D.deduccion_maxima_eur },
        { e: tt('Pagado por encima del límite', 'Pagat per sobre del límit'), v: desperdicio },
      ],
      filas: [
        { e: tt('Pagado en el año', 'Pagat l’any'), v: n(v.pagado) },
        { e: tt('Parte de cada titular', 'Part de cada titular'), v: porTit, sub: true },
        { e: tx((l) => `${l === 'es' ? 'Base con el límite de' : 'Base amb el límit de'} ${eur(D.base_maxima_eur, l)}`), v: base },
        { e: tx((l) => `${l === 'es' ? 'Deducción' : 'Deducció'} (${pct(D.porcentaje, l)}: ${l === 'es' ? 'mitad estatal y mitad autonómica' : 'meitat estatal i meitat autonòmica'})`), v: ded },
        { e: tt('Total de la deducción', 'Total de la deducció'), v: total, fuerte: true },
      ],
      avisos: [
        tt('Régimen transitorio: solo si compraste (o pagaste la construcción) antes de 2013, te aplicaste la deducción en algún año anterior a 2013 y sigue siendo tu vivienda habitual.', 'Règim transitori: només si vas comprar (o vas pagar la construcció) abans del 2013, t’hi vas aplicar la deducció en algun any anterior al 2013 i continua sent el teu habitatge habitual.'),
        tt('Si declaráis en conjunta, el límite es por declaración, no por persona. Algunas comunidades tienen deducciones propias por compra o alquiler que no se calculan aquí.', 'Si declareu en conjunta, el límit és per declaració, no per persona. Algunes comunitats tenen deduccions pròpies per compra o lloguer que aquí no es calculen.'),
      ],
    };
  },
});
