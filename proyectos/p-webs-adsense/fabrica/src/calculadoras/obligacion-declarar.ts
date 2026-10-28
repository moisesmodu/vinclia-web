import { def, tt } from '../lib/def';
import { obligacionDeclarar } from '../lib/calc/fiscal';

const RAZ: Record<string, any> = {
  actividad: tt('Tienes una actividad económica: siempre hay que declarar.', 'Tens una activitat econòmica: sempre s’ha de declarar.'),
  trabajo: tt('Tus rendimientos del trabajo superan el límite de un pagador.', 'Els teus rendiments del treball superen el límit d’un pagador.'),
  trabajoVarios: tt('Tienes varios pagadores y el segundo te pagó más de 1.500 €: el límite baja.', 'Tens diversos pagadors i el segon et va pagar més de 1.500 €: el límit baixa.'),
  capital: tt('Intereses, dividendos y ganancias con retención superan 1.600 €.', 'Interessos, dividends i guanys amb retenció superen 1.600 €.'),
  inmobiliarias: tt('Las imputaciones de segundas viviendas más las ganancias sin retención (acciones, criptomonedas) superan 1.000 €.', 'Les imputacions de segones residències més els guanys sense retenció (accions, criptomonedes) superen 1.000 €.'),
  alquiler: tt('Cobras un alquiler: debes declararlo.', 'Cobres un lloguer: l’has de declarar.'),
};

export default def({
  id: 'obligacion-declarar',
  anual: true,
  campos: [
    { id: 'trabajo', tipo: 'numero', def: 21000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Rendimientos íntegros del trabajo (salario, pensión, paro)', 'Rendiments íntegres del treball (salari, pensió, atur)') },
    { id: 'pagadores', tipo: 'numero', def: 1, min: 0, max: 10, paso: 1, etiqueta: tt('Número de pagadores', 'Nombre de pagadors') },
    { id: 'segundo', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Suma del segundo y siguientes pagadores', 'Suma del segon pagador i següents'), si: (v) => v.pagadores > 1 },
    { id: 'capital', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Intereses y dividendos', 'Interessos i dividends') },
    { id: 'ganancias', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Ganancias por reembolso de fondos de inversión (con retención)', 'Guanys per reemborsament de fons d’inversió (amb retenció)') },
    { id: 'gananciasSin', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Ganancias por venta de acciones o criptomonedas (sin retención)', 'Guanys per venda d’accions o criptomonedes (sense retenció)') },
    { id: 'inmobiliarias', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Imputación de rentas de segundas viviendas', 'Imputació de rendes de segones residències') },
    { id: 'alquiler', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Ingresos por alquiler', 'Ingressos per lloguer') },
    { id: 'actividad', tipo: 'casilla', def: false, etiqueta: tt('Soy autónomo o tengo una actividad económica', 'Soc autònom o tinc una activitat econòmica') },
  ],
  calcular(v, { P }) {
    const r = obligacionDeclarar({ trabajo: v.trabajo, pagadores: v.pagadores, segundoPagador: v.segundo, capital: v.capital, ganancias: v.ganancias, gananciasSinRetencion: v.gananciasSin, inmobiliarias: v.inmobiliarias, actividad: v.actividad, alquiler: v.alquiler }, P.fiscal);
    return {
      destacado: { e: tt('¿Estás obligado a hacer la renta?', 'Estàs obligat a fer la renda?'), v: r.obligado ? (tt('Sí', 'Sí') as any) : (tt('No', 'No') as any), f: 'txt' },
      filas: [
        { e: tt('Límite con un pagador', 'Límit amb un pagador'), v: r.lim1 },
        { e: tt('Límite con varios pagadores (segundo > 1.500 €)', 'Límit amb diversos pagadors (segon > 1.500 €)'), v: r.lim2 },
      ],
      avisos: [...r.razones.map((k) => RAZ[k]), r.obligado ? tt('Aunque no estuvieras obligado, declara si te sale a devolver.', 'Encara que no hi estiguessis obligat, declara si et surt a retornar.') : tt('No estás obligado, pero conviene simularla: si te sale a devolver, solo la cobras si la presentas.', 'No hi estàs obligat, però convé simular-la: si et surt a retornar, només la cobres si la presentes.')],
    };
  },
});
