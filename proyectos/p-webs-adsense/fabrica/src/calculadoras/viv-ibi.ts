import { def, tt } from '../lib/def';
import { diasEntre } from '../lib/calc/base';
import { tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-ibi',
  campos: [
    { id: 'valor', tipo: 'numero', def: 80000, min: 0, paso: 500, sufijo: '€', etiqueta: tt('Valor catastral (o base liquidable) del recibo', 'Valor cadastral (o base liquidable) del rebut'), ayuda: tt('Si tu municipio aplica la reducción por revisión catastral, usa la base liquidable.', 'Si el teu municipi aplica la reducció per revisió cadastral, fes servir la base liquidable.') },
    { id: 'tipo', tipo: 'numero', def: 0.6, min: 0, max: 1.5, paso: 0.01, sufijo: '%', etiqueta: tt('Tipo de gravamen de tu ayuntamiento (ejemplo)', 'Tipus de gravamen del teu ajuntament (exemple)'), ayuda: tt('Sale en el recibo o en la tabla anual del Catastro.', 'Surt al rebut o a la taula anual del Cadastre.') },
    { id: 'bonificacion', tipo: 'numero', def: 0, min: 0, max: 100, paso: 5, sufijo: '%', etiqueta: tt('Bonificación (familia numerosa, placas solares…)', 'Bonificació (família nombrosa, plaques solars…)') },
    { id: 'prorrateo', tipo: 'casilla', def: false, etiqueta: tt('Repartir el IBI de este año entre comprador y vendedor', 'Repartir l’IBI d’aquest any entre comprador i venedor') },
    { id: 'fecha', tipo: 'fecha', def: '2026-07-01', etiqueta: tt('Fecha de la escritura de compraventa', 'Data de l’escriptura de compravenda'), si: (v) => !!v.prorrateo },
  ],
  calcular(v, { P }) {
    const I = P.vivienda.ibi;
    const tipo = n(v.tipo);
    const cuota = n(v.valor) * tipo / 100 * (1 - n(v.bonificacion) / 100);
    const avisos: any[] = [];
    if (tipo < I.tipo_urbano_minimo_pct || tipo > I.tipo_urbano_maximo_general_pct) avisos.push(tx((l) => l === 'es' ? `El tipo general para inmuebles urbanos va del ${pct(I.tipo_urbano_minimo_pct, l)} al ${pct(I.tipo_urbano_maximo_general_pct, l)} (art. 72 TRLRHL); algunos municipios pueden superarlo con incrementos. Revisa el tipo de tu recibo.` : `El tipus general per a immobles urbans va del ${pct(I.tipo_urbano_minimo_pct, l)} al ${pct(I.tipo_urbano_maximo_general_pct, l)} (art. 72 TRLRHL); alguns municipis el poden superar amb increments. Revisa el tipus del rebut.`));
    let filasP: any[] = [], comprador = 0;
    const f = typeof v.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.fecha) ? v.fecha : '2026-07-01';
    if (v.prorrateo) {
      const a = f.slice(0, 4);
      const diasAnio = diasEntre(`${a}-01-01`, `${a}-12-31`);
      const diasComprador = diasEntre(f, `${a}-12-31`);
      comprador = cuota * diasComprador / diasAnio;
      filasP = [
        { e: tx((l) => `${l === 'es' ? 'Vendedor' : 'Venedor'} (${diasAnio - diasComprador} ${l === 'es' ? 'días' : 'dies'})`), v: cuota - comprador, sub: true },
        { e: tx((l) => `${l === 'es' ? 'Comprador' : 'Comprador'} (${diasComprador} ${l === 'es' ? 'días' : 'dies'})`), v: comprador, sub: true },
      ];
      avisos.push(tt('El recibo entero lo paga quien era propietario el 1 de enero. El reparto por días es lo habitual en la escritura, pero solo si se pacta.', 'El rebut sencer el paga qui era propietari l’1 de gener. El repartiment per dies és l’habitual a l’escriptura, però només si es pacta.'));
    }
    avisos.push(tt('Horquilla del art. 72 TRLRHL pendiente de cotejo en el BOE. Los tipos de cada municipio se publican cada año en la web del Catastro.', 'Forquilla de l’art. 72 TRLRHL pendent de confrontació al BOE. Els tipus de cada municipi es publiquen cada any al web del Cadastre.'));
    return {
      destacado: { e: tt('IBI al año', 'IBI l’any'), v: cuota, nota: tx((l) => `${eur(cuota / 12, l, 2)} ${l === 'es' ? 'al mes si lo repartes' : 'al mes si el reparteixes'}`) },
      secundarios: [
        { e: tt('Tipo aplicado', 'Tipus aplicat'), v: tipo, f: 'pct' },
        ...(v.prorrateo ? [{ e: tt('Parte del comprador', 'Part del comprador'), v: comprador }] : []),
      ],
      filas: [
        { e: tt('Valor catastral o base liquidable', 'Valor cadastral o base liquidable'), v: n(v.valor) },
        { e: tx((l) => `${l === 'es' ? 'Cuota íntegra' : 'Quota íntegra'} (${pct(tipo, l)})`), v: n(v.valor) * tipo / 100 },
        { e: tx((l) => `${l === 'es' ? 'Bonificación' : 'Bonificació'} (${pct(n(v.bonificacion), l)})`), v: n(v.valor) * tipo / 100 * n(v.bonificacion) / 100, signo: '-' },
        { e: tt('IBI a pagar', 'IBI a pagar'), v: cuota, fuerte: true },
        ...filasP,
      ],
      tablas: [{ titulo: tt('IBI según el tipo del municipio', 'IBI segons el tipus del municipi'), cab: [tt('Tipo', 'Tipus'), tt('IBI al año', 'IBI l’any')], formatos: ['pct', 'eur'], filas: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1].filter((t) => t >= I.tipo_urbano_minimo_pct && t <= I.tipo_urbano_maximo_general_pct).map((t) => [t, n(v.valor) * t / 100 * (1 - n(v.bonificacion) / 100)]) }],
      avisos,
    };
  },
});
