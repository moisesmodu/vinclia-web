import { def, tt } from '../lib/def';
import { iva } from '../lib/calc/fiscal';
import { tr } from '../lib/traducciones';

export default def({
  id: 'iva',
  anual: true,
  campos: [
    { id: 'importe', tipo: 'numero', def: 100, min: 0, paso: 0.01, sufijo: '€', etiqueta: tt('Importe', 'Import') },
    { id: 'modo', tipo: 'select', def: 'anadir', etiqueta: tt('Quiero…', 'Vull…'), opciones: [{ v: 'anadir', t: tt('Añadir IVA (el importe es sin IVA)', 'Afegir IVA (l’import és sense IVA)') }, { v: 'quitar', t: tt('Quitar IVA (el importe ya lo lleva)', 'Treure l’IVA (l’import ja el porta)') }] },
    { id: 'tipo', tipo: 'select', def: '21', etiqueta: tt('Tipo de IVA', 'Tipus d’IVA'), opciones: [{ v: '21', t: tt('21 % general', '21 % general') }, { v: '10', t: tt('10 % reducido', '10 % reduït') }, { v: '4', t: tt('4 % superreducido', '4 % superreduït') }, { v: '0', t: tt('0 % o exento', '0 % o exempt') }] },
  ],
  calcular(v, { P }) {
    const r = iva({ importe: v.importe, tipo: Number(v.tipo), modo: v.modo });
    const ej = P.fiscal.iva.ejemplos_por_tipo?.[v.tipo === '0' ? '0_o_exento' : v.tipo] ?? [];
    return {
      destacado: { e: v.modo === 'anadir' ? tt('Total con IVA', 'Total amb IVA') : tt('Base sin IVA', 'Base sense IVA'), v: v.modo === 'anadir' ? r.total : r.base },
      secundarios: [{ e: tt('Cuota de IVA', 'Quota d’IVA'), v: r.cuota }],
      filas: [{ e: tt('Base imponible', 'Base imposable'), v: r.base }, { e: tt(`IVA (${v.tipo} %)`, `IVA (${v.tipo} %)`), v: r.cuota }, { e: tt('Total', 'Total'), v: r.total, fuerte: true }],
      avisos: ej.length ? [{ es: `Ejemplos al ${v.tipo} %: ${ej.slice(0, 6).join(', ')}.`, ca: `Exemples al ${v.tipo} %: ${ej.slice(0, 6).map((x: string) => tr(x, 'ca')).join(', ')}.` }] : [],
    };
  },
});
