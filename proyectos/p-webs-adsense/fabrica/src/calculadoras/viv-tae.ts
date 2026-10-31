import { def, tt } from '../lib/def';
import { cuota, tae } from '../lib/calc/vivienda';
import { campoImporte, campoPlazo, tx, eur, pct, n, avisoFEIN } from '../lib/camposVivienda';

export default def({
  id: 'viv-tae',
  campos: [
    campoImporte(180000),
    campoPlazo(30),
    { id: 'tinBonif', tipo: 'numero', def: 2.6, min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('TIN con todas las bonificaciones', 'TIN amb totes les bonificacions') },
    { id: 'tinSin', tipo: 'numero', def: 3.4, min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('TIN sin bonificaciones', 'TIN sense bonificacions') },
    { id: 'vida', tipo: 'numero', def: 300, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Seguro de vida vinculado, al año', 'Assegurança de vida vinculada, l’any') },
    { id: 'hogar', tipo: 'numero', def: 250, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Seguro de hogar vinculado, al año', 'Assegurança de la llar vinculada, l’any') },
    { id: 'otros', tipo: 'numero', def: 0, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Otros productos vinculados, al mes', 'Altres productes vinculats, al mes'), ayuda: tt('Mantenimiento de cuenta, tarjeta, plan de pensiones…', 'Manteniment del compte, targeta, pla de pensions…') },
    { id: 'apertura', tipo: 'numero', def: 0, min: 0, max: 5, paso: 0.05, sufijo: '%', etiqueta: tt('Comisión de apertura', 'Comissió d’obertura') },
    { id: 'tasacion', tipo: 'numero', def: 350, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Tasación (la pagas tú)', 'Taxació (la pagues tu)') },
  ],
  calcular(v) {
    const capital = n(v.importe), meses = Math.round(Math.max(1, n(v.anios)) * 12);
    const gastos = capital * n(v.apertura) / 100 + n(v.tasacion);
    const cB = cuota(capital, n(v.tinBonif), meses), cS = cuota(capital, n(v.tinSin), meses);
    const vinc = (n(v.vida) + n(v.hogar)) / 12 + n(v.otros);
    const taeB = tae(capital - gastos, Array(meses).fill(cB + vinc));
    const taeS = tae(capital - gastos, Array(meses).fill(cS));
    const costeB = (cB + vinc) * meses + gastos, costeS = cS * meses + gastos;
    const conviene = costeB < costeS;
    return {
      destacado: { e: tt('TAE real con las vinculaciones', 'TAE real amb les vinculacions'), v: taeB, f: 'pct', nota: tx((l) => `${l === 'es' ? 'Frente a un TIN del' : 'Davant d’un TIN del'} ${pct(n(v.tinBonif), l)}. ${l === 'es' ? 'Sin bonificar, la TAE sería del' : 'Sense bonificar, la TAE seria del'} ${pct(taeS, l)}.`) },
      secundarios: [
        { e: tt('Cuota bonificada + seguros', 'Quota bonificada + assegurances'), v: cB + vinc },
        { e: tt('Cuota sin bonificar', 'Quota sense bonificar'), v: cS },
        { e: conviene ? tt('Ahorro total bonificándote', 'Estalvi total bonificant-te') : tt('Sobrecoste total bonificándote', 'Sobrecost total bonificant-te'), v: Math.abs(costeS - costeB), f: 'eur0' },
      ],
      tablas: [{ titulo: tt('Las dos ofertas en todo el plazo', 'Les dues ofertes en tot el termini'), cab: [tt('Concepto', 'Concepte'), tt('Con bonificaciones', 'Amb bonificacions'), tt('Sin bonificaciones', 'Sense bonificacions')], formatos: ['txt', 'eur0', 'eur0'], filas: [
        [tt('Cuota de la hipoteca', 'Quota de la hipoteca'), cB, cS],
        [tt('Intereses totales', 'Interessos totals'), cB * meses - capital, cS * meses - capital],
        [tt('Seguros y productos vinculados', 'Assegurances i productes vinculats'), vinc * meses, 0],
        [tt('Apertura y tasación', 'Obertura i taxació'), gastos, gastos],
        [tt('Coste total (sin el capital)', 'Cost total (sense el capital)'), costeB - capital, costeS - capital],
      ] }],
      avisos: [
        conviene
          ? tx((l) => l === 'es' ? `Bonificarte compensa: ahorras ${eur(costeS - costeB, l)} en todo el plazo, si mantienes los seguros con el mismo precio.` : `Bonificar-te compensa: estalvies ${eur(costeS - costeB, l)} en tot el termini, si mantens les assegurances amb el mateix preu.`)
          : tx((l) => l === 'es' ? `Bonificarte no compensa: los productos vinculados cuestan ${eur(costeB - costeS, l)} más de lo que ahorras en intereses.` : `Bonificar-te no compensa: els productes vinculats costen ${eur(costeB - costeS, l)} més del que estalvies en interessos.`),
        tt('TAE aproximada por iteración, con cuotas mensuales iguales y primas prorrateadas. La del banco (Orden EHA/2899/2011) puede variar unas centésimas; en las variables se calcula con el Euríbor de hoy.', 'TAE aproximada per iteració, amb quotes mensuals iguals i primes prorratejades. La del banc (Ordre EHA/2899/2011) pot variar unes centèsimes; en les variables es calcula amb l’Euríbor d’avui.'),
        tt('Las primas del seguro de vida suelen subir con la edad: pide al banco el precio de los próximos años.', 'Les primes de l’assegurança de vida solen pujar amb l’edat: demana al banc el preu dels propers anys.'),
        avisoFEIN,
      ],
    };
  },
});
