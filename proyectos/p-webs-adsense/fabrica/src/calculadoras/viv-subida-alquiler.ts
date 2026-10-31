import { def, tt } from '../lib/def';
import { actualizarRenta, ultimo, nombreMes } from '../lib/calc/vivienda';
import { iravDef, tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-subida-alquiler',
  campos: [
    { id: 'renta', tipo: 'numero', def: 900, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Renta mensual actual', 'Renda mensual actual') },
    { id: 'indice', tipo: 'select', def: 'irav', etiqueta: tt('Índice de tu contrato', 'Índex del teu contracte'), opciones: [{ v: 'irav', t: tt('IRAV (contratos desde el 26/5/2023)', 'IRAV (contractes des del 26/5/2023)') }, { v: 'otro', t: tt('IPC u otro índice', 'IPC o un altre índex') }] },
    { id: 'valor', tipo: 'numero', def: iravDef(), min: -10, max: 20, paso: 0.01, sufijo: '%', etiqueta: tt('Variación del índice', 'Variació de l’índex'), ayuda: tt('Por defecto, el último IRAV publicado. Usa el del mes que diga tu contrato (normalmente, dos meses antes del aniversario).', 'Per defecte, l’últim IRAV publicat. Fes servir el del mes que digui el contracte (normalment, dos mesos abans de l’aniversari).') },
  ],
  calcular(v, { P }) {
    const S = P.vivienda.irav_alquiler.serie.filter((x: any) => x.valor != null);
    const u = ultimo(S);
    const nueva = actualizarRenta(n(v.renta), n(v.valor));
    const dif = nueva - n(v.renta);
    return {
      destacado: { e: tt('Nueva renta mensual', 'Nova renda mensual'), v: nueva, nota: tx((l) => `${dif >= 0 ? '+' : '−'}${eur(Math.abs(dif), l, 2)} ${l === 'es' ? 'al mes' : 'al mes'} (${pct(n(v.valor), l)})`) },
      secundarios: [
        { e: tt('Subida al año', 'Pujada l’any'), v: dif * 12 },
        { e: tx((l) => `IRAV ${l === 'es' ? 'de' : 'de'} ${nombreMes(u.mes, l)}`), v: u.valor, f: 'pct' },
      ],
      tablas: [
        { titulo: tt('Tu renta con cada IRAV publicado', 'La teva renda amb cada IRAV publicat'), cab: [tt('Mes del índice', 'Mes de l’índex'), tt('IRAV', 'IRAV'), tt('Nueva renta', 'Nova renda'), tt('Subida al mes', 'Pujada al mes')], formatos: ['txt', 'pct', 'eur', 'eur'],
          filas: [...S].reverse().map((x: any) => [tx((l) => nombreMes(x.mes, l)), x.valor, actualizarRenta(n(v.renta), x.valor), actualizarRenta(n(v.renta), x.valor) - n(v.renta)]) },
        { titulo: tx((l) => `${l === 'es' ? 'Ejemplos con el IRAV de' : 'Exemples amb l’IRAV de'} ${nombreMes(u.mes, l)}`), cab: [tt('Renta actual', 'Renda actual'), tt('Nueva renta', 'Nova renda'), tt('Subida al año', 'Pujada l’any')], formatos: ['eur0', 'eur', 'eur'],
          filas: [600, 700, 800, 900, 1000, 1200, 1500].map((r) => [r, actualizarRenta(r, u.valor), (actualizarRenta(r, u.valor) - r) * 12]) },
      ],
      avisos: [
        tt('Solo se actualiza una vez al año, en la fecha del aniversario, y si el contrato lo prevé. Si el contrato no dice nada, la renta no sube.', 'Només s’actualitza un cop l’any, en la data de l’aniversari, i si el contracte ho preveu. Si el contracte no diu res, la renda no puja.'),
        tt('El IRAV lo publica el INE cada mes. Las cifras de esta página salen de prensa especializada y están pendientes de cotejar en ine.es.', 'L’IRAV el publica l’INE cada mes. Les xifres d’aquesta pàgina surten de premsa especialitzada i estan pendents de confrontar a ine.es.'),
        tt('En zonas de mercado tensionado y en contratos de grandes tenedores puede haber límites adicionales: consulta la oficina de vivienda de tu ayuntamiento.', 'En zones de mercat tensionat i en contractes de grans tenidors hi pot haver límits addicionals: consulta l’oficina d’habitatge del teu ajuntament.'),
      ],
    };
  },
});
