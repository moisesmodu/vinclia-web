import { def, tt } from '../lib/def';
import { campoComunidad } from '../lib/campos';
import { precioHora } from '../lib/calc/fiscal';

export default def({
  id: 'precio-hora-autonomo',
  anual: true,
  campos: [
    { id: 'neto', tipo: 'numero', def: 2000, min: 0, paso: 50, sufijo: '€', etiqueta: tt('Neto que quieres ganar al mes', 'Net que vols guanyar al mes') },
    { id: 'horas', tipo: 'numero', def: 100, min: 1, max: 250, paso: 1, etiqueta: tt('Horas facturables al mes', 'Hores facturables al mes'), ayuda: tt('No todas las horas se facturan: comerciales, gestiones y vacaciones también cuentan.', 'No totes les hores es facturen: comercials, gestions i vacances també compten.') },
    { id: 'gastos', tipo: 'numero', def: 300, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Gastos de la actividad al mes', 'Despeses de l’activitat al mes') },
    { id: 'tarifaPlana', tipo: 'casilla', def: false, etiqueta: tt('Tengo tarifa plana', 'Tinc tarifa plana') },
    campoComunidad(),
  ],
  calcular(v, { P }) {
    const r = precioHora({ netoMensual: v.neto, horasMes: v.horas, gastosMensuales: v.gastos, ccaa: v.ccaa, tarifaPlana: v.tarifaPlana }, P);
    return {
      destacado: { e: tt('Precio por hora (sin IVA)', 'Preu per hora (sense IVA)'), v: r.precioHora },
      secundarios: [{ e: tt('Facturación mensual necesaria', 'Facturació mensual necessària'), v: r.facturacionMensual }, { e: tt('Facturación anual', 'Facturació anual'), v: r.facturacionAnual }],
      filas: [
        { e: tt('Cuota de autónomos anual', 'Quota d’autònoms anual'), v: r.detalle.cuota.anual },
        { e: tt('IRPF anual', 'IRPF anual'), v: r.detalle.irpf.total },
        { e: tt('Gastos anuales', 'Despeses anuals'), v: v.gastos * 12 },
        { e: tt('Neto anual', 'Net anual'), v: r.detalle.netoAnual, fuerte: true },
      ],
    };
  },
});
