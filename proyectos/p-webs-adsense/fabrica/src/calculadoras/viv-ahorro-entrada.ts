import { def, tt } from '../lib/def';
import { gastosCompra } from '../lib/calc/vivienda';
import { campoComunidadViv, campoNueva, camposHonorarios, campoTipoAJD, campoIndirecto, criterioDef, sinAJD, indirectoEspecial, avisoPendiente, tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-ahorro-entrada',
  campos: [
    { id: 'precio', tipo: 'numero', def: 220000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de la vivienda', 'Preu de l’habitatge') },
    campoComunidadViv(), campoNueva,
    { id: 'financiacion', tipo: 'numero', def: criterioDef('financiacion_habitual_sobre_tasacion_pct'), min: 0, max: 100, paso: 5, sufijo: '%', etiqueta: tt('Porcentaje que financia el banco', 'Percentatge que finança el banc') },
    ...camposHonorarios, campoTipoAJD, campoIndirecto,
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const nueva = v.nueva === 'nueva';
    const g = gastosCompra({ precio: n(v.precio), ccaa: v.ccaa, nueva, gestoria: n(v.gestoria), tasacion: n(v.tasacion), tipoAJD: nueva && sinAJD(v.ccaa) && !indirectoEspecial(v.ccaa) ? n(v.tipoAJD) : null, tipoIndirecto: n(v.indirecto) }, V);
    const entrada = n(v.precio) * (1 - n(v.financiacion) / 100);
    const total = entrada + g.total;
    const filasT = [70, 80, 90, 100].map((f) => [f, n(v.precio) * f / 100, n(v.precio) * (1 - f / 100), g.total, n(v.precio) * (1 - f / 100) + g.total]);
    return {
      destacado: { e: tt('Ahorro que necesitas el día de la firma', 'Estalvi que necessites el dia de la signatura'), v: total, f: 'eur0', nota: tx((l) => `${pct(Math.round((total / n(v.precio)) * 1000) / 10, l)} ${l === 'es' ? 'del precio de la vivienda' : 'del preu de l’habitatge'}`) },
      secundarios: [
        { e: tt('Entrada', 'Entrada'), v: entrada, f: 'eur0' },
        { e: tt('Impuestos', 'Impostos'), v: g.impuestos, f: 'eur0' },
        { e: tt('Notaría, registro, gestoría y tasación', 'Notaria, registre, gestoria i taxació'), v: g.honorarios, f: 'eur0' },
      ],
      filas: [
        { e: tt('Precio de la vivienda', 'Preu de l’habitatge'), v: n(v.precio) },
        { e: tx((l) => `${l === 'es' ? 'Hipoteca' : 'Hipoteca'} (${pct(n(v.financiacion), l)})`), v: n(v.precio) - entrada, signo: '-' },
        { e: tt('Entrada', 'Entrada'), v: entrada, sub: true },
        ...(nueva ? [
          { e: tx((l) => `IVA (${pct(g.tipoIVA, l)})`), v: g.iva, signo: '+' as const },
          { e: tx((l) => `AJD (${pct(g.tipoAJD, l)})`), v: g.ajd, signo: '+' as const },
        ] : [{ e: tx((l) => `ITP (${pct(g.tipoITP, l)})`), v: g.itp, signo: '+' as const }]),
        { e: tt('Notaría, registro, gestoría y tasación (con IVA)', 'Notaria, registre, gestoria i taxació (amb IVA)'), v: g.honorarios, signo: '+' },
        { e: tt('Total que pones tú', 'Total que hi poses tu'), v: total, fuerte: true },
      ],
      reparto: [{ e: tt('Entrada', 'Entrada'), v: entrada }, { e: tt('Impuestos', 'Impostos'), v: g.impuestos }, { e: tt('Notaría, registro y otros', 'Notaria, registre i altres'), v: g.honorarios }],
      tablas: [{ titulo: tt('Según lo que financie el banco', 'Segons el que financiï el banc'), cab: [tt('Financiación', 'Finançament'), tt('Hipoteca', 'Hipoteca'), tt('Entrada', 'Entrada'), tt('Impuestos y gastos', 'Impostos i despeses'), tt('Ahorro necesario', 'Estalvi necessari')], formatos: ['pct', 'eur0', 'eur0', 'eur0', 'eur0'], filas: filasT }],
      avisos: [
        ...(g.pendiente ? [avisoPendiente(v.ccaa)] : []),
        tt('Los bancos casi nunca financian los impuestos ni los gastos: tienen que salir de tu ahorro. Una financiación del 90 o el 100 % suele exigir aval o vivienda del propio banco.', 'Els bancs gairebé mai no financen els impostos ni les despeses: han de sortir del teu estalvi. Un finançament del 90 o el 100 % sol exigir aval o habitatge del mateix banc.'),
        tx((l) => l === 'es' ? `Además, guarda un colchón: la hipoteca de ${eur(n(v.precio) - entrada, l)} no cubre mudanza, muebles ni imprevistos.` : `A més, guarda un coixí: la hipoteca de ${eur(n(v.precio) - entrada, l)} no cobreix mudança, mobles ni imprevistos.`),
      ],
    };
  },
});
