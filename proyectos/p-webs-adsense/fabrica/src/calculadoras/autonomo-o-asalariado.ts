import { def, tt } from '../lib/def';
import { campoComunidad } from '../lib/campos';
import { autonomoVsAsalariado } from '../lib/calc/fiscal';

export default def({
  id: 'autonomo-o-asalariado',
  anual: true,
  campos: [
    { id: 'coste', tipo: 'numero', def: 45000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Lo que paga el cliente o la empresa al año', 'El que paga el client o l’empresa l’any'), ayuda: tt('Como asalariado, el coste empresa total; como autónomo, lo que facturas sin IVA.', 'Com a assalariat, el cost empresa total; com a autònom, el que factures sense IVA.') },
    { id: 'gastos', tipo: 'numero', def: 3000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Gastos que tendrías como autónomo', 'Despeses que tindries com a autònom') },
    { id: 'tarifaPlana', tipo: 'casilla', def: false, etiqueta: tt('Como autónomo tendría tarifa plana', 'Com a autònom tindria tarifa plana') },
    campoComunidad(),
  ],
  calcular(v, { P }) {
    const r = autonomoVsAsalariado({ coste: v.coste, gastosAutonomo: v.gastos, ccaa: v.ccaa, pagas: 14, tarifaPlana: v.tarifaPlana }, P);
    const netoAsal = Math.round((r.asalariado.netoAnual - (r.asalariado.renta?.diferencia ?? 0)) * 100) / 100;
    return {
      destacado: { e: r.diferencia >= 0 ? tt('Como autónomo ganas más al año', 'Com a autònom guanyes més l’any') : tt('Como asalariado ganas más al año', 'Com a assalariat guanyes més l’any'), v: Math.abs(r.diferencia) },
      tablas: [{ cab: [tt('Concepto', 'Concepte'), tt('Asalariado', 'Assalariat'), tt('Autónomo', 'Autònom')], formatos: ['txt', 'eur', 'eur'], filas: [
        [tt('Ingreso bruto', 'Ingrés brut'), r.brutoAsalariado, v.coste],
        [tt('Seguridad Social', 'Seguretat Social'), r.asalariado.ss.trabajador.anual, r.autonomo.cuota.anual],
        [tt('IRPF anual', 'IRPF anual'), r.asalariado.renta?.cuota ?? r.asalariado.ret.importe, r.autonomo.irpf.total],
        [tt('Neto anual', 'Net anual'), netoAsal, r.autonomo.netoAnual],
      ] }],
      avisos: [tt('Como asalariado tienes además vacaciones pagadas, paro, baja desde el día 4 e indemnización por despido. Como autónomo, el cese de actividad y la baja son más limitados.', 'Com a assalariat tens a més vacances pagades, atur, baixa des del dia 4 i indemnització per acomiadament. Com a autònom, el cessament d’activitat i la baixa són més limitats.')],
    };
  },
});
