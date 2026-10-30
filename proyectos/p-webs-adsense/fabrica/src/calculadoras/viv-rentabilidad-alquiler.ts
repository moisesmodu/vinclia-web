import { def, tt } from '../lib/def';
import { gastosCompra, cuadro } from '../lib/calc/vivienda';
import { campoComunidadViv, tx, eur, pct, n } from '../lib/camposVivienda';

export default def({
  id: 'viv-rentabilidad-alquiler',
  campos: [
    { id: 'precio', tipo: 'numero', def: 180000, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Precio de compra', 'Preu de compra') },
    campoComunidadViv(),
    { id: 'renta', tipo: 'numero', def: 900, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Alquiler mensual', 'Lloguer mensual') },
    { id: 'ibi', tipo: 'numero', def: 450, min: 0, paso: 10, sufijo: '€', etiqueta: tt('IBI al año', 'IBI l’any') },
    { id: 'comunidad', tipo: 'numero', def: 600, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Comunidad de propietarios al año', 'Comunitat de propietaris l’any') },
    { id: 'seguro', tipo: 'numero', def: 250, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Seguros al año (hogar, impago)', 'Assegurances l’any (llar, impagament)') },
    { id: 'mantenimiento', tipo: 'numero', def: 5, min: 0, max: 30, paso: 1, sufijo: '%', etiqueta: tt('Mantenimiento y reparaciones (% de la renta)', 'Manteniment i reparacions (% de la renda)') },
    { id: 'vacio', tipo: 'numero', def: 0.5, min: 0, max: 12, paso: 0.5, etiqueta: tt('Meses vacío al año', 'Mesos buit l’any') },
    { id: 'financiacion', tipo: 'numero', def: 0, min: 0, max: 100, paso: 5, sufijo: '%', etiqueta: tt('Parte financiada con hipoteca', 'Part finançada amb hipoteca') },
    { id: 'tin', tipo: 'numero', def: 3, min: 0, max: 15, paso: 0.01, sufijo: '%', etiqueta: tt('Interés de la hipoteca', 'Interès de la hipoteca'), si: (v) => n(v.financiacion) > 0 },
  ],
  calcular(v, { P }) {
    const V = P.vivienda;
    const precio = n(v.precio);
    const g = gastosCompra({ precio, ccaa: v.ccaa, nueva: false, gestoria: 300, tasacion: n(v.financiacion) > 0 ? 350 : 0 }, V);
    const prestamo = precio * n(v.financiacion) / 100;
    const cu = prestamo > 0 ? cuadro(prestamo, 300, () => n(v.tin)) : null;
    const intereses = cu?.anios[0]?.interes ?? 0;
    const inversion = precio + g.total;
    const ingresos = n(v.renta) * (12 - n(v.vacio));
    const mant = ingresos * n(v.mantenimiento) / 100;
    const gastos = n(v.ibi) + n(v.comunidad) + n(v.seguro) + mant;
    const netoAntes = ingresos - gastos;
    const flujo = netoAntes - intereses;
    const propio = inversion - prestamo;
    const bruta = inversion ? n(v.renta) * 12 / inversion * 100 : 0;
    const neta = inversion ? netoAntes / inversion * 100 : 0;
    const sobrePropio = propio > 0 ? flujo / propio * 100 : 0;
    return {
      destacado: { e: tt('Rentabilidad neta (antes de IRPF)', 'Rendibilitat neta (abans d’IRPF)'), v: Math.round(neta * 100) / 100, f: 'pct', nota: tx((l) => `${l === 'es' ? 'Bruta' : 'Bruta'}: ${pct(Math.round(bruta * 100) / 100, l)}. ${l === 'es' ? 'Sobre una inversión de' : 'Sobre una inversió de'} ${eur(inversion, l)} ${l === 'es' ? 'con impuestos y gastos' : 'amb impostos i despeses'}.`) },
      secundarios: [
        { e: tt('Beneficio neto al año', 'Benefici net l’any'), v: netoAntes, f: 'eur0' },
        ...(prestamo > 0 ? [{ e: tt('Flujo de caja tras intereses (año 1)', 'Flux de caixa després d’interessos (any 1)'), v: flujo, f: 'eur0' as const }, { e: tt('Rentabilidad sobre tu dinero', 'Rendibilitat sobre els teus diners'), v: Math.round(sobrePropio * 100) / 100, f: 'pct' as const }] : []),
      ],
      filas: [
        { e: tt('Ingresos por alquiler al año', 'Ingressos per lloguer l’any'), v: ingresos },
        { e: tt('IBI', 'IBI'), v: n(v.ibi), signo: '-' },
        { e: tt('Comunidad', 'Comunitat'), v: n(v.comunidad), signo: '-' },
        { e: tt('Seguros', 'Assegurances'), v: n(v.seguro), signo: '-' },
        { e: tt('Mantenimiento', 'Manteniment'), v: mant, signo: '-' },
        ...(prestamo > 0 ? [{ e: tt('Intereses de la hipoteca (año 1)', 'Interessos de la hipoteca (any 1)'), v: intereses, signo: '-' as const }] : []),
        { e: tt('Beneficio neto antes de IRPF', 'Benefici net abans d’IRPF'), v: flujo, fuerte: true },
      ],
      reparto: [{ e: tt('Te queda', 'Et queda'), v: Math.max(0, flujo) }, { e: tt('Gastos de la vivienda', 'Despeses de l’habitatge'), v: gastos }, { e: tt('Intereses', 'Interessos'), v: intereses }],
      tablas: [{ titulo: tt('Rentabilidad según el alquiler', 'Rendibilitat segons el lloguer'), cab: [tt('Alquiler al mes', 'Lloguer al mes'), tt('Bruta', 'Bruta'), tt('Neta', 'Neta')], formatos: ['eur0', 'pct', 'pct'],
        filas: [-200, -100, 0, 100, 200].map((d) => n(v.renta) + d).filter((r) => r > 0).map((r) => { const ing = r * (12 - n(v.vacio)); const ga = n(v.ibi) + n(v.comunidad) + n(v.seguro) + ing * n(v.mantenimiento) / 100; return [r, Math.round(r * 12 / inversion * 10000) / 100, Math.round((ing - ga) / inversion * 10000) / 100]; }) }],
      avisos: [
        tx((l) => l === 'es' ? `La inversión incluye ${eur(g.total, l)} de ITP, notaría, registro y gestoría (vivienda usada, ejemplo de 300 € de gestoría).` : `La inversió inclou ${eur(g.total, l)} d’ITP, notaria, registre i gestoria (habitatge usat, exemple de 300 € de gestoria).`),
        tt('No calcula el IRPF: la reducción por alquiler de vivienda cambia con el RDL 29/2026 (pendiente de convalidación). Para el impuesto, usa la calculadora de alquiler de ImpuestoClaro.', 'No calcula l’IRPF: la reducció per lloguer d’habitatge canvia amb el RDL 29/2026 (pendent de convalidació). Per a l’impost, fes servir la calculadora de lloguer d’ImpuestoClaro.'),
      ],
    };
  },
});
