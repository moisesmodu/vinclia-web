import { def, tt } from '../lib/def';
import { cuota, ultimo, delMes, nombreMes } from '../lib/calc/vivienda';
import { params, anios } from '../lib/params';
import { euriborDef, avisoEuribor, avisoFEIN, tx, eur, pct, n } from '../lib/camposVivienda';

// Euríbor de doce meses antes del último publicado (el de la revisión anterior), para el valor por defecto
const anteriorDef = (): number => {
  const a = anios('es');
  const V = a.length ? params('es', a[a.length - 1]).vivienda : undefined;
  if (!V) return 0;
  const u = ultimo(V.euribor_12m.serie);
  const [y, m] = u.mes.split('-');
  return delMes(V.euribor_12m.serie, `${Number(y) - 1}-${m}`) ?? u.valor;
};

export default def({
  id: 'viv-revision-euribor',
  campos: [
    { id: 'pendiente', tipo: 'numero', def: 150000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Capital pendiente de tu hipoteca', 'Capital pendent de la teva hipoteca') },
    { id: 'anios', tipo: 'numero', def: 25, min: 1, max: 40, paso: 1, etiqueta: tt('Años que te quedan', 'Anys que et queden') },
    { id: 'diferencial', tipo: 'numero', def: 0.6, min: 0, max: 5, paso: 0.05, sufijo: '%', etiqueta: tt('Diferencial de tu escritura', 'Diferencial de la teva escriptura') },
    { id: 'nuevo', tipo: 'numero', def: euriborDef(), min: -1, max: 10, paso: 0.001, sufijo: '%', etiqueta: tt('Euríbor de la revisión', 'Euríbor de la revisió'), ayuda: tt('Tu escritura dice qué mes se toma: casi siempre uno o dos meses antes de la fecha de revisión.', 'La teva escriptura diu quin mes es pren: gairebé sempre un o dos mesos abans de la data de revisió.') },
    { id: 'anterior', tipo: 'numero', def: anteriorDef(), min: -1, max: 10, paso: 0.001, sufijo: '%', etiqueta: tt('Euríbor de la revisión anterior', 'Euríbor de la revisió anterior') },
    { id: 'periodo', tipo: 'select', def: '12', etiqueta: tt('Revisión', 'Revisió'), opciones: [{ v: '12', t: tt('Anual', 'Anual') }, { v: '6', t: tt('Semestral', 'Semestral') }] },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const meses = Math.round(n(v.anios) * 12);
    const tinNuevo = Math.max(0, n(v.nuevo) + n(v.diferencial)), tinAnt = Math.max(0, n(v.anterior) + n(v.diferencial));
    const ahora = cuota(n(v.pendiente), tinNuevo, meses), antes = cuota(n(v.pendiente), tinAnt, meses);
    const dif = ahora - antes, per = Number(v.periodo);
    const filas = [-1, -0.5, -0.25, 0, 0.25, 0.5, 1].map((d) => { const e = n(v.nuevo) + d; const c = cuota(n(v.pendiente), Math.max(0, e + n(v.diferencial)), meses); return [Math.round(e * 1000) / 1000, Math.max(0, e + n(v.diferencial)), c, c - antes]; });
    const serie = V.euribor_12m.serie.filter((x: any) => x.valor != null);
    return {
      destacado: { e: tt('Nueva cuota mensual', 'Nova quota mensual'), v: ahora, nota: tx((l) => dif >= 0 ? `${eur(dif, l, 2)} ${l === 'es' ? 'más al mes que con el Euríbor anterior' : 'més al mes que amb l’Euríbor anterior'}` : `${eur(-dif, l, 2)} ${l === 'es' ? 'menos al mes que con el Euríbor anterior' : 'menys al mes que amb l’Euríbor anterior'}`) },
      secundarios: [
        { e: tt('Cuota anterior', 'Quota anterior'), v: antes },
        { e: tx((l) => l === 'es' ? `Diferencia en ${per} meses` : `Diferència en ${per} mesos`), v: dif * per },
        { e: tt('Nuevo interés (Euríbor + diferencial)', 'Nou interès (Euríbor + diferencial)'), v: tinNuevo, f: 'pct' },
      ],
      filas: [
        { e: tt('Capital pendiente', 'Capital pendent'), v: n(v.pendiente) },
        { e: tx((l) => `${l === 'es' ? 'Interés anterior' : 'Interès anterior'} (${pct(n(v.anterior), l)} + ${pct(n(v.diferencial), l)})`), v: tinAnt, f: 'pct' },
        { e: tx((l) => `${l === 'es' ? 'Interés nuevo' : 'Interès nou'} (${pct(n(v.nuevo), l)} + ${pct(n(v.diferencial), l)})`), v: tinNuevo, f: 'pct' },
        { e: tt('Cuota con el interés anterior', 'Quota amb l’interès anterior'), v: antes },
        { e: tt('Cuota con el interés nuevo', 'Quota amb l’interès nou'), v: ahora, fuerte: true },
      ],
      tablas: [
        { titulo: tt('Tu cuota si el Euríbor de la revisión fuera otro', 'La teva quota si l’Euríbor de la revisió fos un altre'), cab: [tt('Euríbor', 'Euríbor'), tt('Interés', 'Interès'), tt('Cuota', 'Quota'), tt('Frente a la anterior', 'Respecte a l’anterior')], formatos: ['pct', 'pct', 'eur', 'eur'], filas },
        { titulo: tt('Euríbor a 12 meses: últimos datos', 'Euríbor a 12 mesos: últimes dades'), cab: [tt('Mes', 'Mes'), tt('Media mensual', 'Mitjana mensual'), tt('Estado', 'Estat')], formatos: ['txt', 'pct', 'txt'], filas: [...serie].reverse().map((x: any) => [tx((l) => nombreMes(x.mes, l)), x.valor, x.pendiente_cotejo ? tt('Sin cotejar con el BOE', 'Sense confrontar amb el BOE') : tt('Oficial (BdE)', 'Oficial (BdE)')]) },
      ],
      avisos: [avisoEuribor(V), tt('Se calcula con el capital y el plazo que te quedan hoy, como hace el banco en la revisión. Si tu hipoteca tiene suelo o techo, se aplica el que diga la escritura.', 'Es calcula amb el capital i el termini que et queden avui, com fa el banc a la revisió. Si la teva hipoteca té sòl o sostre, s’aplica el que digui l’escriptura.'), avisoFEIN],
    };
  },
});
