import { def, tt } from '../lib/def';
import { fijaOVariable } from '../lib/calc/vivienda';
import { campoImporte, campoPlazo, ineDef, euriborDef, avisoEuribor, avisoFEIN, tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-fija-o-variable',
  campos: [
    campoImporte(ineDef('importe_medio_eur')),
    campoPlazo(ineDef('plazo_medio_anios')),
    { id: 'tinFijo', tipo: 'numero', def: ineDef('tipo_inicial_medio_fijo_pct'), min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Oferta fija: interés (TIN)', 'Oferta fixa: interès (TIN)'), ayuda: tt('Por defecto, el tipo inicial medio de las hipotecas fijas del INE.', 'Per defecte, el tipus inicial mitjà de les hipoteques fixes de l’INE.') },
    { id: 'tinInicial', tipo: 'numero', def: ineDef('tipo_inicial_medio_variable_pct'), min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Oferta variable: interés del primer año', 'Oferta variable: interès del primer any'), ayuda: tt('Por defecto, el tipo inicial medio de las hipotecas variables del INE.', 'Per defecte, el tipus inicial mitjà de les hipoteques variables de l’INE.') },
    { id: 'diferencial', tipo: 'numero', def: 0.6, min: 0, max: 5, paso: 0.05, sufijo: '%', etiqueta: tt('Oferta variable: diferencial (ejemplo)', 'Oferta variable: diferencial (exemple)') },
    { id: 'euribor', tipo: 'numero', def: euriborDef(), min: -1, max: 10, paso: 0.001, sufijo: '%', etiqueta: tt('Euríbor de partida', 'Euríbor de partida') },
    { id: 'paso', tipo: 'numero', def: 1, min: 0.25, max: 5, paso: 0.25, sufijo: '%', etiqueta: tt('Cuántos puntos sube o baja en los escenarios', 'Quants punts puja o baixa als escenaris') },
  ],
  calcular(v, { P }) {
    const r = fijaOVariable({ capital: n(v.importe), anios: Math.max(1, n(v.anios)), tinFijo: n(v.tinFijo), tinInicial: n(v.tinInicial), diferencial: n(v.diferencial), euribor: n(v.euribor), paso: n(v.paso) });
    const [baja, igual, sube] = r.escenarios;
    const nombres = { baja: tx((l) => `${l === 'es' ? 'Variable: Euríbor baja a' : 'Variable: Euríbor baixa a'} ${pct(n(v.euribor) - n(v.paso), l)}`), igual: tx((l) => `${l === 'es' ? 'Variable: Euríbor se queda en' : 'Variable: Euríbor es queda en'} ${pct(n(v.euribor), l)}`), sube: tx((l) => `${l === 'es' ? 'Variable: Euríbor sube a' : 'Variable: Euríbor puja a'} ${pct(n(v.euribor) + n(v.paso), l)}`) } as const;
    const mejor = igual.intereses < r.fija.intereses;
    return {
      destacado: { e: tt('Euríbor a partir del que la fija sale mejor', 'Euríbor a partir del qual la fixa surt millor'), v: r.euriborEquilibrio, f: 'pct', nota: tx((l) => l === 'es'
        ? `Si el Euríbor medio de los próximos años supera el ${pct(r.euriborEquilibrio, l)}, la variable te costará más que la fija. Hoy está en el ${pct(n(v.euribor), l)}.`
        : `Si l’Euríbor mitjà dels propers anys supera el ${pct(r.euriborEquilibrio, l)}, la variable et costarà més que la fixa. Avui és al ${pct(n(v.euribor), l)}.`) },
      secundarios: [
        { e: tt('Cuota de la fija', 'Quota de la fixa'), v: r.fija.cuota },
        { e: tt('Intereses de la fija', 'Interessos de la fixa'), v: r.fija.intereses },
        { e: tt('Intereses de la variable (Euríbor igual)', 'Interessos de la variable (Euríbor igual)'), v: igual.intereses },
      ],
      tablas: [{
        titulo: tt('Coste de cada opción en todo el plazo', 'Cost de cada opció en tot el termini'),
        cab: [tt('Opción', 'Opció'), tt('Cuota inicial', 'Quota inicial'), tt('Cuota desde el año 2', 'Quota des de l’any 2'), tt('Intereses totales', 'Interessos totals'), tt('Frente a la fija', 'Respecte a la fixa')],
        formatos: ['txt', 'eur', 'eur', 'eur0', 'eur0'],
        filas: [
          [tx((l) => `${l === 'es' ? 'Fija al' : 'Fixa al'} ${pct(n(v.tinFijo), l)}`), r.fija.cuota, r.fija.cuota, r.fija.intereses, 0],
          ...[baja, igual, sube].map((e) => [nombres[e.nombre as keyof typeof nombres], e.cuotaInicial, e.cuotaTrasRevision, e.intereses, e.intereses - r.fija.intereses]),
        ],
      }],
      avisos: [
        mejor
          ? tx((l) => l === 'es' ? `Con el Euríbor de hoy constante, la variable te ahorraría ${eur(r.fija.intereses - igual.intereses, l)} en intereses; si sube ${pct(n(v.paso), l)} puntos, pagarías ${eur(sube.intereses - r.fija.intereses, l)} más que con la fija.` : `Amb l’Euríbor d’avui constant, la variable t’estalviaria ${eur(r.fija.intereses - igual.intereses, l)} en interessos; si puja ${pct(n(v.paso), l)} punts, pagaries ${eur(sube.intereses - r.fija.intereses, l)} més que amb la fixa.`)
          : tx((l) => l === 'es' ? `Con el Euríbor de hoy constante, la fija ya es más barata: ${eur(igual.intereses - r.fija.intereses, l)} menos de intereses.` : `Amb l’Euríbor d’avui constant, la fixa ja és més barata: ${eur(igual.intereses - r.fija.intereses, l)} menys d’interessos.`),
        tt('Los escenarios suponen que el Euríbor cambia en la primera revisión y se queda ahí hasta el final. Nadie sabe cómo evolucionará: la fija compra la tranquilidad de una cuota que no cambia.', 'Els escenaris suposen que l’Euríbor canvia a la primera revisió i s’hi queda fins al final. Ningú no sap com evolucionarà: la fixa compra la tranquil·litat d’una quota que no canvia.'),
        avisoEuribor(P.vivienda), avisoFEIN,
      ],
    };
  },
});
