import { def, tt } from '../lib/def';
import { campoComunidad, camposFamilia, familia } from '../lib/campos';
import { netoAutonomo } from '../lib/calc/laboral';

export default def({
  id: 'sueldo-neto-autonomo',
  anual: true,
  campos: [
    { id: 'ingresos', tipo: 'numero', def: 40000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Facturación anual (sin IVA)', 'Facturació anual (sense IVA)') },
    { id: 'gastos', tipo: 'numero', def: 6000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Gastos deducibles anuales (sin la cuota de autónomos)', 'Despeses deduïbles anuals (sense la quota d’autònoms)') },
    { id: 'tarifaPlana', tipo: 'casilla', def: false, etiqueta: tt('Tengo tarifa plana', 'Tinc tarifa plana') },
    campoComunidad(), ...camposFamilia,
  ],
  calcular(v, { P }) {
    const r = netoAutonomo({ ingresos: v.ingresos, gastos: v.gastos, ccaa: v.ccaa, tarifaPlana: v.tarifaPlana, ...familia(v) }, P);
    return {
      destacado: { e: tt('Neto mensual como autónomo', 'Net mensual com a autònom'), v: r.netoMensual },
      secundarios: [{ e: tt('Neto anual', 'Net anual'), v: r.netoAnual }, { e: tt('Cuota de autónomos al mes', 'Quota d’autònoms al mes'), v: r.cuota.cuota }, { e: tt('Tipo medio de IRPF', 'Tipus mitjà d’IRPF'), v: r.irpf.tipoMedio, f: 'pct' }],
      filas: [
        { e: tt('Facturación', 'Facturació'), v: v.ingresos },
        { e: tt('Gastos', 'Despeses'), v: v.gastos, signo: '-' },
        { e: tt('Cuota de autónomos anual', 'Quota d’autònoms anual'), v: r.cuota.anual, signo: '-' },
        { e: tt('Rendimiento neto', 'Rendiment net'), v: r.rendNeto, fuerte: true },
        { e: tt('Gastos de difícil justificación', 'Despeses de difícil justificació'), v: r.dificil, sub: true, signo: '-' },
        { e: tt('IRPF anual estimado', 'IRPF anual estimat'), v: r.irpf.total, signo: '-' },
        { e: tt('Neto anual', 'Net anual'), v: r.netoAnual, fuerte: true },
      ],
      avisos: [tt('El IRPF se adelanta con el modelo 130 o con las retenciones de tus facturas; aquí se calcula lo que pagas en total en el año.', 'L’IRPF s’avança amb el model 130 o amb les retencions de les teves factures; aquí es calcula el que pagues en total en l’any.')],
    };
  },
});
