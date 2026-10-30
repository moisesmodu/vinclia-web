import { def, tt } from '../lib/def';
import { cuotaComunidad, datosITP } from '../lib/calc/vivienda';
import { campoComunidadViv, avisoPendiente, avisoForal, COMUNIDADES_VIV, COD_VIV, tx, eur, pct, n, nomViv } from '../lib/camposVivienda';

export default def({
  id: 'viv-itp',
  campos: [
    { id: 'precio', tipo: 'numero', def: 200000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de compra', 'Preu de compra') },
    campoComunidadViv(),
    { id: 'referencia', tipo: 'numero', def: 0, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Valor de referencia de Catastro (si lo sabes)', 'Valor de referència del Cadastre (si el saps)'), ayuda: tt('La base del ITP es el mayor entre el precio y este valor (Ley 11/2021).', 'La base de l’ITP és el més alt entre el preu i aquest valor (Llei 11/2021).') },
    { id: 'reducido', tipo: 'casilla', def: false, etiqueta: tt('Aplicar un tipo reducido', 'Aplicar un tipus reduït') },
    { id: 'tipoReducido', tipo: 'numero', def: 5, min: 0, max: 15, paso: 0.1, sufijo: '%', etiqueta: tt('Tipo reducido', 'Tipus reduït'), si: (v) => !!v.reducido },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const base = Math.max(n(v.precio), n(v.referencia));
    const d = datosITP(V, v.ccaa);
    const r = cuotaComunidad(base, d, v.reducido ? n(v.tipoReducido) : null);
    const general = cuotaComunidad(base, d);
    const c = V.itp_vivienda_usada.comunidades[v.ccaa];
    const comp = COD_VIV.map((k) => ({ k, r: cuotaComunidad(base, datosITP(V, k)) })).sort((a, b) => a.r.cuota - b.r.cuota);
    const avisos = [];
    if (d.pendiente) avisos.push(avisoPendiente(v.ccaa));
    if (COMUNIDADES_VIV[v.ccaa]?.foral) avisos.push(avisoForal(v.ccaa));
    if (c.reducidos?.length) avisos.push(tx((l) => `${l === 'es' ? 'Tipos reducidos' : 'Tipus reduïts'}: ${c.reducidos.map((x: any) => `${pct(x.tipo, l)}, ${x.requisito}`).join('; ')}. ${l === 'es' ? 'Los requisitos cambian casi cada año: confírmalos en la agencia tributaria de la comunidad.' : 'Els requisits canvien gairebé cada any: confirma’ls a l’agència tributària de la comunitat.'}`));
    if (d.tramoAlto) avisos.push(tx((l) => l === 'es' ? `Desde ${eur(d.tramoAlto!.desde, l)} el tipo es del ${pct(d.tramoAlto!.tipo, l)} sobre todo el valor.` : `Des de ${eur(d.tramoAlto!.desde, l)} el tipus és del ${pct(d.tramoAlto!.tipo, l)} sobre tot el valor.`));
    let desde = 0;
    const tablas: any[] = [];
    if (d.escala) tablas.push({ titulo: tx((l) => `${l === 'es' ? 'Escala del ITP' : 'Escala de l’ITP'} ${l === 'es' ? 'en' : 'a'} ${nomViv(v.ccaa, l)} (${l === 'es' ? 'por tramos' : 'per trams'})`), cab: [tt('Tramo de valor', 'Tram de valor'), tt('Tipo', 'Tipus')], formatos: ['txt', 'pct'], filas: d.escala.map((t) => { const f = [tx((l) => `${eur(desde, l)} – ${t.hasta == null ? '∞' : eur(t.hasta, l)}`), t.tipo]; desde = t.hasta ?? desde; return f; }) });
    tablas.push({ titulo: tx((l) => `${l === 'es' ? 'ITP de una vivienda de' : 'ITP d’un habitatge de'} ${eur(base, l)} ${l === 'es' ? 'en cada comunidad' : 'a cada comunitat'}`), cab: [tt('Comunidad', 'Comunitat'), tt('Tipo medio', 'Tipus mitjà'), tt('ITP', 'ITP'), tt('Estado del dato', 'Estat de la dada')], formatos: ['txt', 'pct', 'eur0', 'txt'],
      filas: comp.map(({ k, r: x }) => [tx((l) => nomViv(k, l)), x.tipoEfectivo, x.cuota, datosITP(V, k).pendiente ? tt('Sin cotejar', 'Sense confrontar') : tt('Verificado', 'Verificat')]) });
    return {
      destacado: { e: tx((l) => `ITP ${l === 'es' ? 'en' : 'a'} ${nomViv(v.ccaa, l)}`), v: r.cuota, f: 'eur0', nota: tx((l) => `${l === 'es' ? 'Tipo medio' : 'Tipus mitjà'} ${pct(r.tipoEfectivo, l)} ${l === 'es' ? 'sobre una base de' : 'sobre una base de'} ${eur(base, l)}`) },
      secundarios: [
        { e: tt('Tipo marginal', 'Tipus marginal'), v: r.tipoMarginal, f: 'pct' },
        ...(v.reducido ? [{ e: tt('Ahorro frente al tipo general', 'Estalvi respecte al tipus general'), v: general.cuota - r.cuota, f: 'eur0' as const }] : []),
        { e: tx((l) => `${l === 'es' ? 'Comunidad más barata' : 'Comunitat més barata'}: ${nomViv(comp[0].k, l)}`), v: comp[0].r.cuota, f: 'eur0' },
      ],
      tablas,
      avisos,
    };
  },
});
