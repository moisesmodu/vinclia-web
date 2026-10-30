import { def, tt } from '../lib/def';
import { plusvalia, coeficientePlusvalia } from '../lib/calc/vivienda';
import { V0, tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-plusvalia',
  campos: [
    { id: 'venta', tipo: 'numero', def: 240000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de venta (o valor en la herencia o donación)', 'Preu de venda (o valor a l’herència o donació)') },
    { id: 'compra', tipo: 'numero', def: 160000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de compra (o valor cuando la recibiste)', 'Preu de compra (o valor quan la vas rebre)') },
    { id: 'anios', tipo: 'numero', def: 10, min: 0, max: 100, paso: 1, etiqueta: tt('Años completos que la has tenido', 'Anys complets que l’has tinguda') },
    { id: 'suelo', tipo: 'numero', def: 30000, min: 0, paso: 500, sufijo: '€', etiqueta: tt('Valor catastral del suelo (recibo del IBI)', 'Valor cadastral del sòl (rebut de l’IBI)') },
    { id: 'total', tipo: 'numero', def: 75000, min: 0, paso: 500, sufijo: '€', etiqueta: tt('Valor catastral total (recibo del IBI)', 'Valor cadastral total (rebut de l’IBI)') },
    { id: 'tipo', tipo: 'numero', def: V0()?.plusvalia_municipal?.tipo_maximo_pct ?? 0, min: 0, max: 30, paso: 0.5, sufijo: '%', etiqueta: tt('Tipo de tu ayuntamiento', 'Tipus del teu ajuntament'), ayuda: tt('Está en la ordenanza fiscal del IIVTNU. Por defecto, el máximo legal.', 'És a l’ordenança fiscal de l’IIVTNU. Per defecte, el màxim legal.') },
    { id: 'coefPropio', tipo: 'numero', def: 0, min: 0, max: 1, paso: 0.01, etiqueta: tt('Coeficiente de tu ayuntamiento (0 = el máximo legal)', 'Coeficient del teu ajuntament (0 = el màxim legal)') },
  ],
  calcular(v, { P }) {
    const V = P.vivienda.plusvalia_municipal;
    const anios = Math.max(0, Math.floor(n(v.anios)));
    const coefLegal = coeficientePlusvalia(V.coeficientes_maximos_vigentes.por_anios, anios);
    const coef = n(v.coefPropio) > 0 ? Math.min(n(v.coefPropio), coefLegal ?? Infinity) : coefLegal;
    const tipo = Math.min(n(v.tipo), V.tipo_maximo_pct);
    const base = { vcSuelo: n(v.suelo), vcTotal: n(v.total), compra: n(v.compra), venta: n(v.venta), anios, tipoPct: tipo };
    const r = plusvalia({ ...base, coeficiente: coef });
    const coefNuevo = coeficientePlusvalia(V.coeficientes_rdl_29_2026.conocidos, anios);
    const rNuevo = coefNuevo != null ? plusvalia({ ...base, coeficiente: n(v.coefPropio) > 0 ? Math.min(n(v.coefPropio), coefNuevo) : coefNuevo }) : null;
    const avisos: any[] = [];
    if (r.exenta) avisos.push(tt('No hay ganancia: no pagas plusvalía (RDL 26/2021). Guarda las escrituras de compra y venta para acreditarlo ante el ayuntamiento.', 'No hi ha guany: no pagues plusvàlua (RDL 26/2021). Guarda les escriptures de compra i venda per acreditar-ho davant l’ajuntament.'));
    avisos.push(rNuevo
      ? tx((l) => l === 'es' ? `Si el RDL 29/2026 se convalida, desde el 1/12/2026 el coeficiente máximo para ${anios} años pasaría a ${coefNuevo} y pagarías ${eur(rNuevo.aPagar, l, 2)}. Hoy está pendiente de convalidación.` : `Si el RDL 29/2026 es convalida, des de l’1/12/2026 el coeficient màxim per a ${anios} anys passaria a ${coefNuevo} i pagaries ${eur(rNuevo.aPagar, l, 2)}. Avui està pendent de convalidació.`)
      : tt('El RDL 29/2026 cambia los coeficientes desde el 1/12/2026 si se convalida; para estos años aún no conocemos el nuevo coeficiente.', 'El RDL 29/2026 canvia els coeficients des de l’1/12/2026 si es convalida; per a aquests anys encara no coneixem el coeficient nou.'));
    avisos.push(tt('Coeficientes máximos de 2024 (RDL 8/2023), vigentes porque los de 2025 y 2026 decayeron. Están pendientes de cotejo año a año. Tu ayuntamiento puede tener coeficientes y tipo más bajos y bonificaciones por herencia de la vivienda habitual.', 'Coeficients màxims del 2024 (RDL 8/2023), vigents perquè els del 2025 i el 2026 van decaure. Estan pendents de confrontació any per any. El teu ajuntament pot tenir coeficients i tipus més baixos i bonificacions per herència de l’habitatge habitual.'));
    return {
      destacado: { e: tt('Plusvalía a pagar', 'Plusvàlua a pagar'), v: r.aPagar, nota: r.exenta ? tt('Sin ganancia, sin impuesto', 'Sense guany, sense impost') : tx((l) => `${l === 'es' ? 'Método' : 'Mètode'} ${r.metodo === 'real' ? (l === 'es' ? 'real' : 'real') : (l === 'es' ? 'objetivo' : 'objectiu')}: ${l === 'es' ? 'el más barato de los dos' : 'el més barat dels dos'}`) },
      secundarios: [
        { e: tt('Método objetivo', 'Mètode objectiu'), v: Number.isFinite(r.objetiva) ? r.objetiva : '—' },
        { e: tt('Método real', 'Mètode real'), v: r.real },
        { e: tt('Ganancia de la venta', 'Guany de la venda'), v: r.ganancia, f: 'eur0' },
      ],
      filas: [
        { e: tt('Valor catastral del suelo', 'Valor cadastral del sòl'), v: n(v.suelo) },
        { e: tx((l) => `${l === 'es' ? 'Coeficiente por' : 'Coeficient per'} ${anios} ${l === 'es' ? 'años' : 'anys'}`), v: coef ?? '—', f: 'num' },
        { e: tt('Base del método objetivo', 'Base del mètode objectiu'), v: r.baseObjetiva, sub: true },
        { e: tx((l) => `${l === 'es' ? 'Parte del suelo en el valor catastral' : 'Part del sòl al valor cadastral'}`), v: r.proporcion, f: 'pct' },
        { e: tt('Base del método real (ganancia × parte del suelo)', 'Base del mètode real (guany × part del sòl)'), v: r.baseReal, sub: true },
        { e: tt('Tipo del ayuntamiento', 'Tipus de l’ajuntament'), v: tipo, f: 'pct' },
        { e: tt('Plusvalía a pagar', 'Plusvàlua a pagar'), v: r.aPagar, fuerte: true },
      ],
      tablas: [{ titulo: tt('Coeficientes máximos por años de tenencia', 'Coeficients màxims per anys de tinença'), cab: [tt('Años', 'Anys'), tt('Vigente (RDL 8/2023)', 'Vigent (RDL 8/2023)'), tt('RDL 29/2026, si se convalida', 'RDL 29/2026, si es convalida')], formatos: ['txt', 'num', 'num'],
        filas: Object.entries<number>(V.coeficientes_maximos_vigentes.por_anios).map(([k, c]) => [k === '20_o_mas' ? tt('20 o más', '20 o més') : k, c, V.coeficientes_rdl_29_2026.conocidos[k] ?? '—']) }],
      avisos,
    };
  },
});
