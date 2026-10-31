import { def, tt } from '../lib/def';
import { notaria, registro } from '../lib/calc/vivienda';
import { tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-notaria-registro',
  campos: [
    { id: 'precio', tipo: 'numero', def: 200000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de la compraventa', 'Preu de la compravenda') },
    { id: 'otros', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Copias, folios y otros conceptos de la notaría', 'Còpies, folis i altres conceptes de la notaria'), ayuda: tt('No dependen del precio: si la notaría te ha dado presupuesto, súmalos aquí.', 'No depenen del preu: si la notaria t’ha donat pressupost, suma’ls aquí.') },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const precio = n(v.precio), ivaPct = V.iva_vivienda.general_servicios.tipo;
    const no = notaria(precio, V), re = registro(precio, V);
    const base = no.conRebaja + n(v.otros) + re;
    const iva = base * ivaPct / 100;
    const precios = [100000, 150000, 200000, 250000, 300000, 400000, 500000, 600000];
    return {
      destacado: { e: tt('Notaría y registro de la compraventa', 'Notaria i registre de la compravenda'), v: base + iva, nota: tx((l) => `${l === 'es' ? 'Con IVA del' : 'Amb IVA del'} ${pct(ivaPct, l)}. ${l === 'es' ? 'Los paga el comprador, salvo pacto' : 'Els paga el comprador, llevat de pacte'}.`) },
      secundarios: [
        { e: tt('Notaría (sin IVA)', 'Notaria (sense IVA)'), v: no.conRebaja + n(v.otros) },
        { e: tt('Registro (sin IVA)', 'Registre (sense IVA)'), v: re },
        { e: tt('IVA', 'IVA'), v: iva },
      ],
      filas: [
        { e: tt('Arancel notarial por la escala', 'Aranzel notarial per l’escala'), v: no.escala },
        { e: tx((l) => `${l === 'es' ? 'Rebaja general del' : 'Rebaixa general del'} ${pct(V.arancel_notarial.rebaja_general_pct, l)}`), v: no.escala - no.conRebaja, signo: '-' },
        { e: tt('Copias, folios y otros', 'Còpies, folis i altres'), v: n(v.otros), signo: '+' },
        { e: tt('Arancel del registro', 'Aranzel del registre'), v: re, signo: '+' },
        { e: tx((l) => `IVA (${pct(ivaPct, l)})`), v: iva, signo: '+' },
        { e: tt('Total', 'Total'), v: base + iva, fuerte: true },
      ],
      reparto: [{ e: tt('Notaría', 'Notaria'), v: no.conRebaja + n(v.otros) }, { e: tt('Registro', 'Registre'), v: re }, { e: tt('IVA', 'IVA'), v: iva }],
      tablas: [{ titulo: tt('Aranceles según el precio (sin copias ni folios)', 'Aranzels segons el preu (sense còpies ni folis)'), cab: [tt('Precio', 'Preu'), tt('Notaría', 'Notaria'), tt('Registro', 'Registre'), tt('Total con IVA', 'Total amb IVA')], formatos: ['eur0', 'eur', 'eur', 'eur'],
        filas: precios.map((p) => { const a = notaria(p, V).conRebaja, b = registro(p, V); return [p, a, b, (a + b) * (1 + ivaPct / 100)]; }) }],
      avisos: [
        tt('Es el arancel de la escritura de compraventa. La escritura de la hipoteca (notaría, registro y gestoría) la paga el banco desde la Ley 5/2019.', 'És l’aranzel de l’escriptura de compravenda. L’escriptura de la hipoteca (notaria, registre i gestoria) la paga el banc des de la Llei 5/2019.'),
        tt('Los tramos altos del arancel del registro (desde 150.253,03 €) están pendientes de cotejar con el BOE. Las rebajas adicionales para vivienda habitual o VPO no se aplican.', 'Els trams alts de l’aranzel del registre (des de 150.253,03 €) estan pendents de confrontar amb el BOE. Les rebaixes addicionals per a habitatge habitual o HPO no s’apliquen.'),
        tx((l) => l === 'es' ? `Copias, folios y suplidos no están en la escala: pide presupuesto a la notaría y súmalos arriba. Por ${eur(precio, l)} la escala solo cubre el documento principal.` : `Còpies, folis i suplerts no són a l’escala: demana pressupost a la notaria i suma’ls a dalt. Per ${eur(precio, l)} l’escala només cobreix el document principal.`),
      ],
    };
  },
});
