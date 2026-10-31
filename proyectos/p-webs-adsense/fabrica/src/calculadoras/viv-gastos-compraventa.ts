import { def, tt } from '../lib/def';
import { gastosCompra } from '../lib/calc/vivienda';
import { campoComunidadViv, campoNueva, camposHonorarios, campoTipoAJD, campoIndirecto, sinAJD, indirectoEspecial, avisoPendiente, avisoForal, COMUNIDADES_VIV, tx, eur, pct, n, nomViv } from '../lib/camposVivienda';

export default def({
  id: 'viv-gastos-compraventa',
  campos: [
    { id: 'precio', tipo: 'numero', def: 200000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de compra', 'Preu de compra') },
    campoComunidadViv(), campoNueva,
    { id: 'referencia', tipo: 'numero', def: 0, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Valor de referencia de Catastro (si lo sabes)', 'Valor de referència del Cadastre (si el saps)'), ayuda: tt('Si es mayor que el precio, el ITP se paga sobre él. Se consulta gratis en la sede del Catastro.', 'Si és més alt que el preu, l’ITP es paga sobre aquest valor. Es consulta gratis a la seu del Cadastre.'), si: (v) => v.nueva !== 'nueva' },
    { id: 'reducido', tipo: 'casilla', def: false, etiqueta: tt('Tengo derecho a un tipo reducido de ITP', 'Tinc dret a un tipus reduït d’ITP'), si: (v) => v.nueva !== 'nueva' },
    { id: 'tipoReducido', tipo: 'numero', def: 5, min: 0, max: 15, paso: 0.1, sufijo: '%', etiqueta: tt('Tipo reducido que te corresponde', 'Tipus reduït que et correspon'), si: (v) => v.nueva !== 'nueva' && !!v.reducido },
    { id: 'vpo', tipo: 'casilla', def: false, etiqueta: tt('VPO de régimen especial (IVA superreducido)', 'HPO de règim especial (IVA superreduït)'), si: (v) => v.nueva === 'nueva' && !indirectoEspecial(v.ccaa) },
    ...camposHonorarios, campoTipoAJD, campoIndirecto,
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const nueva = v.nueva === 'nueva', precio = n(v.precio);
    const ent = (p: number) => ({ precio: p, ccaa: v.ccaa, nueva, valorReferencia: p === precio ? n(v.referencia) : 0, tipoITP: !nueva && v.reducido ? n(v.tipoReducido) : null, tipoAJD: nueva && sinAJD(v.ccaa) && !indirectoEspecial(v.ccaa) ? n(v.tipoAJD) : null, tipoIndirecto: n(v.indirecto), vpo: !!v.vpo, gestoria: n(v.gestoria), tasacion: n(v.tasacion) });
    const g = gastosCompra(ent(precio), V);
    const c = V.itp_vivienda_usada.comunidades[v.ccaa];
    const avisos = [];
    if (g.pendiente) avisos.push(avisoPendiente(v.ccaa));
    if (COMUNIDADES_VIV[v.ccaa]?.foral) avisos.push(avisoForal(v.ccaa));
    if (!nueva && c.reducidos?.length) avisos.push(tx((l) => `${l === 'es' ? 'Tipos reducidos citados' : 'Tipus reduïts citats'} ${l === 'es' ? 'en' : 'a'} ${nomViv(v.ccaa, l)}: ${c.reducidos.map((r: any) => `${pct(r.tipo, l)} (${r.requisito})`).join('; ')}.`));
    avisos.push(tt('Los gastos de la escritura de hipoteca (notaría, registro, gestoría y AJD) los paga el banco desde la Ley 5/2019; tú pagas la tasación y las copias que pidas.', 'Les despeses de l’escriptura d’hipoteca (notaria, registre, gestoria i AJD) les paga el banc des de la Llei 5/2019; tu pagues la taxació i les còpies que demanis.'));
    const precios = [100000, 150000, 200000, 250000, 300000, 400000, 500000];
    return {
      destacado: { e: tt('Impuestos y gastos de la compra', 'Impostos i despeses de la compra'), v: g.total, f: 'eur0', nota: tx((l) => `${pct(g.pctSobrePrecio, l)} ${l === 'es' ? 'sobre el precio. En total pagas' : 'sobre el preu. En total pagues'} ${eur(g.totalConPrecio, l)}.`) },
      secundarios: [
        { e: nueva ? tt('IVA + AJD', 'IVA + AJD') : tt('ITP', 'ITP'), v: g.impuestos, f: 'eur0' },
        { e: tt('Notaría y registro (con IVA)', 'Notaria i registre (amb IVA)'), v: (g.notaria + g.registro) * (1 + V.iva_vivienda.general_servicios.tipo / 100) },
        { e: tt('Gestoría y tasación (con IVA)', 'Gestoria i taxació (amb IVA)'), v: (g.gestoria + g.tasacion) * (1 + V.iva_vivienda.general_servicios.tipo / 100) },
      ],
      filas: [
        { e: tt('Precio', 'Preu'), v: precio },
        ...(nueva ? [
          { e: tx((l) => `${l === 'es' ? 'IVA' : 'IVA'} (${pct(g.tipoIVA, l)})`), v: g.iva, signo: '+' as const },
          { e: tx((l) => `AJD (${pct(g.tipoAJD, l)})`), v: g.ajd, signo: '+' as const },
        ] : [{ e: tx((l) => `ITP (${l === 'es' ? 'tipo medio' : 'tipus mitjà'} ${pct(g.tipoITP, l)}${g.base > precio ? `, ${l === 'es' ? 'sobre el valor de referencia' : 'sobre el valor de referència'}` : ''})`), v: g.itp, signo: '+' as const }]),
        { e: tx((l) => `${l === 'es' ? 'Notaría (arancel con la rebaja del' : 'Notaria (aranzel amb la rebaixa del'} ${pct(V.arancel_notarial.rebaja_general_pct, l)})`), v: g.notaria, signo: '+' },
        { e: tt('Registro de la propiedad', 'Registre de la propietat'), v: g.registro, signo: '+' },
        { e: tt('Gestoría', 'Gestoria'), v: g.gestoria, signo: '+' },
        { e: tt('Tasación', 'Taxació'), v: g.tasacion, signo: '+' },
        { e: tx((l) => `${l === 'es' ? 'IVA de notaría, registro, gestoría y tasación' : 'IVA de notaria, registre, gestoria i taxació'} (${pct(V.iva_vivienda.general_servicios.tipo, l)})`), v: g.ivaHonorarios, signo: '+' },
        { e: tt('Total con impuestos y gastos', 'Total amb impostos i despeses'), v: g.totalConPrecio, fuerte: true },
      ],
      reparto: [{ e: tt('Precio', 'Preu'), v: precio }, { e: tt('Impuestos', 'Impostos'), v: g.impuestos }, { e: tt('Notaría y registro', 'Notaria i registre'), v: g.notaria + g.registro }, { e: tt('Gestoría, tasación e IVA', 'Gestoria, taxació i IVA'), v: g.gestoria + g.tasacion + g.ivaHonorarios }],
      tablas: [{
        titulo: tx((l) => `${l === 'es' ? 'Gastos según el precio' : 'Despeses segons el preu'} ${l === 'es' ? 'en' : 'a'} ${nomViv(v.ccaa, l)}`),
        cab: [tt('Precio', 'Preu'), nueva ? tt('IVA + AJD', 'IVA + AJD') : tt('ITP', 'ITP'), tt('Notaría y registro', 'Notaria i registre'), tt('Total gastos', 'Total despeses'), tt('Sobre el precio', 'Sobre el preu')],
        formatos: ['eur0', 'eur0', 'eur', 'eur0', 'pct'],
        filas: precios.map((p) => { const x = gastosCompra({ ...ent(p), valorReferencia: 0 }, V); return [p, x.impuestos, x.notaria + x.registro, x.total, x.pctSobrePrecio]; }),
      }],
      avisos,
    };
  },
});
