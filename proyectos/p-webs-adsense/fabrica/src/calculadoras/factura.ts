import { def, tt } from '../lib/def';
import { factura, facturaInversa } from '../lib/calc/fiscal';

export default def({
  id: 'factura',
  anual: true,
  campos: [
    { id: 'importe', tipo: 'numero', def: 1000, min: 0, paso: 0.01, sufijo: '€', etiqueta: tt('Importe', 'Import') },
    { id: 'modo', tipo: 'select', def: 'base', etiqueta: tt('El importe es', 'L’import és'), opciones: [{ v: 'base', t: tt('La base imponible (sin IVA)', 'La base imposable (sense IVA)') }, { v: 'total', t: tt('Lo que quiero cobrar en total', 'El que vull cobrar en total') }] },
    { id: 'iva', tipo: 'select', def: '21', etiqueta: tt('IVA', 'IVA'), opciones: [{ v: '21', t: '21 %' }, { v: '10', t: '10 %' }, { v: '4', t: '4 %' }, { v: '0', t: tt('Exento (formación, sanidad…)', 'Exempt (formació, sanitat…)') }] },
    { id: 'retencion', tipo: 'select', def: '15', etiqueta: tt('Retención de IRPF', 'Retenció d’IRPF'), opciones: [
      { v: '15', t: tt('15 % profesional (también cursos y conferencias)', '15 % professional (també cursos i conferències)') }, { v: '7', t: tt('7 % nuevo profesional (3 primeros años)', '7 % nou professional (3 primers anys)') },
      { v: '19', t: tt('19 % (alquiler de local)', '19 % (lloguer de local)') }, { v: '1', t: tt('1 % módulos', '1 % mòduls') }, { v: '0', t: tt('Sin retención (cliente particular o empresa extranjera)', 'Sense retenció (client particular o empresa estrangera)') },
    ] },
    { id: 'recargo', tipo: 'casilla', def: false, etiqueta: tt('Vendo mercancía a un comercio en recargo de equivalencia', 'Venc mercaderia a un comerç en recàrrec d’equivalència'), ayuda: tt('El recargo solo se aplica a entregas de bienes, no a servicios.', 'El recàrrec només s’aplica a lliuraments de béns, no a serveis.') },
  ],
  calcular(v, { P }) {
    const e = { tipoIva: Number(v.iva), retencion: Number(v.retencion), recargo: v.recargo };
    const r = v.modo === 'base' ? factura({ base: v.importe, ...e }, P.fiscal) : facturaInversa({ total: v.importe, ...e }, P.fiscal);
    return {
      destacado: { e: tt('Total a cobrar', 'Total a cobrar'), v: r.total },
      secundarios: [{ e: tt('Base imponible (tu ingreso)', 'Base imposable (el teu ingrés)'), v: r.base }, { e: tt('IVA que ingresarás en el 303', 'IVA que ingressaràs al 303'), v: r.cuotaIva }],
      filas: [
        { e: tt('Base imponible', 'Base imposable'), v: r.base },
        { e: tt(`IVA (${v.iva} %)`, `IVA (${v.iva} %)`), v: r.cuotaIva, signo: '+' },
        ...(r.recargo ? [{ e: tt(`Recargo de equivalencia (${r.tipoRe} %)`, `Recàrrec d’equivalència (${r.tipoRe} %)`), v: r.recargo, signo: '+' as const }] : []),
        { e: tt(`Retención de IRPF (${v.retencion} %)`, `Retenció d’IRPF (${v.retencion} %)`), v: r.retencion, signo: '-' },
        { e: tt('Total factura', 'Total factura'), v: r.total, fuerte: true },
      ],
      avisos: [tt('El IVA lo ingresas en el modelo 303 y la retención la ingresa tu cliente en su modelo 111: es un adelanto de tu IRPF.', 'L’IVA l’ingresses al model 303 i la retenció l’ingressa el teu client al seu model 111: és un avançament del teu IRPF.')],
    };
  },
});
