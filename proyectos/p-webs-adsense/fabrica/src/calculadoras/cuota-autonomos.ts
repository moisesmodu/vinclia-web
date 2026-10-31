import { def, tt } from '../lib/def';
import { cuotaAutonomos } from '../lib/calc/laboral';

export default def({
  id: 'cuota-autonomos',
  anual: true,
  campos: [
    { id: 'ingresos', tipo: 'numero', def: 36000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Ingresos anuales previstos (sin IVA)', 'Ingressos anuals previstos (sense IVA)') },
    { id: 'gastos', tipo: 'numero', def: 8000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Gastos deducibles anuales (sin contar la cuota)', 'Despeses deduïbles anuals (sense comptar la quota)') },
    { id: 'societario', tipo: 'casilla', def: false, etiqueta: tt('Autónomo societario (administrador de sociedad)', 'Autònom societari (administrador de societat)') },
    { id: 'tarifaPlana', tipo: 'casilla', def: false, etiqueta: tt('Estoy en mi primer año con tarifa plana', 'Soc al primer any amb tarifa plana') },
  ],
  calcular(v, { P }) {
    const r = cuotaAutonomos({ rendimientoAnual: Math.max(0, v.ingresos - v.gastos), societario: v.societario, tarifaPlana: v.tarifaPlana }, P.laboral);
    const T = P.laboral.autonomos.tramos;
    return {
      destacado: { e: tt('Cuota mensual de autónomos', 'Quota mensual d’autònoms'), v: r.cuota, nota: v.tarifaPlana ? tt('Tarifa plana', 'Tarifa plana') : tt(`Tramo ${r.tramo} de ${T.length}, con la base mínima`, `Tram ${r.tramo} de ${T.length}, amb la base mínima`) },
      secundarios: [{ e: tt('Rendimiento computable al mes', 'Rendiment computable al mes'), v: r.computableMensual }, { e: tt('Cuota anual', 'Quota anual'), v: r.anual }],
      filas: [
        { e: tt('Base mínima de tu tramo', 'Base mínima del teu tram'), v: r.baseMin },
        { e: tt('Base máxima de tu tramo', 'Base màxima del teu tram'), v: r.baseMax },
        { e: tt('Tipo de cotización', 'Tipus de cotització'), v: r.tipo, f: 'pct' },
        { e: tt('Cuota con la base mínima', 'Quota amb la base mínima'), v: r.cuotaMin, fuerte: true },
        { e: tt('Cuota con la base máxima', 'Quota amb la base màxima'), v: r.cuotaMax },
        { e: tt('Deducción por gastos genéricos aplicada', 'Deducció per despeses genèriques aplicada'), v: r.pctGastos, f: 'pct', sub: true },
      ],
      tablas: [{ titulo: tt('Tabla de tramos', 'Taula de trams'), cab: [tt('Rendimiento mensual', 'Rendiment mensual'), tt('Base mínima', 'Base mínima'), tt('Cuota mínima', 'Quota mínima')], formatos: ['txt', 'eur', 'eur'], filas: T.map((t: any) => [t.rend_max == null ? `> ${t.rend_min.toFixed(0)} €` : `${t.rend_min.toFixed(0)}–${t.rend_max.toFixed(0)} €`, t.base_min, Math.round(t.base_min * r.tipo) / 100]) }],
      avisos: [tt('La cuota se paga sobre los rendimientos previstos y la Seguridad Social la regulariza al año siguiente con los datos de Hacienda. Puedes cambiar de base hasta 6 veces al año.', 'La quota es paga sobre els rendiments previstos i la Seguretat Social la regularitza l’any següent amb les dades d’Hisenda. Pots canviar de base fins a 6 vegades l’any.')],
    };
  },
});
