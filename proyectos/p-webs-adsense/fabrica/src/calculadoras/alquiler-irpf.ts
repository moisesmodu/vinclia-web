import { def, tt } from '../lib/def';
import { campoComunidad } from '../lib/campos';
import { alquilerIRPF } from '../lib/calc/fiscal';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'alquiler-irpf',
  anual: true,
  campos: [
    { id: 'renta', tipo: 'numero', def: 800, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Alquiler mensual', 'Lloguer mensual') },
    { id: 'meses', tipo: 'numero', def: 12, min: 1, max: 12, paso: 1, etiqueta: tt('Meses alquilado en el año', 'Mesos llogat en l’any') },
    { id: 'gastos', tipo: 'numero', def: 1800, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Gastos anuales (IBI, comunidad, seguro, intereses, reparaciones)', 'Despeses anuals (IBI, comunitat, assegurança, interessos, reparacions)') },
    { id: 'valorConstruccion', tipo: 'numero', def: 60000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Valor de la construcción (sin suelo) para amortizar', 'Valor de la construcció (sense sòl) per amortitzar'), ayuda: tt('Se amortiza un 3 % al año: el mayor entre el valor catastral de la construcción y el coste de adquisición de la construcción.', 'S’amortitza un 3 % l’any: el més gran entre el valor cadastral de la construcció i el cost d’adquisició de la construcció.') },
    { id: 'reduccion', tipo: 'select', def: '50', etiqueta: tt('Reducción por alquiler de vivienda', 'Reducció per lloguer d’habitatge'), opciones: [
      { v: '50', t: tt('50 % general (contratos desde 26/05/2023)', '50 % general (contractes des del 26/05/2023)') },
      { v: '60', t: tt('60 % (contratos anteriores al 26/05/2023)', '60 % (contractes anteriors al 26/05/2023)') },
      { v: '70', t: tt('70 % (zona tensionada: primer alquiler a joven de 18 a 35 años, o vivienda social)', '70 % (zona tensionada: primer lloguer a jove de 18 a 35 anys, o habitatge social)') },
      { v: '60r', t: tt('60 % (obras de rehabilitación en los 2 años anteriores)', '60 % (obres de rehabilitació en els 2 anys anteriors)') },
      { v: '90', t: tt('90 % (rebaja de renta del 5 % en zona tensionada)', '90 % (rebaixa de renda del 5 % en zona tensionada)') },
      { v: '0', t: tt('Sin reducción (local, temporada, turístico)', 'Sense reducció (local, temporada, turístic)') },
    ] },
    { id: 'otra', tipo: 'numero', def: 25000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Tu otra base liquidable general (salario neto de reducciones)', 'La teva altra base liquidable general (salari net de reduccions)') },
    campoComunidad(),
  ],
  calcular(v, { P }) {
    const ingresos = v.renta * v.meses;
    const am = v.valorConstruccion * 0.03 * v.meses / 12;
    const r = alquilerIRPF({ ingresos, gastos: v.gastos, amortizacion: am, reduccionPct: parseFloat(v.reduccion), otraBase: v.otra, ccaa: v.ccaa }, P.fiscal);
    return {
      destacado: { e: tt('IRPF extra por el alquiler', 'IRPF extra pel lloguer'), v: r.impuestoExtra },
      secundarios: [{ e: tt('Rendimiento neto reducido', 'Rendiment net reduït'), v: r.reducido }, { e: tt('Sobre lo que ganas', 'Sobre el que guanyes'), v: r.tipoEfectivo, f: 'pct' }],
      filas: [
        { e: tt('Ingresos íntegros', 'Ingressos íntegres'), v: ingresos },
        { e: tt('Gastos deducibles', 'Despeses deduïbles'), v: v.gastos, signo: '-' },
        { e: tt('Amortización (3 %)', 'Amortització (3 %)'), v: r2(am), signo: '-' },
        { e: tt('Rendimiento neto', 'Rendiment net'), v: r.rend, fuerte: true },
        { e: tt(`Reducción del ${parseFloat(v.reduccion)} %`, `Reducció del ${parseFloat(v.reduccion)} %`), v: r.reduccion, signo: '-' },
        { e: tt('Rendimiento neto reducido', 'Rendiment net reduït'), v: r.reducido, fuerte: true },
      ],
      avisos: [tt('Los intereses y las reparaciones no pueden superar los ingresos del inmueble (el exceso se arrastra 4 años). La reducción solo se aplica sobre rendimiento positivo y a vivienda habitual del inquilino.', 'Els interessos i les reparacions no poden superar els ingressos de l’immoble (l’excés s’arrossega 4 anys). La reducció només s’aplica sobre rendiment positiu i a habitatge habitual del llogater.')],
    };
  },
});
