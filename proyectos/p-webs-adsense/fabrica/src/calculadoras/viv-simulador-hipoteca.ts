import { def, tt } from '../lib/def';
import { hipotecaFija, hipotecaVariable } from '../lib/calc/vivienda';
import { campoImporte, campoPlazo, ineDef, euriborDef, avisoEuribor, avisoFEIN, tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-simulador-hipoteca',
  campos: [
    campoImporte(ineDef('importe_medio_eur')),
    campoPlazo(ineDef('plazo_medio_anios')),
    { id: 'modo', tipo: 'select', def: 'fijo', etiqueta: tt('Tipo de interés', 'Tipus d’interès'), opciones: [{ v: 'fijo', t: tt('Fijo', 'Fix') }, { v: 'variable', t: tt('Variable', 'Variable') }, { v: 'mixto', t: tt('Mixto', 'Mixt') }] },
    { id: 'tin', tipo: 'numero', def: ineDef('tipo_interes_medio_pct'), min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Interés (TIN) fijo', 'Interès (TIN) fix'), ayuda: tt('Por defecto, el tipo medio de las hipotecas sobre vivienda del INE.', 'Per defecte, el tipus mitjà de les hipoteques sobre habitatge de l’INE.'), si: (v) => v.modo !== 'variable' },
    { id: 'aniosFijos', tipo: 'numero', def: 5, min: 1, max: 30, paso: 1, etiqueta: tt('Años a tipo fijo', 'Anys a tipus fix'), si: (v) => v.modo === 'mixto' },
    { id: 'euribor', tipo: 'numero', def: euriborDef(), min: -1, max: 10, paso: 0.001, sufijo: '%', etiqueta: tt('Euríbor que supones', 'Euríbor que suposes'), ayuda: tt('Por defecto, el último Euríbor mensual. Se supone constante: cambia el valor para ver otros escenarios.', 'Per defecte, l’últim Euríbor mensual. Se suposa constant: canvia el valor per veure altres escenaris.'), si: (v) => v.modo !== 'fijo' },
    { id: 'diferencial', tipo: 'numero', def: 0.6, min: 0, max: 5, paso: 0.05, sufijo: '%', etiqueta: tt('Diferencial sobre el Euríbor (ejemplo)', 'Diferencial sobre l’Euríbor (exemple)'), si: (v) => v.modo !== 'fijo' },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const capital = n(v.importe), anios = Math.max(1, n(v.anios));
    const h = v.modo === 'fijo'
      ? hipotecaFija(capital, n(v.tin), anios)
      : hipotecaVariable(capital, anios, { tinFijo: v.modo === 'mixto' ? n(v.tin) : undefined, aniosFijos: v.modo === 'mixto' ? n(v.aniosFijos) : 0, diferencial: n(v.diferencial), euriborAnio: () => n(v.euribor) });
    const variableTin = Math.max(0, n(v.euribor) + n(v.diferencial));
    const cuotaTramo2 = v.modo === 'mixto' ? h.cuadro.meses[Math.min(h.cuadro.meses.length - 1, n(v.aniosFijos) * 12)]?.cuota ?? h.cuota : null;
    const avisos = [avisoFEIN];
    if (v.modo !== 'fijo') avisos.push(avisoEuribor(V), tt('El Euríbor real cambiará en cada revisión: el simulador lo mantiene igual todo el plazo. Mira «¿Hipoteca fija o variable?» para comparar escenarios.', 'L’Euríbor real canviarà a cada revisió: el simulador el manté igual tot el termini. Mira «Hipoteca fixa o variable?» per comparar escenaris.'));
    return {
      destacado: { e: tt('Cuota mensual', 'Quota mensual'), v: h.cuota, nota: tx((l) => `${anios * 12} ${l === 'es' ? 'cuotas por un préstamo de' : 'quotes per un préstec de'} ${eur(capital, l)}${v.modo === 'fijo' ? ` ${l === 'es' ? 'al' : 'al'} ${pct(n(v.tin), l)}` : ''}`) },
      secundarios: [
        { e: tt('Intereses totales', 'Interessos totals'), v: h.intereses },
        { e: tt('Total que devuelves', 'Total que retornes'), v: h.total },
        ...(cuotaTramo2 != null ? [{ e: tx((l) => `${l === 'es' ? 'Cuota desde el año' : 'Quota des de l’any'} ${n(v.aniosFijos) + 1}`), v: cuotaTramo2 }] : []),
        ...(v.modo === 'variable' ? [{ e: tt('Interés aplicado (Euríbor + diferencial)', 'Interès aplicat (Euríbor + diferencial)'), v: variableTin, f: 'pct' as const }] : []),
      ],
      reparto: [{ e: tt('Capital', 'Capital'), v: capital }, { e: tt('Intereses', 'Interessos'), v: h.intereses }],
      tablas: [{
        titulo: tt('Cuadro de amortización por años', 'Quadre d’amortització per anys'),
        cab: [tt('Año', 'Any'), tt('Interés', 'Interès'), tt('Cuota media', 'Quota mitjana'), tt('Intereses', 'Interessos'), tt('Capital', 'Capital'), tt('Pendiente', 'Pendent')],
        formatos: ['num0', 'pct', 'eur', 'eur', 'eur', 'eur0'],
        filas: h.cuadro.anios.map((a) => [a.anio, a.tin, a.cuotaMedia, a.interes, a.capital, a.pendiente]),
      }],
      avisos,
    };
  },
});
