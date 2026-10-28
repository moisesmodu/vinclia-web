import { def, tt } from '../lib/def';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'recargo-equivalencia',
  anual: true,
  campos: [
    { id: 'base', tipo: 'numero', def: 500, min: 0, paso: 0.01, sufijo: '€', etiqueta: tt('Base de la compra al proveedor', 'Base de la compra al proveïdor') },
    { id: 'iva', tipo: 'select', def: '21', etiqueta: tt('Tipo de IVA del producto', 'Tipus d’IVA del producte'), opciones: [{ v: '21', t: '21 %' }, { v: '10', t: '10 %' }, { v: '4', t: '4 %' }, { v: 'tabaco', t: tt('Tabaco', 'Tabac') }] },
    { id: 'margen', tipo: 'numero', def: 40, min: 0, paso: 1, sufijo: '%', etiqueta: tt('Margen que aplicas sobre el coste', 'Marge que apliques sobre el cost') },
  ],
  calcular(v, { P }) {
    const re = P.fiscal.iva.recargo_equivalencia[v.iva] ?? 0;
    const tipoIva = v.iva === 'tabaco' ? 21 : Number(v.iva);
    const cuotaIva = v.base * tipoIva / 100, cuotaRe = v.base * re / 100;
    const coste = v.base + cuotaIva + cuotaRe;
    const pvp = coste * (1 + v.margen / 100);
    return {
      destacado: { e: tt('Total a pagar al proveedor', 'Total a pagar al proveïdor'), v: r2(coste) },
      secundarios: [{ e: tt('Recargo de equivalencia', 'Recàrrec d’equivalència'), v: r2(cuotaRe) }, { e: tt('PVP con tu margen (IVA incluido)', 'PVP amb el teu marge (IVA inclòs)'), v: r2(pvp) }],
      filas: [{ e: tt('Base', 'Base'), v: v.base }, { e: tt(`IVA (${tipoIva} %)`, `IVA (${tipoIva} %)`), v: r2(cuotaIva) }, { e: tt(`Recargo (${re} %)`, `Recàrrec (${re} %)`), v: r2(cuotaRe) }, { e: tt('Coste total', 'Cost total'), v: r2(coste), fuerte: true }],
      avisos: [tt('En recargo de equivalencia el comercio minorista no presenta el modelo 303: el proveedor cobra el IVA y el recargo y los ingresa él. Ese IVA no se deduce, es coste.', 'En recàrrec d’equivalència el comerç minorista no presenta el model 303: el proveïdor cobra l’IVA i el recàrrec i els ingressa ell. Aquest IVA no es dedueix, és cost.')],
    };
  },
});
