import { def, tt } from '../lib/def';
import { gastosCompra, datosAJD } from '../lib/calc/vivienda';
import { campoComunidadViv, campoTipoAJD, campoIndirecto, sinAJD, indirectoEspecial, COD_VIV, tx, eur, pct, n, nomViv } from '../lib/camposVivienda';

export default def({
  id: 'viv-iva-ajd',
  campos: [
    { id: 'precio', tipo: 'numero', def: 250000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de la vivienda nueva (sin IVA)', 'Preu de l’habitatge nou (sense IVA)') },
    campoComunidadViv(),
    { id: 'nueva', tipo: 'select', def: 'nueva', etiqueta: tt('Operación', 'Operació'), opciones: [{ v: 'nueva', t: tt('Primera entrega del promotor', 'Primer lliurament del promotor') }] },
    { id: 'vpo', tipo: 'casilla', def: false, etiqueta: tt('VPO de régimen especial o promoción pública', 'HPO de règim especial o promoció pública'), si: (v) => !indirectoEspecial(v.ccaa) },
    campoTipoAJD, campoIndirecto,
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const precio = n(v.precio);
    const g = gastosCompra({ precio, ccaa: v.ccaa, nueva: true, vpo: !!v.vpo, tipoAJD: sinAJD(v.ccaa) && !indirectoEspecial(v.ccaa) ? n(v.tipoAJD) : null, tipoIndirecto: n(v.indirecto) }, V);
    const imp = g.iva + g.ajd;
    const nombreInd = v.ccaa === 'CN' ? 'IGIC' : indirectoEspecial(v.ccaa) ? 'IPSI' : 'IVA';
    const avisos = [];
    if (sinAJD(v.ccaa)) avisos.push(tx((l) => l === 'es' ? `Aún no tenemos cotejado el AJD de ${nomViv(v.ccaa, l)}: se usa el tipo que escribas.` : `Encara no tenim confrontat l’AJD de ${nomViv(v.ccaa, l)}: s’utilitza el tipus que escriguis.`));
    else if (datosAJD(V, v.ccaa).pendiente) avisos.push(tx((l) => l === 'es' ? `El AJD de ${nomViv(v.ccaa, l)} sale de comparativas y está pendiente de cotejar con su boletín.` : `L’AJD de ${nomViv(v.ccaa, l)} surt de comparatives i està pendent de confrontar amb el seu butlletí.`));
    if (indirectoEspecial(v.ccaa)) avisos.push(tt('En Canarias no hay IVA sino IGIC, y en Ceuta y Melilla, IPSI. Las fuentes no coinciden en el tipo: usa el que te confirme el promotor.', 'A Canàries no hi ha IVA sinó IGIC, i a Ceuta i Melilla, IPSI. Les fonts no coincideixen en el tipus: fes servir el que et confirmi el promotor.'));
    if (v.vpo) avisos.push(tt('El IVA superreducido solo es para VPO de régimen especial o de promoción pública, con la calificación en la escritura. Pendiente de cotejar en el BOE.', 'L’IVA superreduït només és per a HPO de règim especial o de promoció pública, amb la qualificació a l’escriptura. Pendent de confrontar al BOE.'));
    avisos.push(tt('El IVA se paga al promotor (en la entrada y en cada plazo) y el AJD a la comunidad autónoma en los 30 días hábiles siguientes a la escritura.', 'L’IVA es paga al promotor (a l’entrada i a cada termini) i l’AJD a la comunitat autònoma en els 30 dies hàbils següents a l’escriptura.'));
    const comp = COD_VIV.filter((k) => !indirectoEspecial(k) && !sinAJD(k)).map((k) => { const d = datosAJD(V, k); return { k, tipo: d.tipo!, ajd: precio * d.tipo! / 100, pend: d.pendiente }; }).sort((a, b) => a.tipo - b.tipo);
    return {
      destacado: { e: tx((l) => `${nombreInd} + AJD`), v: imp, f: 'eur0', nota: tx((l) => `${pct(Math.round((imp / (precio || 1)) * 10000) / 100, l)} ${l === 'es' ? 'sobre el precio' : 'sobre el preu'}`) },
      secundarios: [
        { e: tx((l) => `${nombreInd} (${pct(g.tipoIVA, l)})`), v: g.iva, f: 'eur0' },
        { e: tx((l) => `AJD (${pct(g.tipoAJD, l)})`), v: g.ajd, f: 'eur0' },
        { e: tt('Precio con impuestos', 'Preu amb impostos'), v: precio + imp, f: 'eur0' },
      ],
      reparto: [{ e: tt('Precio', 'Preu'), v: precio }, { e: tx(() => nombreInd), v: g.iva }, { e: tt('AJD', 'AJD'), v: g.ajd }],
      tablas: [{ titulo: tx((l) => `${l === 'es' ? 'AJD de una vivienda nueva de' : 'AJD d’un habitatge nou de'} ${eur(precio, l)} ${l === 'es' ? 'por comunidad (con dato)' : 'per comunitat (amb dada)'}`), cab: [tt('Comunidad', 'Comunitat'), tt('Tipo de AJD', 'Tipus d’AJD'), tt('AJD', 'AJD'), tt('Estado del dato', 'Estat de la dada')], formatos: ['txt', 'pct', 'eur0', 'txt'],
        filas: comp.map((x) => [tx((l) => nomViv(x.k, l)), x.tipo, x.ajd, x.pend ? tt('Sin cotejar', 'Sense confrontar') : tt('Verificado', 'Verificat')]) }],
      avisos,
    };
  },
});
